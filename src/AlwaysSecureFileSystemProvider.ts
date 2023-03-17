import * as vscode from 'vscode';

export class AlwaysSecureFileSystemProvider implements vscode.FileSystemProvider {
	onDidChangeEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	onDidChangeFile = this.onDidChangeEmitter.event;

	watch(uri: vscode.Uri, options: { readonly recursive: boolean; readonly excludes: readonly string[]; }): vscode.Disposable {
		return {
			dispose: () => {}
		};
	}
	stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
		return {
			type: vscode.FileType.File,
			ctime: Date.now(),
			mtime: Date.now(),
			size: 0
		};
	}
	readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
		throw new Error('Method not implemented.');
	}
	createDirectory(uri: vscode.Uri): void | Thenable<void> {
		throw new Error('Method not implemented.');
	}
	readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
		return this.documents.get(uri.toString()) ?? Uint8Array.from([]);
	}
	writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): void | Thenable<void> {
		this.documents.set(uri.toString(), content);
	}
	delete(uri: vscode.Uri, options: {
		readonly recursive: boolean // Import the module and reference it with the alias vscode in your code below
	}): void | Thenable<void> {
		this.documents.delete(uri.toString());
	}
	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
		const doc = this.documents.get(oldUri.toJSON()) ?? Uint8Array.from([]);
		this.documents.set(newUri.toString(), doc);
		this.documents.delete(oldUri.toString());
	}
	copy?(source: vscode.Uri, destination: vscode.Uri, options: {
		// Import the module and reference it with the alias vscode in your code below
		readonly overwrite: boolean;
	}): void | Thenable<void> {
		throw new Error('Method not implemented.');
	}

	documents = new Map<string, Uint8Array>();

	update(uri: vscode.Uri, document: Uint8Array) {
		this.documents.set(uri.toString(), document);
		this.onDidChangeEmitter.fire([{
			uri: uri,
			type: vscode.FileChangeType.Changed
		}]);
	}
}