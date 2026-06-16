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
        } else if (message.type === 'saveSource') {
          await this.saveDocument(document.uri, message.content);
          vscode.window.showInformationMessage('✅ Source saved successfully!');
        } else if (message.type === 'replaceImage') {
          // Handle image replacement via VS Code file picker
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

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource} https: data: blob:;
          script-src 'nonce-${nonce}' 'unsafe-inline';
          style-src 'unsafe-inline' ${webview.cspSource};
          font-src ${webview.cspSource} https:;">
    <base href="${baseUri}">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #1a1a2e;
        overflow: hidden;
        height: 100vh;
      }

      /* ─── Toolbar ─── */
      #toolbar {
        position: fixed;
        top: 0; left: 0; right: 0;
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
      }

      .toolbar-logo {
        width: 28px; height: 28px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }

      .toolbar-title {
        color: #e2e8f0;
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
      }

      .toolbar-divider {
        width: 1px; height: 20px;
        background: rgba(255,255,255,0.15);
        flex-shrink: 0;
      }

      #toolbar button {
        background: rgba(255,255,255,0.08);
        color: #cbd5e1;
        border: 1px solid rgba(255,255,255,0.12);
        padding: 5px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.15s;
        white-space: nowrap;
        display: flex; align-items: center; gap: 4px;
      }

      #toolbar button:hover {
        background: rgba(255,255,255,0.15);
        color: #fff;
      }

      #toolbar button.active {
        background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        border-color: transparent;
        color: #fff;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }

      #toolbar button.save-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-color: transparent;
        color: #fff;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }

      #toolbar button.save-btn:hover {
        background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      }

      .toolbar-spacer { flex: 1; }

      .toolbar-group {
        display: flex; align-items: center; gap: 4px;
      }

      .info-badge {
        background: rgba(255,255,255,0.08);
        color: #94a3b8;
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 11px;
        white-space: nowrap;
      }

      .info-badge.editing {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }

      .info-badge.saved {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }

      .info-badge.dirty {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
      }

      /* ─── Zoom Control ─── */
      .zoom-control {
        display: flex; align-items: center; gap: 2px;
      }

      .zoom-control button {
        padding: 4px 8px !important;
        font-size: 14px !important;
        min-width: 28px;
        justify-content: center;
      }

      .zoom-value {
        color: #94a3b8;
        font-size: 11px;
        min-width: 36px;
        text-align: center;
      }

      /* ─── Main Content ─── */
      #preview-frame {
        position: fixed;
        top: 44px; bottom: 26px;
        left: 0; right: 0;
        border: none;
        width: 100%;
        background: #f8fafc;
      }

      /* ─── Source Editor ─── */
      #source-editor {
        display: none;
        position: fixed;
        top: 44px; bottom: 26px;
        left: 0; right: 0;
        background: #1e1e2e;
      }

      #source-editor textarea {
        width: 100%;
        height: 100%;
        background: #1e1e2e;
        color: #e2e8f0;
        border: none;
        padding: 16px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
        font-size: 13px;
        line-height: 1.6;
        resize: none;
        outline: none;
        tab-size: 2;
      }

      #source-editor textarea::selection {
        background: rgba(99, 102, 241, 0.3);
      }

      /* ─── Status Bar ─── */
      .status-bar {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: 26px;
        background: #0f0f23;
        border-top: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        padding: 0 12px;
        gap: 16px;
        z-index: 10000;
        user-select: none;
      }

      .status-item {
        color: #64748b;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .status-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #475569;
      }

      .status-dot.active {
        background: #10b981;
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
      }

      .status-dot.editing {
        background: #f59e0b;
        box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
      }

      .status-spacer { flex: 1; }

      /* ─── Element Info Tooltip ─── */
      #element-tooltip {
        display: none;
        position: fixed;
        z-index: 9999;
        background: #1e1e2e;
        color: #e2e8f0;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: 'JetBrains Mono', monospace;
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: none;
        max-width: 400px;
        word-break: break-all;
      }

      #element-tooltip .tag-name { color: #818cf8; font-weight: 600; }
      #element-tooltip .class-name { color: #34d399; }
      #element-tooltip .char-count { color: #94a3b8; margin-left: 8px; }
    </style>
