# Companion and Quick Pad demos

Recorded on reMarkable Paper Pro, firmware 3.29.0.148, portrait.
These are actual screen-share recordings, not mockups or simulated handwriting.
Screen sharing does not capture the physical panel's e-ink refresh behavior.

| Clip | GIF | MP4 | Editing |
| --- | --- | --- | --- |
| Quick Pad: open, write, tuck away | [GIF](quick-pad.gif) | [MP4](quick-pad.mp4) | Two excerpts, 1.5× speed |
| Read and scroll with a corner pad | [GIF](read-and-scroll.gif) | [MP4](read-and-scroll.mp4) | One excerpt, 1.5× speed |
| Write beneath a PDF | [GIF](companion-writing.gif) | [MP4](companion-writing.mp4) | One excerpt, 1.25× speed |

The bottom screen-sharing banner is cropped out. Library and document-picker
browsing are not included. No handwriting or interface content was synthesized.
The original private recording is not committed.

Developer regeneration: `node ops/render-demo-clips.mjs /path/to/original.mp4`
requires FFmpeg with H.264 encoding. The edit points are specific to this demo.
