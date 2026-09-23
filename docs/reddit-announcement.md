# Reddit announcement draft

Destination: r/RemarkableTablet. Required flair: Self-Promotion.

Title: I built a writable split-screen companion for Paper Pro (experimental, 3.29.0.148)

I've been working on Companion Notebook: a portrait split-screen / writable margin for reading one document while taking notes in another, inspired by rm-hacks' split-document idea.

Both panes support native handwriting and independent scrolling, with shared pen controls and only a thin divider between them. You can choose a small, medium or half-height companion, switch the documents' roles, and choose partners from Recent or Favorites in a popup. Pairings are remembered per document.

Source: https://github.com/guibor/companion-notebook

Portrait only for now. Important caveat: this is an experimental XOVI/QML integration developed on Paper Pro firmware 3.29.0.148, not a general-purpose installer. It is not qualified for other firmware, Paper Pro Move, reMarkable 2 or landscape. The repo includes engineering and recovery notes; please don't blindly run the device-specific deployment scripts. Back up your documents before experimenting.

I'd love feedback on the reading-and-writing workflow, and input from developers interested in making this more portable.
