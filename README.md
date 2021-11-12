# Zotero Citation Counts Manager

* This is a fork from [eschnett](https://github.com/eschnett/). See [his code here](https://github.com/eschnett/zotero-citationcounts).

I am a noob at github, so idk if this is proper etiquette. But Imma just make releases for personal use. All code here is by [eschnett](https://github.com/eschnett/). He even has instructions on how to make new builds. So all credit to him. Please don't @ me. 

This is an add-on for [Zotero](https://www.zotero.org), a research source management tool. The add-on can auto-fetch citation counts for journal articles using various APIs, including [Crossref](https://www.crossref.org), [Inspire
HEP](https://inspirehep.net),<!-- [NASA/ADS](https://ui.adsabs.harvard.edu), --> and [Semantic Scholar](https://www.semanticscholar.org).
[Google Scholar](https://scholar.google.com) is not supported because automated access is against its terms of service. But I want to see if I can do it.

Code for this extension is based on the [Zotero DOI Manager](https://github.com/bwiernik/zotero-shortdoi), which is based in part on [Zotero Google Scholar Citations](https://github.com/beloglazov/zotero-scholar-citations) by  Anton Beloglazov.

## Plugin Functions

- Get citation counts: Right-click selected Zotero items and select from "Manage Citation Counts" options.
  This will replace stored citation counts (if any) and tag results with the current date.
- Currently, Zotero doesn't have any special field for the number of citations, so they are stored in the "Extra" field. **It will also replace the Call Number field with the count number** (so one can sort by count number).

## Installing

- Download the add-on (the .xpi file) from the latest release: https://github.com/eschnett/zotero-citationcounts/releases
- To download the .xpi file, right click it and select 'Save link as'
- Run Zotero (version 5.x)
- Go to `Tools -> Add-ons`
- `Install Add-on From File`
- Choose the file `zotero-citationcounts-1.2.0.xpi`
- Restart Zotero

## License

Distributed under the Mozilla Public License (MPL) Version 2.0.
