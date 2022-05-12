# Zotero Citation Counts Manager (Frankenstein Edition)

This Zotero add-on tries to find citation counts of selected scholarly items using various APIs and sources:  CrossRef, inspireHEP, semanticScholar, and googleScholar.

![demo](https://i.imgur.com/90RwZt7.gif)

## Plugin Functions
- Get Citation Counts (Right-click and select `Update Citation Counts` options in context menu.)
- Citation Counts info will be placed in the `Extra` **and** `callNumber` field (if field exists)
- Switch between existing citation counts from Extras field (Right-click and select `Switch Citation Counts` options in context menu.)
- Works with itemTypes such as books, that does not have a DOI field


---
### Credits
Most of the code here is by [eschnett's](https://github.com/eschnett/) [zotero-citationcounts](https://github.com/eschnett/zotero-citationcounts) and some from various versions of `Zotero Scholar Citations`, from: [smlum's](https://github.com/smlum/zotero-scholar-citations) (2021 Feb), [MaxKuehn's](https://github.com/MaxKuehn/zotero-scholar-citations/) (2020), and [beloglazov's](https://github.com/beloglazov/zotero-scholar-citations) (2017) versions.
I am a noob at github, so idk if this is proper etiquette. But Imma just make releases for personal use.

### About Add-on
This is an add-on for [Zotero](https://www.zotero.org), a research source management tool. The add-on can auto-fetch citation counts for journal articles using various APIs, including [Crossref](https://www.crossref.org), [Inspire
HEP](https://inspirehep.net),<!-- [NASA/ADS](https://ui.adsabs.harvard.edu), --> and [Semantic Scholar](https://www.semanticscholar.org).
[Google Scholar](https://scholar.google.com) works since v1.2.2



### Installing

1. Download the add-on (the .xpi file) from [the latest release](https://github.com/welpdx/zotero-citationcounts/releases)
2. To download the .xpi file, right click it and select 'Save link as'
3. Run Zotero (version 5.x)
4. Go to `Tools -> Add-ons`
5. `Install Add-on From File`
6. Selected the downloaded `.xpi` file.
7. Restart Zotero


### License
Distributed under the Mozilla Public License (MPL) Version 2.0.
