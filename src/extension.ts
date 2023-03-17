import * as path from 'path';
import * as vscode from 'vscode';
import { TextEncoder } from 'util';
import { encrypt, decrypt } from './crypto';
import { AlwaysSecureFileSystemProvider } from './AlwaysSecureFileSystemProvider';


const alwaysSecureFilePrefix = "[VIRTUAL] ";
const alwaysSecureScheme = 'always-secure';
const alwaysSecureProvider = new AlwaysSecureFileSystemProvider();


export function activate(context: vscode.ExtensionContext) {
	if (vscode.window.activeTextEditor?.document && isSecretFile(vscode.window.activeTextEditor.document)) {
		openSecretDoc(vscode.window.activeTextEditor.document);
	}

	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider(alwaysSecureScheme, alwaysSecureProvider),

		vscode.commands.registerCommand('always-secure.encrypt', async () => {
			if (vscode.window.activeTextEditor?.document) {
				await saveSecretDoc(vscode.window.activeTextEditor.document);
			}
		}),
		vscode.commands.registerCommand('always-secure.decrypt', async () => {
			if (vscode.window.activeTextEditor?.document) {
				await openSecretDoc(vscode.window.activeTextEditor.document);
			}
		}),

		vscode.workspace.onDidOpenTextDocument(async (document) => {
			if (isSecretFile(document) && document.uri.scheme !== alwaysSecureScheme) {
				await openSecretDoc(document);
			}
		}),
		vscode.workspace.onWillSaveTextDocument((event) => {
			if (isSecretFile(event.document)) {
				event.waitUntil(saveSecretDoc(event.document));
			}
		}),
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }


async function saveSecretDoc(document: vscode.TextDocument) {
	const text = document.getText();
	const password = await getPasswordFromUser(true);
	if (password) {
		try {
			const edit = new vscode.WorkspaceEdit();
			const encoder = new TextEncoder();
			const encryptedText = await encrypt(text, password);
			const fileName = path.basename(document.fileName);
			const filePath = document.uri.path.replace(fileName, fileName.substring(alwaysSecureFilePrefix.length));
			// Update the original file with the encrypted content
			edit.createFile(vscode.Uri.file(filePath), {
				overwrite: true,
				contents: encoder.encode(encryptedText)
			});
			await vscode.workspace.applyEdit(edit);
			await vscode.window.showTextDocument(document, { preserveFocus: false, preview: false });
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		} catch (error) {
			console.error(error);
		}
	}
	else {
		vscode.window.showErrorMessage("Password is not confirmed or empty");
	}
}


async function openSecretDoc(document: vscode.TextDocument) {
	let text = document.getText();
	const password = await getPasswordFromUser(false);
	if (password) {
		try {
			text = await decrypt(text, password);
		} catch (error) {
			vscode.window.showErrorMessage("Password is not correct, you can use command to decrypt it or reopen the original file.");
		}
		const fileName = path.basename(document.fileName);
		// To indicate this file is virtual and not on disk
		const filePath = document.uri.path.replace(fileName, alwaysSecureFilePrefix + fileName);

		// Use the always secure virtual file system, so no file will be saved into disk
		const uri =
			document.uri.scheme === alwaysSecureScheme
				? document.uri
				: vscode.Uri.parse(alwaysSecureScheme + ":" + filePath);

		const doc = await vscode.workspace.openTextDocument(uri);
		const encoder = new TextEncoder();
		alwaysSecureProvider.update(uri, encoder.encode(text));
		await vscode.window.showTextDocument(doc, { preview: false });
	}
	else {
		vscode.window.showErrorMessage("Password cannot be empty");
	}
}


function isSecretFile(document: vscode.TextDocument) {
	return document.fileName.match(/\.secret\./) !== null;
}


async function getPasswordFromUser(needConfirm: boolean) {
	const firstPassword = await vscode.window.showInputBox({
		prompt: 'Enter password for file encryption:',
		password: true
	});

	if (needConfirm) {
		const secondPassword = await vscode.window.showInputBox({
			prompt: 'Enter confirm your password for file encryption:',
			password: true
		});

		if (firstPassword && firstPassword === secondPassword) {
			return firstPassword;
		}

		return undefined;
	}

	return firstPassword;
}
