// Startup -- load Zotero and constants
if (typeof Zotero === 'undefined') {
    Zotero = {};
}
Zotero.CitationCounts = {};

// ZSC is for Google Scholar to work. Collated from
//https://github.com/smlum/zotero-scholar-citations/

let isDebug = function() {
    return typeof Zotero != 'undefined'
        && typeof Zotero.Debug != 'undefined'
        && Zotero.Debug.enabled;
};

let zsc = {
	_captchaString: '',
	_citedPrefixString: 'Cited by ',
	_citeCountStrLength: 7,
	_extraPrefix: 'ZSCC',
	_extraEntrySep: ' \n',
	_noData : 'NoCitationData',
	_searchblackList: new RegExp('[-+~*":]', 'g'),
	_baseUrl : 'https://scholar.google.com/'
};

zsc.cleanTitle = function(title) {
	return title.replace(zsc._searchblackList, ' ');
};

zsc.generateItemUrl = function(item) {
	let url = this._baseUrl
		+ 'scholar?hl=en&as_q='
		+ zsc.cleanTitle(item.getField('title')).split(/\s/).join('+')
		+ '&as_epq=&as_occt=title&num=1';

	let creators = item.getCreators();
	if (creators && creators.length > 0) {
		url += '&as_sauthors=';
		url += creators[0].lastName;
		for (let idx = 1; idx < creators.length; idx++) {
			url += '+' + creators[idx].lastName;
		}
	}
	let year = item.getField('year');
	if (year) {
		url += '&as_ylo=' + year + '&as_yhi=' + year;
	}
	return encodeURI(url);
};

zsc.generateItemUrl_yrRange = function(item) {
	let url = this._baseUrl
		+ 'scholar?hl=en&as_q='
		+ zsc.cleanTitle(item.getField('title')).split(/\s/).join('+')
		+ '&as_epq=&as_occt=title&num=1';

	let creators = item.getCreators();
	if (creators && creators.length > 0) {
    num_creators = creators.length > 3 ? 3 : creators.length;
		url += '&as_sauthors=';
		url += creators[0].lastName;
		for (let idx = 1; idx < num_creators; idx++) {
			url += '+' + creators[idx].lastName;
		}
	}
	let year = item.getField('year');
	if (year) {
    // nico-zck zsc.js line 324
    // year + 1 gets me 20101 instead of 2011
    // fix: https://stackoverflow.com/a/8976659/14451841
		url += '&as_ylo=' + (+year - +1) + '&as_yhi=' + (+year + +1);
	}
	return encodeURI(url);
};


zsc.getCiteCount = function(responseText) {
    let citePrefix = '>' + this._citedPrefixString;
    let citePrefixLen = citePrefix.length;
    let citeCountStart = responseText.indexOf(citePrefix);

    if (citeCountStart === -1) {
        if (responseText.indexOf('class="gs_rt"') === -1)
            return -1;
        else
            return 0;
    } else {
        let citeCountEnd = responseText.indexOf('<', citeCountStart);
        let citeStr = responseText.substring(citeCountStart, citeCountEnd);
        if (isDebug()) Zotero.debug("[scholar-citations]: gs citeStr: " + citeStr)
        let citeCount = citeStr.substring(citePrefixLen);
        return parseInt(citeCount.trim());
    }
};

// itemType that doesnt have call numbers
zsc.itemtypeNoCallNum = "bill  blogPost  case  email  forumPost  hearing  instantMessage  patent  presentation  statute  webpage";

// list of itemTypes from Zotero
zsc.getitemtypes = function(item) {
  var listOfTypes = [];
  var itemtypes = Zotero.ItemTypes.getAll();
  itemtypes.forEach(function (arrayItem) {
      var x = arrayItem["name"];
      listOfTypes.push(x);
  });
  return listOfTypes
}
// checks if itemTypeID is not in listOfTypes
zsc.doesItemHaveCallNum = function (item, listOfTypes) {
  const itemtypeid = item.getField("itemTypeID"); //or item.itemTypeID?
  if(zsc.itemtypeNoCallNum.includes(listOfTypes[itemtypeid-1])){
    return true
  } else {
    return false
  }
}

// Definitions

const operations = [
    "crossref", "inspire", "ads", "semanticscholar", "googlescholar",
    "setcrossref", "setinspire", "setads", "setsemanticscholar"
];

