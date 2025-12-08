# Module-Specific Contract System

## Overview
The platform now supports **different training agreements for each module**:
- Digitization
- Mobile Mapping
- Household Survey
- Microtasking

## Current Status
✅ **Contract signing TEMPORARILY DISABLED** (as of Dec 8, 2025)
- Youth can access all training materials without signing contracts
- Waiting for official module-specific contract content
- System infrastructure ready for module-specific contracts

## Database Structure

### contract_templates Table
Each contract template is linked to a specific `program_type`:

```sql
CREATE TABLE contract_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_type VARCHAR(50) NOT NULL,  -- 'digitization', 'mobile_mapping', 'household_survey', 'microtasking'
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,              -- HTML content with placeholders
  pdf_url VARCHAR(500),                -- Optional PDF version
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Placeholders in Contract Content
Use these placeholders in your HTML contract content:
- `{{PARTICIPANT_NAME}}` - Youth's full name
- `{{PARTICIPANT_EMAIL}}` - Youth's email
- `{{PROGRAM_TYPE}}` - Program type (e.g., "Digitization")
- `{{SIGN_DATE}}` - Date when contract was signed
- `{{YOUTH_ID}}` - Youth participant ID

## How to Add Module-Specific Contracts

### Step 1: Prepare Your Contract Content
Create HTML content for each module with proper formatting:

```html
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1>Digitization Training Agreement</h1>
  
  <p>This agreement is made between Spatial Collective and {{PARTICIPANT_NAME}} (Youth ID: {{YOUTH_ID}}).</p>
  
  <h2>Training Program</h2>
  <p>You are enrolled in the {{PROGRAM_TYPE}} training program...</p>
  
  <h2>Responsibilities</h2>
  <ul>
    <li>Complete all assigned modules</li>
    <li>Maintain data quality standards</li>
    <li>Follow OpenStreetMap guidelines</li>
  </ul>
  
  <h2>Certification</h2>
  <p>Upon successful completion, you will receive certification in {{PROGRAM_TYPE}}.</p>
  
  <p>Signed on {{SIGN_DATE}}</p>
</div>
```

### Step 2: Insert Contracts into Database

Use the provided script `database/add-module-contracts.sql`:

```sql
-- Example for Digitization module
INSERT INTO contract_templates (program_type, version, title, content, created_by) VALUES
(
  'digitization',
  '1.0',
  'Digitization Training Agreement',
  '<div>YOUR_HTML_CONTENT_HERE</div>',
  'STEA8103SA'  -- Super admin staff ID
);

-- Repeat for other modules
-- 'mobile_mapping'
-- 'household_survey'
-- 'microtasking'
```

### Step 3: Re-enable Contract Signing

Once contracts are added:

1. **Update youth dashboard** - Uncomment contract check in `src/app/dashboard/youth/page.tsx`:
   ```typescript
   // Currently lines 26-32 are commented out
   if (!agreementAccepted) {
     router.push('/contract');
     return;
   }
   ```

2. **Update contract status UI** - Replace yellow warning with green success message

3. **Deploy changes** - Commit and push to production

## API Endpoints

### GET /api/contracts/template
Returns the contract template for the authenticated youth's program type.

**Headers:**
```
Authorization: Bearer <youth_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Contract template retrieved successfully",
  "template": {
    "templateId": "uuid",
    "programType": "digitization",
    "version": "1.0",
    "title": "Digitization Training Agreement",
    "content": "<div>...</div>",
    "pdfUrl": null
  }
}
```

### POST /api/contracts/sign
Signs the contract for the authenticated youth.

**Headers:**
```
Authorization: Bearer <youth_jwt_token>
```

**Body:**
```json
{
  "templateId": "uuid",
  "signatureData": "data:image/png;base64,..."
}
```

## Implementation Notes

1. **One Contract Per Module**: Each youth sees only the contract for their assigned `program_type`
2. **Version Control**: Use `version` field to track contract updates (e.g., "1.0", "1.1", "2.0")
3. **Active Templates**: Only templates with `is_active = true` are shown to youth
4. **Signature Storage**: Signatures stored as base64 PNG data
5. **Audit Trail**: All contract signatures logged with IP address, timestamp, and user agent

## Files Modified

### Temporarily Disabled Contract Requirement
- `src/app/dashboard/youth/page.tsx` - Lines 26-32 commented out
- Youth can now access all modules without contract signing

### Ready for Re-enablement
- `src/app/api/contracts/template/route.ts` - Already fetches by program_type
- `src/app/api/contracts/sign/route.ts` - Already stores with template_id
- `src/app/api/_lib/ContractModel.ts` - Already supports getTemplateByProgramType()

## Next Steps (When Contract Content Ready)

1. ✅ Receive final contract content from team for each module
2. ✅ Format as HTML with proper styling
3. ✅ Add placeholders ({{PARTICIPANT_NAME}}, etc.)
4. ✅ Run `database/add-module-contracts.sql` to insert templates
5. ✅ Test contract display for each program_type
6. ✅ Re-enable contract requirement in youth dashboard
7. ✅ Deploy to production
8. ✅ Notify existing youth to sign their module-specific contracts

## Contact
For questions about contract content or implementation:
- Technical: tech@spatialcollective.com
- Admin: Contact your super admin (STEA8103SA)
