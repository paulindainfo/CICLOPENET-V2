param([string]$SdkPath = (Join-Path $PSScriptRoot '..\artifacts\android-tools'))
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path $PSScriptRoot -Parent
$sdkDirectory = (Resolve-Path -LiteralPath $SdkPath).Path
$toolsDirectory = Join-Path $sdkDirectory 'android-16'
$androidJar = Join-Path $sdkDirectory 'android-36\android.jar'
$javaDirectory = Split-Path (Get-Command java).Source -Parent
$buildDirectory = Join-Path $projectPath 'android\build'
$classesDirectory = Join-Path $buildDirectory 'classes'
$dexDirectory = Join-Path $buildDirectory 'dex'
New-Item -ItemType Directory -Force $classesDirectory,$dexDirectory | Out-Null
function Run-Tool([string]$Tool, [string[]]$Arguments) {
  & $Tool @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Falha na ferramenta: $Tool" }
}
Run-Tool (Join-Path $toolsDirectory 'aapt2.exe') @('compile','--dir',(Join-Path $projectPath 'android\res'),'-o',(Join-Path $buildDirectory 'resources.zip'))
Run-Tool (Join-Path $toolsDirectory 'aapt2.exe') @('link','-o',(Join-Path $buildDirectory 'unsigned.apk'),'--manifest',(Join-Path $projectPath 'android\AndroidManifest.xml'),'-I',$androidJar,'--java',$buildDirectory,(Join-Path $buildDirectory 'resources.zip'))
$javaSources = @(Get-ChildItem (Join-Path $projectPath 'android\src') -Filter '*.java' -Recurse | ForEach-Object FullName) + @(Get-ChildItem $buildDirectory -Filter 'R.java' -Recurse | ForEach-Object FullName)
Run-Tool (Join-Path $javaDirectory 'javac.exe') (@('-encoding','UTF-8','-source','8','-target','8','-bootclasspath',"$androidJar;$(Join-Path $toolsDirectory 'core-lambda-stubs.jar')",'-d',$classesDirectory) + $javaSources)
Run-Tool (Join-Path $javaDirectory 'jar.exe') @("-J-Djava.io.tmpdir=$buildDirectory",'cf',(Join-Path $buildDirectory 'classes.jar'),'-C',$classesDirectory,'.')
Run-Tool (Join-Path $javaDirectory 'java.exe') @('-cp',(Join-Path $toolsDirectory 'lib\d8.jar'),'com.android.tools.r8.D8','--lib',$androidJar,'--min-api','26','--output',$dexDirectory,(Join-Path $buildDirectory 'classes.jar'))
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open((Join-Path $buildDirectory 'unsigned.apk'),[System.IO.Compression.ZipArchiveMode]::Update)
try { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $dexDirectory 'classes.dex'),'classes.dex') | Out-Null } finally { $archive.Dispose() }
Run-Tool (Join-Path $toolsDirectory 'zipalign.exe') @('-f','-p','4',(Join-Path $buildDirectory 'unsigned.apk'),(Join-Path $buildDirectory 'aligned.apk'))
$signingPath = Join-Path $projectPath 'ANDROID-ASSINATURA.private.json'
$keyPath = Join-Path $projectPath 'CICLOPE-NET.private.jks'
if (!(Test-Path -LiteralPath $signingPath)) {
  if (Test-Path -LiteralPath $keyPath) { throw 'A chave existe, mas os dados de assinatura estão ausentes. Preserve a chave original.' }
  $randomBytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
  $signingJson = @{alias='ciclope';password=[Convert]::ToBase64String($randomBytes);keystore='CICLOPE-NET.private.jks';orientacao='Guarde este arquivo e o keystore para assinar atualizações. Não publique.'} | ConvertTo-Json
  [System.IO.File]::WriteAllText($signingPath,$signingJson,[System.Text.UTF8Encoding]::new($false))
}
$signing = Get-Content -Raw -LiteralPath $signingPath | ConvertFrom-Json
$passwordFile = Join-Path $projectPath 'artifacts\android-tools\signing-password.private.txt'
[System.IO.File]::WriteAllText($passwordFile,$signing.password,[System.Text.UTF8Encoding]::new($false))
try {
  if (!(Test-Path -LiteralPath $keyPath)) {
    Run-Tool (Join-Path $javaDirectory 'keytool.exe') @('-genkeypair','-keystore',$keyPath,'-alias',$signing.alias,'-keyalg','RSA','-keysize','3072','-validity','10000','-storepass:file',$passwordFile,'-keypass:file',$passwordFile,'-dname','CN=CICLOPE NET, OU=Android, O=CICLOPE NET, C=BR','-noprompt')
  }
  $apkPath = Join-Path $projectPath 'CICLOPE-NET.apk'
  Run-Tool (Join-Path $javaDirectory 'java.exe') @('-jar',(Join-Path $toolsDirectory 'lib\apksigner.jar'),'sign','--ks',$keyPath,'--ks-key-alias',$signing.alias,'--ks-pass',"file:$passwordFile",'--out',$apkPath,(Join-Path $buildDirectory 'aligned.apk'))
  Run-Tool (Join-Path $javaDirectory 'java.exe') @('-jar',(Join-Path $toolsDirectory 'lib\apksigner.jar'),'verify','--verbose',$apkPath)
  Run-Tool (Join-Path $toolsDirectory 'aapt.exe') @('dump','badging',$apkPath)
  Get-FileHash -Algorithm SHA256 -LiteralPath $apkPath | Select-Object Hash,Path
} finally { Remove-Item -LiteralPath $passwordFile -ErrorAction SilentlyContinue }
