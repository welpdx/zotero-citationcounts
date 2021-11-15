// Startup -- load Zotero and constants
if (typeof Zotero === 'undefined') {
    Zotero = {};
}
Zotero.CitationCounts = {};

// Stuff for Google Scholar. Collated from
//https://github.com/smlum/zotero-scholar-citations/blob/develop/chrome/content/zsc.js
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
        let citeCount = citeStr.substring(citePrefixLen);
        return parseInt(citeCount.trim());
    }
};

// Definitions

const operations = [
    "crossref", "inspire", "ads", "semanticscholar", "googlescholar", "setcrossref", "setinspire", "setads", "setsemanticscholar"
];

const operationNames = {
    "crossref": "Crossref",
    "inspire": "Inspire HEP",
    //"ads": "NASA/ADS",
    "semanticscholar": "Semantic Scholar",
  	"googlescholar": "Google Scholar",
    "setcrossref": "Crossref",
    "setinspire": "Inspire HEP",
    //"setads": "NASA/ADS",
    "setsemanticscholar": "Semantic Scholar",
    "setgooglescholar" : "Google Scholar"
};

/* function getCitationCount(item, tag) {
    let extra = item.getField('extra');
    if (!extra) {
        return -1;
    }
    let extras = extra.split("\n");
    const patt = new RegExp("^Citations \\(" + tag + "\\): (\\d+).*", "i");
    extras = extras.filter(ex => patt.test(ex));
    if (length(extras) == 0) {
        return -1;
    }
    let count = patt.exec(extras[1])[1]
    if (!count) {
        return -1;
    }
    count = parseInt(count);
    return count;
} */


function setCitationCountSwitch(item, tag) {
  //if (isDebug()) Zotero.debug("[scholar-citations] item: "+ item);

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
  //if (isDebug()) Zotero.debug("[scholar-citations] rest: "  + rest);

  rest = String(rest).split(",").join("\n");
  //if (isDebug()) Zotero.debug("[scholar-citations] rest2: "  + rest);
  extra = line + "\n" + rest;

  item.setField('extra', extra);
  count = parseInt(count)
  item.setField('callNumber', count);

  //if (isDebug()) Zotero.debug("[scholar-citations] count: " + count);
  return count;
}

