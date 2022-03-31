# Zotero Citation Counts Manager (Frankenstein Edition)

## Changelogs
#### 1.3.1  Update for Zotero 6.0
 - Simply allowed plugin to work in Zotero V6.0. No additional code changes added
#### 1.3.0  Big Boi Update
 - For Semantic Scholar Option, added a function to use semanticScholar url to get count. [eschnett/Issue#13](https://github.com/eschnett/zotero-citationcounts/issues/13)
 - Reduced unnessary fetch requests  (in `CitationCounts.updateItem()`)
 - Fixed error where actions triggers an '"undefined" citation count' progress Window. [eschnett/Issue#16](https://github.com/eschnett/zotero-citationcounts/issues/16)
 - Fixed error where add-on breaks because some itemTypes don't have a `callNumber` field. For items that don't have the `CallNumber` field, cite count info is **only** added to the `Extra` field. Custom fields is planned in Zotero v5.2 apparently, so we may have to wait for that to happen.
 - changed icon so that it doesn't look like [bwiernik's DOI Manager](https://github.com/bwiernik/zotero-shortdoi)
 - solidified that, this add-on, is in fact, the Frankenstein Edition (changed title in add-on info page)


#### 1.2.3
 - Adds Extra Context Menu when RightClicking to switch citation count, if data exists.  
 - [demo gif](https://i.imgur.com/JC90JxQ.gif)
 - SideNote: I messed up commit comments. Commits "V1.2.3.0" and "V1.2.3.1" that is implemented in the V1.2.3 release should actually be called "V1.2.2.1" and "V1.2.2.2" respectively.

#### 1.2.2  Added Google Scholar as an option. Get's Google Scholar "Cited By" numbers and adds it in "Extra" and "callNumber" fields

#### 1.2.1  Replaces the callNumber field with times cited count

---
### Credits
Most of the code here is by [eschnett's](https://github.com/eschnett/) [zotero-citationcounts](https://github.com/eschnett/zotero-citationcounts) and some from various versions of `Zotero Scholar Citations`, from: [smlum's](https://github.com/smlum/zotero-scholar-citations) (2021 Feb), [MaxKuehn's](https://github.com/MaxKuehn/zotero-scholar-citations/) (2020), and [beloglazov's](https://github.com/beloglazov/zotero-scholar-citations) (2017) versions.
I am a noob at github, so idk if this is proper etiquette. But Imma just make releases for personal use.

### About Add-on
This is an add-on for [Zotero](https://www.zotero.org), a research source management tool. The add-on can auto-fetch citation counts for journal articles using various APIs, including [Crossref](https://www.crossref.org), [Inspire
HEP](https://inspirehep.net),<!-- [NASA/ADS](https://ui.adsabs.harvard.edu), --> and [Semantic Scholar](https://www.semanticscholar.org).
[Google Scholar](https://scholar.google.com) works since v1.2.2

## Plugin Functions
- Get Citation Counts (Right-click and select `Update Citation Counts` options in context menu.)
- Citation Counts info will be placed in the `Extra` **and** `callNumber` field (if field exists)
- Switch between existing citation counts from Extras field (Right-click and select `Switch Citation Counts` options in context menu.)



### Installing

- Download the add-on (the .xpi file) from [the latest release](https://github.com/welpdx/zotero-citationcounts/releases)
- To download the .xpi file, right click it and select 'Save link as'
- Run Zotero (version 5.x)
- Go to `Tools -> Add-ons`
- `Install Add-on From File`
- Choose the file `zotero-citationcounts-1.3.0.xpi`
- Restart Zotero

### License
Distributed under the Mozilla Public License (MPL) Version 2.0.

#### FAQ
1. Citation Count is in Extra field but not in the Call Number column?
- Some items don't have a Call Number field. Such itemTypes are: bill , blogPost , case , email , forumPost , hearing , instantMessage , patent , presentation , statute , webpage. See Question 2
2. Why can't we just create a new custom field for all items?
- Currently, Zotero doesn't have any special field for the number of citations (maybe in Zotero V5.1? [info](https://github.com/eschnett/zotero-citationcounts/issues/12#issuecomment-966550007)).
3. A feature in this add-on isn't working! What should I do?
- Please create a new issue. Please also add info from the Zotero Debugger:
  1. Open Debugger (Alt, H,L,V)
  2. Replicate bug or perform actions that causes the issue
  3. Copy pasta Debugger text and paste it into [shrib.com](http://shrib.com/) or some online notepad.
  4. Please [create a new bug report](https://github.com/welpdx/zotero-citationcounts/issues/new/choose).
