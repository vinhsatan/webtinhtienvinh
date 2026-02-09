# PowerShell script to serve test-auth.html via HTTP server
# Usage: .\scripts\serve-test-page.ps1

Write-Host "🌐 Starting HTTP Server for test-auth.html...`n" -ForegroundColor Yellow

$port = 8080
$filePath = Join-Path $PSScriptRoot "..\test-auth.html"
$filePath = Resolve-Path $filePath

Write-Host "Serving: $filePath" -ForegroundColor Cyan
Write-Host "Port: $port" -ForegroundColor Cyan
Write-Host "`nOpen in browser: http://localhost:$port/test-auth.html" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

# Check if Python is available
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    Write-Host "Using Python HTTP server..." -ForegroundColor Gray
    Set-Location (Split-Path $filePath)
    python -m http.server $port
} else {
    # Use PowerShell simple HTTP server
    Write-Host "Using PowerShell HTTP server..." -ForegroundColor Gray
    
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    
    Write-Host "Server started at http://localhost:$port/" -ForegroundColor Green
    Write-Host "Open: http://localhost:$port/test-auth.html" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow
    
    try {
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = $request.Url.LocalPath
            if ($localPath -eq "/" -or $localPath -eq "/test-auth.html") {
                $localPath = "/test-auth.html"
            }
            
            $file = Join-Path (Split-Path $filePath) ($localPath.TrimStart('/'))
            
            if (Test-Path $file) {
                $content = [System.IO.File]::ReadAllBytes($file)
                $response.ContentType = "text/html"
                $response.ContentLength64 = $content.Length
                $response.StatusCode = 200
                $response.OutputStream.Write($content, 0, $content.Length)
            } else {
                $response.StatusCode = 404
                $notFound = [System.Text.Encoding]::UTF8.GetBytes("File not found")
                $response.ContentLength64 = $notFound.Length
                $response.OutputStream.Write($notFound, 0, $notFound.Length)
            }
            
            $response.Close()
        }
    } finally {
        $listener.Stop()
    }
}
