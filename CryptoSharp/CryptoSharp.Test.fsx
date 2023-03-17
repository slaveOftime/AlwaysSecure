#r "./bin/Debug/net7.0/CryptoSharp.dll"

open System.IO

File.WriteAllText(Path.Combine(__SOURCE_DIRECTORY__, "demo.txt"), "hi")
encryptsharp.encryptFile "123" (Path.Combine(__SOURCE_DIRECTORY__, "demo.txt"))
encryptsharp.decryptFile "123" ".txt2" (Path.Combine(__SOURCE_DIRECTORY__, "demo.secret"))
File.ReadAllText(Path.Combine(__SOURCE_DIRECTORY__, "demo.txt2")) |> printfn "Expect hi, Actual: %s"

File.WriteAllText(Path.Combine(__SOURCE_DIRECTORY__, "demo2.secret"), "rfK324M4sSiZAKQe19cj2tZFbWAPbp90l7YYOlSo4/w=")
encryptsharp.decryptFile "123" ".json" (Path.Combine(__SOURCE_DIRECTORY__, "demo2.secret"))
