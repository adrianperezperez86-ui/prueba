$NodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
$InstallerPath = "$env:TEMP\node-installer.msi"

Write-Host "Descargando Node.js..."
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
(New-Object System.Net.WebClient).DownloadFile($NodeUrl, $InstallerPath)

Write-Host "Instalando Node.js..."
Start-Process -FilePath $InstallerPath -ArgumentList '/quiet' -Wait

Write-Host "Completado. Reinicia PowerShell para usar npm."