const operationNames = {
    "crossref": "Crossref",
    "inspire": "Inspire HEP",
    //"ads": "NASA/ADS", //remove completely? todo
    "semanticscholar": "Semantic Scholar",
  	"googlescholar": "Google Scholar",
    "setcrossref": "Crossref",
    "setinspire": "Inspire HEP",
    //"setads": "NASA/ADS",
    "setsemanticscholar": "Semantic Scholar",
    "setgooglescholar" : "Google Scholar"
};

// Reorder existing cite count data to the top
function setCitationCountSwitch(item, tag) {

	let extra = item.getField('extra');
  //if (isDebug()) Zotero.debug("[scholar-citations] extra: "  + extra);
  if (!extra) {
      extra = "";
      return -1;
  }
  let extras = extra.split("\n");
  // just dont have the old format (sorry no cross compatibility at the moment)
  const patt2 = new RegExp("^\\d+ citations \\(" + tag + "\\)", "i");

  rest = extras.filter(ex => !patt2.test(ex));
  line = extras.filter(ex => patt2.test(ex));
  countpatt = new RegExp("^\\d+");
  count = String(line).match(countpatt);
  count = parseInt(count);
  rest = String(rest).split(",").join("\n");
  extra = line + "\n" + rest;
  item.setField('extra', extra);

  //some itemTypes dont have callNumbers! This causes errors
  if (!zsc.doesItemHaveCallNum(item, zsc.getitemtypes(item))) {
      item.setField('callNumber', count);
  }

  return count;
}

// function to reduce fetch requests by checking if field exists before
// any functions is run, in updateItem()
function doesFieldExist(item, idtype) {
  const fieldContent = item.getField(idtype);
  if (!fieldContent) {
    return false
  } else {
    return true
  }
}

function setCitationCount(item, tag, count) {
	let extra = item.getField('extra');
    if (!extra) {
        extra = "";
    }
    let extras = extra.split("\n");
    // Keep old patterns around when updating the format
    const patt1 = new RegExp("^Citations \\(" + tag + "\\):", "i");
    const patt2 = new RegExp("^\\d+ citations \\(" + tag + "\\)", "i");
    // Remove old count
    extras = extras.filter(ex => !patt1.test(ex) && !patt2.test(ex));
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();
    const date = yyyy + '-' + mm + '-' + dd
    // extras.push("Citations (" + tag + "): " + count + " [" + date + "]");
    extras.unshift("" + count + " citations (" + tag + ") [" + date + "]");
    extra = extras.join("\n");
    item.setField('extra', extra);

    //some itemTypes dont have callNumbers! This causes errors
    if(!zsc.doesItemHaveCallNum(item, zsc.getitemtypes(item))){
        item.setField('callNumber', count);
    }
}

// From scite.ts
function isShortDoi(doi) {
  return doi.match(/10\/[^\s]*[^\s\.,]/);
}

// From scite.ts
function getDOI(doi, extra, url) {
  if (doi) {
    return doi.toLowerCase().trim();
  }

  if (extra) {
  const dois = extra.split('\n')
    .map(line => line.match(/^DOI:\s*(.+)/i))
    .filter(line => line)
    .map(line => line[1].trim());
    if (isDebug()) Zotero.debug("[scholar-citations]: [get DOI] - doi in extra: " + dois)
    // if dois[0] = noDOI
    if (dois[0]) {
      return dois[0].toLowerCase().trim();
    }
  }

  // urls contain dois. But this doesn't work all the time
  if (url) {
    var patt = new RegExp("\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![\"&\\'<>])\\S)+)\\b");
    var matched = String(url).match(patt);
    if (isDebug()) Zotero.debug("[scholar-citations]: [get DOI] - doi in url: " + matched)
    if (matched) {
      return matched[0].toLowerCase().trim();
    }
  }
  return
}

