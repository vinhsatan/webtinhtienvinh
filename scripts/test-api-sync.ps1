# Test API Sync endpoints (customers, orders, wallets, categories, templates)
# Usage: .\scripts\test-api-sync.ps1
# Requires: Dev server running (npm run dev) and valid JWT token

$ErrorActionPreference = "Stop"
$API_BASE = "http://localhost:5173"

Write-Host "`n=== Test API Sync Endpoints ===" -ForegroundColor Yellow
Write-Host "Base URL: $API_BASE`n" -ForegroundColor Gray

# Get token from login
$token = $null
try {
    $loginBody = @{ email = "vinhsatan@gmail.com"; password = "@Vinhsatan666" } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "$API_BASE/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    if ($loginResp.success -and $loginResp.token) {
        $token = $loginResp.token
        Write-Host "✅ Login OK - Token received" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Login failed - using test token. Run with valid credentials." -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

if (-not $token) {
    Write-Host "`n❌ No token. Please login first or update email/password in this script." -ForegroundColor Red
    exit 1
}

$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

$endpoints = @(
    @{ Name = "customers"; Url = "/api/customers" },
    @{ Name = "orders"; Url = "/api/orders" },
    @{ Name = "wallets"; Url = "/api/wallets" },
    @{ Name = "categories"; Url = "/api/categories" },
    @{ Name = "templates"; Url = "/api/templates" }
)

foreach ($ep in $endpoints) {
    Write-Host "`nTesting $($ep.Name)..." -ForegroundColor Cyan
    try {
        $resp = Invoke-WebRequest -Uri "$API_BASE$($ep.Url)" -Method GET -Headers $headers -TimeoutSec 5 -ErrorAction Stop
        $content = $resp.Content
        if ($content.TrimStart().StartsWith("<")) {
            Write-Host "   ❌ FAIL - Server returned HTML instead of JSON" -ForegroundColor Red
        } else {
            $json = $content | ConvertFrom-Json
            if ($json.success) {
                $count = if ($json.data) { 
                    if ($json.data -is [array]) { $json.data.Count } 
                    else { "object" } 
                } else { 0 }
                Write-Host "   ✅ OK - JSON response (data: $count)" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  success=false: $($json.error)" -ForegroundColor Yellow
            }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   ❌ FAIL - HTTP $statusCode : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Yellow
