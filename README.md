# always-secure

Make sure the encrypted content is always secure for edit.

## Features

- Select some text and search command **Always Secure: encrypt selected content**, then provide a password to encrypt it.
- Select the encrypted content and search command **Always Secure: decrypt selected content**, then provide password to decrypt it. 

    > Fo decryption, we will open an virtual file which will never be saved into disk to edit the content. When you click save it will ask for password again, and replace the selected content of the original file. Finally it will close the virtual file and open the original file automatically.

- If a virtual file is opened for 5 mins, then it will be closed automatically.

## Release Notes

### 0.0.1

- Init release
