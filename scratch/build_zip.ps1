Add-Type -AssemblyName System.IO.Compression.FileSystem

$projectDir = "C:\Users\ETicaret\Desktop\PEKEFE\webtasarim\pekefe-app"
$zipPath = "$projectDir\pekefe_cpanel_deploy.zip"
$stageDir = "$projectDir\cpanel_deploy_staging"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
New-Item -ItemType Directory -Path $stageDir | Out-Null

Write-Host "Copying standalone build files..."
robocopy "$projectDir\.next\standalone" "$stageDir\.next\standalone" /E /XF *.map /NJH /NJS /NDL /NC /NS
robocopy "$projectDir\.next\standalone" "$stageDir" /E /XF *.map /NJH /NJS /NDL /NC /NS

Write-Host "Copying static assets and public files..."
robocopy "$projectDir\.next\static" "$stageDir\.next\static" /E /XF *.map /NJH /NJS /NDL /NC /NS
robocopy "$projectDir\public" "$stageDir\public" /E /NJH /NJS /NDL /NC /NS
robocopy "$projectDir\prisma" "$stageDir\prisma" /E /NJH /NJS /NDL /NC /NS

Copy-Item "$projectDir\cpanel_server.js" "$stageDir\cpanel_server.js" -Force
Copy-Item "$projectDir\package.json" "$stageDir\package.json" -Force
Copy-Item "$projectDir\.env" "$stageDir\.env" -Force

Write-Host "Creating Zip archive..."
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($stageDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Remove-Item $stageDir -Recurse -Force

Get-Item $zipPath | Select-Object Name, @{n='Size (MB)';e={[math]::round($_.Length / 1MB, 2)}}
