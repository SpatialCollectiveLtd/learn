Write-Host "Waiting for deployment and approving December work days..." -ForegroundColor Cyan
$url = "https://learn-brown-six.vercel.app/api/admin/approve-december-days"
$maxRetries = 10
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    try {
        Write-Host "`nAttempt $($retryCount + 1) of $maxRetries..." -ForegroundColor Gray
        $response = Invoke-RestMethod -Uri $url -Method Post -ErrorAction Stop
        Write-Host "`nSuccess! Approved: $($response.data.approvedCount) work days" -ForegroundColor Green
        Write-Host "`nSummary:" -ForegroundColor Cyan
        $response.data.summary | ForEach-Object { 
            Write-Host "  $($_.settlement): Total $($_.total_days) | Approved $($_.approved_days) | Pending $($_.pending_days)" 
        }
        Write-Host "`nAll December work days are now approved!" -ForegroundColor Green
        exit 0
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "Waiting 10 seconds before retry..." -ForegroundColor Gray
            Start-Sleep -Seconds 10
        }
    }
}
Write-Host "`nFailed after $maxRetries attempts. Please try again later." -ForegroundColor Red
