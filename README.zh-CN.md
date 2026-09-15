# HTML 实时编辑器

[English README](README.md)

适用于 VSCode/Trae 的 HTML 可视化所见即所得编辑器。直接双击渲染页面中的文本即可原位编辑。

## 功能

- 🖱️ **双击编辑**：双击任意文本元素即可原位编辑。
- 🖼️ **双击替换图片**：双击图片后，通过文件选择器替换。
- 📝 **源码视图**：在可视化预览与原始 HTML 编辑之间切换。
- ↩ **撤销与重做**：支持完整撤销与重做（Ctrl+Z / Ctrl+Y）。
- 🔍 **缩放**：缩放预览（Ctrl+/-/0）。
- 💾 **保存**：保存修改并保留完整 HTML 结构（head、样式、脚本）。
- 🎨 **元素提示**：编辑模式下悬停可显示标签名、类名和字符数。
- 📊 **编辑计数**：显示已完成的编辑次数。

## 安装

### 通过 VSIX 文件安装

1. 从 [Releases](../../releases) 下载最新版 `.vsix` 文件。
2. 在 VSCode/Trae 中按 `Ctrl+Shift+P`（macOS 为 `Cmd+Shift+P`）。
3. 运行 `Install from VSIX`。
4. 选择下载的 `.vsix` 文件。

### 从源码构建

```bash
git clone https://github.com/JunbiaoXue/html-live-edit.git
cd html-live-edit
npm install
npm run compile
npx vsce package
```

## 使用方法

1. 打开任意 `.html` 或 `.htm` 文件。
2. 如果没有自动打开，请使用 **HTML Visual Editor** 打开文件。
3. 点击工具栏中的 **✏️ Edit**，或按 Ctrl+E。
4. 双击文本即可原位编辑。
5. 双击图片即可替换。
6. 点击 **💾 Save**，或按 Ctrl+S 保存。

## 快捷键

| 快捷键 | 操作 |
|---|---|
| Ctrl+E | 切换编辑模式 |
| Ctrl+U | 切换源码视图 |
| Ctrl+S | 保存 |
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |
| Ctrl++ | 放大 |
| Ctrl+- | 缩小 |
| Ctrl+0 | 重置缩放 |

## 支持编辑的元素

- 标题：`h1`–`h6`
- 段落：`p`
- 列表：`li`、`dt`、`dd`、`summary`
- 表格单元格：`td`、`th`、`caption`
- 行内文本：`span`、`strong`、`em`、`b`、`i`、`u`、`mark`、`small`、`sub`、`sup`
- 链接：`a`、`abbr`、`time`
- 提示框：`.note`、`.warn`
- 自定义组件：`.kpi-label`、`.kpi-value`、`.subtitle`、`.figure-caption`、`.insight-box strong`、`.highlight`
- 图片：`img`（双击替换）

## v1.2.2 更新

- 🛠️ `.note`、`.warn` 等提示框可作为完整内容块编辑，包括加粗标签及其后的正文。

## v1.2.1 更新

- 🛠️ 支持显式 `<head>...</head>` 文档、使用隐式 head 的 HTML5 文档，以及没有 `<html>` / `<body>` 外壳的 HTML 片段。
- 🛠️ 打开省略 `<head>` 但符合浏览器解析规则的 HTML 时，保留前置元数据、样式、脚本、标题、链接和基础 URL。

## v1.1.0 更新

- 🆕 新增源码视图（Ctrl+U），可直接编辑 HTML。
- 🆕 新增撤销与重做支持（Ctrl+Z / Ctrl+Y）。
- 🆕 新增缩放控制（Ctrl+/-/0）。
- 🆕 新增通过文件选择器替换图片。
- 🆕 新增元素悬停信息提示。
- 🔧 保存时保留完整 HTML 结构（head、样式、脚本）。
- 🔧 改进报告组件的文本元素选择器覆盖范围。
- 🔧 改进 base64 图片的 CSP 配置。

## 环境要求

- VSCode 1.74+ 或兼容编辑器，如 Trae、Cursor。

## 许可证

MIT
