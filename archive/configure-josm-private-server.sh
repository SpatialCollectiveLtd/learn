#!/bin/bash
# ============================================
# JOSM Configuration Script for Private OSM Server
# Spatial Collective - DPW 2025
# Updated: January 2025 - Private Server Migration
# ============================================

echo ""
echo "================================================"
echo " JOSM Configuration for Private OSM Server"
echo " Spatial Collective - DPW 2025"
echo "================================================"
echo ""
echo "This script will configure your JOSM settings to:"
echo " - Connect to osm.spatialcollective.co.ke"
echo " - Enable OAuth2 authentication"
echo " - Set up chunked uploads (500 objects)"
echo " - Add #DPW2025 hashtag"
echo " - Configure optimal upload settings"
echo ""
echo "IMPORTANT: You will need to complete OAuth authorization"
echo "manually in your browser after running this script."
echo ""
read -p "Press Enter to continue..."

# ============================================
# 1. FIND JOSM PREFERENCES FILE
# ============================================

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PREFS_FILE="$HOME/Library/JOSM/preferences.xml"
else
    # Linux
    PREFS_FILE="$HOME/.config/JOSM/preferences.xml"
fi

if [ ! -f "$PREFS_FILE" ]; then
    echo ""
    echo "ERROR: JOSM preferences file not found at:"
    echo "$PREFS_FILE"
    echo ""
    echo "Please run JOSM at least once before using this script."
    echo ""
    exit 1
fi

echo ""
echo "[FOUND] JOSM preferences: $PREFS_FILE"

# ============================================
# 2. BACKUP EXISTING PREFERENCES
# ============================================

BACKUP_FILE="${PREFS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$PREFS_FILE" "$BACKUP_FILE"

echo "[BACKUP] Created backup: $BACKUP_FILE"

# ============================================
# 3. UPDATE PREFERENCES USING XML MANIPULATION
# ============================================

echo ""
echo "[UPDATING] Configuring JOSM for private OSM server..."

# Create a temporary file with our updates
TEMP_UPDATE="/tmp/josm_update_$$"

cat > "$TEMP_UPDATE" << 'EOF'
  <!-- OSM Server Configuration -->
  <tag key='osm-server.url' value='https://osm.spatialcollective.co.ke'/>
  <tag key='osm-server.api-url' value='https://osm.spatialcollective.co.ke/api/0.6'/>

  <!-- OAuth2 Configuration -->
  <tag key='oauth.settings.osm-server.oauth-authorize-url' value='https://osm.spatialcollective.co.ke/oauth2/authorize'/>
  <tag key='oauth.settings.osm-server.oauth-access-token-url' value='https://osm.spatialcollective.co.ke/oauth2/token'/>
  <tag key='oauth.settings.use-oauth2' value='true'/>

  <!-- Chunked Upload Settings -->
  <tag key='osm.upload.chunked' value='true'/>
  <tag key='osm.upload.chunk-size' value='500'/>

  <!-- User Agent -->
  <tag key='expert.http.user-agent' value='JOSM-DPW2025/Spatial-Collective (contact@spatialcollective.co.ke)'/>

  <!-- Auto-close changeset (200 buildings limit) -->
  <tag key='osm.changeset.close-automatically' value='true'/>
  <tag key='osm.changeset.max-size' value='200'/>

  <!-- Default Changeset Hashtag -->
  <tag key='upload.comment.last' value='#DPW2025'/>
  <tag key='upload.source.last' value='Survey, fieldwork, local knowledge'/>

EOF

# Remove existing </preferences> tag and append our settings
sed '/<\/preferences>/d' "$PREFS_FILE" > "${PREFS_FILE}.tmp"
cat "$TEMP_UPDATE" >> "${PREFS_FILE}.tmp"
echo "</preferences>" >> "${PREFS_FILE}.tmp"

# Replace original file
mv "${PREFS_FILE}.tmp" "$PREFS_FILE"

# Clean up
rm "$TEMP_UPDATE"

# ============================================
# 4. SUCCESS MESSAGE & NEXT STEPS
# ============================================

echo ""
echo "================================================"
echo " JOSM CONFIGURATION COMPLETED SUCCESSFULLY!"
echo "================================================"
echo ""
echo "Settings Updated:"
echo " [✓] OSM Server: osm.spatialcollective.co.ke"
echo " [✓] Chunked uploads: Enabled (500 objects)"
echo " [✓] Auto-close changeset: 200 buildings"
echo " [✓] Default hashtag: #DPW2025"
echo " [✓] User-Agent: JOSM-DPW2025/Spatial-Collective"
echo ""
echo "IMPORTANT - NEXT STEPS:"
echo ""
echo "1. RESTART JOSM for settings to take effect"
echo ""
echo "2. COMPLETE OAuth2 AUTHORIZATION:"
echo "   - Open JOSM"
echo "   - Click \"Edit\" > \"Preferences\""
echo "   - Go to \"Connection Settings\" tab"
echo "   - Click \"OAuth 2\" tab"
echo "   - Click \"Authorize now\""
echo "   - A browser will open - LOGIN to osm.spatialcollective.co.ke"
echo "   - Grant JOSM access to your account"
echo "   - Return to JOSM - you should see \"Authorized\""
echo ""
echo "3. TEST YOUR CONFIGURATION:"
echo "   - Download a small area"
echo "   - Add or edit 1-2 buildings"
echo "   - Upload (should work without 429 errors)"
echo "   - Verify hashtag #DPW2025 appears automatically"
echo ""
echo "If you encounter issues:"
echo " - Check that you authorized OAuth correctly"
echo " - Verify you can login to osm.spatialcollective.co.ke"
echo " - Contact your trainer for support"
echo ""
echo "Backup saved: $BACKUP_FILE"
echo ""
