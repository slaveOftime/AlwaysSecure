import * as path from 'path';
import * as vscode from 'vscode';
import { TextEncoder } from 'util';
import { encrypt, decrypt } from './crypto';
import { AlwaysSecureFileSystemProvider } from './AlwaysSecureFileSystemProvider';


const alwaysSecureFilePrefix = "[VIRTUAL] ";
const alwaysSecureScheme = 'always-secure';
const alwaysSecureProvider = new AlwaysSecureFileSystemProvider();

// Convert string to UintArray
const encoder = new TextEncoder();
// Cache virtual path with original file's uri, selection, encryptedContent etc.
const encryptionBundles = new Map<string, { selection: vscode.Selection, originalUri: vscode.Uri, encryptedContent?: string, lastEditTime: number } | undefined>();


export function activate(context: vscode.ExtensionContext) {
	const autoCloseInternal = setInterval(async () => {
		for (const [path, bundle] of encryptionBundles.entries()) {
			if (bundle && Date.now() - bundle.lastEditTime > 1000 * 60 * 5) {
				try {
					encryptionBundles.set(path, undefined);
					const uri = vscode.Uri.from({ scheme: alwaysSecureScheme, path: path });
					const document = await vscode.workspace.openTextDocument(uri);
					const editor = await vscode.window.showTextDocument(document, { preview: false });
					await editor.edit(edit => {
						edit.replace(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE), "");
					});
					await document.save();
					await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				} catch (error) {
					console.warn("Close virtual file failed");
				}
			}
		}
	}, 1000);

	context.subscriptions.push(
		{ dispose: () => clearInterval(autoCloseInternal) },

		// Register in memory virtual file system to handle special schema
		vscode.workspace.registerFileSystemProvider(alwaysSecureScheme, alwaysSecureProvider),

		vscode.commands.registerCommand('always-secure.encrypt', encryptSelection),

		vscode.commands.registerCommand('always-secure.decrypt', decryptSelection),

		vscode.workspace.onDidSaveTextDocument(encryptVirtualFile),

		vscode.workspace.onDidChangeTextDocument(event => {
			if (event.document.uri.scheme === alwaysSecureScheme) {
				const bundle = encryptionBundles.get(event.document.uri.path);
				if (bundle) {
					bundle.lastEditTime = Date.now();
				}
			}
		}),

		vscode.workspace.onDidCloseTextDocument(document => {
			if (document.uri.scheme === alwaysSecureScheme) {
				encryptionBundles.set(document.uri.path, undefined);
			}
		}),

		vscode.window.onDidChangeActiveTextEditor(async activeEditor => {
			if (activeEditor && activeEditor.document.uri.scheme !== alwaysSecureScheme) {
				const path = createVirtualPath(activeEditor.document);
				const bundle = encryptionBundles.get(path);
				if (bundle && bundle.encryptedContent) {
					encryptionBundles.set(path, undefined);
					// Replace the selection with encrypted content
					await activeEditor.edit(edit => edit.replace(bundle.selection, bundle.encryptedContent!));
				}
			}
		})
	);
}

export async function deactivate() { }


async function decryptSelection() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const selection = editor.selection;
		let content = editor.document.getText(new vscode.Range(selection.start, selection.end)).trim();
		if (content) {
			const password = await getPasswordFromUser(false);
			try {
				const decryptedContent = await decrypt(content, password!);
				if (decryptedContent) {
					// Open a virtual file to edit the decrypted content
					const path = createVirtualPath(editor.document);
					const uri = vscode.Uri.from({ scheme: alwaysSecureScheme, path: path });
					// Cache the selection for replace with encrypted content later
					encryptionBundles.set(uri.path, { selection, originalUri: editor.document.uri, lastEditTime: Date.now() });
					// Update the virtual editor content
					alwaysSecureProvider.setDocument(uri.toString(), encoder.encode(decryptedContent));
					// Open virtual editor
					const doc = await vscode.workspace.openTextDocument(uri);
					await vscode.window.showTextDocument(doc);
				}
				else {
					vscode.window.showErrorMessage(`Decryption failed`);
				}
			} catch (error) {
				vscode.window.showErrorMessage(`Decryption failed. ${error}`);
			}
		}
	}
}


async function encryptSelection() {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const selection = editor.selection;
		const content = editor.document.getText(new vscode.Range(selection.start, selection.end));
		if (content) {
			const password = await getPasswordFromUser(true);
			if (password) {
				try {
					// Encrypt and replace accordingly
					const encryptedContent = await encrypt(content, password);
					await editor.edit(edit => edit.replace(selection, encryptedContent));
				}
				catch (error) {
					vscode.window.showErrorMessage(`Encryption failed: ${error}`);
				}
			}
			else {
				vscode.window.showErrorMessage("Password cannot be empty or confirming is failed");
			}
		}
	}
}


async function encryptVirtualFile(document: vscode.TextDocument) {
	if (document.uri.scheme === alwaysSecureScheme) {
		const bundle = encryptionBundles.get(document.uri.path);
		if (bundle) {
			const content = document.getText();
			// Encrypt file and cache it for later replacing
			const password = await getPasswordFromUser(true);
			if (password) {
				try {
					const encryptedContent = await encrypt(content, password);
					bundle.encryptedContent = encryptedContent;
					// Close virtual editor
					await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
					// Open original file
					const doc = await vscode.workspace.openTextDocument(bundle.originalUri);
					await vscode.window.showTextDocument(doc);
				}
				catch (error) {
					vscode.window.showErrorMessage(`Encryption failed, ${error}`);
				}
			}
			else {
				vscode.window.showErrorMessage("Password is not correct or confirming is failed.");
			}
		}
	}
}


function createVirtualPath(document: vscode.TextDocument) {
	const fileName = path.basename(document.fileName);
	// To indicate this file is virtual and not on disk
	return document.uri.path.replace(fileName, alwaysSecureFilePrefix + fileName);
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
