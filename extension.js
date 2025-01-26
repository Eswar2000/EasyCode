const vscode = require('vscode');

function activate(context) {
	// Sample data for snippets
	// const snippets = [
	// 	{ name: 'Snippet 1', description: 'This is snippet 1, useful in many scenarios.', tags: ['tag1', 'js'], code: 'console.log("Hello, World!");' },
	// 	{ name: 'Snippet 2', description: 'Snippet 2, useful for variable declarations.', tags: ['tag2', 'var'], code: 'const x = 10;' },
	// ];
	const snippets = vscode.workspace.getConfiguration('easy-code').get('snippets');

	// Register the WebviewViewProvider
	const snippetViewProvider = new SnippetViewProvider(context, snippets);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('easy-code-sidebar-panel', snippetViewProvider)
	);
}

// The SnippetViewProvider is responsible for displaying the snippets in the sidebar
class SnippetViewProvider {
	constructor(context, snippets) {
		this.context = context;
		this.snippets = snippets;
	}

	resolveWebviewView(webviewView) {
		webviewView.webview.options = {
			enableScripts: true,
		};

		webviewView.webview.html = this.getWebviewContent(this.snippets);

		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'insertSnippet':
					const snippet = this.snippets.find(snippet => snippet.name === message.snippetName);
					if (snippet) {
						const editor = vscode.window.activeTextEditor;
						if (editor) {
							editor.edit(editBuilder => {
								editBuilder.insert(editor.selection.active, snippet.code);
							});
						}
					}
					break;
				case 'deleteSnippet':
					const index = this.snippets.findIndex(snippet => snippet.name === message.snippetName);
					if (index !== -1) {
						this.snippets.splice(index, 1);
						webviewView.webview.html = this.getWebviewContent(this.snippets);
					}
					break;
			}
		});
	}

	getWebviewContent() {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Snippet Manager</title>
			<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.25/dist/codicon.css">
			<style>

				/* Default styling */
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
					padding: 10px;
					margin: 0;
					background-color: var(--vscode-panel-background);
					color: var(--vscode-foreground);
				}

				h1 {
					font-size: 16px;
					color: var(--vscode-editorForeground);
					margin: 0 0 20px;
					font-weight: 600;
				}

				/* Search bar styling */
				.search-bar {
					margin-bottom: 20px;
					padding: 6px 10px;
					width: 100%;
					font-size: 14px;
					border-radius: 4px;
					border: 1px solid var(--vscode-input-border);
					background-color: var(--vscode-input-background);
					color: var(--vscode-input-foreground);
					box-sizing: border-box;
					display: block;
				}

				/* Code snippet item styling */
				.snippet-card {
					background-color: var(--vscode-list-background);
					border-radius: 6px;
					padding: 10px;
					margin-bottom: 8px;
					box-shadow: var(--vscode-list-box-shadow);
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					cursor: pointer;
					position: relative;
				}

				.snippet-card:hover {
					background-color: var(--vscode-list-hoverBackground);
				}

				.snippet-card h3 {
					margin: 0;
					font-weight: bold;
					color: var(--vscode-textLink-foreground);
					font-size: 14px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
					width: 100%;
					display: block;
					position: relative;
				}

				.snippet-card .tags {
					font-size: 12px;
					color: var(--vscode-descriptionForeground);
					margin-top: 5px;
				}

				.snippet-card p {
					font-size: 12px;
					color: var(--vscode-editorForeground);
					margin-top: 8px;
					word-wrap: break-word;
					overflow-wrap: break-word;
					max-width: 100%;
					display: block;
					white-space: normal;
				}

				.snippet-actions {
					position: absolute;
					right: 10px;
					top: 45%;
					transform: translateY(-50%);
					display: flex;
					gap: 8px;
					justify-content: flex-start;
				}

				.snippet-actions button {
					background-color: transparent;
					border: none;
					cursor: pointer;
					display: inline-flex;
					justify-content: center;
					align-items: center;
					width: 24px;
					height: 24px;
					padding: 0;
				}

				.snippet-actions button:hover {
					opacity: 0.8;
				}

				.snippet-actions button:focus {
					outline: none;
				}

				.snippet-card:hover .snippet-actions button {
					opacity: 1;
				}

				.codicon-add,
				.codicon-trash {
					font-size: 16px;
					color: var(--vscode-button-foreground);
				}

				.snippet-actions button:hover .codicon-add,
				.snippet-actions button:hover .codicon-trash {
					color: var(--vscode-button-hoverForeground);
				}
			</style>
		</head>
		<body>
			<input type="text" class="search-bar" id="searchInput" placeholder="Search snippets by name or tags" oninput="filterSnippets()" />
			
			<div id="snippetsList">
				${this.snippets.map(snippet => `
					<div class="snippet-card" data-name="${snippet.name}" data-tags="${snippet.tags.join(',')}">
						<h3>${snippet.name}</h3>
						<div class="tags">${snippet.tags.join(', ')}</div>
						<div class="snippet-actions">
							<button class="add" title="Add Snippet" onclick="insertSnippet('${snippet.name}')">
								<span class="codicon codicon-add"></span>
							</button>
							<button class="delete" title="Delete Snippet" onclick="deleteSnippet('${snippet.name}')">
								<span class="codicon codicon-trash"></span>
							</button>
						</div>
					</div>
				`).join('')}
			</div>
			
			<script>
				const vscode = acquireVsCodeApi();
	
				function insertSnippet(snippetName) {
					vscode.postMessage({
						command: 'insertSnippet',
						snippetName: snippetName
					});
				}
	
				function deleteSnippet(snippetName) {
					vscode.postMessage({
						command: 'deleteSnippet',
						snippetName: snippetName
					});
				}
	
				function filterSnippets() {
					const searchQuery = document.getElementById("searchInput").value.toLowerCase();
					const snippets = document.querySelectorAll(".snippet-card");
	
					snippets.forEach(snippet => {
						const name = snippet.getAttribute("data-name").toLowerCase();
						const tags = snippet.getAttribute("data-tags").toLowerCase();
	
						if (name.includes(searchQuery) || tags.includes(searchQuery)) {
							snippet.style.display = "block";
						} else {
							snippet.style.display = "none";
						}
					});
				}
			</script>
		</body>
		</html>`;
	}



}

module.exports = {
	activate
};
