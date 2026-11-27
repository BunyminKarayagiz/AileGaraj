
$root = $PSScriptRoot

Write-Host "AileGaraj baslatiliyor..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\AileGaraj.Api'; dotnet run"
)

# Frontend
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$root\ailegaraj-client'; npm run dev"
)

Write-Host "Backend ve Frontend baslatildi!" -ForegroundColor Green
cd 