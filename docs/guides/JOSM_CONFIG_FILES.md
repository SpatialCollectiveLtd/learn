# JOSM Configuration Files - Pre-configured for DPW2025

**For Technical Team: Deploy these configurations to all mapper computers**

---

## Option 1: JOSM Preferences XML (Recommended)

Create/edit: `%APPDATA%\JOSM\preferences.xml` (Windows) or `~/.config/JOSM/preferences.xml` (Linux/Mac)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://josm.openstreetmap.de/preferences-1.0" version="19421">
  
  <!-- OAuth Configuration (mappers must still authorize individually) -->
  <tag key="oauth.access-token.key" value=""/>
  <tag key="oauth.access-token.secret" value=""/>
  <tag key="osm-server.auth-method" value="oauth"/>
  
  <!-- Custom User-Agent -->
  <tag key="http.agent" value="JOSM/1.5 (DPW2025 Nairobi Mapping; contact@spatialcollective.co.ke)"/>
  
  <!-- Upload Settings - Prevent Rate Limiting -->
  <tag key="osm-server.upload-strategy" value="chunked"/>
  <tag key="osm-server.upload-chunk-size" value="500"/>
  <tag key="osm-server.close-changeset" value="true"/>
  <tag key="osm-server.max-changeset-size" value="200"/>
  
  <!-- Connection Settings -->
  <tag key="socket.timeout.connect" value="30"/>
  <tag key="socket.timeout.read" value="30"/>
  
  <!-- Default Changeset Tags -->
  <tag key="upload.comment.history" value="DPW2025: [Settlement] - HOTOSM Task #[number] - Partial&#xa;Source: Bing Aerial Imagery&#xa;Info: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements"/>
  <tag key="upload.source.history" value="Bing Aerial Imagery;Maxar Premium Imagery via HOTOSM"/>
  
  <!-- Default Hashtag -->
  <list key="upload.hashtags">
    <entry value="#DPW2025"/>
  </list>
  
  <!-- Imagery Settings -->
  <list key="imagery.layers.sites">
    <entry value="https://osmlab.github.io/editor-layer-index/imagery.geojson"/>
  </list>
  
  <!-- Performance Settings -->
  <tag key="mappaint.use-real-width" value="false"/>
  <tag key="draw.segment.direction" value="true"/>
  
  <!-- Validation Settings -->
  <tag key="validator.beforeupload" value="true"/>
  
</preferences>
```

---

## Option 2: JOSM Command Line Setup

Run this command to configure JOSM programmatically:

```bash
# Windows PowerShell
josm --set=osm-server.auth-method=oauth `
     --set=http.agent="JOSM/1.5 (DPW2025 Nairobi; contact@spatialcollective.co.ke)" `
     --set=osm-server.upload-chunk-size=500 `
     --set=osm-server.upload-strategy=chunked `
     --set=osm-server.close-changeset=true
```

```bash
# Linux/Mac
josm --set=osm-server.auth-method=oauth \
     --set=http.agent="JOSM/1.5 (DPW2025 Nairobi; contact@spatialcollective.co.ke)" \
     --set=osm-server.upload-chunk-size=500 \
     --set=osm-server.upload-strategy=chunked \
     --set=osm-server.close-changeset=true
```

---

## Option 3: Batch Script for Windows Deployment

Save as: `configure-josm-dpw2025.bat`

```batch
@echo off
echo Configuring JOSM for DPW2025...

set JOSM_PREFS=%APPDATA%\JOSM\preferences.xml

if not exist "%APPDATA%\JOSM" mkdir "%APPDATA%\JOSM"

