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
    webviewPanel.webview.html = this.buildEditorHtml(webviewPanel.webview, htmlContent, document.uri);

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

  private buildEditorHtml(webview: vscode.Webview, htmlContent: string, documentUri: vscode.Uri): string {
    const nonce = this.getNonce();
    const baseUri = webview.asWebviewUri(documentUri.with({
      path: documentUri.path.substring(0, documentUri.path.lastIndexOf('/') + 1)
    }));
    const fileName = documentUri.path.split('/').pop() || 'document.html';

    // Parse original HTML into parts
    const doctypeMatch = htmlContent.match(/<!DOCTYPE[^>]*>/i);
    const htmlOpenMatch = htmlContent.match(/<html([^>]*)>/i);
    const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyOpenMatch = htmlContent.match(/<body([^>]*)>/i);
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    const doctype = doctypeMatch ? doctypeMatch[0] : '<!DOCTYPE html>';
    const htmlAttrs = htmlOpenMatch ? htmlOpenMatch[1] : '';
    const headContent = headMatch ? headMatch[1] : '';
    const bodyAttrs = bodyOpenMatch ? bodyOpenMatch[1] : '';
    const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;

    // Reconstruct: inject our chrome into the original HTML structure
    // This ensures the page renders exactly as the author intended
    return `${doctype}
<html${htmlAttrs}>
<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource} https: data: blob:;
          script-src 'nonce-${nonce}' 'unsafe-inline';
          style-src 'unsafe-inline' ${webview.cspSource} https:;
          font-src ${webview.cspSource} https:;">
    <base href="${baseUri}">
    ${headContent}

    <!-- === HLE Editor Chrome Styles === -->
    <style id="hle-styles">
      /* Toolbar - sits on top of everything */
      #hle-toolbar {
        all: initial;
        position: fixed !important;
        top: 0 !important; left: 0 !important; right: 0 !important;
        height: 42px !important;
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%) !important;
        border-bottom: 1px solid rgba(255,255,255,0.08) !important;
        display: flex !important;
        align-items: center !important;
        padding: 0 12px !important;
        z-index: 999999 !important;
        gap: 6px !important;
        box-shadow: 0 2px 16px rgba(0,0,0,0.4) !important;
        user-select: none !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 12px !important;
        color: #e2e8f0 !important;
      }

      #hle-toolbar * {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 12px !important;
        box-sizing: border-box !important;
      }

      #hle-toolbar .hle-logo {
        width: 26px !important; height: 26px !important;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        border-radius: 5px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        font-size: 13px !important; flex-shrink: 0 !important;
      }

      #hle-toolbar .hle-title {
        color: #e2e8f0 !important; font-size: 13px !important; font-weight: 600 !important; white-space: nowrap !important;
      }

      #hle-toolbar .hle-divider {
        width: 1px !important; height: 18px !important; background: rgba(255,255,255,0.15) !important; flex-shrink: 0 !important;
      }

      #hle-toolbar button {
        background: rgba(255,255,255,0.08) !important;
        color: #cbd5e1 !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        padding: 4px 10px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        display: inline-flex !important; align-items: center !important; gap: 3px !important;
        line-height: 1 !important;
        height: auto !important;
        min-width: 0 !important;
        width: auto !important;
        margin: 0 !important;
      }

      #hle-toolbar button:hover {
        background: rgba(255,255,255,0.15) !important; color: #fff !important;
      }

      #hle-toolbar button.hle-active {
        background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%) !important;
        border-color: transparent !important; color: #fff !important;
      }

      #hle-toolbar button.hle-save {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        border-color: transparent !important; color: #fff !important;
      }
      #hle-toolbar button.hle-save:hover {
        background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
      }

      #hle-toolbar .hle-spacer { flex: 1 !important; }

      #hle-toolbar .hle-badge {
        padding: 2px 8px !important; border-radius: 8px !important;
        font-size: 11px !important; white-space: nowrap !important;
        background: rgba(255,255,255,0.08) !important; color: #94a3b8 !important;
      }
      #hle-toolbar .hle-badge.hle-badge-edit {
        background: rgba(245, 158, 11, 0.2) !important; color: #fbbf24 !important;
      }
      #hle-toolbar .hle-badge.hle-badge-saved {
        background: rgba(16, 185, 129, 0.2) !important; color: #34d399 !important;
      }
      #hle-toolbar .hle-badge.hle-badge-dirty {
        background: rgba(239, 68, 68, 0.2) !important; color: #f87171 !important;
      }

      #hle-toolbar .hle-zoom {
        display: inline-flex !important; align-items: center !important; gap: 2px !important;
      }
      #hle-toolbar .hle-zoom button { padding: 3px 6px !important; font-size: 13px !important; min-width: 24px !important; justify-content: center !important; }
      #hle-toolbar .hle-zoom-val { color: #94a3b8 !important; font-size: 11px !important; min-width: 34px !important; text-align: center !important; }

      /* Body push-down for toolbar */
      body.hle-body { padding-top: 42px !important; padding-bottom: 24px !important; }

      /* Status bar */
      #hle-statusbar {
        all: initial;
        position: fixed !important;
        bottom: 0 !important; left: 0 !important; right: 0 !important;
        height: 24px !important;
        background: #0f0f23 !important;
        border-top: 1px solid rgba(255,255,255,0.08) !important;
        display: flex !important; align-items: center !important;
        padding: 0 10px !important; gap: 14px !important;
        z-index: 999999 !important; user-select: none !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 11px !important; color: #64748b !important;
      }

      #hle-statusbar * { all: initial; font-size: 11px !important; }

      .hle-dot {
        width: 6px !important; height: 6px !important; border-radius: 50% !important;
        background: #475569 !important; display: inline-block !important;
      }
      .hle-dot.hle-dot-on { background: #10b981 !important; box-shadow: 0 0 6px rgba(16,185,129,0.5) !important; }
      .hle-dot.hle-dot-edit { background: #f59e0b !important; box-shadow: 0 0 6px rgba(245,158,11,0.5) !important; }

      /* Source editor */
      #hle-source-wrap {
        all: initial;
        display: none !important;
        position: fixed !important;
        top: 42px !important; bottom: 24px !important; left: 0 !important; right: 0 !important;
        z-index: 999998 !important;
        background: #1e1e2e !important;
      }
      #hle-source-wrap textarea {
        all: initial;
        width: 100% !important; height: 100% !important;
        background: #1e1e2e !important; color: #e2e8f0 !important;
        border: none !important; padding: 16px !important;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace !important;
        font-size: 13px !important; line-height: 1.6 !important;
        resize: none !important; outline: none !important; tab-size: 2 !important;
        box-sizing: border-box !important;
        display: block !important;
      }
      #hle-source-wrap textarea::selection { background: rgba(99,102,241,0.3) !important; }

      /* Editable highlight */
      .hle-el {
        cursor: pointer !important;
        outline: 2px dashed transparent !important;
        outline-offset: 2px !important;
        transition: outline-color 0.15s, background-color 0.15s !important;
      }
      .hle-el:hover {
        outline-color: #6366f1 !important;
        background-color: rgba(99,102,241,0.06) !important;
      }
      .hle-el.hle-el-active {
        outline: 2px solid #6366f1 !important;
        background-color: rgba(99,102,241,0.08) !important;
        box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
        cursor: text !important;
      }

      .hle-img {
        cursor: pointer !important;
        outline: 3px dashed transparent !important;
        outline-offset: 3px !important;
      }
      .hle-img:hover { outline-color: #8b5cf6 !important; }
      .hle-img.hle-img-active {
        outline: 3px solid #8b5cf6 !important;
        box-shadow: 0 0 0 4px rgba(139,92,246,0.2) !important;
      }

      /* Tooltip */
      #hle-tip {
        all: initial;
        display: none !important; position: fixed !important; z-index: 9999999 !important;
        background: #1e1e2e !important; color: #e2e8f0 !important;
        padding: 4px 8px !important; border-radius: 4px !important;
        font-family: monospace !important; font-size: 11px !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        pointer-events: none !important; white-space: nowrap !important;
      }
    </style>
</head>

<body${bodyAttrs} class="hle-body">

    <!-- HLE Toolbar -->
    <div id="hle-toolbar" data-hle="chrome">
        <div class="hle-logo">🎨</div>
        <span class="hle-title">Live Edit</span>
        <div class="hle-divider"></div>
        <button id="hle-btn-edit" title="Ctrl+E">✏️ Edit</button>
        <button id="hle-btn-src" title="Ctrl+U">⟨/⟩</button>
        <div class="hle-divider"></div>
        <button id="hle-btn-undo" title="Ctrl+Z">↩</button>
        <button id="hle-btn-redo" title="Ctrl+Y">↪</button>
        <div class="hle-divider"></div>
        <button id="hle-btn-save" class="hle-save" title="Ctrl+S">💾</button>
        <div class="hle-spacer"></div>
        <div class="hle-zoom">
          <button id="hle-btn-zo" title="Zoom out">−</button>
          <span class="hle-zoom-val" id="hle-zoom-val">100%</span>
          <button id="hle-btn-zi" title="Zoom in">+</button>
          <button id="hle-btn-zf" title="Reset">⊞</button>
        </div>
        <div class="hle-divider"></div>
        <span class="hle-badge" id="hle-badge-mode">Preview</span>
        <span class="hle-badge" id="hle-badge-count">0 edits</span>
    </div>

    <!-- Original body content -->
    ${bodyContent}

    <!-- Source editor -->
    <div id="hle-source-wrap" data-hle="chrome">
        <textarea id="hle-src-text" spellcheck="false"></textarea>
    </div>

    <!-- Tooltip -->
    <div id="hle-tip" data-hle="chrome"></div>

    <!-- Status bar -->
    <div id="hle-statusbar" data-hle="chrome">
        <span class="hle-dot" id="hle-dot"></span>
        <span id="hle-status">Ready</span>
        <span style="flex:1"></span>
        <span>${fileName}</span>
        <span style="flex:1"></span>
        <span id="hle-hint">Double-click to edit</span>
    </div>

    <script nonce="${nonce}">
    (function(){
        var vscode = acquireVsCodeApi();
        var editMode = false, sourceMode = false, editCount = 0, zoomLevel = 100;
        var undoStack = [], redoStack = [], MAX_UNDO = 50;

        // Store original head for reconstruction
        var savedHead = ${JSON.stringify(headContent)};
        var savedDoctype = ${JSON.stringify(doctype)};
        var savedHtmlAttrs = ${JSON.stringify(htmlAttrs)};
        var savedBodyAttrs = ${JSON.stringify(bodyAttrs)};

        var badgeMode = document.getElementById('hle-badge-mode');
        var badgeCount = document.getElementById('hle-badge-count');
        var dot = document.getElementById('hle-dot');
        var statusEl = document.getElementById('hle-status');
        var hintEl = document.getElementById('hle-hint');
        var tipEl = document.getElementById('hle-tip');

        // ─── Mark editable elements ───
        function markEditables() {
            var sel = 'h1,h2,h3,h4,h5,h6,p,span,label,figcaption,blockquote,cite,' +
                'li,dt,dd,summary,td,th,caption,' +
                'strong,em,b,i,u,mark,small,sub,sup,' +
                'a,abbr,time,' +
                '.kpi-label,.kpi-value,.subtitle,.figure-caption,.highlight';
            var els = document.querySelectorAll(sel);
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el.closest('[data-hle]')) continue;
                if (!el.textContent.trim()) continue;
                if (el.querySelector('img')) continue;
                if (el.classList.contains('hle-el')) continue;
                if (el.parentElement && el.parentElement.classList.contains('hle-el')) continue;
                el.classList.add('hle-el');
                bindText(el);
            }
            var imgs = document.querySelectorAll('img');
            for (var j = 0; j < imgs.length; j++) {
                if (imgs[j].closest('[data-hle]')) continue;
                if (imgs[j].classList.contains('hle-img')) continue;
                imgs[j].classList.add('hle-img');
                bindImg(imgs[j]);
            }
        }

        function bindText(el) {
            el.addEventListener('dblclick', function(e) {
                if (!editMode) toggleEdit();
                e.preventDefault(); e.stopPropagation();
                pushUndo();
                el.contentEditable = 'true';
                el.classList.add('hle-el-active');
                el.focus();
                var r = document.createRange();
                r.selectNodeContents(el);
                var s = window.getSelection();
                s.removeAllRanges(); s.addRange(r);
            });
            el.addEventListener('blur', function() {
                el.contentEditable = 'false';
                el.classList.remove('hle-el-active');
            });
            el.addEventListener('input', function() {
                editCount++;
                badgeCount.textContent = editCount + ' edits';
                badgeCount.className = 'hle-badge hle-badge-dirty';
            });
        }

        function bindImg(img) {
            img.addEventListener('dblclick', function(e) {
                if (!editMode) toggleEdit();
                e.preventDefault(); e.stopPropagation();
                pushUndo();
                img.classList.add('hle-img-active');
                vscode.postMessage({ type: 'replaceImage', src: img.getAttribute('src') || '' });
            });
        }

        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'imageSelected') {
                var imgs = document.querySelectorAll('.hle-img-active');
                for (var i = 0; i < imgs.length; i++) {
                    imgs[i].setAttribute('src', e.data.dataUri);
                    imgs[i].classList.remove('hle-img-active');
                }
                editCount++;
                badgeCount.textContent = editCount + ' edits';
                badgeCount.className = 'hle-badge hle-badge-dirty';
            }
        });

        // ─── Tooltip ───
        document.addEventListener('mouseover', function(e) {
            if (!editMode) return;
            var el = e.target;
            if (!el.classList.contains('hle-el') && !el.classList.contains('hle-img')) return;
            var tag = el.tagName.toLowerCase();
            var cls = Array.from(el.classList).filter(function(c){ return c!=='hle-el'&&c!=='hle-img'&&c!=='hle-el-active'&&c!=='hle-img-active'; }).join('.');
            tipEl.textContent = '<' + tag + '>' + (cls ? '.' + cls : '') + ' [' + el.textContent.trim().length + 'ch]';
            tipEl.style.display = 'block';
            tipEl.style.left = Math.min(e.clientX + 10, window.innerWidth - 200) + 'px';
            tipEl.style.top = Math.max(e.clientY - 28, 48) + 'px';
        });
        document.addEventListener('mouseout', function(e) {
            if (e.target.classList.contains('hle-el') || e.target.classList.contains('hle-img')) {
                tipEl.style.display = 'none';
            }
        });

        // ─── Undo/Redo ───
        function pushUndo() {
            // Save the body content without chrome
            undoStack.push(getBodyContent());
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            redoStack = [];
        }

        function doUndo() {
            if (!undoStack.length) return;
            redoStack.push(getBodyContent());
            var prev = undoStack.pop();
            setBodyContent(prev);
            editCount = Math.max(0, editCount - 1);
            badgeCount.textContent = editCount + ' edits';
        }

        function doRedo() {
            if (!redoStack.length) return;
            undoStack.push(getBodyContent());
            var next = redoStack.pop();
            setBodyContent(next);
            editCount++;
            badgeCount.textContent = editCount + ' edits';
        }

        // Get body innerHTML excluding chrome elements
        function getBodyContent() {
            var clone = document.body.cloneNode(true);
            var chrome = clone.querySelectorAll('[data-hle]');
            for (var i = 0; i < chrome.length; i++) chrome[i].remove();
            // Remove hle classes/attrs from content elements
            var marked = clone.querySelectorAll('.hle-el,.hle-img');
            for (var j = 0; j < marked.length; j++) {
                marked[j].classList.remove('hle-el','hle-el-active','hle-img','hle-img-active');
                marked[j].removeAttribute('contenteditable');
                if (marked[j].classList.length === 0) marked[j].removeAttribute('class');
            }
            return clone.innerHTML;
        }

        function setBodyContent(html) {
            // Remove old content (not chrome)
            var children = document.body.children;
            for (var i = children.length - 1; i >= 0; i--) {
                if (!children[i].hasAttribute('data-hle')) children[i].remove();
            }
            // Insert new content before first chrome element
            var firstChrome = document.body.querySelector('[data-hle]');
            var tmp = document.createElement('div');
            tmp.innerHTML = html;
            while (tmp.firstChild) {
                document.body.insertBefore(tmp.firstChild, firstChrome);
            }
            markEditables();
        }

        // ─── Edit toggle ───
        function toggleEdit() {
            editMode = !editMode;
            var btn = document.getElementById('hle-btn-edit');
            if (editMode) {
                btn.textContent = '👁 View'; btn.classList.add('hle-active');
                badgeMode.textContent = 'Editing'; badgeMode.className = 'hle-badge hle-badge-edit';
                dot.className = 'hle-dot hle-dot-edit';
                statusEl.textContent = 'Editing';
                hintEl.textContent = 'Dbl-click: text/img';
            } else {
                btn.textContent = '✏️ Edit'; btn.classList.remove('hle-active');
                badgeMode.textContent = 'Preview'; badgeMode.className = 'hle-badge';
                dot.className = 'hle-dot';
                statusEl.textContent = 'Preview';
                hintEl.textContent = 'Double-click to edit';
                var editing = document.querySelectorAll('.hle-el-active,.hle-img-active');
                for (var i = 0; i < editing.length; i++) {
                    editing[i].contentEditable = 'false';
                    editing[i].classList.remove('hle-el-active','hle-img-active');
                }
            }
        }

        // ─── Source toggle ───
        function toggleSource() {
            sourceMode = !sourceMode;
            var btn = document.getElementById('hle-btn-src');
            var sw = document.getElementById('hle-source-wrap');
            if (sourceMode) {
                btn.textContent = '👁'; btn.classList.add('hle-active');
                document.getElementById('hle-src-text').value = buildFullHtml();
                sw.style.display = 'block';
                badgeMode.textContent = 'Source'; badgeMode.className = 'hle-badge';
                dot.className = 'hle-dot';
                statusEl.textContent = 'Source';
                hintEl.textContent = 'Edit raw HTML';
            } else {
                btn.textContent = '⟨/⟩'; btn.classList.remove('hle-active');
                // Apply source back
                var src = document.getElementById('hle-src-text').value;
                var bm = src.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
                if (bm) {
                    setBodyContent(bm[1]);
                    var hm = src.match(/<head[^>]*>([\\s\\S]*?)<\\/head>/i);
                    if (hm) savedHead = hm[1];
                }
                sw.style.display = 'none';
                badgeMode.textContent = editMode ? 'Editing' : 'Preview';
                if (editMode) badgeMode.className = 'hle-badge hle-badge-edit';
                statusEl.textContent = editMode ? 'Editing' : 'Preview';
                hintEl.textContent = 'Double-click to edit';
            }
        }

        // ─── Build full HTML for save/source ───
        function buildFullHtml() {
            if (sourceMode) return document.getElementById('hle-src-text').value;
            var bodyHtml = getBodyContent();
            return savedDoctype + '\\n<html' + savedHtmlAttrs + '>\\n<head>\\n' + savedHead + '\\n</head>\\n<body' + savedBodyAttrs + '>\\n' + bodyHtml + '\\n</body>\\n</html>';
        }

        // ─── Save ───
        function doSave() {
            vscode.postMessage({ type: 'save', content: buildFullHtml() });
            editCount = 0;
            badgeCount.textContent = 'Saved!'; badgeCount.className = 'hle-badge hle-badge-saved';
            setTimeout(function(){ badgeCount.textContent = '0 edits'; badgeCount.className = 'hle-badge'; }, 2000);
            undoStack = []; redoStack = [];
        }

        // ─── Zoom ───
        function applyZoom() {
            // Zoom by scaling the body content, keeping chrome at normal size
            var allEls = document.body.children;
            for (var i = 0; i < allEls.length; i++) {
                var el = allEls[i];
                if (el.hasAttribute('data-hle')) continue; // skip chrome
                if (zoomLevel === 100) {
                    el.style.transform = '';
                    el.style.transformOrigin = '';
                    el.style.width = '';
                } else {
                    el.style.transform = 'scale(' + (zoomLevel/100) + ')';
                    el.style.transformOrigin = 'top left';
                    el.style.width = (10000/zoomLevel) + '%';
                }
            }
            document.getElementById('hle-zoom-val').textContent = zoomLevel + '%';
        }

        // ─── Keyboard ───
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's': e.preventDefault(); doSave(); break;
                    case 'e': e.preventDefault(); toggleEdit(); break;
                    case 'u': e.preventDefault(); toggleSource(); break;
                    case 'z': if (!e.shiftKey) { e.preventDefault(); doUndo(); } break;
                    case 'y': e.preventDefault(); doRedo(); break;
                    case '=': case '+': e.preventDefault(); zoomLevel = Math.min(200, zoomLevel+10); applyZoom(); break;
                    case '-': e.preventDefault(); zoomLevel = Math.max(30, zoomLevel-10); applyZoom(); break;
                    case '0': e.preventDefault(); zoomLevel = 100; applyZoom(); break;
                }
            }
        });

        // ─── Button bindings ───
        document.getElementById('hle-btn-edit').onclick = toggleEdit;
        document.getElementById('hle-btn-src').onclick = toggleSource;
        document.getElementById('hle-btn-save').onclick = doSave;
        document.getElementById('hle-btn-undo').onclick = doUndo;
        document.getElementById('hle-btn-redo').onclick = doRedo;
        document.getElementById('hle-btn-zi').onclick = function(){ zoomLevel = Math.min(200, zoomLevel+10); applyZoom(); };
        document.getElementById('hle-btn-zo').onclick = function(){ zoomLevel = Math.max(30, zoomLevel-10); applyZoom(); };
        document.getElementById('hle-btn-zf').onclick = function(){ zoomLevel = 100; applyZoom(); };

        // ─── Init ───
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