// Get Citation Count using CrossRef REST API or doi.org/{doi}
async function getCrossrefCount(item, doi) {
    if (!doi) {
        var doi = getDOI(item.getField('DOI'), item.getField('extra'), item.getField('url'));
        if (isDebug()) Zotero.debug("[scholar-citations]: getDOI: " + doi)
        if (!doi) {
          // There is no DOI; skip item
          if (isDebug()) Zotero.debug("[scholar-citations]: getCrossrefCount: no doi from item.doi, .extra, .url")
          return -1
        }
    }
    const edoi = encodeURIComponent(doi);

    let response = null;

    if (response === null) {
        const style = "vnd.citationstyles.csl+json";
        const xform = "transform/application/" + style;
        const url = "https://api.crossref.org/works/" + edoi + "/" + xform;
        if (isDebug()) Zotero.debug("[scholar-citations]: Crossref url1: " + url)
        response = await fetch(url)
            .then(response => {
              if (response.ok) {
                return response.json();
              }
            }
            ).catch(err => null);
    }

    if (response === null) {
        const url = "https://doi.org/" + edoi;
        const style = "vnd.citationstyles.csl+json";
        if (isDebug()) Zotero.debug("[scholar-citations]: Crossref url2: " + url)
        response = await fetch(url, {
            headers: {
                "Accept": "application/" + style
            }
        })
            .then(response => response.json())
            .catch(err => null);
        }

    if (response === null) {
        // Something went wrong
        return -1;
    }

    let str = null;
    try {
        str = response['is-referenced-by-count'];
    } catch (err) {
        // There are no citation counts
        return -1;
    }

    const count = parseInt(str);
    return count;
}

async function getInspireCount(item, idtype) {
    let doi = null;
    if (idtype == 'DOI') {
        const doi = getDOI(item.getField('DOI'), item.getField('extra'), item.getField('url'));
    } else if (idtype == 'arxiv') {
        const arxiv = item.getField('url'); // check URL for arXiv id
        const patt = /(?:arxiv.org[/]abs[/]|arXiv:)([a-z.-]+[/]\d+|\d+[.]\d+)/i;
        const m = patt.exec(arxiv);
        if (!m) {
            // No arxiv id found
            return -1;
        }
        doi = m[1];
    } else {
        // Internal error
        return -1;
    }
    if (!doi) {
        // There is no DOI / arXiv id; skip item
        return -1;
    }
    const edoi = encodeURIComponent(doi);

    const url = "https://inspirehep.net/api/" + idtype + "/" + edoi;
    const response = await fetch(url)
          .then(response => response.json())
          .catch(err => null);
    if (isDebug()) Zotero.debug("[scholar-citations]: inspire URL = "	+ url );
    if (response === null) {
        // Something went wrong
        if (isDebug()) Zotero.debug("[scholar-citations]: inspire response === null")
        return -1;
    }

    let str = null;
    try {
        str = response['metadata']['citation_count'];
    } catch (err) {
        // There are no citation counts
        if (isDebug()) Zotero.debug("[scholar-citations]: inspire api: " +
        response['message'] + "; Status: " + response['status'])
        return -1;
    }

    const count = parseInt(str);
    return count;
}

async function getSemanticScholarCount(item, idtype) {
    let doi = null;
    if (idtype == 'DOI') {
        //doi = item.getField('DOI');
        const doi = getDOI(item.getField('DOI'), item.getField('extra'), item.getField('url'));
    } else if (idtype == 'arxiv') {
        const arxiv = item.getField('url'); // check URL for arXiv id
        const patt = /(?:arxiv.org[/]abs[/]|arXiv:)([a-z.-]+[/]\d+|\d+[.]\d+)/i;
        const m = patt.exec(arxiv);
        if (!m) {
            // No arxiv id found
            return -1;
        }
        doi = m[1];
    } else if (idtype == 'url') {
      let count = null
      url1 = item.getField('url');
      //const urlFieldID = Zotero.ItemFields.getID('url')
      //if (isDebug()) Zotero.debug("[scholar-citations]: URL = "	+ url1 );//+ "\n" + urlFieldID);
    } else {
        // Internal error
        return -1;
    }
    var response;
    if (doi) {
      const edoi = encodeURIComponent(doi);
      const url =
            "https://api.semanticscholar.org/v1/paper/" +
            (idtype == 'DOI' ? '' : 'arXiv:') + edoi;
      if (isDebug()) Zotero.debug("[scholar-citations]: inspire URL = "	+ url );
      response = await fetch(url)
            .then(response => response.json())
            .catch(err => null);

    } else if (url1) {
      const url =
            "https://api.semanticscholar.org/v1/paper/" + "URL:" + url1
      if (isDebug()) Zotero.debug("[scholar-citations]: const url = "	+ url );
      response = await fetch(url)
            .then(response => response.json())
            .catch(err => null);

    } else{
      return -1
    }

    if (response == null) {
        // Something went wrong
        if (isDebug()) Zotero.debug("[scholar-citations] "
          + "response === null in semantic");
        return -1;
    }


    let count = null;
    try {
        // Semantic Scholar returns the actual citations
        count = response['citations'].length;
        // Semantic Scholar imposes a rate limit of 100 requests per 5
        // minutes. We should keep track of this globally so that we
        // don't need to rate limit if there are just a few requests.
        await await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
        // There are no citations
        return -1;
    }

    return count;
}