</head>
<body>
    <div id="toolbar">
        <div class="toolbar-logo">🎨</div>
        <span class="toolbar-title">HTML Live Edit</span>
        <div class="toolbar-divider"></div>
        <button id="btn-edit" title="Toggle edit mode (Ctrl+E)">✏️ Edit</button>
        <button id="btn-source" title="Toggle source view (Ctrl+U)">⟨/⟩ Source</button>
        <div class="toolbar-divider"></div>
        <button id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
        <button id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
        <div class="toolbar-divider"></div>
        <button id="btn-save" class="save-btn" title="Save (Ctrl+S)">💾 Save</button>
        <div class="toolbar-spacer"></div>
        <div class="zoom-control">
          <button id="btn-zoom-out" title="Zoom out">−</button>
          <span class="zoom-value" id="zoom-value">100%</span>
          <button id="btn-zoom-in" title="Zoom in">+</button>
          <button id="btn-zoom-fit" title="Fit to width">⊞</button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="toolbar-group">
            <span class="info-badge" id="mode-badge">Preview</span>
            <span class="info-badge" id="edit-count">0 edits</span>
        </div>
    </div>

    <iframe id="preview-frame" sandbox="allow-same-origin allow-scripts"></iframe>

    <div id="source-editor">
        <textarea id="source-textarea" spellcheck="false"></textarea>
    </div>

    <div id="element-tooltip">
        <span class="tag-name"></span><span class="class-name"></span><span class="char-count"></span>
    </div>

    <div class="status-bar">
        <div class="status-item">
            <span class="status-dot" id="status-dot"></span>
            <span id="status-text">Ready</span>
        </div>
        <div class="status-item" id="status-file">${fileName}</div>
        <div class="status-spacer"></div>
        <div class="status-item" id="status-hint">Double-click text to edit</div>
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

            // Store the ORIGINAL full HTML document
            var originalHtml = ${JSON.stringify(htmlContent)};

            // References
            var previewFrame = document.getElementById('preview-frame');
            var sourceEditor = document.getElementById('source-editor');
            var sourceTextarea = document.getElementById('source-textarea');
            var modeBadge = document.getElementById('mode-badge');
            var editCountBadge = document.getElementById('edit-count');
            var statusDot = document.getElementById('status-dot');
            var statusText = document.getElementById('status-text');
            var statusHint = document.getElementById('status-hint');
            var elementTooltip = document.getElementById('element-tooltip');

            // ─── Initialize preview iframe ───
            function initPreview() {
                var doc = previewFrame.contentDocument || previewFrame.contentWindow.document;
                doc.open();
                doc.write(originalHtml);
                doc.close();

                // Wait for content to load, then inject editing scripts
                previewFrame.onload = function() {
                    injectEditScripts(doc);
                };
                // Also try immediately in case onload already fired
                setTimeout(function() {
                    injectEditScripts(doc);
                }, 100);
            }

            // ─── Inject editing scripts into the iframe ───
            function injectEditScripts(doc) {
                // Inject editable styles
                var style = doc.createElement('style');
                style.textContent = \`
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
                    .hle-img-editable:hover {
                        outline-color: #8b5cf6 !important;
                    }
                    .hle-img-editing {
                        outline: 3px solid #8b5cf6 !important;
                        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2) !important;
                    }
                \`;
                doc.head.appendChild(style);

                // Comprehensive text selectors
                var textSelectors = [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'span', 'label', 'figcaption', 'blockquote', 'cite',
                    'li', 'dt', 'dd', 'summary',
                    'td', 'th', 'caption',
                    'strong', 'em', 'b', 'i', 'u', 'mark', 'small', 'sub', 'sup',
                    'a', 'abbr', 'time',
                    'div.kpi-label', 'div.kpi-value', 'div.subtitle',
                    'div.figure-caption', '.kpi-label', '.kpi-value', '.subtitle',
                    '.figure-caption', '.insight-box strong', '.highlight',
                    '.section h2', '.section h3'
                ].join(', ');

                var elements = doc.querySelectorAll(textSelectors);
                elements.forEach(function(el) {
                    if (!el.textContent.trim()) return;
                    if (el.querySelector('img')) return; // Skip if contains images
                    el.classList.add('hle-editable');

                    el.addEventListener('dblclick', function(e) {
                        if (!editMode) {
                            toggleEditMode();
                        }
                        e.preventDefault();
                        e.stopPropagation();

                        // Save undo state
                        pushUndo();

                        el.contentEditable = 'true';
                        el.classList.add('hle-editing');
                        el.focus();

                        // Select all text
                        var range = doc.createRange();
                        range.selectNodeContents(el);
                        var sel = doc.defaultView.getSelection();
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
                        editCountBadge.classList.add('dirty');
                        editCountBadge.classList.remove('saved');
                    });
                });

                // Make images replaceable on double-click
                var images = doc.querySelectorAll('img');
                images.forEach(function(img) {
                    img.classList.add('hle-img-editable');
                    img.addEventListener('dblclick', function(e) {
                        if (!editMode) {
                            toggleEditMode();
                        }
                        e.preventDefault();
                        e.stopPropagation();

                        // Save undo state
                        pushUndo();

                        img.classList.add('hle-img-editing');

                        // Request image replacement from extension
                        var src = img.getAttribute('src') || '';
                        vscodeApi.postMessage({ type: 'replaceImage', src: src });
                    });
                });

                // Handle image replacement response
                window.addEventListener('message', function(event) {
                    var msg = event.data;
                    if (msg.type === 'imageSelected') {
                        var imgs = doc.querySelectorAll('img.hle-img-editing');
                        imgs.forEach(function(img) {
                            img.setAttribute('src', msg.dataUri);
                            img.classList.remove('hle-img-editing');
                        });
                        editCount++;
                        editCountBadge.textContent = editCount + ' edits';
                        editCountBadge.classList.add('dirty');
                    }
                });

                // Hover tooltip for element info
                doc.addEventListener('mouseover', function(e) {
                    if (!editMode) return;
                    var el = e.target;
                    if (el.classList.contains('hle-editable') || el.classList.contains('hle-img-editable')) {
                        var tagName = el.tagName.toLowerCase();
                        var classes = el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
                        classes = classes.replace(/hle-editable|hle-img-editable|hle-editing|hle-img-editing/g, '').replace(/\\.+/g, '.').replace(/^\\./, '');
                        var text = el.textContent.trim().substring(0, 60);
                        var tooltipHtml = '<span class="tag-name">&lt;' + tagName + '&gt;</span>';
                        if (classes) tooltipHtml += '<span class="class-name">.' + classes + '</span>';
                        tooltipHtml += '<span class="char-count">' + el.textContent.trim().length + ' chars</span>';

                        elementTooltip.innerHTML = tooltipHtml;
                        elementTooltip.style.display = 'block';
                        elementTooltip.style.left = e.clientX + 12 + 'px';
                        elementTooltip.style.top = e.clientY - 30 + 'px';
                    }
                });

                doc.addEventListener('mouseout', function(e) {
                    if (e.target.classList.contains('hle-editable') || e.target.classList.contains('hle-img-editable')) {
                        elementTooltip.style.display = 'none';
                    }
                });

                // Zoom support
                applyZoom();
            }

            // ─── Undo/Redo ───
            function pushUndo() {
                var doc = previewFrame.contentDocument;
                if (!doc) return;
                undoStack.push(doc.body.innerHTML);
                if (undoStack.length > MAX_UNDO) undoStack.shift();
                redoStack = [];
            }

            function doUndo() {
                if (undoStack.length === 0) return;
                var doc = previewFrame.contentDocument;
                if (!doc) return;
                redoStack.push(doc.body.innerHTML);
                var prev = undoStack.pop();
                doc.body.innerHTML = prev;
                editCount = Math.max(0, editCount - 1);
                editCountBadge.textContent = editCount + ' edits';
            }

            function doRedo() {
                if (redoStack.length === 0) return;
                var doc = previewFrame.contentDocument;
                if (!doc) return;
                undoStack.push(doc.body.innerHTML);
                var next = redoStack.pop();
                doc.body.innerHTML = next;
                editCount++;
                editCountBadge.textContent = editCount + ' edits';
            }

            // ─── Edit Mode Toggle ───
            function toggleEditMode() {
                editMode = !editMode;
                var btn = document.getElementById('btn-edit');

                if (editMode) {
                    btn.textContent = '👁 View';
                    btn.classList.add('active');
                    modeBadge.textContent = 'Editing';
                    modeBadge.classList.add('editing');
                    statusDot.classList.add('editing');
                    statusDot.classList.remove('active');
                    statusText.textContent = 'Editing';
                    statusHint.textContent = 'Double-click text to edit, image to replace';
                } else {
                    btn.textContent = '✏️ Edit';
                    btn.classList.remove('active');
                    modeBadge.textContent = 'Preview';
                    modeBadge.classList.remove('editing');
                    statusDot.classList.remove('editing');
                    statusText.textContent = 'Preview';
                    statusHint.textContent = 'Double-click text to edit';

                    // Exit all editing states
                    var doc = previewFrame.contentDocument;
                    if (doc) {
                        doc.querySelectorAll('.hle-editing').forEach(function(el) {
                            el.contentEditable = 'false';
                            el.classList.remove('hle-editing');
                        });
                        doc.querySelectorAll('.hle-img-editing').forEach(function(el) {
                            el.classList.remove('hle-img-editing');
                        });
                    }
                }
            }

            // ─── Source Mode Toggle ───
            function toggleSourceMode() {
                sourceMode = !sourceMode;
                var btn = document.getElementById('btn-source');

                if (sourceMode) {
                    btn.textContent = '👁 Preview';
                    btn.classList.add('active');

                    // Get the current full HTML (preserving head/body structure)
                    var currentHtml = getCurrentFullHtml();
                    sourceTextarea.value = currentHtml;

                    previewFrame.style.display = 'none';
                    sourceEditor.style.display = 'block';
                    sourceTextarea.focus();

                    modeBadge.textContent = 'Source';
                    modeBadge.classList.remove('editing');
                    statusDot.classList.remove('editing');
                    statusText.textContent = 'Source';
                    statusHint.textContent = 'Edit HTML source directly';
                } else {
                    btn.textContent = '⟨/⟩ Source';
                    btn.classList.remove('active');

                    // Apply source edits back to preview
                    var newSource = sourceTextarea.value;
                    originalHtml = newSource;
                    var doc = previewFrame.contentDocument;
                    if (doc) {
                        doc.open();
                        doc.write(newSource);
                        doc.close();
                        setTimeout(function() { injectEditScripts(doc); }, 100);
                    }

                    sourceEditor.style.display = 'none';
                    previewFrame.style.display = 'block';

                    modeBadge.textContent = editMode ? 'Editing' : 'Preview';
                    if (editMode) modeBadge.classList.add('editing');
                    statusText.textContent = editMode ? 'Editing' : 'Preview';
                    statusHint.textContent = 'Double-click text to edit';
                }
            }

            // ─── Get Current Full HTML (preserving original structure) ───
            function getCurrentFullHtml() {
                if (sourceMode) {
                    return sourceTextarea.value;
                }

                var doc = previewFrame.contentDocument;
                if (!doc) return originalHtml;

                // Clone the document to clean up editing artifacts
                var bodyClone = doc.body.cloneNode(true);

                // Remove editing classes and attributes
                bodyClone.querySelectorAll('.hle-editable, .hle-img-editable').forEach(function(el) {
                    el.classList.remove('hle-editable', 'hle-img-editing', 'hle-editing');
                    el.removeAttribute('contenteditable');
                });

                // Remove our injected style
                bodyClone.querySelectorAll('style').forEach(function(s) {
                    if (s.textContent.indexOf('hle-editable') !== -1) {
                        s.parentNode.removeChild(s);
                    }
                });

                // Reconstruct the full HTML using the original as template
                // Replace body content in the original
                var result = originalHtml;

                // Use a more robust approach: rebuild from the iframe's full document
                var fullDoc = doc.documentElement.cloneNode(true);

                // Clean up editing artifacts from the full document clone
                fullDoc.querySelectorAll('.hle-editable, .hle-img-editable').forEach(function(el) {
                    el.classList.remove('hle-editable', 'hle-img-editing', 'hle-editing');
                    el.removeAttribute('contenteditable');
                });

                // Remove injected styles
                fullDoc.querySelectorAll('style').forEach(function(s) {
                    if (s.textContent.indexOf('hle-editable') !== -1) {
                        s.parentNode.removeChild(s);
                    }
                });

                // Serialize back to HTML string
                return '<!DOCTYPE html>\\n' + fullDoc.outerHTML;
            }

            // ─── Save ───
            function doSave() {
                var fullHtml = getCurrentFullHtml();
                vscodeApi.postMessage({ type: 'save', content: fullHtml });

                editCount = 0;
                editCountBadge.textContent = 'Saved!';
                editCountBadge.classList.add('saved');
                editCountBadge.classList.remove('dirty');
                setTimeout(function() {
                    editCountBadge.textContent = '0 edits';
                    editCountBadge.classList.remove('saved');
                }, 2000);

                // Update originalHtml to current state
                originalHtml = fullHtml;
                undoStack = [];
                redoStack = [];
            }

            // ─── Zoom ───
            function applyZoom() {
                var doc = previewFrame.contentDocument;
                if (!doc || !doc.body) return;
                doc.body.style.transform = 'scale(' + (zoomLevel / 100) + ')';
                doc.body.style.transformOrigin = 'top left';
                doc.body.style.width = (100 / (zoomLevel / 100)) + '%';
                document.getElementById('zoom-value').textContent = zoomLevel + '%';
            }

            function zoomIn() {
                zoomLevel = Math.min(200, zoomLevel + 10);
                applyZoom();
            }

            function zoomOut() {
                zoomLevel = Math.max(30, zoomLevel - 10);
                applyZoom();
            }

            function zoomFit() {
                zoomLevel = 100;
                applyZoom();
            }

            // ─── Event Bindings ───
            document.getElementById('btn-edit').addEventListener('click', toggleEditMode);
            document.getElementById('btn-source').addEventListener('click', toggleSourceMode);
            document.getElementById('btn-save').addEventListener('click', doSave);
            document.getElementById('btn-undo').addEventListener('click', doUndo);
            document.getElementById('btn-redo').addEventListener('click', doRedo);
            document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
            document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
            document.getElementById('btn-zoom-fit').addEventListener('click', zoomFit);

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                // Ctrl+S: Save
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    doSave();
                }
                // Ctrl+E: Toggle edit mode
                if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                    e.preventDefault();
                    toggleEditMode();
                }
                // Ctrl+U: Toggle source
                if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                    e.preventDefault();
                    toggleSourceMode();
                }
                // Ctrl+Z: Undo
                if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    doUndo();
                }
                // Ctrl+Y or Ctrl+Shift+Z: Redo
                if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                    e.preventDefault();
                    doRedo();
                }
                // Ctrl+Plus: Zoom in
                if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                    e.preventDefault();
                    zoomIn();
                }
                // Ctrl+Minus: Zoom out
                if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                    e.preventDefault();
                    zoomOut();
                }
                // Ctrl+0: Reset zoom
                if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                    e.preventDefault();
                    zoomFit();
                }
            });

            // Initialize
            initPreview();
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
