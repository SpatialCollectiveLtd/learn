# 📌 Quick Reference: Delete Attendance Feature

## For Staff Users

### How to Delete an Attendance Record

1. **Navigate** to `/dashboard/staff/attendance`
2. **Select** the date and module
3. **Find** the wrong attendance record in the list
4. **Click** the red trash icon (🗑️) next to the record
5. **Confirm** the deletion when prompted
6. **Wait** for the success message
7. **Record** the correct attendance if needed

### When to Use Delete

✅ Wrong youth was recorded  
✅ Duplicate attendance entry  
✅ Attendance recorded on wrong date  
✅ Need to correct a mistake  

### What Happens When You Delete

- Record is permanently removed from database
- Attendance count decreases by 1
- List refreshes automatically
- Success message appears
- Deletion is logged for audit trail

---

## For Developers

### API Endpoint

```http
DELETE /api/staff/attendance?id={recordId}
Authorization: Bearer {staff_token}
```

### Response
```json
{
  "success": true,
  "message": "Attendance record for {name} on {date} has been deleted",
  "data": { "deleted_record": {...} }
}
```

### Key Files
- API: `src/app/api/staff/attendance/route.ts`
- UI: `src/app/dashboard/staff/attendance/page.tsx`
- Schema: `database/schema-neon-postgresql.sql`
- Migration: `database/migrations/add-attendance-table.sql`

### Testing
```bash
node scripts/test-attendance-delete.js
```

---

## Database

### Table Structure
```sql
attendance_records (
  id SERIAL PRIMARY KEY,
  youth_id VARCHAR(50) FK → youth_participants,
  attendance_date DATE,
  submitted_at TIMESTAMP,
  submitted_by VARCHAR(50) FK → staff_members,
  notes TEXT,
  UNIQUE(youth_id, attendance_date)
)
```

### Delete Query
```sql
DELETE FROM attendance_records WHERE id = $1;
```

---

## Security

✅ Requires staff authentication  
✅ Token verification on every request  
✅ Confirmation dialog prevents accidents  
✅ All deletions logged  
✅ Foreign key constraints protect data integrity  

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Login again |
| 404 | Record not found | Already deleted or invalid ID |
| 400 | Missing ID | Check API call |
| 500 | Server error | Contact support |

---

## Troubleshooting

### "Failed to delete"
- Check internet connection
- Verify you're still logged in
- Try refreshing the page

### "Record not found"
- Record may already be deleted
- Check if you have the correct ID

### Delete button disabled
- Deletion in progress, please wait
- Another delete operation is running

---

**Quick Links:**
- Full Documentation: `docs/AI_AGENT_INSTRUCTIONS.md`
- Feature Details: `docs/features/ATTENDANCE_DELETE_FEATURE.md`
- Implementation Summary: `IMPLEMENTATION_SUMMARY.md`