function doesFieldExist(item, idtype) {
  const fieldContent = item.getField(idtype);
  if (!fieldContent) {
    return true
  } else {
    return false
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
    item.setField('callNumber', count);
}

async function getCrossrefCount(item) {
    const doi = item.getField('DOI');
    if (!doi) {
        // There is no DOI; skip item
        return -1;
    }
    const edoi = encodeURIComponent(doi);

    let response = null;

    if (response === null) {
        const style = "vnd.citationstyles.csl+json";
        const xform = "transform/application/" + style;
        const url = "https://api.crossref.org/works/" + edoi + "/" + xform;
        response = await fetch(url)
            .then(response => response.json())
            .catch(err => null);
    }

    if (response === null) {
        const url = "https://doi.org/" + edoi;
        const style = "vnd.citationstyles.csl+json";
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
    if (idtype == 'doi') {
        doi = item.getField('DOI');
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

    if (response === null) {
        // Something went wrong
        return -1;
    }

    let str = null;
    try {
        str = response['metadata']['citation_count'];
    } catch (err) {
        // There are no citation counts
        return -1;
    }

    const count = parseInt(str);
    return count;
}

async function getSemanticScholarCount(item, idtype) {
    if (isDebug()) Zotero.debug("[scholar-citations]: idtype = "	+ idtype);
    let doi = null;
    if (idtype == 'doi') {
        doi = item.getField('DOI');
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
      if (isDebug()) Zotero.debug("[scholar-citations]: idtype == 'url' = "	+ (String(idtype) == 'url') + "   asdf");
      let count = null
      url1 = item.getField('url');
      //const urlFieldID = Zotero.ItemFields.getID('url')
      if (isDebug()) Zotero.debug("[scholar-citations]: URL = "	+ url1 );//+ "\n" + urlFieldID);

      if (url1) {
        //url1 = encodeURI(url1)
        const url =
              "https://api.semanticscholar.org/v1/paper/" + "URL:" + url1
        if (isDebug()) Zotero.debug("[scholar-citations]: const url = "	+ url );
        const response = await fetch(url)
              .then(response => response.json())
              .catch(err => null);
        let count = null;
        try {
            count = response['citations'].length;
            await await new Promise(r => setTimeout(r, 3000));
            return count
        } catch (err) {
            // There are no citations
            return -1;
        }
          return count;
      }

    } else {
        // Internal error
        return -1;
    }
    if (!doi) {
        // There is no DOI / arXiv id; skip item
        return -1;
    }
    const edoi = encodeURIComponent(doi);

    const url =
          "https://api.semanticscholar.org/v1/paper/" +
          (idtype == 'doi' ? '' : 'arXiv:') + edoi
    const response = await fetch(url)
          .then(response => response.json())
          .catch(err => null);

    if (response === null) {
        // Something went wrong
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


//Google Scholar
async function getGoogleScholar(item) {

	const url = zsc.generateItemUrl(item);
	if (isDebug()) Zotero.debug("[scholar-citations]: URL = "	+ url);

	let count = null;

    const response = await fetch(url)
          .then(response => response.text())
          .catch(err => null);

    if (response === null) {
        // Something went wrong
		if (isDebug()) Zotero.debug("[scholar-citations] "
			+ "Something went wrong");
        return -1;
	}

	try {
        // google Scholar returns
        count = zsc.getCiteCount(response);
		if (isDebug()) Zotero.debug("[scholar-citations] "
			+ "recieved non-captcha scholar results");
		if (isDebug()) Zotero.debug("[scholar-citations] Count: "
			+ count);
    } catch (err) {
        // There are no citations
        return -1;
    }
	return count;
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
            Zotero.CitationCounts.updateItems(Zotero.Items.get(ids), operation);
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
    if (isDebug()) Zotero.debug("[scholar-citations]  items0: " + JSON.stringify(items0, null, 4));
    if (isDebug()) Zotero.debug("[scholar-citations]  items: " + JSON.stringify(items, null, 4));

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
    if (operation == "crossref") {

        const count = await getCrossrefCount(item);
        if (count >= 0) {
            setCitationCount(item, 'Crossref', count);
            item.saveTx();
            Zotero.CitationCounts.counter++;
        }
        Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "inspire") {

        const count_doi = await getInspireCount(item, 'doi');
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

        const count_doi = await getSemanticScholarCount(item, 'doi');
        const count_arxiv = await getSemanticScholarCount(item, 'arxiv');
        const count_url = await getSemanticScholarCount(item, 'url');
        if (isDebug()) Zotero.debug("[scholar-citations]  sematnics " + count_doi + "doi"+ count_arxiv + "arxiv"+ count_url +"url");
        if (count_doi >= 0 || count_arxiv >= 0) {
            if (count_doi >= 0) {
                setCitationCount(item, 'Semantic Scholar/DOI', count_doi);
            }
            if (count_arxiv >= 0) {
                setCitationCount(item, 'Semantic Scholar/arXiv', count_arxiv);
            }
            item.saveTx();
            Zotero.CitationCounts.counter++;
        } else if (count_url >= 0){
            setCitationCount(item, 'Semantic Scholar/url', count_url);
            item.saveTx();
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

          if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setcrossref'  ");
          count = setCitationCountSwitch(item, 'Crossref');

          //await item.save();
          if (count){
            await item.saveTx();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setinspire" ) {

          if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setinspire'  ");
          count = setCitationCountSwitch(item, 'Inspire/DOI');
          if (!count){
            count = setCitationCountSwitch(item, 'Inspire/arXiv');
          }
          //await item.save();
          if (count){
            await item.saveTx();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setsemanticscholar" ) {

          if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setsemanticscholar'  ");
          count = setCitationCountSwitch(item, 'Semantic Scholar/DOI');
          if (!count){
            count = setCitationCountSwitch(item, 'Semantic Scholar/arXiv');
          }
          //await item.save();
          if (count){
            await item.saveTx();
          }
          Zotero.CitationCounts.counter++;
          Zotero.CitationCounts.updateNextItem(operation);

    } else if (operation == "setgooglescholar" ) {

          if (isDebug()) Zotero.debug("[scholar-citations] operation == 'setgooglescholar'  ");
          count = setCitationCountSwitch(item, 'Google Scholar');

          //await item.save();
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
