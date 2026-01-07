Write-Host "Approving December 2025 Work Days..." -ForegroundColor Cyan
$url = "https://learn-brown-six.vercel.app/api/admin/approve-december-days"
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ErrorAction Stop
    Write-Host "Success! Approved: $($response.data.approvedCount) work days" -ForegroundColor Green
    $response.data.summary | ForEach-Object { Write-Host "$($_.settlement): Approved $($_.approved_days) days" }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
