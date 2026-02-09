# Chạy 2 lệnh sau mỗi lần sửa code
# 1. npm run typecheck
# 2. npm run dev

$ErrorActionPreference = "Stop"
# PSScriptRoot = apps\web\scripts -> parent = apps\web (chứa package.json)
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== 1. Running typecheck ===" -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "Typecheck failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 2. Starting dev server ===" -ForegroundColor Cyan
npm run dev
