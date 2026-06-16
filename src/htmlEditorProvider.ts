import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class HtmlEditorProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = 'htmlWysiwyg.editor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CustomDocument> {
    return { uri, dispose: () => {} };
  }

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.dirname(document.uri.fsPath)),
        this.context.extensionUri
      ]
    };

    const htmlContent = fs.readFileSync(document.uri.fsPath, 'utf-8');
    webviewPanel.webview.html = this.getHtmlContent(webviewPanel.webview, htmlContent, document.uri);

    webviewPanel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.type === 'save') {
          await this.saveDocument(document.uri, message.content);
          vscode.window.showInformationMessage('✅ HTML saved successfully!');
        } else if (message.type === 'replaceImage') {
          const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
            title: 'Select replacement image'
          });
          if (fileUris && fileUris.length > 0) {
            const imageData = fs.readFileSync(fileUris[0].fsPath);
            const ext = path.extname(fileUris[0].fsPath).slice(1);
            const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
            const base64 = imageData.toString('base64');
            const dataUri = `data:${mimeType};base64,${base64}`;
            webviewPanel.webview.postMessage({ type: 'imageSelected', src: message.src, dataUri });
          }
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async saveDocument(uri: vscode.Uri, content: string): Promise<void> {
    fs.writeFileSync(uri.fsPath, content, 'utf-8');
  }

  private getHtmlContent(webview: vscode.Webview, htmlContent: string, documentUri: vscode.Uri): string {
    const nonce = this.getNonce();
    const baseUri = webview.asWebviewUri(documentUri.with({
      path: documentUri.path.substring(0, documentUri.path.lastIndexOf('/') + 1)
    }));
    const fileName = documentUri.path.split('/').pop() || 'document.html';

    // Parse the original HTML to extract head and body separately
    const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const htmlAttr = htmlContent.match(/<html([^>]*)>/i);
    const headContent = headMatch ? headMatch[1] : '';
    const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;
    const htmlLang = htmlAttr ? htmlAttr[1] : ' lang="zh-CN"';

    return `<!DOCTYPE html>
<html${htmlLang}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource} https: data: blob:;
          script-src 'nonce-${nonce}' 'unsafe-inline';
          style-src 'unsafe-inline' ${webview.cspSource} https:;
          font-src ${webview.cspSource} https:;">
    <base href="${baseUri}">

    <!-- Original head content (styles, fonts, etc.) -->
    ${headContent}

    <style>
      /* ─── Editor Chrome (toolbar, statusbar) ─── */
      .hle-toolbar {
        position: sticky;
        top: 0;
        left: 0; right: 0;
        height: 44px;
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        padding: 0 16px;
        z-index: 10000;
        gap: 8px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.4);
        user-select: none;
        flex-shrink: 0;
      }

      .hle-toolbar-logo {
        width: 28px; height: 28px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; flex-shrink: 0;
      }

      .hle-toolbar-title {
        color: #e2e8f0; font-size: 13px; font-weight: 600; white-space: nowrap;
      }

      .hle-toolbar-divider {
        width: 1px; height: 20px; background: rgba(255,255,255,0.15); flex-shrink: 0;
      }

      .hle-toolbar button {
        background: rgba(255,255,255,0.08);
        color: #cbd5e1;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 5px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px; font-weight: 500;
        transition: all 0.15s;
        white-space: nowrap;
        display: flex; align-items: center; gap: 4px;
      }

      .hle-toolbar button:hover {
        background: rgba(255,255,255,0.15); color: #fff;
      }

      .hle-toolbar button.hle-active {
        background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        border-color: transparent; color: #fff;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }

      .hle-toolbar button.hle-save-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-color: transparent; color: #fff;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }

      .hle-toolbar button.hle-save-btn:hover {
        background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      }

      .hle-spacer { flex: 1; }

      .hle-zoom-control { display: flex; align-items: center; gap: 2px; }
      .hle-zoom-control button { padding: 4px 8px !important; font-size: 14px !important; min-width: 28px; justify-content: center; }
      .hle-zoom-value { color: #94a3b8; font-size: 11px; min-width: 36px; text-align: center; }

      .hle-info-badge {
        background: rgba(255,255,255,0.08); color: #94a3b8;
        padding: 3px 10px; border-radius: 10px; font-size: 11px; white-space: nowrap;
      }
      .hle-info-badge.hle-editing-badge { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
      .hle-info-badge.hle-saved-badge { background: rgba(16, 185, 129, 0.2); color: #34d399; }
      .hle-info-badge.hle-dirty-badge { background: rgba(239, 68, 68, 0.2); color: #f87171; }

      /* ─── Source Editor ─── */
      .hle-source-editor {
        display: none;
        width: 100%; height: calc(100vh - 44px - 26px);
        background: #1e1e2e;
        overflow: auto;
      }

      .hle-source-editor textarea {
        width: 100%; min-height: 100%;
        background: #1e1e2e; color: #e2e8f0;
        border: none; padding: 16px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
        font-size: 13px; line-height: 1.6;
        resize: none; outline: none; tab-size: 2;
      }

      .hle-source-editor textarea::selection { background: rgba(99, 102, 241, 0.3); }

      /* ─── Status Bar ─── */
      .hle-status-bar {
        position: sticky;
        bottom: 0; left: 0; right: 0;
        height: 26px;
        background: #0f0f23;
        border-top: 1px solid rgba(255,255,255,0.08);
        display: flex; align-items: center;
        padding: 0 12px; gap: 16px;
        z-index: 10000; user-select: none;
        flex-shrink: 0;
      }

      .hle-status-item { color: #64748b; font-size: 11px; display: flex; align-items: center; gap: 5px; }
      .hle-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #475569; }
      .hle-status-dot.hle-dot-active { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.5); }
      .hle-status-dot.hle-dot-editing { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }
      .hle-status-spacer { flex: 1; }

      /* ─── Element Tooltip ─── */
      .hle-element-tooltip {
        display: none; position: fixed; z-index: 9999;
        background: #1e1e2e; color: #e2e8f0;
        padding: 6px 10px; border-radius: 6px; font-size: 11px;
        font-family: 'JetBrains Mono', monospace;
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: none; max-width: 400px; word-break: break-all;
      }
      .hle-element-tooltip .hle-tag-name { color: #818cf8; font-weight: 600; }
      .hle-element-tooltip .hle-class-name { color: #34d399; }
      .hle-element-tooltip .hle-char-count { color: #94a3b8; margin-left: 8px; }

      /* ─── Editable Elements ─── */
      .hle-editable {
        cursor: pointer !important;
        outline: 2px dashed transparent !important;
        outline-offset: 2px !important;
        transition: outline-color 0.15s, background 0.15s !important;
        border-radius: 2px !important;
      }
      .hle-editable:hover {
        outline-color: #6366f1 !important;
        background: rgba(99, 102, 241, 0.06) !important;
      }
      .hle-editing {
        outline: 2px solid #6366f1 !important;
        background: rgba(99, 102, 241, 0.08) !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
        cursor: text !important;
      }

      .hle-img-editable {
        cursor: pointer !important;
        outline: 3px dashed transparent !important;
        outline-offset: 3px !important;
        transition: outline-color 0.15s !important;
      }
      .hle-img-editable:hover { outline-color: #8b5cf6 !important; }
      .hle-img-editing {
        outline: 3px solid #8b5cf6 !important;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2) !important;
      }

      /* ─── Content wrapper for zoom ─── */
      .hle-content-wrapper {
        transform-origin: top left;
        transition: transform 0.1s ease;
      }
    </style>
</head>
<body style="margin:0; padding:0;">
    <!-- Toolbar -->
    <div class="hle-toolbar" id="hle-toolbar">
        <div class="hle-toolbar-logo">🎨</div>
        <span class="hle-toolbar-title">HTML Live Edit</span>
        <div class="hle-toolbar-divider"></div>
        <button id="btn-edit" title="Toggle edit mode (Ctrl+E)">✏️ Edit</button>
        <button id="btn-source" title="Toggle source view (Ctrl+U)">⟨/⟩ Source</button>
        <div class="hle-toolbar-divider"></div>
        <button id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
        <button id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
        <div class="hle-toolbar-divider"></div>
        <button id="btn-save" class="hle-save-btn" title="Save (Ctrl+S)">💾 Save</button>
        <div class="hle-spacer"></div>
        <div class="hle-zoom-control">
          <button id="btn-zoom-out" title="Zoom out">−</button>
          <span class="hle-zoom-value" id="zoom-value">100%</span>
          <button id="btn-zoom-in" title="Zoom in">+</button>
          <button id="btn-zoom-fit" title="Fit to width">⊞</button>
        </div>
        <div class="hle-toolbar-divider"></div>
        <span class="hle-info-badge" id="mode-badge">Preview</span>
        <span class="hle-info-badge" id="edit-count">0 edits</span>
    </div>

    <!-- Content area (original HTML body content goes here) -->
    <div class="hle-content-wrapper" id="hle-content">
        ${bodyContent}
    </div>

    <!-- Source editor (hidden by default) -->
    <div class="hle-source-editor" id="hle-source-editor">
        <textarea id="source-textarea" spellcheck="false"></textarea>
    </div>

    <!-- Element tooltip -->
    <div class="hle-element-tooltip" id="hle-tooltip">
        <span class="hle-tag-name"></span><span class="hle-class-name"></span><span class="hle-char-count"></span>
    </div>

    <!-- Status bar -->
    <div class="hle-status-bar" id="hle-statusbar">
        <div class="hle-status-item">
            <span class="hle-status-dot" id="status-dot"></span>
            <span id="status-text">Ready</span>
        </div>
        <div class="hle-status-item" id="status-file">${fileName}</div>
        <div class="hle-status-spacer"></div>
        <div class="hle-status-item" id="status-hint">Double-click text to edit</div>
    </div>

    <script nonce="${nonce}">
        (function() {
            var vscodeApi = acquireVsCodeApi();
            var editMode = false;
            var sourceMode = false;
            var editCount = 0;
            var zoomLevel = 100;
            var undoStack = [];
            var redoStack = [];
            var MAX_UNDO = 50;

            // Store the ORIGINAL full HTML for save reconstruction
            var originalHeadContent = ${JSON.stringify(headContent)};
            var originalHtmlLang = ${JSON.stringify(htmlLang)};

            var contentEl = document.getElementById('hle-content');
            var sourceEditor = document.getElementById('hle-source-editor');
            var sourceTextarea = document.getElementById('source-textarea');
            var modeBadge = document.getElementById('mode-badge');
            var editCountBadge = document.getElementById('edit-count');
            var statusDot = document.getElementById('status-dot');
            var statusText = document.getElementById('status-text');
            var statusHint = document.getElementById('status-hint');
            var tooltipEl = document.getElementById('hle-tooltip');
            var toolbar = document.getElementById('hle-toolbar');
            var statusbar = document.getElementById('hle-statusbar');

            // ─── Mark editable elements ───
            function markEditables() {
                var textSelectors = [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'span', 'label', 'figcaption', 'blockquote', 'cite',
                    'li', 'dt', 'dd', 'summary',
                    'td', 'th', 'caption',
                    'strong', 'em', 'b', 'i', 'u', 'mark', 'small', 'sub', 'sup',
                    'a', 'abbr', 'time',
                    '.kpi-label', '.kpi-value', '.subtitle',
                    '.figure-caption', '.highlight',
                    '.section h2', '.section h3'
                ].join(', ');

                var elements = contentEl.querySelectorAll(textSelectors);
                elements.forEach(function(el) {
                    // Skip toolbar/statusbar elements
                    if (el.closest('.hle-toolbar') || el.closest('.hle-status-bar')) return;
                    // Skip if empty
                    if (!el.textContent.trim()) return;
                    // Skip if contains images (edit those separately)
                    if (el.querySelector('img')) return;
                    // Skip if already marked
                    if (el.classList.contains('hle-editable')) return;
                    // Skip if parent is already editable (avoid nested)
                    if (el.parentElement && el.parentElement.classList.contains('hle-editable')) return;

                    el.classList.add('hle-editable');

                    el.addEventListener('dblclick', function(e) {
                        if (!editMode) toggleEditMode();
                        e.preventDefault();
                        e.stopPropagation();

                        pushUndo();
                        el.contentEditable = 'true';
                        el.classList.add('hle-editing');
                        el.focus();

                        var range = document.createRange();
                        range.selectNodeContents(el);
                        var sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    });

                    el.addEventListener('blur', function() {
                        el.contentEditable = 'false';
                        el.classList.remove('hle-editing');
                    });

                    el.addEventListener('input', function() {
                        editCount++;
                        editCountBadge.textContent = editCount + ' edits';
                        editCountBadge.classList.add('hle-dirty-badge');
                        editCountBadge.classList.remove('hle-saved-badge');
                    });
                });

                // Make images replaceable
                var images = contentEl.querySelectorAll('img');
                images.forEach(function(img) {
                    if (img.classList.contains('hle-img-editable')) return;
                    img.classList.add('hle-img-editable');

                    img.addEventListener('dblclick', function(e) {
                        if (!editMode) toggleEditMode();
                        e.preventDefault();
                        e.stopPropagation();

                        pushUndo();
                        img.classList.add('hle-img-editing');

                        var src = img.getAttribute('src') || '';
                        vscodeApi.postMessage({ type: 'replaceImage', src: src });
                    });
                });
            }

            // Handle image replacement from extension
            window.addEventListener('message', function(event) {
                var msg = event.data;
                if (msg.type === 'imageSelected') {
                    var imgs = contentEl.querySelectorAll('img.hle-img-editing');
                    imgs.forEach(function(img) {
                        img.setAttribute('src', msg.dataUri);
                        img.classList.remove('hle-img-editing');
                    });
                    editCount++;
                    editCountBadge.textContent = editCount + ' edits';
                    editCountBadge.classList.add('hle-dirty-badge');
                }
            });

            // ─── Hover tooltip ───
            contentEl.addEventListener('mouseover', function(e) {
                if (!editMode) return;
                var el = e.target;
                if (el.classList.contains('hle-editable') || el.classList.contains('hle-img-editable')) {
                    var tagName = el.tagName.toLowerCase();
                    var classes = Array.from(el.classList).filter(function(c) {
                        return c !== 'hle-editable' && c !== 'hle-img-editable' && c !== 'hle-editing' && c !== 'hle-img-editing';
                    }).join('.');
                    var tooltipHtml = '<span class="hle-tag-name">&lt;' + tagName + '&gt;</span>';
                    if (classes) tooltipHtml += '<span class="hle-class-name">.' + classes + '</span>';
                    tooltipHtml += '<span class="hle-char-count">' + el.textContent.trim().length + ' chars</span>';

                    tooltipEl.innerHTML = tooltipHtml;
                    tooltipEl.style.display = 'block';
                    tooltipEl.style.left = Math.min(e.clientX + 12, window.innerWidth - 300) + 'px';
                    tooltipEl.style.top = Math.max(e.clientY - 30, 50) + 'px';
                }
            });

            contentEl.addEventListener('mouseout', function(e) {
                if (e.target.classList.contains('hle-editable') || e.target.classList.contains('hle-img-editable')) {
                    tooltipEl.style.display = 'none';
                }
            });

            // ─── Undo/Redo ───
            function pushUndo() {
                undoStack.push(contentEl.innerHTML);
                if (undoStack.length > MAX_UNDO) undoStack.shift();
                redoStack = [];
            }

            function doUndo() {
                if (undoStack.length === 0) return;
                redoStack.push(contentEl.innerHTML);
                var prev = undoStack.pop();
                contentEl.innerHTML = prev;
                markEditables();
                editCount = Math.max(0, editCount - 1);
                editCountBadge.textContent = editCount + ' edits';
            }

            function doRedo() {
                if (redoStack.length === 0) return;
                undoStack.push(contentEl.innerHTML);
                var next = redoStack.pop();
                contentEl.innerHTML = next;
                markEditables();
                editCount++;
                editCountBadge.textContent = editCount + ' edits';
            }

            // ─── Edit Mode ───
            function toggleEditMode() {
                editMode = !editMode;
                var btn = document.getElementById('btn-edit');

                if (editMode) {
                    btn.textContent = '👁 View';
                    btn.classList.add('hle-active');
                    modeBadge.textContent = 'Editing';
                    modeBadge.classList.add('hle-editing-badge');
                    statusDot.classList.add('hle-dot-editing');
                    statusDot.classList.remove('hle-dot-active');
                    statusText.textContent = 'Editing';
                    statusHint.textContent = 'Double-click: text edit / image replace';
                } else {
                    btn.textContent = '✏️ Edit';
                    btn.classList.remove('hle-active');
                    modeBadge.textContent = 'Preview';
                    modeBadge.classList.remove('hle-editing-badge');
                    statusDot.classList.remove('hle-dot-editing');
                    statusText.textContent = 'Preview';
                    statusHint.textContent = 'Double-click text to edit';

                    contentEl.querySelectorAll('.hle-editing').forEach(function(el) {
                        el.contentEditable = 'false';
                        el.classList.remove('hle-editing');
                    });
                    contentEl.querySelectorAll('.hle-img-editing').forEach(function(el) {
                        el.classList.remove('hle-img-editing');
                    });
                }
            }

            // ─── Source Mode ───
            function toggleSourceMode() {
                sourceMode = !sourceMode;
                var btn = document.getElementById('btn-source');

                if (sourceMode) {
                    btn.textContent = '👁 Preview';
                    btn.classList.add('hle-active');

                    sourceTextarea.value = getCurrentFullHtml();

                    contentEl.style.display = 'none';
                    sourceEditor.style.display = 'block';
                    sourceTextarea.focus();

                    modeBadge.textContent = 'Source';
                    modeBadge.classList.remove('hle-editing-badge');
                    statusDot.classList.remove('hle-dot-editing');
                    statusText.textContent = 'Source';
                    statusHint.textContent = 'Edit HTML source directly';
                } else {
                    btn.textContent = '⟨/⟩ Source';
                    btn.classList.remove('hle-active');

                    // Apply source edits back
                    var newSource = sourceTextarea.value;
                    var newBody = newSource.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
                    if (newBody) {
                        contentEl.innerHTML = newBody[1];
                    } else {
                        contentEl.innerHTML = newSource;
                    }
                    // Also update head
                    var newHead = newSource.match(/<head[^>]*>([\\s\\S]*?)<\\/head>/i);
                    if (newHead) {
                        originalHeadContent = newHead[1];
                    }

                    sourceEditor.style.display = 'none';
                    contentEl.style.display = 'block';
                    markEditables();
                    applyZoom();

                    modeBadge.textContent = editMode ? 'Editing' : 'Preview';
                    if (editMode) modeBadge.classList.add('hle-editing-badge');
                    statusText.textContent = editMode ? 'Editing' : 'Preview';
                    statusHint.textContent = 'Double-click text to edit';
                }
            }

            // ─── Reconstruct full HTML for saving ───
            function getCurrentFullHtml() {
                if (sourceMode) {
                    return sourceTextarea.value;
                }

                // Clone content to clean up editor artifacts
                var clone = contentEl.cloneNode(true);
                clone.querySelectorAll('.hle-editable, .hle-img-editable').forEach(function(el) {
                    el.classList.remove('hle-editable', 'hle-img-editable', 'hle-editing', 'hle-img-editing');
                    el.removeAttribute('contenteditable');
                    // Clean up empty class attr
                    if (el.getAttribute('class') === '') el.removeAttribute('class');
                });
                // Remove empty style attributes we may have added
                clone.querySelectorAll('[style=""]').forEach(function(el) {
                    el.removeAttribute('style');
                });

                var bodyHtml = clone.innerHTML;

                // Reconstruct full HTML
                var full = '<!DOCTYPE html>\\n<html' + originalHtmlLang + '>\\n';
                full += '<head>\\n' + originalHeadContent + '\\n</head>\\n';
                full += '<body>\\n' + bodyHtml + '\\n</body>\\n';
                full += '</html>';

                return full;
            }

            // ─── Save ───
            function doSave() {
                var fullHtml = getCurrentFullHtml();
                vscodeApi.postMessage({ type: 'save', content: fullHtml });

                editCount = 0;
                editCountBadge.textContent = 'Saved!';
                editCountBadge.classList.add('hle-saved-badge');
                editCountBadge.classList.remove('hle-dirty-badge');
                setTimeout(function() {
                    editCountBadge.textContent = '0 edits';
                    editCountBadge.classList.remove('hle-saved-badge');
                }, 2000);

                undoStack = [];
                redoStack = [];
            }

            // ─── Zoom ───
            function applyZoom() {
                if (zoomLevel === 100) {
                    contentEl.style.transform = '';
                    contentEl.style.width = '';
                } else {
                    contentEl.style.transform = 'scale(' + (zoomLevel / 100) + ')';
                    contentEl.style.width = (10000 / zoomLevel) + '%';
                }
                document.getElementById('zoom-value').textContent = zoomLevel + '%';
            }

            // ─── Keyboard shortcuts ───
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 's') { e.preventDefault(); doSave(); }
                    else if (e.key === 'e') { e.preventDefault(); toggleEditMode(); }
                    else if (e.key === 'u') { e.preventDefault(); toggleSourceMode(); }
                    else if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
                    else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); doRedo(); }
                    else if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomLevel = Math.min(200, zoomLevel + 10); applyZoom(); }
                    else if (e.key === '-') { e.preventDefault(); zoomLevel = Math.max(30, zoomLevel - 10); applyZoom(); }
                    else if (e.key === '0') { e.preventDefault(); zoomLevel = 100; applyZoom(); }
                }
            });

            // ─── Button bindings ───
            document.getElementById('btn-edit').addEventListener('click', toggleEditMode);
            document.getElementById('btn-source').addEventListener('click', toggleSourceMode);
            document.getElementById('btn-save').addEventListener('click', doSave);
            document.getElementById('btn-undo').addEventListener('click', doUndo);
            document.getElementById('btn-redo').addEventListener('click', doRedo);
            document.getElementById('btn-zoom-in').addEventListener('click', function() { zoomLevel = Math.min(200, zoomLevel + 10); applyZoom(); });
            document.getElementById('btn-zoom-out').addEventListener('click', function() { zoomLevel = Math.max(30, zoomLevel - 10); applyZoom(); });
            document.getElementById('btn-zoom-fit').addEventListener('click', function() { zoomLevel = 100; applyZoom(); });

            // ─── Initialize ───
            markEditables();
        })();
    </script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
