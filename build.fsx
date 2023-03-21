#r "nuget: Fun.Build, 0.3.7"

open Fun.Build


let envCheckStage =
    stage "Check environment" {
        paralle
        run "dotnet --version"
        run "dotnet --list-sdks"
        run "dotnet tool restore"
        run "dotnet build"
        run (fun ctx -> printfn $"""GITHUB_ACTION: {ctx.GetEnvVar "GITHUB_ACTION"}""")
    }

let lintStage =
    stage "Lint" {
        stage "Format" {
            whenNot { envVar "GITHUB_ACTION" }
            run "dotnet fantomas . -r"
        }
        stage "Check" {
            whenEnvVar "GITHUB_ACTION"
            run "dotnet fantomas . -r --check"
        }
    }

let testStage = stage "Run unit tests" { run "dotnet test" }


pipeline "deploy" {
    description "Build and deploy to nuget"
    envCheckStage
    lintStage
    // testStage
    stage "Build packages" { run "dotnet pack -c Release AlwaysSecure/AlwaysSecure.fsproj -o ." }
    stage "Publish packages to nuget" {
        whenAll {
            branch "main"
            whenAny {
                envVar "NUGET_API_KEY"
                cmdArg "NUGET_API_KEY"
            }
        }
        run (fun ctx ->
            let key = ctx.GetCmdArgOrEnvVar "NUGET_API_KEY"
            ctx.RunSensitiveCommand $"""dotnet nuget push *.nupkg -s https://api.nuget.org/v3/index.json --skip-duplicate -k {key}"""
        )
    }
    runIfOnlySpecified
}

pipeline "test" {
    description "Format code and run tests"
    envCheckStage
    lintStage
    testStage
    runIfOnlySpecified
}


tryPrintPipelineCommandHelp ()