// Google Scholar
async function getGoogleScholar(item) {

	const url = zsc.generateItemUrl(item);
  const url2 = zsc.generateItemUrl_yrRange(item); // search within +/-1 year range
	if (isDebug()) Zotero.debug("[scholar-citations]: Try URL = "	+ url);

	let count = null;

  var response = await fetch(url)
    .then(response => response.text())
    .then(r =>  {
        var count = zsc.getCiteCount(r)
        if (count >= 0) {
                return count
        } else {return null}})
    .catch(err => null);

  if (response === null) {
	if (isDebug()) Zotero.debug("[scholar-citations] "
		    + "response1 === null in googlescholar");

  response = await fetch(url2)
        .then(response => response.text())
        .then(r =>  {
            var count = zsc.getCiteCount(r)
            if (count >= 0) {
                    return count
            } else {return null}})
        .catch(err => null);
  if (isDebug()) Zotero.debug("[scholar-citations]: Try URL2 = "	+ url2);
	}

  if (response === null) {
    if (isDebug()) Zotero.debug("[scholar-citations] "
          + "response3 === null in googlescholar");
    return -1;
  }

	try {
        // google Scholar returns
        //count = zsc.getCiteCount(response);
        count = response
		if (isDebug()) Zotero.debug("[scholar-citations] "
			+ "recieved non-captcha scholar results. Count = " + count);
    if (isDebug()) Zotero.debug("[scholar-citations] response text:" + response);
    } catch (err) {
        // There are no citations
        // or captcha? todo
        return -1;
    }
	return count;
}


// If no DOI in extra, add info to item.extra
zsc.addDOI2ExtraField = function (item, doi){
  let extra = item.getField('extra');
  if (!extra) {
      extra = "";
  }

  const dois = extra.split('\n')
  .map(line => line.match(/^DOI:\s*(.+)/i))
  .filter(line => line)
  .map(line => line[1].trim());

  if (!dois.length) {
    let extras = extra + '\n' + "DOI: " + doi
    item.setField('extra', extras);
  } else {
    if (isDebug()) Zotero.debug("[scholar-citations] addDOI2ExtraField: doi in extra: " + dois);
  }
}

// COinS OpenURL
async function crossrefOpenURLMethod(item) {
  var crossrefOpenURL = 'https://www.crossref.org/openurl?pid=zoteroDOI@wiernik.org&';
  var ctx = Zotero.OpenURL.createContextObject(item, "1.0");
  const url = crossrefOpenURL + ctx + '&multihit=true';

  if (isDebug()) Zotero.debug("[scholar-citations]: URL = "	+ url);

	let doi = null;

  var response = await fetch(url)
    .then( response => {
        if (response.statusText = "OK") {
            if (response.status == 200) {
                return response.text()
            }
        }
    })
    .then(xml => new window.DOMParser().parseFromString(xml, "text/xml"))
    .then(response =>   {
        var status = response.getElementsByTagName("query")[0].getAttribute('status')
        var r = response.getElementsByTagName("query")[0]
        if (status === "resolved") {
            var count = r.getAttribute('fl_count');
            var doi = r.getElementsByTagName("doi")[0].childNodes[0].nodeValue;
            return {
                count:count,
                doi:doi,
                status:status
            }
        } else if (status === "unresolved") { //todo error messaging
            return {status:status}
        } else if (status === "multiresolved") {
            return {status:status}
        } else if (status === "malformed") {
            return {status:status}
        } else {
            return
        }

    })
    .catch(err => null);

  if (response === null) {
	if (isDebug()) Zotero.debug("[scholar-citations] "
		    + "response1 === null in getDOI");
    return;
  }

  if (isDebug()) Zotero.debug("[scholar-citations] [COinS] response:" + response);

  return response
}

// Regex match doi pattern from html response
async function urlScrapDOI(item) {

	var url = item.getField('url')
  if (!url) {
    return
  }
	let doi = null;
	var patt = new RegExp("\\b(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![\"&\\'<>])\\S)+)\\b");

	const response = await fetch(url)
        .then(response => response.text())
        .catch(err => null);

	if (response === null) {
		if (isDebug()) Zotero.debug("[scholar-citations] "
	    + "urlScrapDOI" + " response === null");
	return;
	}

  	if (isDebug()) Zotero.debug("[scholar-citations]: urlScrapDOI URL = "	+ url);

  	const dois = response.trim().split('\n')
	    .map(line => line.match(patt))
	    .filter(line => line)
	    .map(line => line[1].trim());

	try {
        doi = dois[0]
        if (isDebug()) Zotero.debug("[scholar-citations] response doi:" + JSON.stringify(doi));
        return doi

    } catch (err) {
        if (isDebug()) Zotero.debug("[scholar-citations] urlScrapDOI catch error: " + err);
        return;
    }
    return
}


