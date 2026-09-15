# HTML Live Edit / HTML 实时编辑器

A VSCode/Trae extension for visual WYSIWYG editing of HTML files. Double-click text to edit directly on the rendered page.

适用于 VSCode/Trae 的 HTML 可视化所见即所得编辑器。直接双击渲染页面中的文本即可原位编辑。

## Features / 功能

- 🖱️ **Double-click to edit / 双击编辑** — Double-click any text element to start editing inline. / 双击任意文本元素即可原位编辑。
- 🖼️ **Double-click to replace images / 双击替换图片** — Double-click any image to replace it via file picker. / 双击图片，通过文件选择器替换。
- 📝 **Source view / 源码视图** — Toggle between visual preview and raw HTML source editing. / 在可视化预览与原始 HTML 编辑之间切换。
- ↩ **Undo/Redo / 撤销与重做** — Full undo/redo support (Ctrl+Z / Ctrl+Y). / 支持完整撤销与重做（Ctrl+Z / Ctrl+Y）。
- 🔍 **Zoom / 缩放** — Zoom in/out the preview (Ctrl+/-/0). / 缩放预览（Ctrl+/-/0）。
- 💾 **Save / 保存** — Save changes back preserving full HTML structure (head/styles/scripts). / 保存修改并保留完整 HTML 结构（head、样式、脚本）。
- 🎨 **Element tooltip / 元素提示** — Hover in edit mode shows tag name, classes, and char count. / 编辑模式悬停可显示标签名、类名和字符数。
- 📊 **Edit tracking / 编辑计数** — See how many edits you've made. / 显示已完成的编辑次数。

## Installation / 安装

### From VSIX file / 通过 VSIX 文件安装

1. Download the latest `.vsix` file from [Releases](../../releases). / 从 [Releases](../../releases) 下载最新版 `.vsix` 文件。
2. In VSCode/Trae, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac). / 在 VSCode/Trae 中按 `Ctrl+Shift+P`（Mac 为 `Cmd+Shift+P`）。
3. Type `Install from VSIX`. / 输入 `Install from VSIX`。
4. Select the downloaded `.vsix` file. / 选择下载的 `.vsix` 文件。

### Build from source / 从源码构建

```bash
git clone https://github.com/JunbiaoXue/html-live-edit.git
cd html-live-edit
npm install
npm run compile
npx vsce package
```

## Usage / 使用方法

1. Open any `.html` or `.htm` file. / 打开任意 `.html` 或 `.htm` 文件。
2. The file opens in the visual editor (or click the editor switch button). / 文件会在可视化编辑器中打开（也可点击编辑器切换按钮）。
3. Click **✏️ Edit** in the toolbar (or press Ctrl+E). / 点击工具栏中的 **✏️ Edit**（或按 Ctrl+E）。
4. **Double-click** any text to edit it inline. / **双击**文本即可原位编辑。
5. **Double-click** any image to replace it. / **双击**图片即可替换。
6. Click **💾 Save** (or press Ctrl+S). / 点击 **💾 Save**（或按 Ctrl+S）保存。

## Keyboard Shortcuts / 快捷键

| Shortcut / 快捷键 | Action / 操作 |
|---|---|
| Ctrl+E | Toggle edit mode / 切换编辑模式 |
| Ctrl+U | Toggle source view / 切换源码视图 |
| Ctrl+S | Save / 保存 |
| Ctrl+Z | Undo / 撤销 |
| Ctrl+Y | Redo / 重做 |
| Ctrl++ | Zoom in / 放大 |
| Ctrl+- | Zoom out / 缩小 |
| Ctrl+0 | Reset zoom / 重置缩放 |

## Supported Editable Elements / 支持编辑的元素

- Headings / 标题：`h1` - `h6`
- Paragraphs / 段落：`p`
- Lists / 列表：`li`, `dt`, `dd`, `summary`
- Table cells / 表格单元格：`td`, `th`, `caption`
- Inline text / 行内文本：`span`, `strong`, `em`, `b`, `i`, `u`, `mark`, `small`, `sub`, `sup`
- Links / 链接：`a`, `abbr`, `time`
- Custom components / 自定义组件：`.kpi-label`, `.kpi-value`, `.subtitle`, `.figure-caption`, `.insight-box strong`, `.highlight`
- Images / 图片：`img`（double-click to replace / 双击替换）

## What's New in v1.2.2 / v1.2.2 更新

- 🛠️ Callout containers such as `.note` and `.warn` are now editable as complete blocks, including mixed bold labels and following text. / `.note`、`.warn` 等提示框现在可作为完整内容块编辑，包括加粗标签及其后的正文。

## What's New in v1.2.1 / v1.2.1 更新

- 🛠️ Supports explicit `<head>...</head>` documents, HTML5 documents with an implicit head, and HTML fragments without `<html>` / `<body>` wrappers. / 支持显式 `<head>...</head>` 文档、使用隐式 head 的 HTML5 文档，以及没有 `<html>` / `<body>` 外壳的 HTML 片段。
- 🛠️ Preserves leading metadata, styles, scripts, titles, links, and base URLs when opening browser-valid HTML that omits `<head>`. / 打开省略 `<head>` 但符合浏览器解析规则的 HTML 时，保留前置元数据、样式、脚本、标题、链接和基础 URL。

## What's New in v1.1.0 / v1.1.0 更新

- 🆕 Source code view (Ctrl+U) for direct HTML editing. / 新增源码视图（Ctrl+U），可直接编辑 HTML。
- 🆕 Undo/Redo support (Ctrl+Z / Ctrl+Y). / 新增撤销与重做支持（Ctrl+Z / Ctrl+Y）。
- 🆕 Zoom controls (Ctrl+/-/0). / 新增缩放控制（Ctrl+/-/0）。
- 🆕 Image replacement via file picker. / 新增通过文件选择器替换图片。
- 🆕 Element info tooltip on hover. / 新增元素悬停信息提示。
- 🔧 Save now preserves full HTML structure (head, styles, scripts). / 保存时保留完整 HTML 结构（head、样式、脚本）。
- 🔧 Comprehensive text element selectors for report components. / 改进报告组件的文本元素选择器覆盖范围。
- 🔧 Better CSP configuration for base64 images. / 改进 base64 图片的 CSP 配置。

## Requirements / 环境要求

- VSCode 1.74+ or compatible editor (Trae, Cursor, etc.). / VSCode 1.74+ 或兼容编辑器（Trae、Cursor 等）。

## License / 许可证

MIT
