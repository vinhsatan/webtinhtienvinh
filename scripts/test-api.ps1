# PowerShell script to test API endpoints
# Usage: .\scripts\test-api.ps1

$ErrorActionPreference = "Stop"

$API_BASE = "http://localhost:5173"

Write-Host "Testing API Endpoints...`n" -ForegroundColor Yellow

# Test 1: Health check
Write-Host "1. Testing root endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$API_BASE/" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Root endpoint accessible (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Root endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 2: Register endpoint
Write-Host "`n2. Testing Register endpoint..." -ForegroundColor Cyan
try {
    $body = @{
        email = "test@example.com"
        password = "password123"
        name = "Test User"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$API_BASE/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "   ✅ Register endpoint works!" -ForegroundColor Green
        Write-Host "   User ID: $($data.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($data.user.email)" -ForegroundColor Gray
        $script:token = $data.token
        Write-Host "   Token received: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Register returned: $($data.error)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    if ($statusCode -eq 409) {
        Write-Host "   ⚠️  User already exists (this is OK)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Register failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($errorBody) {
            Write-Host "   Error: $($errorBody.error)" -ForegroundColor Red
        }
    }
}

# Test 3: Login endpoint
Write-Host "`n3. Testing Login endpoint..." -ForegroundColor Cyan
try {
    $body = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$API_BASE/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "   ✅ Login endpoint works!" -ForegroundColor Green
        Write-Host "   User: $($data.user.email)" -ForegroundColor Gray
        $script:token = $data.token
        Write-Host "   Token received: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Login failed: $($data.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorBody) {
        Write-Host "   Error: $($errorBody.error)" -ForegroundColor Red
    }
}

# Test 4: Protected route
if ($token) {
    Write-Host "`n4. Testing Protected Route..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "$API_BASE/api/protected" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $token"
            } `
            -ErrorAction Stop

        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "   ✅ Protected route works!" -ForegroundColor Green
        Write-Host "   Message: $($data.message)" -ForegroundColor Gray
        Write-Host "   User: $($data.user.email)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Protected route failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n4. Skipping Protected Route (no token)" -ForegroundColor Yellow
}

Write-Host "`n✅ API Testing Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Open test-auth.html in browser" -ForegroundColor White
Write-Host "  2. Test registration and login forms" -ForegroundColor White
Write-Host "  3. Test protected route with JWT token" -ForegroundColor White
