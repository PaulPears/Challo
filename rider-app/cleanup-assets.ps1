# ====================================
# Ride Andhra - Assets Cleanup Script
# ====================================
# This script removes unnecessary files from the assets folder
# Run this to reduce app size by ~90 MB

Write-Host "🧹 Starting Asset Cleanup..." -ForegroundColor Cyan
Write-Host ""

$assetsPath = "d:\RideAndhraBhairava\frontend\assets"
$removed = 0
$savedSize = 0

# Function to remove file and track size
function Remove-AssetFile {
    param($fileName)
    
    $filePath = Join-Path $assetsPath $fileName
    
    if (Test-Path $filePath) {
        $fileSize = (Get-Item $filePath).Length / 1MB
        Remove-Item $filePath -Force
        $script:removed++
        $script:savedSize += $fileSize
        Write-Host "✅ Removed: $fileName ($(([math]::Round($fileSize, 2))) MB)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $fileName" -ForegroundColor Yellow
    }
}

Write-Host "🚨 CRITICAL: Removing APK file from assets..." -ForegroundColor Red
Remove-AssetFile "application-884cba3f-caff-4097-a29e-b78efe0ef8a3.apk"

Write-Host ""
Write-Host "📄 Removing PDFs..." -ForegroundColor Cyan
Remove-AssetFile "51208367-swarna-akarshana-bhairava-mantra.pdf"
Remove-AssetFile "UDYAM_CERTIFICATE_RIDE_ANDHRA.pdf"

Write-Host ""
Write-Host "🖼️  Removing unused images..." -ForegroundColor Cyan
Remove-AssetFile "47caf202-f544-4e11-82b5-9b418beae048.png"
Remove-AssetFile "6f8dd58f0a97f15ade54b2964b006d77.jpg"
Remove-AssetFile "88ce9b71-e6da-4b3b-8781-09767d5b0faa.png"
Remove-AssetFile "544c853c-79bd-4b4b-9880-ce8f640a6e46.jfif"
Remove-AssetFile "8b2e18ad-5ddb-4ca1-b340-405cc1080e67.jfif"
Remove-AssetFile "a3bf2150-d8fd-4cd2-9eba-d76787191928.jfif"
Remove-AssetFile "b32f53be-68cc-4067-be14-4f2c7c540031.png"
Remove-AssetFile "ad479dab-b04a-4a9a-a430-fe95ee98c5ed.png"
Remove-AssetFile "Andhra Pradesh Rider's Journey.png"

Write-Host ""
Write-Host "🔄 Removing duplicates..." -ForegroundColor Cyan
Remove-AssetFile "namelogorideandhra.png"
Remove-AssetFile "namelogorideandhra-removebg-preview.png"
Remove-AssetFile "namelogorideandhra-removebg-preview (1).png"
Remove-AssetFile "Ride (1).png"
Remove-AssetFile "Ride-removebg-preview.png"
Remove-AssetFile "adaptive-icon-removebg-preview.png"

Write-Host ""
Write-Host "📦 Removing archives..." -ForegroundColor Cyan
Remove-AssetFile "icons8-search-color.zip"
Remove-AssetFile "icons8-search-office-m.zip"

Write-Host ""
Write-Host "🎨 Removing SVG and large animations..." -ForegroundColor Cyan
Remove-AssetFile "rideandhralogo.svg"
Remove-AssetFile "Notification-[remix].gif"
Remove-AssetFile "Notification-[remix].json"

Write-Host ""
Write-Host "═══════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════" -ForegroundColor Green
Write-Host "Files removed: $removed" -ForegroundColor White
Write-Host "Space saved: $([math]::Round($savedSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Compress remaining images (icon.png, splash-icon.png, adaptive-icon.png)" -ForegroundColor White
Write-Host "2. Run: npm uninstall native-base nativewind tailwindcss" -ForegroundColor White
Write-Host "3. Build new version: eas build --platform android --profile production" -ForegroundColor White
Write-Host ""
