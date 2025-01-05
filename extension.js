const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let saveSnippetRegisterCommand = vscode.commands.registerCommand('easy-code.saveSnippet', async function () {
		let editor = vscode.window.activeTextEditor;
		if(!editor){
			return vscode.window.showErrorMessage('No active editor found!');
		}

		let selection = editor.selection;
		let snippet = editor.document.getText(selection);

		if(!snippet){
			return vscode.window.showErrorMessage('No code snippet selected!');
		}

		let snippetName = await vscode.window.showInputBox({prompt: 'Please enter a snippet name'});
		if(!snippetName){
			vscode.window.showErrorMessage('Snippet name is mandatory!');
		}

		let snippetDescription = await vscode.window.showInputBox({prompt: 'Please enter a snippet description'});
		let snippetTags = await vscode.window.showInputBox({prompt: 'Please enter a snippet tags as comma-separated fields'});
		if(snippetTags){
			snippetTags = snippetTags.split(',').map(tag => tag.trim());
		} else {
			snippetTags = [];
		}

		storeCodeSnippet(snippetName, snippetDescription, snippetTags, snippet);
		vscode.window.showInformationMessage('Code snippet saved successfully!');


	});
	context.subscriptions.push(saveSnippetRegisterCommand);

	let useSnippetRegisterCommand = vscode.commands.registerCommand('easy-code.useSnippet', async function () {
		let editor = vscode.window.activeTextEditor;
		if(!editor){
			return vscode.window.showErrorMessage('No active editor found!');
		}

		let workspaceConfig = vscode.workspace.getConfiguration('easy-code');
		let existingSnippets = workspaceConfig.get('snippets', []);
		
		let selectedSnippet = await vscode.window.showQuickPick(
			existingSnippets.map(snippet => ({
				label: snippet.name,
				description: snippet.description ? snippet.description : 'No description found',
				detail: snippet.tags.length > 0 ? snippet.tags.join(', ') : 'No tags attached',
				snippetContent: snippet.code
			})),
			{
				placeHolder: 'Search for a code snippet to paste',
				matchOnDescription: true,
				matchOnDetail: true
			}
		);

		if(selectedSnippet){
			let snippetText = selectedSnippet.snippetContent;
			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.active, snippetText);
			})
		}
	});
	context.subscriptions.push(useSnippetRegisterCommand);
}

function storeCodeSnippet(name, description, tags, code){
	let workspaceConfig = vscode.workspace.getConfiguration('easy-code');
	let codeSnippets = workspaceConfig.get('snippets', []);

	let existingCodeSnippet = codeSnippets.find(snippet => snippet.name === name);

	if(existingCodeSnippet){
		vscode.window.showWarningMessage(`A snippet with the name ${name} already exists. Do you want to overwrite it?`, 'Yes', 'No').then(userChoice => {
			if(userChoice === 'Yes'){
				let index = codeSnippets.indexOf(existingCodeSnippet);
				codeSnippets[index] = {name, description, tags, code};
				updateCodeSnippet(codeSnippets);
				vscode.window.showInformationMessage(`Snippet "${name}" overwritten.`);
			} else {
				vscode.window.showInformationMessage('Snippet not saved.');
			}
		})
	} else {
		codeSnippets.push({name, description, tags, code});
		updateCodeSnippet(codeSnippets);
	}

	console.log(`\n${'='.repeat(40)}`);
    console.log(`Snippet Saved Successfully!`);
    console.log(`${'='.repeat(40)}\n`);
    console.log(`%cName:`, 'color: green; font-weight: bold;', name);
    console.log(`%cDescription:`, 'color: blue; font-weight: bold;', description);
    console.log(`%cTags:`, 'color: orange; font-weight: bold;', tags.join(', '));
    console.log(`%cSnippet:`, 'color: purple; font-weight: bold;', `\n${code}`);
    console.log(`\n${'='.repeat(40)}`);
}

function updateCodeSnippet(snippets){
	vscode.workspace.getConfiguration('easy-code').update('snippets', snippets, vscode.ConfigurationTarget.Global);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
