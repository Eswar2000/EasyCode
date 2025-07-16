const vscode = require('vscode');
const { getWebviewContent } = require('../webview/snippetView');

class SnippetViewProvider {
    constructor() {
        this.loadSnippets();
    }

    // Load snippets from the VS Code configuration
    loadSnippets() {
        this.snippets = vscode.workspace.getConfiguration('easy-code').get('snippets', []);
    }

    // Update snippets in VS Code configuration
    updateSnippetsConfiguration() {
        vscode.workspace.getConfiguration('easy-code').update('snippets', this.snippets);
    }

    // Resolve the webview view
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = getWebviewContent(this.snippets);

        this.setupMessageHandlers(webviewView);
    }

    // Setup message handlers for the webview
    async setupMessageHandlers(webviewView) {
        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'insertSnippet':
                    await this.handleInsertSnippet(message.snippetName);
                    break;

                case 'deleteSnippet':
                    await this.handleDeleteSnippet(message.snippetName, webviewView);
                    break;

                case 'createSnippet':
                    await this.handleCreateSnippet(message.snippet, webviewView);
                    break;

                case 'previewSnippet':
                    await this.handlePreviewSnippet(message.snippetName);
                    break;
            }
        });
    }

    // Handle inserting a snippet into active text editor
    async handleInsertSnippet(snippetName) {
        const snippet = this.snippets.find(s => s.name === snippetName);
        if (snippet) {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                try {
                    await editor.edit(editBuilder => {
                        editBuilder.insert(editor.selection.active, snippet.code);
                    });
                    vscode.window.showInformationMessage(`Snippet "${snippetName}" has been inserted.`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to insert snippet: ${error.message}`);
                }
            } else {
                vscode.window.showWarningMessage('Please open a file to insert the snippet.');
            }
        }
    }

    // Handle deleting a snippet from the list
    async handleDeleteSnippet(snippetName, webviewView) {
        const action = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the snippet "${snippetName}"?`,
            'Delete',
            'Cancel'
        );

        if (action === 'Delete') {
            let deleteIndex = this.snippets.findIndex(s => s.name === snippetName);
            if (deleteIndex !== -1) {
                this.snippets.splice(deleteIndex, 1);
                this.updateSnippetsConfiguration();
                webviewView.webview.html = getWebviewContent(this.snippets);
                vscode.window.showInformationMessage(`Snippet "${snippetName}" has been deleted.`);
            }
        }
    }

    // Handle creating a new snippet
    async handleCreateSnippet(snippetData, webviewView) {
        let editor = vscode.window.activeTextEditor;
        let selectedCode = "";
        if (editor) {
            selectedCode = editor.document.getText(editor.selection);
        }

        if (!selectedCode) {
            vscode.window.showErrorMessage('Please select some code before creating a snippet.');
            return;
        }

        let snippetName = snippetData.name;
        let snippetDescription = snippetData.description;
        let snippetTags = snippetData.tags.split(',').map(tag => tag.trim());
        let snippetIndex = this.snippets.findIndex(s => s.name === snippetName);

        if (snippetIndex !== -1) {
            const action = await vscode.window.showWarningMessage(
                `Snippet "${snippetName}" already exists. Do you want to overwrite it?`,
                'Overwrite',
                'Cancel'
            );
            
            if (action !== 'Overwrite') {
                return;
            }
        }

        let newSnippet = {
            name: snippetName,
            description: snippetDescription,
            tags: snippetTags,
            code: selectedCode
        };

        if (snippetIndex === -1) {
            this.snippets.push(newSnippet);
        } else {
            this.snippets[snippetIndex] = newSnippet;
        }
        
        this.updateSnippetsConfiguration();
        webviewView.webview.html = getWebviewContent(this.snippets);
        vscode.window.showInformationMessage(`Snippet "${snippetName}" has been saved successfully!`);
    }

    // Handle previewing a snippet in a new text document
    async handlePreviewSnippet(snippetName) {
        const previewSnippet = this.snippets.find(s => s.name === snippetName);
        if (previewSnippet) {
            const doc = await vscode.workspace.openTextDocument({
                content: previewSnippet.code,
                language: 'plaintext'
            });
            await vscode.window.showTextDocument(doc, {
                preview: true,
                viewColumn: vscode.ViewColumn.One
            });
        }
    }
}

module.exports = SnippetViewProvider;