echo ^<?xml version="1.0" encoding="UTF-8"?^> > "%JOSM_PREFS%"
echo ^<preferences xmlns="http://josm.openstreetmap.de/preferences-1.0" version="19421"^> >> "%JOSM_PREFS%"
echo   ^<tag key="osm-server.auth-method" value="oauth"/^> >> "%JOSM_PREFS%"
echo   ^<tag key="http.agent" value="JOSM/1.5 (DPW2025 Nairobi; contact@spatialcollective.co.ke)"/^> >> "%JOSM_PREFS%"
echo   ^<tag key="osm-server.upload-strategy" value="chunked"/^> >> "%JOSM_PREFS%"
echo   ^<tag key="osm-server.upload-chunk-size" value="500"/^> >> "%JOSM_PREFS%"
echo   ^<tag key="osm-server.close-changeset" value="true"/^> >> "%JOSM_PREFS%"
echo   ^<tag key="osm-server.max-changeset-size" value="200"/^> >> "%JOSM_PREFS%"
echo   ^<list key="upload.hashtags"^> >> "%JOSM_PREFS%"
echo     ^<entry value="#DPW2025"/^> >> "%JOSM_PREFS%"
echo   ^</list^> >> "%JOSM_PREFS%"
echo ^</preferences^> >> "%JOSM_PREFS%"

echo.
echo ✅ JOSM configured successfully!
echo.
echo IMPORTANT: Mappers must still:
echo 1. Open JOSM and press F12
echo 2. Go to Connection Settings
echo 3. Click "Authorize now" to enable OAuth
echo 4. Login to OpenStreetMap in browser
echo.
pause
```

---

## Option 4: Shell Script for Linux/Mac Deployment

Save as: `configure-josm-dpw2025.sh`

```bash
#!/bin/bash

echo "Configuring JOSM for DPW2025..."

JOSM_CONFIG_DIR="$HOME/.config/JOSM"
JOSM_PREFS="$JOSM_CONFIG_DIR/preferences.xml"

# Create config directory if it doesn't exist
mkdir -p "$JOSM_CONFIG_DIR"

# Write preferences
cat > "$JOSM_PREFS" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<preferences xmlns="http://josm.openstreetmap.de/preferences-1.0" version="19421">
  <tag key="osm-server.auth-method" value="oauth"/>
  <tag key="http.agent" value="JOSM/1.5 (DPW2025 Nairobi; contact@spatialcollective.co.ke)"/>
  <tag key="osm-server.upload-strategy" value="chunked"/>
  <tag key="osm-server.upload-chunk-size" value="500"/>
  <tag key="osm-server.close-changeset" value="true"/>
  <tag key="osm-server.max-changeset-size" value="200"/>
  <list key="upload.hashtags">
    <entry value="#DPW2025"/>
  </list>
</preferences>
EOF

echo ""
echo "✅ JOSM configured successfully!"
echo ""
echo "IMPORTANT: Mappers must still:"
echo "1. Open JOSM and press F12"
echo "2. Go to Connection Settings"
echo "3. Click 'Authorize now' to enable OAuth"
echo "4. Login to OpenStreetMap in browser"
echo ""
```

Make executable:
```bash
chmod +x configure-josm-dpw2025.sh
./configure-josm-dpw2025.sh
```

---

## Deployment Instructions

### For Computer Labs:

1. **Run configuration script** on each computer BEFORE training
2. **Verify configuration** by opening JOSM and checking preferences
3. **Train mappers** on OAuth authorization (they must do this individually)
4. **Test upload** with 1 mapper before allowing all to upload

### For Individual Mappers:

1. Send them the configuration file via WhatsApp/email
2. Instruct them to:
   - Close JOSM
   - Run the script (Windows: double-click .bat, Linux/Mac: run .sh)
   - Reopen JOSM
   - Complete OAuth authorization (F12 → Connection → Authorize now)

---

## Verification Checklist

After deployment, verify on each computer:

- [ ] JOSM preferences file exists
- [ ] `osm-server.auth-method` is set to `oauth`
- [ ] `http.agent` contains "DPW2025"
- [ ] `osm-server.upload-chunk-size` is set to `500`
- [ ] Mapper has completed OAuth authorization
- [ ] Test upload succeeds without 429 error

---

## Troubleshooting

**Script doesn't work:**
- Check file permissions
- Run as administrator (Windows) or with sudo (Linux/Mac)
- Manually edit preferences.xml using text editor

**OAuth not working:**
- Mappers MUST authorize individually
- Cannot share OAuth tokens between mappers
- Each mapper needs their own OSM account

**Still getting 429 errors:**
- Check if multiple mappers uploading simultaneously
- Implement upload schedule (see main guide)
- Verify chunk size is actually 500 (check preferences)

---

**Maintained by**: Technical Team  
**Last Updated**: January 9, 2026
