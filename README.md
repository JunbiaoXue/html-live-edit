# HTML Live Edit

[中文说明](README.zh-CN.md)

A VSCode/Trae extension for visual WYSIWYG editing of HTML files. Double-click text to edit directly on the rendered page.

## Features

- 🖱️ **Double-click to edit** — Double-click any text element to start editing inline.
- 🖼️ **Double-click to replace images** — Double-click any image to replace it via file picker.
- 📝 **Source view** — Toggle between visual preview and raw HTML source editing.
- ↩ **Undo/Redo** — Full undo/redo support (Ctrl+Z / Ctrl+Y).
- 🔍 **Zoom** — Zoom in/out the preview (Ctrl+/-/0).
- 💾 **Save** — Save changes back while preserving the full HTML structure (head, styles, scripts).
- 🎨 **Element tooltip** — Hover in edit mode to see the tag name, classes, and character count.
- 📊 **Edit tracking** — See how many edits you have made.

## Installation

### From a VSIX file

1. Download the latest `.vsix` file from [Releases](../../releases).
2. In VSCode/Trae, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
3. Run `Install from VSIX`.
4. Select the downloaded `.vsix` file.

### Build from source

```bash
git clone https://github.com/JunbiaoXue/html-live-edit.git
cd html-live-edit
npm install
npm run compile
npx vsce package
```

## Usage

1. Open an `.html` or `.htm` file.
2. Open it with **HTML Visual Editor** if it does not open there automatically.
3. Click **✏️ Edit** in the toolbar, or press Ctrl+E.
4. Double-click text to edit it inline.
5. Double-click an image to replace it.
6. Click **💾 Save**, or press Ctrl+S.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+E | Toggle edit mode |
| Ctrl+U | Toggle source view |
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl++ | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Reset zoom |

## Supported editable elements

- Headings: `h1`–`h6`
- Paragraphs: `p`
- Lists: `li`, `dt`, `dd`, `summary`
- Table cells: `td`, `th`, `caption`
- Inline text: `span`, `strong`, `em`, `b`, `i`, `u`, `mark`, `small`, `sub`, `sup`
- Links: `a`, `abbr`, `time`
- Callouts: `.note`, `.warn`
- Custom components: `.kpi-label`, `.kpi-value`, `.subtitle`, `.figure-caption`, `.insight-box strong`, `.highlight`
- Images: `img` (double-click to replace)

## What's new in v1.2.2

- 🛠️ Callout containers such as `.note` and `.warn` can be edited as complete blocks, including mixed bold labels and following text.

## What's new in v1.2.1

- 🛠️ Supports explicit `<head>...</head>` documents, HTML5 documents with an implicit head, and HTML fragments without `<html>` / `<body>` wrappers.
- 🛠️ Preserves leading metadata, styles, scripts, titles, links, and base URLs when opening browser-valid HTML that omits `<head>`.

## What's new in v1.1.0

- 🆕 Source code view (Ctrl+U) for direct HTML editing.
- 🆕 Undo/Redo support (Ctrl+Z / Ctrl+Y).
- 🆕 Zoom controls (Ctrl+/-/0).
- 🆕 Image replacement via file picker.
- 🆕 Element info tooltip on hover.
- 🔧 Save preserves the full HTML structure (head, styles, scripts).
- 🔧 Expanded text element selectors for report components.
- 🔧 Improved CSP configuration for base64 images.

## Requirements

- VSCode 1.74+ or a compatible editor such as Trae or Cursor.

## License

MIT
