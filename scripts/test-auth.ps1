# PowerShell script to test Authentication API
# Usage: .\scripts\test-auth.ps1

$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$email = "test@example.com"
$password = "password123"
$name = "Test User"

Write-Host "Testing Authentication API`n" -ForegroundColor Yellow

# Test 1: Register
Write-Host "1. Testing Register endpoint..." -ForegroundColor Cyan
try {
    $registerBody = @{
        email = $email
        password = $password
        name = $name
    } | ConvertTo-Json

    $registerResponse = Invoke-WebRequest `
        -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    $registerData = $registerResponse.Content | ConvertFrom-Json
    
    if ($registerData.success) {
        Write-Host "   ✅ Registration successful!" -ForegroundColor Green
        Write-Host "   User ID: $($registerData.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($registerData.user.email)" -ForegroundColor Gray
        $token = $registerData.token
        Write-Host "   Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Registration failed" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    if ($statusCode -eq 409) {
        Write-Host "   ⚠️  User already exists, trying login instead..." -ForegroundColor Yellow
        $token = $null
    } else {
        Write-Host "   ❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($errorBody) {
            Write-Host "   Error: $($errorBody.error)" -ForegroundColor Red
        }
        $token = $null
    }
}

Write-Host ""

# Test 2: Login (if registration failed or to test login)
if (-not $token) {
    Write-Host "2. Testing Login endpoint..." -ForegroundColor Cyan
    try {
        $loginBody = @{
            email = $email
            password = $password
        } | ConvertTo-Json

        $loginResponse = Invoke-WebRequest `
            -Uri "$baseUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginBody `
            -ErrorAction Stop

        $loginData = $loginResponse.Content | ConvertFrom-Json
        
        if ($loginData.success) {
            Write-Host "   ✅ Login successful!" -ForegroundColor Green
            Write-Host "   User ID: $($loginData.user.id)" -ForegroundColor Gray
            Write-Host "   Email: $($loginData.user.email)" -ForegroundColor Gray
            $token = $loginData.token
            Write-Host "   Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray
        } else {
            Write-Host "   ❌ Login failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorBody) {
            Write-Host "   Error: $($errorBody.error)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "2. Skipping Login (already have token from registration)" -ForegroundColor Gray
}

Write-Host ""

# Test 3: Protected Route
if ($token) {
    Write-Host "3. Testing Protected Route..." -ForegroundColor Cyan
    try {
        $protectedResponse = Invoke-WebRequest `
            -Uri "$baseUrl/api/protected" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $token"
            } `
            -ErrorAction Stop

        $protectedData = $protectedResponse.Content | ConvertFrom-Json
        
        Write-Host "   ✅ Protected route accessible!" -ForegroundColor Green
        Write-Host "   Message: $($protectedData.message)" -ForegroundColor Gray
        Write-Host "   User ID: $($protectedData.user.userId)" -ForegroundColor Gray
        Write-Host "   Email: $($protectedData.user.email)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Protected route failed: $($_.Exception.Message)" -ForegroundColor Red
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorBody) {
            Write-Host "   Error: $($errorBody.error)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "3. Skipping Protected Route (no token available)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Testing complete!" -ForegroundColor Green
