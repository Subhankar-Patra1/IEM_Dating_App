<#
  Connects this PC to the phone over wireless ADB.

  Usage:
      .\scripts\connect-phone.ps1              # auto-detects the port
      .\scripts\connect-phone.ps1 -Port 41987  # or pass it yourself

  The wireless port changes every time Wireless debugging is toggled or the
  phone reboots, so this script asks the phone for its current port via mDNS
  instead of making you read it off the screen.

  Pairing is separate and permanent - if this says the phone is not paired,
  pair once with:  adb pair <ip>:<PAIRING-port>
#>

param(
    [string]$Port = "",
    [string]$PhoneIP = ""
)

# ---- edit these if your phone changes -------------------------------------
$DefaultPhoneIP = "192.168.3.186"
# ---------------------------------------------------------------------------

if (-not $PhoneIP) { $PhoneIP = $DefaultPhoneIP }

# Locate adb: PATH first, then the standard SDK location.
$adb = (Get-Command adb -ErrorAction SilentlyContinue).Source
if (-not $adb) { $adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe" }
if (-not (Test-Path $adb)) {
    Write-Host "adb not found. Install Android platform-tools." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Clearing stale connections..." -ForegroundColor DarkGray
& $adb disconnect | Out-Null

# Build the list of candidate endpoints to try.
$candidates = @()

if ($Port) {
    $candidates += "${PhoneIP}:${Port}"
}
else {
    Write-Host "Looking for the phone on the network..." -ForegroundColor DarkGray
    $services = & $adb mdns services 2>$null

    # mDNS keeps stale registrations alongside the live one, so gather every
    # advertised endpoint and try them all - newest entries listed last.
    $found = @()
    foreach ($line in $services) {
        if ($line -match "_adb-tls-connect\._tcp" -and $line -match "(\d+\.\d+\.\d+\.\d+):(\d+)") {
            $found += "$($Matches[1]):$($Matches[2])"
        }
    }

    # Prefer endpoints on the expected IP, then anything else. Reverse so the
    # most recently advertised port is tried first.
    $preferred = $found | Where-Object { $_ -like "${PhoneIP}:*" }
    $others    = $found | Where-Object { $_ -notlike "${PhoneIP}:*" }
    $candidates = @($preferred) + @($others)
    [array]::Reverse($candidates)
    $candidates = $candidates | Select-Object -Unique
}

if (-not $candidates -or $candidates.Count -eq 0) {
    Write-Host ""
    Write-Host "Could not find the phone." -ForegroundColor Red
    Write-Host "  - Phone and PC must be on the SAME Wi-Fi"
    Write-Host "  - Settings > Developer options > Wireless debugging must be ON"
    Write-Host "  - Then re-run, or pass the port from that screen:"
    Write-Host "      .\scripts\connect-phone.ps1 -Port <port>" -ForegroundColor Yellow
    exit 1
}

$connected = $null
foreach ($target in $candidates) {
    Write-Host "Trying $target ..." -ForegroundColor DarkGray
    & $adb connect $target 2>&1 | Out-Null
    Start-Sleep -Milliseconds 600

    $line = (& $adb devices) | Where-Object { $_ -match [regex]::Escape($target) } | Select-Object -First 1

    if ($line -match "device\s*$") { $connected = $target; break }
    if ($line -match "unauthorized") {
        Write-Host ""
        Write-Host "UNAUTHORIZED - accept the debugging prompt on your phone, then re-run." -ForegroundColor Yellow
        exit 1
    }
    # offline or refused: drop it so it does not linger in adb's device list
    & $adb disconnect $target 2>&1 | Out-Null
}

Write-Host ""
if ($connected) {
    Write-Host "CONNECTED  $connected" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run:  npx expo start --dev-client" -ForegroundColor Cyan
    exit 0
}

Write-Host "Could not connect. Tried:" -ForegroundColor Red
$candidates | ForEach-Object { Write-Host "  $_" }
Write-Host ""
Write-Host "Most likely causes:"
Write-Host "  1. Wireless debugging was toggled off - turn it ON and re-run."
Write-Host "  2. You passed the PAIRING port. The main Wireless debugging"
Write-Host "     screen shows a DIFFERENT port - that is the one to use."
Write-Host "  3. The phone is not paired with this PC yet. Pair once:"
Write-Host "       adb pair ${PhoneIP}:<PAIRING-port>" -ForegroundColor Yellow
Write-Host "  4. Phone and PC are on different networks."
exit 1
