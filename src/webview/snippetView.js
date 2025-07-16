// Get the webview HTML content
function getWebviewContent(snippets) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            ${getWebviewHeader()}
        </head>
        <body>
            ${getWebviewBody(snippets)}
            ${getWebviewScripts()}
        </body>
        </html>`;
}

// Get the webview header content with styles
function getWebviewHeader() {
    return `
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Snippet Manager</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.25/dist/codicon.css">
        <style>
            ${getWebviewStyles()}
        </style>`;
}

// Get the webview body content
function getWebviewBody(snippets) {
    return `
        <div id="search-create-container">
            <input type="text" class="search-bar" id="searchInput" placeholder="Search snippets by name or tags" oninput="filterSnippets()" />
            <button class="create-snippet-btn" title="Create Snippet" onclick="showCreateSnippetForm()">
                <span class="codicon codicon-new-file" />
            </button>
        </div>
        ${getCreateSnippetForm()}
        ${getSnippetsList(snippets)}`;
}

// Get the create snippet form HTML
function getCreateSnippetForm() {
    return `
        <div id="create-snippet-form">
            <h2>Create a New Snippet</h2>
            <input class="form-input" type="text" id="snippetName" placeholder="Snippet Name" required />
            <input class="form-input" type="text" id="snippetTags" placeholder="Tags (comma-separated)" />
            <textarea class="form-textarea" id="snippetDescription" placeholder="Description" rows="4"></textarea>
            <div class="form-btn-container">
                <button id="confirm-btn" class="form-btn" onclick="submitCreateSnippetForm()">Submit</button>
                <button class="cancel-btn" onclick="hideCreateSnippetForm()">Cancel</button>
            </div>
        </div>`;
}

// Get the snippets list HTML
function getSnippetsList(snippets) {
    return `
        <div id="snippets-list">
            ${snippets.map(snippet => `
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
                        <button class="preview" title="Preview Snippet" onclick="previewSnippet('${snippet.name}')">
                            <span class="codicon codicon-eye"></span>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// Get the webview styles
function getWebviewStyles() {
    return `
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

        /* Search bar and create snippet button styling */
        #search-create-container {
            width: 100%;
            display: flex;
            align-items: center;
            box-sizing: border-box;
            margin-bottom: 10px;
        }

        .search-bar {
            flex: 1 0 75%;
            margin-right: 10px;
            padding: 6px 10px;
            font-size: 14px;
            border-radius: 4px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            box-sizing: border-box;
        }

        .search-bar:hover {
            border-color: var(--vscode-button-hoverBorder);
        }
            
        .search-bar:active {
            border-color: var(--vscode-button-pressedBorder);
        }

        .create-snippet-btn {
            flex: 0 0 auto;
            padding: 6px 12px;
            font-size: 14px;
            border-radius: 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border);
            cursor: pointer;
            transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .create-snippet-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
            border-color: var(--vscode-button-hoverBorder);
        }

        .create-snippet-btn:focus {
            outline: none;
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
        }

        .create-snippet-btn:active {
            background-color: var(--vscode-button-pressedBackground);
            border-color: var(--vscode-button-pressedBorder);
        }

        /* Snippet creation form styling */
        #create-snippet-form {
            padding: 15px;
            background-color: var(--vscode-input-background);
            border-radius: 6px;
            box-shadow: var(--vscode-input-box-shadow);
            display: none;
        }

        .form-input {
            font-size: 14px;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 10px;
        }

        .form-input:focus {
            outline: none;
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
        }

        .form-textarea {
            font-size: 14px;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            width: 100%;
            box-sizing: border-box;
            margin-bottom: 10px;
            resize: vertical;
        }

        .form-textarea:focus {
            outline: none;
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
        }

        .form-input, .form-textarea {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        }

        .form-btn-container {
            display: flex;
            justify-content: flex-start;
        }

        .form-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid var(--vscode-button-border);
            width: auto;
            transition: background-color 0.2s ease, border-color 0.2s ease;
            margin-right: 5px;
        }

        .form-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
            border-color: var(--vscode-button-hoverBorder);
        }

        .form-btn:active {
            background-color: var(--vscode-button-pressedBackground);
            border-color: var(--vscode-button-pressedBorder);
        }

        .cancel-btn {
            background-color: transparent;
            color: var(--vscode-button-foreground);
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid var(--vscode-button-border);
        }

        /* Code snippet items styling */
        #snippets-list {
            display: block;
        }
        
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

        .snippet-actions button:focus {
            outline: none;
        }

        .snippet-card:hover .snippet-actions button {
            opacity: 1;
        }

        .codicon-add,
        .codicon-trash,
        .codicon-eye {
            font-size: 16px;
            color: var(--vscode-button-foreground);
        }

        .snippet-actions button:hover .codicon-add,
        .snippet-actions button:hover .codicon-trash,
        .snippet-actions button:hover .codicon-eye {
            opacity: 0.4;
        }
    `;
}

// Get the webview scripts
function getWebviewScripts() {
    return `
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

            function createSnippet(snippet) {
                vscode.postMessage({
                    command: 'createSnippet',
                    snippet: snippet
                });
            }

            function previewSnippet(snippetName) {
                vscode.postMessage({
                    command: 'previewSnippet',
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

            function showCreateSnippetForm() {
                document.getElementById('create-snippet-form').style.display = 'block';
                document.getElementById('snippets-list').style.display = 'none';
            }

            function hideCreateSnippetForm() {
                document.getElementById('snippetName').value = '';
                document.getElementById('snippetTags').value = '';
                document.getElementById('snippetDescription').value = '';
                document.getElementById('create-snippet-form').style.display = 'none';
                document.getElementById('snippets-list').style.display = 'block';
            }

            function submitCreateSnippetForm() {
                let snippetName = document.getElementById('snippetName').value.trim();
                let snippetTags = document.getElementById('snippetTags').value.trim();
                let snippetDescription = document.getElementById('snippetDescription').value.trim();

                if (!snippetName || !snippetTags || !snippetDescription) {
                    return;
                }

                let snippet = {
                    'name': snippetName,
                    'tags': snippetTags,
                    'description': snippetDescription
                };

                createSnippet(snippet);
                hideCreateSnippetForm();
            }
        </script>`;
}

module.exports = {
    getWebviewContent
};
