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
          vscode.window.showInformationMessage('HTML saved successfully!');
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
          img-src ${webview.cspSource} https: data:; 
          script-src 'nonce-${nonce}' 'unsafe-inline'; 
          style-src 'unsafe-inline' ${webview.cspSource};
          font-src ${webview.cspSource};">
    <base href="${baseUri}">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f5f5f5;
      }
      
      #toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 48px;
        background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        padding: 0 20px;
        z-index: 10000;
        gap: 12px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      }
      
      .toolbar-logo {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }
      
      .toolbar-title {
        color: #fff;
        font-size: 14px;
        font-weight: 600;
      }
      
      .toolbar-divider {
        width: 1px;
        height: 24px;
        background: rgba(255,255,255,0.2);
      }
      
      #toolbar button {
        background: rgba(255,255,255,0.1);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.2);
        padding: 7px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      #toolbar button:hover {
        background: rgba(255,255,255,0.2);
        transform: translateY(-1px);
      }
      
      #toolbar button.active {
        background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      }
      
      #toolbar button.save-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
      }
      
      #toolbar button.save-btn:hover {
        background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      }
      
      .toolbar-spacer { flex: 1; }
      
      .toolbar-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .info-badge {
        background: rgba(255,255,255,0.1);
        color: #ccc;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
      }
      
      .info-badge.editing {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }
      
      .info-badge.saved {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }
      
      #content {
        margin-top: 48px;
        margin-bottom: 28px;
        padding: 32px 48px;
        background: #fff;
        min-height: calc(100vh - 76px);
      }
      
      .editable {
        cursor: pointer;
        outline: 2px dashed transparent;
        outline-offset: 3px;
        padding: 2px;
        border-radius: 3px;
        transition: all 0.15s;
        min-height: 1em;
      }
      
      .editable:hover {
        outline-color: #6366f1;
        background: rgba(99, 102, 241, 0.05);
      }
      
      .editable.editing {
        outline: 2px solid #6366f1;
        background: rgba(99, 102, 241, 0.08);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        cursor: text;
      }
      
      .status-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 28px;
        background: #1e1e2e;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 16px;
        z-index: 10000;
      }
      
      .status-item {
        color: #888;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #888;
      }
      
      .status-dot.active {
        background: #10b981;
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
      }
      
      .status-spacer { flex: 1; }
    </style>
</head>
<body>
    <div id="toolbar">
        <div class="toolbar-logo">🎨</div>
        <span class="toolbar-title">HTML Visual Editor</span>
        <div class="toolbar-divider"></div>
        <button id="btn-edit">✏️ Edit Mode</button>
        <button id="btn-save" class="save-btn">💾 Save</button>
        <div class="toolbar-spacer"></div>
        <div class="toolbar-info">
            <span class="info-badge" id="mode-badge">Preview</span>
            <span class="info-badge" id="edit-count">0 changes</span>
        </div>
    </div>
    
    <div id="content"></div>
    
    <div class="status-bar">
        <div class="status-item">
            <span class="status-dot" id="status-dot"></span>
            <span id="status-text">Ready</span>
        </div>
        <div class="status-item">${fileName}</div>
        <div class="status-spacer"></div>
        <div class="status-item">Double-click text to edit</div>
    </div>

    <script nonce="${nonce}">
        (function() {
            var vscode = acquireVsCodeApi();
            var editMode = false;
            var editCount = 0;
            
            var htmlContent = ${JSON.stringify(htmlContent)};
            
            // Render content
            var content = document.getElementById('content');
            content.innerHTML = htmlContent;
            
            // Expanded selectors to cover more text elements
            var selectors = [
                // Headings
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                // Paragraphs and text containers
                'p', 'span', 'label', 'figcaption', 'blockquote', 'cite',
                // Lists
                'li', 'dt', 'dd', 'summary',
                // Table cells
                'td', 'th',
                // Inline formatting
                'strong', 'em', 'b', 'i', 'u', 'mark', 'small',
                // Links
                'a',
                // Div containers with direct text (not containing other editable elements)
                '.highlight-box', '.mechanism-box', '.advantage-box', '.risk-box',
                '.cover .subtitle', '.cover .date'
            ].join(', ');
            
            var elements = content.querySelectorAll(selectors);
            
            elements.forEach(function(el) {
                // Skip if inside toolbar or status bar
                if (el.closest('#toolbar') || el.closest('.status-bar')) return;
                
                // Skip if element is empty or only whitespace
                if (!el.textContent.trim()) return;
                
                // Skip if parent is already editable (avoid nested editables)
                if (el.parentElement && el.parentElement.classList.contains('editable')) return;
                
                el.classList.add('editable');
                
                // Double-click to edit
                el.addEventListener('dblclick', function(e) {
                    if (!editMode) {
                        toggleEditMode();
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    
                    el.contentEditable = 'true';
                    el.classList.add('editing');
                    el.focus();
                    
                    // Select all text
                    var range = document.createRange();
                    range.selectNodeContents(el);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                });
                
                // Track changes
                el.addEventListener('input', function() {
                    editCount++;
                    document.getElementById('edit-count').textContent = editCount + ' changes';
                });
                
                // Exit edit on blur
                el.addEventListener('blur', function() {
                    el.contentEditable = 'false';
                    el.classList.remove('editing');
                });
            });
            
            // Toggle edit mode
            function toggleEditMode() {
                editMode = !editMode;
                var btn = document.getElementById('btn-edit');
                var badge = document.getElementById('mode-badge');
                var dot = document.getElementById('status-dot');
                var status = document.getElementById('status-text');
                
                if (editMode) {
                    btn.textContent = '👁️ View Mode';
                    btn.classList.add('active');
                    badge.textContent = 'Editing';
                    badge.classList.add('editing');
                    dot.classList.add('active');
                    status.textContent = 'Editing';
                } else {
                    btn.textContent = '✏️ Edit Mode';
                    btn.classList.remove('active');
                    badge.textContent = 'Preview';
                    badge.classList.remove('editing');
                    dot.classList.remove('active');
                    status.textContent = 'Preview';
                    
                    // Exit all editing
                    document.querySelectorAll('.editing').forEach(function(el) {
                        el.contentEditable = 'false';
                        el.classList.remove('editing');
                    });
                }
            }
            
            document.getElementById('btn-edit').addEventListener('click', toggleEditMode);
            
            // Save
            document.getElementById('btn-save').addEventListener('click', function() {
                var clone = content.cloneNode(true);
                
                // Clean up editor attributes
                clone.querySelectorAll('.editable').forEach(function(el) {
                    el.classList.remove('editable', 'editing');
                    el.removeAttribute('contenteditable');
                    el.removeAttribute('style');
                });
                
                vscode.postMessage({ type: 'save', content: clone.innerHTML });
                
                editCount = 0;
                var badge = document.getElementById('edit-count');
                badge.textContent = 'Saved!';
                badge.classList.add('saved');
                setTimeout(function() {
                    badge.textContent = '0 changes';
                    badge.classList.remove('saved');
                }, 2000);
            });
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
