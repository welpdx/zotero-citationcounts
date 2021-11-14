# Zotero Citation Counts Manager

* This is a fork from [eschnett](https://github.com/eschnett/). See [his code here](https://github.com/eschnett/zotero-citationcounts).

## Changelogs
#### 1.2.1
 - Replaces the callNumber field with times cited count
#### 1.2.2
 - Added Google Scholar as an option. Get's Google Scholar "Cited By" numbers and adds it in "Extra" and "callNumber" fields
#### 1.2.3
 - Adds Extra Context Menu when RightClicking to switch citation count, if data exists.  
 - [demo gif](https://i.imgur.com/JC90JxQ.gif)

### Credits
I am a noob at github, so idk if this is proper etiquette. But Imma just make releases for personal use. Most of the code here is by [eschnett](https://github.com/eschnett/) and some in Zotero Scholar Citations from [smlum's](https://github.com/smlum/zotero-scholar-citations) (2021 Feb), [MaxKuehn's](https://github.com/MaxKuehn/zotero-scholar-citations/) (2019), and [beloglazov's](https://github.com/beloglazov/zotero-scholar-citations) (2017) versions.
### About Add-on
This is an add-on for [Zotero](https://www.zotero.org), a research source management tool. The add-on can auto-fetch citation counts for journal articles using various APIs, including [Crossref](https://www.crossref.org), [Inspire
HEP](https://inspirehep.net),<!-- [NASA/ADS](https://ui.adsabs.harvard.edu), --> and [Semantic Scholar](https://www.semanticscholar.org).
[Google Scholar](https://scholar.google.com) works in v1.2.2

## Plugin Functions
- Get citation counts: Right-click selected Zotero items and select from "Manage Citation Counts" options.
  This will replace stored citation counts (if any) and tag results with the current date.
- Currently, Zotero doesn't have any special field for the number of citations (maybe in Zotero V5.1? [info](https://github.com/eschnett/zotero-citationcounts/issues/12#issuecomment-966550007)), so they are stored in the "Extra" field. **It will also replace the Call Number field with the count number** (so one can sort by count number).

## Installing

- Download the add-on (the .xpi file) from the latest release: https://github.com/welpdx/zotero-citationcounts/releases
- To download the .xpi file, right click it and select 'Save link as'
- Run Zotero (version 5.x)
- Go to `Tools -> Add-ons`
- `Install Add-on From File`
- Choose the file `zotero-citationcounts-1.2.2.xpi`
- Restart Zotero

## License
Distributed under the Mozilla Public License (MPL) Version 2.0.
