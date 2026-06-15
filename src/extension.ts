import * as vscode from 'vscode';
import { HtmlEditorProvider } from './htmlEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  // Register the custom editor provider
  const provider = new HtmlEditorProvider(context);
  
  const providerRegistration = vscode.window.registerCustomEditorProvider(
    HtmlEditorProvider.viewType,
    provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
      supportsMultipleEditorsPerDocument: false,
    }
  );

  // Register command to manually open in visual editor
  const openCommand = vscode.commands.registerCommand(
    'htmlWysiwyg.openEditor',
    async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && 
          (activeEditor.document.fileName.endsWith('.html') || 
           activeEditor.document.fileName.endsWith('.htm'))) {
        await vscode.commands.executeCommand(
          'vscode.openWith',
          activeEditor.document.uri,
          HtmlEditorProvider.viewType
        );
      } else {
        vscode.window.showInformationMessage('Please open an HTML file first.');
      }
    }
  );

  context.subscriptions.push(providerRegistration, openCommand);
}

export function deactivate() {}
