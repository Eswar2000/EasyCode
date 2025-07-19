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
        this._webviewView = webviewView;
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
                    await this.handleCreateSnippet();
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
    async handleCreateSnippet() {
        const editor = vscode.window.activeTextEditor;
        let selectedCode = "";
        if (editor) {
            selectedCode = editor.document.getText(editor.selection);
        }

        if (!selectedCode) {
            vscode.window.showErrorMessage('Please select some code before creating a snippet.');
            return;
        }

        // Prompt for snippet name
        const snippetName = await vscode.window.showInputBox({
            prompt: 'Enter a name for your code snippet',
            placeHolder: 'Snippet name',
            validateInput: text => text && text.trim().length > 0 ? null : 'Name cannot be empty'
        });
        if (!snippetName) return;

        // Prompt for snippet description
        const snippetDescription = await vscode.window.showInputBox({
            prompt: 'Enter a description for your code snippet',
            placeHolder: 'Snippet description',
            validateInput: text => text && text.trim().length > 0 ? null : 'Description cannot be empty'
        });
        if (!snippetDescription) return;

        // Prompt for tags (multi-select QuickPick with custom entry)
        const tagSuggestions = ['javascript', 'typescript', 'react', 'node', 'html', 'css', 'express', 'api', 'frontend', 'backend'];
        let allTags = [...tagSuggestions];
        let selectedTags = [];
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = allTags.map(label => ({ label }));
        quickPick.canSelectMany = true;
        quickPick.title = 'Select tags for your snippet';
        quickPick.placeholder = 'Pick tags or type a new tag and press Enter to add';

        let lastValue = '';
        quickPick.onDidChangeValue(value => {
            lastValue = value;
        });

        const snippetTags = await new Promise(resolve => {
            quickPick.onDidAccept(() => {
                // If user typed a custom value and pressed Enter, add it to the list
                if (
                    lastValue &&
                    !allTags.includes(lastValue) &&
                    !quickPick.items.some(item => item.label === lastValue)
                ) {
                    // Preserve previous selections
                    const prevSelectedLabels = quickPick.selectedItems.map(item => item.label);
                    allTags = [lastValue, ...allTags];
                    quickPick.items = allTags.map(label => ({ label }));
                    // Restore previous selections and add the new one
                    quickPick.selectedItems = quickPick.items.filter(item => prevSelectedLabels.includes(item.label) || item.label === lastValue);
                    quickPick.value = '';
                    lastValue = '';
                    quickPick.title = 'Select tags for your snippet';
                    quickPick.placeholder = 'Pick tags or type a new tag and press Enter to add';
                    return; // Don't close, let user keep picking
                }
                resolve(quickPick.selectedItems.map(item => item.label));
                quickPick.hide();
            });
            quickPick.show();
        });

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

        const newSnippet = {
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
        // Reload the webview to show updated snippets
        if (this._webviewView) {
            this._webviewView.webview.html = getWebviewContent(this.snippets);
        }
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