// Preference managers

function getPref(pref) {
    return Zotero.Prefs.get('extensions.citationcounts.' + pref, true)
};

function setPref(pref, value) {
    return Zotero.Prefs.set('extensions.citationcounts.' + pref, value, true)
};

// Startup - initialize plugin

Zotero.CitationCounts.init = function() {
    Zotero.CitationCounts.resetState("initial");

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(
        Zotero.CitationCounts.notifierCallback, ['item']);

    // Unregister callback when the window closes (important to avoid
    // a memory leak)
    window.addEventListener('unload', function(e) {
        Zotero.Notifier.unregisterObserver(notifierID);
    }, false);
};

Zotero.CitationCounts.notifierCallback = {
    notify: function(event, type, ids, extraData) {
        if (event == 'add') {
            const operation = getPref("autoretrieve");
            // Make sure that if pref set to "no", script stops here
            if (operation != "none" || operation === undefined || operation == null  ) {
            //if (isDebug()) Zotero.debug("[scholar-citations]: running updateItems...... ");
              Zotero.CitationCounts.updateItems(Zotero.Items.get(ids), operation);
            } else {
              //if (isDebug()) Zotero.debug("[scholar-citations]: NOOOOPE ");
              return
            }
        }
    }
};

// Controls for Tools menu

// *********** Set the checkbox checks, from pref
Zotero.CitationCounts.setCheck = function() {
    let tools_crossref = document.getElementById(
        "menu_Tools-citationcounts-menu-popup-crossref");
    let tools_inspire = document.getElementById(
        "menu_Tools-citationcounts-menu-popup-inspire");
    let tools_ads = document.getElementById(
        "menu_Tools-citationcounts-menu-popup-ads");
    let tools_semanticscholar = document.getElementById(
        "menu_Tools-citationcounts-menu-popup-semanticscholar");
  	let tools_googlescholar = document.getElementById(
  		"menu_Tools-citationcounts-menu-popup-googlescholar");
    let tools_none = document.getElementById(
        "menu_Tools-citationcounts-menu-popup-none");
    const pref = getPref("autoretrieve");
    tools_crossref.setAttribute("checked", Boolean(pref === "crossref"));
    tools_inspire.setAttribute("checked", Boolean(pref === "inspire"));
    tools_ads.setAttribute("checked", Boolean(pref === "ads"));
    tools_semanticscholar.setAttribute(
        "checked", Boolean(pref === "semanticscholar"));
    tools_googlescholar.setAttribute(
        "checked", Boolean(pref === "googlescholar"));
    tools_none.setAttribute("checked", Boolean(pref === "none"));
};

// *********** Change the checkbox, topref
Zotero.CitationCounts.changePref = function changePref(option) {
    setPref("autoretrieve", option);
};

/**
 * Open citationcounts preference window
 */
Zotero.CitationCounts.openPreferenceWindow = function(paneID, action) {
    const io = {pane: paneID, action: action};
    window.openDialog(
        'chrome://zoterocitationcounts/content/options.xul',
        'citationcounts-pref',
        // TODO: This looks wrong; it's always "dialog=no"?
        'chrome,titlebar,toolbar,centerscreen' + Zotero.Prefs.get('browser.preferences.instantApply', true) ? 'dialog=no' : 'modal',
        io
    );
};

