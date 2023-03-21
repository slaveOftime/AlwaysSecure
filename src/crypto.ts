import * as crypto from 'crypto-js';


const keySize = 32;

const cipherOption = {
	mode: crypto.mode.CBC,
	padding: crypto.pad.Pkcs7
};


function makeAESKey(password: string, salt: string) {
	return crypto.PBKDF2(password, salt, {
		keySize: keySize / 4,
		iterations: 10000,
		hasher: crypto.algo.SHA256
	});
}

export async function encrypt(contents: string, password: string) {
	const iv = crypto.lib.WordArray.random(16);
	const ivBase64 = iv.toString(crypto.enc.Base64);
	const key = makeAESKey(password, ivBase64);
	return ivBase64 + ":" + crypto.AES.encrypt(contents, key, { ...cipherOption, iv }).toString();
}

export async function decrypt(encryptedContent: string, password: string) {
	const [ivBase64, content] = encryptedContent.split(":");
	const key = makeAESKey(password, ivBase64);
	const iv = crypto.enc.Base64.parse(ivBase64);
	return crypto.AES.decrypt(content, key, { ...cipherOption, iv }).toString(crypto.enc.Utf8);
}
