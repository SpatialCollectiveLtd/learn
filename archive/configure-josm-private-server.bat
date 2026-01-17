@echo off
REM ============================================
REM JOSM Configuration Script for Private OSM Server
REM Spatial Collective - DPW 2025
REM Updated: January 2025 - Private Server Migration
REM ============================================

echo.
echo ================================================
echo  JOSM Configuration for Private OSM Server
echo  Spatial Collective - DPW 2025
echo ================================================
echo.
echo This script will configure your JOSM settings to:
echo  - Connect to osm.spatialcollective.co.ke
echo  - Enable OAuth2 authentication
echo  - Set up chunked uploads (500 objects)
echo  - Add #DPW2025 hashtag
echo  - Configure optimal upload settings
echo.
echo IMPORTANT: You will need to complete OAuth authorization
echo manually in your browser after running this script.
echo.
pause

REM ============================================
REM 1. FIND JOSM PREFERENCES FILE
REM ============================================

set "PREFS_FILE=%APPDATA%\JOSM\preferences.xml"

if not exist "%PREFS_FILE%" (
    echo.
    echo ERROR: JOSM preferences file not found at:
    echo %PREFS_FILE%
    echo.
    echo Please run JOSM at least once before using this script.
    echo.
    pause
    exit /b 1
)

echo.
echo [FOUND] JOSM preferences: %PREFS_FILE%

REM ============================================
REM 2. BACKUP EXISTING PREFERENCES
REM ============================================

set "BACKUP_FILE=%APPDATA%\JOSM\preferences.backup.%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.xml"
set "BACKUP_FILE=%BACKUP_FILE: =0%"

copy "%PREFS_FILE%" "%BACKUP_FILE%" >nul

echo [BACKUP] Created backup: %BACKUP_FILE%

REM ============================================
REM 3. CREATE TEMPORARY XML UPDATE FILE
REM ============================================

set "TEMP_UPDATE=%TEMP%\josm_update.xml"

(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<preferences xmlns="http://josm.openstreetmap.de/preferences-1.0"^>
echo.
echo   ^<!-- OSM Server Configuration --^>
echo   ^<tag key='osm-server.url' value='https://osm.spatialcollective.co.ke'/^>
echo   ^<tag key='osm-server.api-url' value='https://osm.spatialcollective.co.ke/api/0.6'/^>
echo.
echo   ^<!-- OAuth2 Configuration --^>
echo   ^<tag key='oauth.settings.osm-server.oauth-authorize-url' value='https://osm.spatialcollective.co.ke/oauth2/authorize'/^>
echo   ^<tag key='oauth.settings.osm-server.oauth-access-token-url' value='https://osm.spatialcollective.co.ke/oauth2/token'/^>
echo   ^<tag key='oauth.settings.use-oauth2' value='true'/^>
echo.
echo   ^<!-- Chunked Upload Settings --^>
echo   ^<tag key='osm.upload.chunked' value='true'/^>
echo   ^<tag key='osm.upload.chunk-size' value='500'/^>
echo.
echo   ^<!-- User Agent --^>
echo   ^<tag key='expert.http.user-agent' value='JOSM-DPW2025/Spatial-Collective (contact@spatialcollective.co.ke^)'/^>
echo.
echo   ^<!-- Auto-close changeset (200 buildings limit^) --^>
echo   ^<tag key='osm.changeset.close-automatically' value='true'/^>
echo   ^<tag key='osm.changeset.max-size' value='200'/^>
echo.
echo   ^<!-- Default Changeset Hashtag --^>
echo   ^<tag key='upload.comment.last' value='#DPW2025'/^>
echo   ^<tag key='upload.source.last' value='Survey, fieldwork, local knowledge'/^>
echo.
echo ^</preferences^>
) > "%TEMP_UPDATE%"

echo [CREATED] Temporary configuration file

REM ============================================
REM 4. MERGE CONFIGURATIONS
REM ============================================

echo.
echo [UPDATING] Merging new settings into JOSM preferences...
echo.

REM Note: This is a simplified approach. For production, use XML parsing.
REM For now, we'll append the settings and let JOSM handle duplicates.

findstr /v "^</preferences^>" "%PREFS_FILE%" > "%TEMP%\josm_temp.xml"
type "%TEMP_UPDATE%" | findstr /v "^<?xml" | findstr /v "^<preferences" >> "%TEMP%\josm_temp.xml"
echo ^</preferences^> >> "%TEMP%\josm_temp.xml"

move /y "%TEMP%\josm_temp.xml" "%PREFS_FILE%" >nul

del "%TEMP_UPDATE%" >nul

REM ============================================
REM 5. SUCCESS MESSAGE & NEXT STEPS
REM ============================================

echo.
echo ================================================
echo  JOSM CONFIGURATION COMPLETED SUCCESSFULLY!
echo ================================================
echo.
echo Settings Updated:
echo  [x] OSM Server: osm.spatialcollective.co.ke
echo  [x] Chunked uploads: Enabled (500 objects)
echo  [x] Auto-close changeset: 200 buildings
echo  [x] Default hashtag: #DPW2025
echo  [x] User-Agent: JOSM-DPW2025/Spatial-Collective
echo.
echo IMPORTANT - NEXT STEPS:
echo.
echo 1. RESTART JOSM for settings to take effect
echo.
echo 2. COMPLETE OAuth2 AUTHORIZATION:
echo    - Open JOSM
echo    - Click "Edit" ^> "Preferences"
echo    - Go to "Connection Settings" tab
echo    - Click "OAuth 2" tab
echo    - Click "Authorize now"
echo    - A browser will open - LOGIN to osm.spatialcollective.co.ke
echo    - Grant JOSM access to your account
echo    - Return to JOSM - you should see "Authorized"
echo.
echo 3. TEST YOUR CONFIGURATION:
echo    - Download a small area
echo    - Add or edit 1-2 buildings
echo    - Upload (should work without 429 errors^)
echo    - Verify hashtag #DPW2025 appears automatically
echo.
echo If you encounter issues:
echo  - Check that you authorized OAuth correctly
echo  - Verify you can login to osm.spatialcollective.co.ke
echo  - Contact your trainer for support
echo.
echo Backup saved: %BACKUP_FILE%
echo.
pause
