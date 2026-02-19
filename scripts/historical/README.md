# Historical Scripts

**Last Updated:** February 19, 2026

## ⚠️ Important Notice

**These scripts are archived and should NOT be run again.** They were created for one-time migrations, specific bug fixes, or data operations that have already been completed. They are preserved here for historical reference and to understand past system changes.

---

## 📚 Contents

### Microtasking Migration (February 2026)
One-time scripts from the microtasking module implementation and youth allocation:

- `backup-before-microtasking-update.js` - Pre-migration backup
- `batch-move-microtasking.js` - Batch move youth to microtasking
- `complete-microtasking-transition.js` - Finalize microtasking transition
- `final-microtasking-status.js` - Final status check
- `update-microtasking-users.js` - Update microtasking user records
- `check-microtasking-users.js` - Verify microtasking users

### User-Specific Fixes
Scripts created to fix issues for specific participants:

- `move-paul-final.js` - Move Paul to microtasking (final version)
- `move-paul-to-microtasking-fixed.js` - Paul migration with fixes
- `move-paul-to-microtasking.js` - Initial Paul migration
- `check-regina.js` - Check Regina's records
- `test-regina-fix.js` - Test Regina fix
- `full-check-kay2333oo.js` - Full check for KAY2333OO user

### Data Restoration & Audit
Scripts for restoring historical data and fixing audit issues:

- `restore-historical-audit-data.js` - Restore historical audit records
- `emergency-audit-restore.js` - Emergency audit data restoration
- `execute-confirmed-restoration.js` - Execute confirmed restoration
- `verify-audit-restoration.js` - Verify restoration success
- `complete-restoration.js` - Complete restoration process
- `debug-restore.js` - Debug restoration issues
- `simple-restore.js` - Simple restoration approach
- `check-historical-data-loss.js` - Check for data loss

### Weekend Error Cleanup
Scripts to identify and fix weekend-related errors:

- `scan-weekend-errors.js` - Scan for weekend errors
- `remove-weekend-errors.js` - Remove weekend error records
- `investigate-sunday-records.js` - Investigate Sunday records

### Database Structure
Scripts that checked or modified database structure:

- `check-table-structure.js` - Check table structure
- `check-microtasking-users.js` - Verify microtasking user setup

---

## 🔍 Why These Are Archived

1. **One-Time Operations:** Most of these scripts performed migrations or data fixes that only needed to run once
2. **Completed Tasks:** The issues they addressed have been resolved
3. **Historical Context:** Running them again could cause data inconsistencies or errors
4. **Reference Purpose:** Kept for understanding system evolution and past decisions

---

## 📖 Learning from Historical Scripts

These scripts can be valuable for:
- Understanding how migrations were handled
- Learning the codebase patterns
- Reference for future similar operations
- Debugging similar issues

---

## ⚡ If You Need Similar Functionality

Instead of running these scripts:
1. Review the script to understand the approach
2. Check current database state with `scripts/utilities/` scripts
3. Create a new script in the appropriate directory
4. Test thoroughly before running on production data
5. Always backup data first: `node scripts/utilities/backup-youth-data.js`

---

## 🔗 Related Documentation

- **Active Scripts:** [../README.md](../README.md)
- **Archive Scripts:** [../../archive/README.md](../../archive/README.md)
- **Platform Documentation:** [../../docs/PLATFORM_DOCUMENTATION.md](../../docs/PLATFORM_DOCUMENTATION.md)

---

*These scripts are preserved for historical reference only. Do not execute without explicit approval and after thorough review.*
