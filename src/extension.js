const vscode = require('vscode');
const SnippetViewProvider = require('./providers/snippetViewProvider');

// Activate the extension
function activate(context) {
    // Register the WebviewViewProvider
    const snippetViewProvider = new SnippetViewProvider();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('easy-code-sidebar-panel', snippetViewProvider)
    );
}

// Deactivate the extension
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
