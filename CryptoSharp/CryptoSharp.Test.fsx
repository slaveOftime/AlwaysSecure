#r "./bin/Debug/net7.0/CryptoSharp.dll"

encryptsharp.encryptFile "123" "hi"
|> encryptsharp.decryptFile "123"

encryptsharp.decryptFile "123" "WXwbcnZh90tBf1Ja+vO4AQ==:zi+YEiU1xhSVXNXwqqH8Kw=="