Zotero.CitationCounts.resetState = function(operation) {
    if (operation == "initial") {
        if (Zotero.CitationCounts.progressWindow) {
            Zotero.CitationCounts.progressWindow.close();
        }
        Zotero.CitationCounts.current = -1;
        Zotero.CitationCounts.toUpdate = 0;
        Zotero.CitationCounts.itemsToUpdate = null;
        Zotero.CitationCounts.numberOfUpdatedItems = 0;
        Zotero.CitationCounts.counter = 0;
        error_invalid = null;
        error_nocitationcounts = null;
        error_multiple = null;
        error_invalid_shown = false;
        error_nocitationcounts_shown = false;
        error_multiple_shown = false;
        final_count_shown = false;
        return;
    }

    if (error_invalid || error_nocitationcounts || error_multiple) {
        Zotero.CitationCounts.progressWindow.close();
        const icon = "chrome://zotero/skin/cross.png";
        if (error_invalid && !error_invalid_shown) {
            var progressWindowInvalid = new Zotero.ProgressWindow({closeOnClick:true});
            progressWindowInvalid.changeHeadline("Invalid DOI");
            if (getPref("tag_invalid") !== "") {
                progressWindowInvalid.progress = new progressWindowInvalid.ItemProgress(icon, "Invalid citation counts were found. These have been tagged with '" + getPref("tag_invalid") + "'.");
            } else {
                progressWindowInvalid.progress = new progressWindowInvalid.ItemProgress(icon, "Invalid citation counts were found.");
            }
            progressWindowInvalid.progress.setError();
            progressWindowInvalid.show();
            progressWindowInvalid.startCloseTimer(8000);
            error_invalid_shown = true;
        }
        if (error_nocitationcounts && !error_nocitationcounts_shown) {
            var progressWindowNocitationcounts = new Zotero.ProgressWindow({closeOnClick:true});
            progressWindowNocitationcounts.changeHeadline("Citation count not found");
            if (getPref("tag_nocitationcounts") !== "") {
                progressWindowNocitationcounts.progress = new progressWindowNocitationcounts.ItemProgress(icon, "No citation count was found for some items. These have been tagged with '" + getPref("tag_nocitationcounts") + "'.");
            } else {
                progressWindowNocitationcounts.progress = new progressWindowNocitationcounts.ItemProgress(icon, "No citation counts was found for some items.");
            }
            progressWindowNocitationcounts.progress.setError();
            progressWindowNocitationcounts.show();
            progressWindowNocitationcounts.startCloseTimer(8000);
            error_nocitationcounts_shown = true;
        }
        if (error_multiple && !error_multiple_shown) {
            var progressWindowMulti = new Zotero.ProgressWindow({closeOnClick:true});
            progressWindowMulti.changeHeadline("Multiple possible citation counts");
            if (getPref("tag_multiple") !== "") {
                progressWindowMulti.progress = new progressWindowMulti.ItemProgress(icon, "Some items had multiple possible citation counts. Links to lists of citation counts have been added and tagged with '" + getPref("tag_multiple") + "'.");
            } else {
                progressWindowMulti.progress = new progressWindowMulti.ItemProgress(icon, "Some items had multiple possible DOIs.");
            }
            progressWindow.progress.setError();
            progressWindowMulti.show();
            progressWindowMulti.startCloseTimer(8000);
            error_multiple_shown = true;
        }
        return;
    }
    if (!final_count_shown) {
        const icon = "chrome://zotero/skin/tick.png";
        Zotero.CitationCounts.progressWindow = new Zotero.ProgressWindow({closeOnClick:true});
        Zotero.CitationCounts.progressWindow.changeHeadline("Finished");
        Zotero.CitationCounts.progressWindow.progress = new Zotero.CitationCounts.progressWindow.ItemProgress(icon);
        Zotero.CitationCounts.progressWindow.progress.setProgress(100);
        Zotero.CitationCounts.progressWindow.progress.setText(
            operationNames[operation] + " citation counts updated for " +
                Zotero.CitationCounts.counter + " items.");
        Zotero.CitationCounts.progressWindow.show();
        Zotero.CitationCounts.progressWindow.startCloseTimer(4000);
        final_count_shown = true;
    }
};

Zotero.CitationCounts.updateSelectedItems = function(operation) {
    Zotero.CitationCounts.updateItems(ZoteroPane.getSelectedItems(), operation);
};

Zotero.CitationCounts.updateItems = function(items0, operation) {
    const items = items0.filter(item => !item.isFeedItem);
    //if (isDebug()) Zotero.debug("[scholar-citations]  items: " + JSON.stringify(items, null, 4));

    if (items.length === 0 ||
        Zotero.CitationCounts.numberOfUpdatedItems <
        Zotero.CitationCounts.toUpdate) {
        return;
    }

    Zotero.CitationCounts.resetState("initial");
    Zotero.CitationCounts.toUpdate = items.length;
    Zotero.CitationCounts.itemsToUpdate = items;

    // Progress Windows
    Zotero.CitationCounts.progressWindow =
        new Zotero.ProgressWindow({closeOnClick: false});
    const icon = 'chrome://zotero/skin/toolbar-advanced-search' +
          (Zotero.hiDPI ? "@2x" : "") + '.png';
    Zotero.CitationCounts.progressWindow.changeHeadline(
        "Getting " + operationNames[operation] + " citation counts", icon);
    const doiIcon =
          'chrome://zoterocitationcounts/skin/doi' +
          (Zotero.hiDPI ? "@2x" : "") + '.png';
    Zotero.CitationCounts.progressWindow.progress =
        new Zotero.CitationCounts.progressWindow.ItemProgress(
            doiIcon, "Retrieving citation counts.");
    Zotero.CitationCounts.updateNextItem(operation);
};

