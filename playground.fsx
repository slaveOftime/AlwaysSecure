#r "./AlwaysSecure/bin/Debug/net6.0/AlwaysSecure.dll"

AlwaysSecure.aesEncrypt "123" "hi" |> AlwaysSecure.aesDecrypt "123"

AlwaysSecure.aesDecrypt "123" "WXwbcnZh90tBf1Ja+vO4AQ==:zi+YEiU1xhSVXNXwqqH8Kw=="
