module encryptsharp

open System
open System.IO
open System.Text
open System.Security.Cryptography


let private salt = "always secure"

let private iv = [ 456; 123; 15556; 12 ] |> Seq.map (BitConverter.GetBytes >> Seq.rev) |> Seq.concat |> Seq.toArray

let private makeAESKey (password: string) =
    use deriveBytes = new Rfc2898DeriveBytes(Encoding.UTF8.GetBytes password, Encoding.UTF8.GetBytes salt, 10_000, HashAlgorithmName.SHA256)
    deriveBytes.GetBytes(16)

let private createAES key =
    let aes = Aes.Create()
    aes.IV <- iv
    aes.Key <- key
    printfn "%A" iv
    printfn "%A" key
    aes


let encryptFile (password: string) (sourceFile: string) =
    let content = File.ReadAllText sourceFile |> Encoding.UTF8.GetBytes
    let key = makeAESKey password
    let aes = createAES key
    let encryptedContent = aes.EncryptCbc(content, iv, PaddingMode.PKCS7) |> Convert.ToBase64String
    let targetFile = sourceFile.Replace(Path.GetExtension sourceFile, ".secret")
    File.WriteAllText(targetFile, encryptedContent)

         
let decryptFile (password: string) (originalExtension: string) (sourceFile: string) =   
    let encryptedContent = File.ReadAllText(sourceFile) |> Convert.FromBase64String
    let key = makeAESKey password
    let aes = createAES key
    let content = aes.DecryptCbc(encryptedContent, iv, PaddingMode.PKCS7) |> Encoding.UTF8.GetString
    let targetFile = sourceFile.Replace(Path.GetExtension sourceFile, originalExtension)
    File.WriteAllText(targetFile, content)
