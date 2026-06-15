# HTML WYSIWYG Editor

A VSCode/Trae extension for visual WYSIWYG editing of HTML files. Edit text directly on the rendered page without touching the source code.

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
git clone https://github.com/JunbiaoXue/html-wysiwyg-editor.git
cd html-wysiwyg-editor
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
- Special boxes: `.highlight-box`, `.mechanism-box`, etc.

## Keyboard Shortcuts

- **Double-click**: Enter edit mode for clicked element
- **Click outside**: Exit edit mode for current element
- **Save button**: Save all changes

## Requirements

- VSCode 1.74+ or compatible editor (Trae, Cursor, etc.)

## License

MIT

## Repository

[https://github.com/JunbiaoXue/html-wysiwyg-editor](https://github.com/JunbiaoXue/html-wysiwyg-editor)
