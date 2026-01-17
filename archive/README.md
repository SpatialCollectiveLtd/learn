# Archive Directory

**Last Updated:** January 17, 2026

## 📦 Contents

This directory contains historical files that are no longer actively used but preserved for reference.

### 📄 Documentation Archives

Historical investigation reports, bug fix summaries, and feature implementation records:
- Investigation reports (Brian Karani stats, database sync analysis)
- Emergency fix summaries
- Deployment status snapshots
- Training reports and allocation checklists

### 📊 Data Snapshots

Historical data exports and analysis:
- Module allocation JSON files
- Youth analysis by program type
- Digitization dropout reports
- Settlement and disability breakdowns
- OSM changeset XML data

### 🔧 One-Time Scripts

Migration, setup, and fix scripts that were run once:
- Database migration scripts
- User registration batches
- Schema updates
- Staff hierarchy setup
- Work day backfills

### 🐛 Debug & Analysis Scripts

Temporary scripts created for specific investigations:
- Stats verification scripts
- Date mismatch debugging
- OSM username validation
- User-specific checks

### ⚙️ Configuration Files

Old configuration and setup files:
- JOSM configuration scripts (`.bat`, `.sh`)
- OSM wiki page content
- Old credential lists

---

## ⚠️ Usage Warning

Files in this directory are **archived for reference only**. They may:
- Reference outdated database schemas
- Contain hardcoded values that are no longer valid
- Not work with current codebase
- Be superseded by newer implementations

**Do not run archived scripts in production without review and testing.**

---

## 🔍 Finding Information

If you need to reference old implementations:

1. **Check the filename** - Most files are descriptively named
2. **Review inline comments** - Many scripts have detailed comments
3. **Check git history** - Use `git log` to see when files were created/modified
4. **Consult documentation** - `/docs/` contains current information

---

## 🗑️ Cleanup Policy

Files may be moved from `/archive/` to permanent deletion if:
- They are more than 1 year old
- They contain no unique implementation logic
- They are fully documented elsewhere

Current retention: All files from 2025-2026 development period.

---

## 📋 Archive Organization

```
archive/
├── *.md           # Historical documentation
├── *.json         # Data snapshots and analysis
├── *.csv          # Export files
├── *.js           # One-time scripts
├── *.xml          # OSM changeset data
├── *.bat/.sh      # Configuration scripts
└── *.txt          # Log files and data dumps
```

---

*For current scripts and documentation, see `/scripts/` and `/docs/` directories.*
