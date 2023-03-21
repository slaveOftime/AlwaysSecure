module encryptsharp

open System
open System.Text
open System.Security.Cryptography

let private keySize = 32

let private makeAESKey (password: string) (salt: string) =
    use deriveBytes = new Rfc2898DeriveBytes(Encoding.UTF8.GetBytes password, Encoding.UTF8.GetBytes salt, 10_000, HashAlgorithmName.SHA256)
    deriveBytes.GetBytes(keySize)


let encryptFile (password: string) (content: string) =
    let aes = Aes.Create()
    let iv = aes.IV
    let ivBase64 = Convert.ToBase64String iv
    let key = makeAESKey password ivBase64
    aes.Key <- key
    ivBase64 + ":" + (aes.EncryptCbc(Encoding.UTF8.GetBytes content, iv, PaddingMode.PKCS7) |> Convert.ToBase64String)

         
let decryptFile (password: string) (encryptedContent: string) =   
    let splits = encryptedContent.Split(":")
    let content = splits[1]
    let ivBase64 = splits[0]
    let iv = Convert.FromBase64String ivBase64
    let key = makeAESKey password ivBase64
    let aes = Aes.Create()
    aes.Key <- key
    aes.DecryptCbc(Convert.FromBase64String content, iv, PaddingMode.PKCS7) |> Encoding.UTF8.GetString
