$ErrorActionPreference = "Stop"

if ($args.Count -ne 1) {
  throw "Expected exactly one binary path from Tauri"
}

$certificatePath = Join-Path $env:RUNNER_TEMP "zybernetix-signing.pfx"
if (-not (Test-Path -LiteralPath $certificatePath)) {
  throw "Windows signing certificate was not decoded at $certificatePath"
}

$signtool = Get-Command signtool.exe -ErrorAction SilentlyContinue
if ($null -eq $signtool) {
  $searchRoots = @(
    (Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"),
    (Join-Path $env:ProgramFiles "Windows Kits\10\bin")
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  $signtool = $searchRoots |
    ForEach-Object { Get-ChildItem -LiteralPath $_ -Filter "signtool.exe" -Recurse -File -ErrorAction SilentlyContinue } |
    Sort-Object -Property FullName |
    Select-Object -Last 1
}

if ($null -eq $signtool) {
  throw "signtool.exe was not found on the GitHub-hosted Windows runner"
}

$signtoolPath = if ($signtool.PSObject.Properties.Name -contains "Source") {
  $signtool.Source
} else {
  $signtool.FullName
}

& $signtoolPath sign `
  /fd sha256 `
  /tr "http://timestamp.digicert.com" `
  /td sha256 `
  /f $certificatePath `
  /p $env:WINDOWS_CERT_PASSWORD `
  $args[0]

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
