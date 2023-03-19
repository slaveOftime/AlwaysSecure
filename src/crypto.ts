import * as crypto from 'crypto-js';


const salt = "always secure";

const iv = crypto.enc.Utf8.parse('always secure iv');

const keySize = 32;

const cipherOption = {
	iv: iv,
	mode: crypto.mode.CBC,
	padding: crypto.pad.Pkcs7
};


function makeAESKey(password: string) {
	return crypto.PBKDF2(password, salt, {
		keySize: keySize / 4,
		iterations: 10000,
		hasher: crypto.algo.SHA256
	});
}

export async function encrypt(contents: string, password: string) {
	const key = makeAESKey(password);
	return crypto.AES.encrypt(contents, key, cipherOption).toString();
}

export async function decrypt(encryptedContent: string, password: string) {
	const key = makeAESKey(password);
	return crypto.AES.decrypt(encryptedContent, key, cipherOption).toString(crypto.enc.Utf8);
}