Zotero.CitationCounts.updateNextItem = function(operation) {
    Zotero.CitationCounts.numberOfUpdatedItems++;

    if (Zotero.CitationCounts.current == Zotero.CitationCounts.toUpdate - 1) {
        Zotero.CitationCounts.progressWindow.close();
        Zotero.CitationCounts.resetState(operation);
        return;
    }

    Zotero.CitationCounts.current++;

    // Progress Windows
    const percent = Math.round(Zotero.CitationCounts.numberOfUpdatedItems /
                               Zotero.CitationCounts.toUpdate * 100);
    Zotero.CitationCounts.progressWindow.progress.setProgress(percent);
    Zotero.CitationCounts.progressWindow.progress.setText(
        "Item "+Zotero.CitationCounts.current+" of "+
            Zotero.CitationCounts.toUpdate);
    Zotero.CitationCounts.progressWindow.show();

    Zotero.CitationCounts.updateItem(
        Zotero.CitationCounts.itemsToUpdate[Zotero.CitationCounts.current],
        operation);
};

Zotero.CitationCounts.updateItem = async function(item, operation) {
    var doi_exists = false, url_exists = false, title_exists = false;
    doi_exists = doesFieldExist(item, 'DOI')
    url_exists = doesFieldExist(item, 'url')
    title_exists = doesFieldExist(item, 'title')

    if (isDebug()) Zotero.debug("[scholar-citations]  updateItem: "
    + "doi_exists: " + doi_exists +"; url_exists: " + url_exists
    + "; title_exists: " + title_exists + "| Operation: " + operation);


    if (operation == "crossref") {
        var count = await getCrossrefCount(item, null); // doi from item.doi, item.extra, and item.url regex
        if (count >= 0) {
            if (isDebug()) Zotero.debug("[scholar-citations]: [normal] Updating Crossref Count to: "	+ count);
            setCitationCount(item, 'Crossref', count);
            item.saveTx();
            Zotero.CitationCounts.counter++;
        } else { // try scrap doi from item.url
            if (isDebug()) Zotero.debug("[scholar-citations]: scraping doi from html...");
            var doi = await urlScrapDOI(item);
            if (isDebug()) Zotero.debug("[scholar-citations]: [urlScrapDOI]: doi: " + doi);
            if (doi) {
              var count = await getCrossrefCount(item, doi);
              if (isDebug()) Zotero.debug("[scholar-citations]: [urlScrapDOI] count: " + count);
              if (count >= 0) {
                zsc.addDOI2ExtraField(item, doi);
                if (!doi_exists) {
                  try{
                    item.setField('DOI', doi)
                  } catch(err) {}
                }
                if (!url_exists) {
                  try{
                    const url = "https://doi.org/" + doi
                    item.setField('url', url)
                  } catch(err) {}
                }
                setCitationCount(item, 'Crossref', count);
                if (isDebug()) Zotero.debug("[scholar-citations]: [scrape] Updating Crossref Count to: "	+ count);
                item.saveTx();
              }
              Zotero.CitationCounts.counter++;
            } else {
            // if no doi from scrape, COinS
            if (isDebug()) Zotero.debug("[scholar-citations]: Try COinS method...");
            var output = await crossrefOpenURLMethod(item);

            // status checking from ShortDoi
            // If Else is nasty here. Consider Switch Case?
            if (output) {
              if (output.status === "resolved") {
                  if (isDebug()) Zotero.debug("[scholar-citations] [COinS] [" + output.status + "]");
                  if (output.count >= 0) {
                    setCitationCount(item, 'Crossref', output.count);
                  } else {
                    // resolved but no count?
                      if (isDebug()) Zotero.debug("[scholar-citations] [COinS] [" + output.status + "] [no count]");
                  }
                  if (output.doi) {
                    zsc.addDOI2ExtraField(item, output.doi);
                    if (!doi_exists) {
                      try{
                        item.setField('DOI', doi)
                      } catch(err) {}
                    }
                    if (!url_exists) {
                      try{
                        const url = "https://doi.org/" + doi
                        item.setField('url', url)
                      } catch(err) {}
                    }
                  } else {
                    // resolved but no doi?
                    if (isDebug()) Zotero.debug("[scholar-citations] [COinS] [" + output.status + "] [no doi]");
                  }
                  if (isDebug()) Zotero.debug("[scholar-citations]  crossref: count: " + output.count + ". doi: " + output.doi);

              } else if (output.status === "unresolved" ) {
                  if (isDebug()) Zotero.debug("[scholar-citations] [COinS] [" + output.status + "]");
                  // var doi = "noDOI";
                  // todo ShortDoi tagging so that we dont have to do this all over next time
                  // tag_nocitationcounts
                  // todo see .resetState for adding info to toast
              } else if (output.status === "multiresolved") {
                  if (isDebug()) Zotero.debug("[scholar-citations] [COinS] [" + output.status + "]");
              } else {
                  if (isDebug()) Zotero.debug("[scholar-citations] [COinS] [" + output.status + "]");
              }

              item.saveTx();
              Zotero.CitationCounts.counter++;
            } else {
              //next
              if (isDebug()) Zotero.debug("[scholar-citations]: [COinS] no output.");
              Zotero.CitationCounts.counter++;
            }
          }

        }
        Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "inspire") {

        const count_doi = await getInspireCount(item, 'DOI');
        const count_arxiv = await getInspireCount(item, 'arxiv');
        if (count_doi >= 0 || count_arxiv >= 0) {
            if (count_doi >= 0) {
                setCitationCount(item, 'Inspire/DOI', count_doi);
            }
            if (count_arxiv >= 0) {
                setCitationCount(item, 'Inspire/arXiv', count_arxiv);
            }
            item.saveTx();
            Zotero.CitationCounts.counter++;
        }
        Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "semanticscholar") {


        if (doi_exists){
          const count_doi = await getSemanticScholarCount(item, 'DOI');
          //if (isDebug()) Zotero.debug("[scholar-citations]  Semantics " + count_doi + " doi; ");
          if (count_doi >= 0) {
              setCitationCount(item, 'Semantic Scholar/DOI', count_doi);
          }
          item.saveTx();
          Zotero.CitationCounts.counter++;
        } else if (url_exists) {
          const count_arxiv = await getSemanticScholarCount(item, 'arxiv');
          if (count_arxiv >= 0) {
              setCitationCount(item, 'Semantic Scholar/arXiv', count_arxiv);
              //if (isDebug()) Zotero.debug("[scholar-citations]  Semantics " + count_arxiv + " arxiv; ");
          } else {
            const count_url = await getSemanticScholarCount(item, 'url');
            if (count_url >= 0) {
                setCitationCount(item, 'Semantic Scholar/URL', count_url);
                //if (isDebug()) Zotero.debug("[scholar-citations]  Semantics " + count_url +" url; ");
            }
          }
          item.saveTx();
          Zotero.CitationCounts.counter++;
        }
        Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "googlescholar") {
        const counts = await getGoogleScholar(item);
        if (counts >= 0 ) {
          setCitationCount(item, 'Google Scholar', counts);
          item.saveTx();
          Zotero.CitationCounts.counter++;
        }
        Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setcrossref" ) {

          //if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setcrossref'  ");
          count = setCitationCountSwitch(item, 'Crossref');

          if (count){
            await item.saveTx();//await item.save();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setinspire" ) {

          //if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setinspire'  ");
          count = setCitationCountSwitch(item, 'Inspire/DOI');
          if (!count){
            count = setCitationCountSwitch(item, 'Inspire/arXiv');
          }
          if (count){
            await item.saveTx();//await item.save();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setsemanticscholar" ) {

          //if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setsemanticscholar'  ");
          count = setCitationCountSwitch(item, 'Semantic Scholar/DOI');
          if (!count){
            count = setCitationCountSwitch(item, 'Semantic Scholar/arXiv');
          }
          if (count){
            await item.saveTx();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setgooglescholar" ) {

          //if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setgooglescholar'  ");
          count = setCitationCountSwitch(item, 'Google Scholar');
          if (count){
            await item.saveTx();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else {
          Zotero.CitationCounts.updateNextItem(operation);
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('load', function(e) {
        Zotero.CitationCounts.init();
    }, false);
}
