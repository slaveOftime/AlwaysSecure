import * as vscode from 'vscode';

type EncryptionBundle = { selection: vscode.Selection, originalUri: vscode.Uri, lastEditTime: number };

export class AlwaysSecureContext {
	// Cache virtual path (lower case) with original file's uri, selection, encryptedContent etc.
	private encryptionBundles = new Map<string, EncryptionBundle | undefined>();

    get entries() {
        return this.encryptionBundles.entries();
    }

	setBundle(path: string, bundle: EncryptionBundle | undefined) {
		this.encryptionBundles.set(path.toLowerCase(), bundle);
	}

	getBundle(path: string) {
		return this.encryptionBundles.get(path.toLowerCase());
	}
}