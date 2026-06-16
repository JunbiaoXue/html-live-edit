# HTML Live Edit

A VSCode/Trae extension for visual WYSIWYG editing of HTML files. Double-click text to edit directly on the rendered page.

## Features

- 🖱️ **Double-click to edit** — Double-click any text element to start editing inline
- 🖼️ **Double-click to replace images** — Double-click any image to replace it via file picker
- 📝 **Source view** — Toggle between visual preview and raw HTML source editing
- ↩ **Undo/Redo** — Full undo/redo support (Ctrl+Z / Ctrl+Y)
- 🔍 **Zoom** — Zoom in/out the preview (Ctrl+/-/0)
- 💾 **Save** — Save changes back preserving full HTML structure (head/styles/scripts)
- 🎨 **Element tooltip** — Hover in edit mode shows tag name, classes, and char count
- 📊 **Edit tracking** — See how many edits you've made

## Installation

### From VSIX file

1. Download the latest `.vsix` file from [Releases](../../releases)
2. In VSCode/Trae, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type `Install from VSIX`
4. Select the downloaded `.vsix` file

### Build from source

```bash
git clone https://github.com/JunbiaoXue/html-live-edit.git
cd html-live-edit
npm install
npm run compile
npx vsce package
```

## Usage

1. Open any `.html` or `.htm` file
2. The file opens in the visual editor (or click the editor switch button)
3. Click **✏️ Edit** in the toolbar (or press Ctrl+E)
4. **Double-click** any text to edit it inline
5. **Double-click** any image to replace it
6. Click **💾 Save** (or press Ctrl+S)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+E | Toggle edit mode |
| Ctrl+U | Toggle source view |
| Ctrl+S | Save |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl++ | Zoom in |
| Ctrl+- | Zoom out |
| Ctrl+0 | Reset zoom |

## Supported Editable Elements

- Headings: `h1` - `h6`
- Paragraphs: `p`
- Lists: `li`, `dt`, `dd`, `summary`
- Table cells: `td`, `th`, `caption`
- Inline text: `span`, `strong`, `em`, `b`, `i`, `u`, `mark`, `small`, `sub`, `sup`
- Links: `a`, `abbr`, `time`
- Custom components: `.kpi-label`, `.kpi-value`, `.subtitle`, `.figure-caption`, `.insight-box strong`, `.highlight`
- Images: `img` (double-click to replace)

## What's New in v1.1.0

- 🆕 Source code view (Ctrl+U) for direct HTML editing
- 🆕 Undo/Redo support (Ctrl+Z / Ctrl+Y)
- 🆕 Zoom controls (Ctrl+/-/0)
- 🆕 Image replacement via file picker
- 🆕 Element info tooltip on hover
- 🔧 Save now preserves full HTML structure (head, styles, scripts)
- 🔧 Comprehensive text element selectors for report components
- 🔧 Better CSP configuration for base64 images

## Requirements

- VSCode 1.74+ or compatible editor (Trae, Cursor, etc.)

## License

MIT
