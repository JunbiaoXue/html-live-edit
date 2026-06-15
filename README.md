# HTML Live Edit

A VSCode/Trae extension for visual WYSIWYG editing of HTML files. Double-click text to edit directly on the rendered page.

## Features

- 🖱️ **Double-click to edit** - Double-click any text element to start editing
- ✏️ **Edit Mode** - Toggle edit mode to enable/disable editing
- 💾 **Save** - Save changes back to the source HTML file
- 🎨 **Clean UI** - Modern dark toolbar with purple accent theme
- 📊 **Edit tracking** - See how many changes you've made

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
3. Click **Edit Mode** in the toolbar
4. **Double-click** any text to edit it
5. Click **Save** to save changes

## Supported Elements

- Headings: `h1` - `h6`
- Paragraphs: `p`
- Lists: `li`, `dt`, `dd`
- Table cells: `td`, `th`
- Inline text: `span`, `strong`, `em`, `b`, `i`, `a`
- Containers: `div`, `blockquote`, `label`, `figcaption`

## Requirements

- VSCode 1.74+ or compatible editor (Trae, Cursor, etc.)

## License

MIT
