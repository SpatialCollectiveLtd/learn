# OSM Community Response Plan - DPW2025

## Date: January 9, 2026
## Issue: Concerns raised by OSM DWG regarding mapping practices

---

## Issues Raised by woodpeck (Frederik Ramm)

1. ❌ Insufficient changeset comments ("#DPW2025" not descriptive enough)
2. ❌ Questionable source tagging (mapbox)
3. ❌ Partial task completion without explanation (3/30 buildings)
4. ❌ No community discussion/documentation
5. ⚠️ Catherine Wanjira's account temporarily blocked

---

## IMMEDIATE ACTIONS (Complete within 24-48 hours)

### 1. PAUSE ALL MAPPING (URGENT)
- [ ] Stop all mapper activities immediately
- [ ] Send message to all 36 mappers explaining the pause
- [ ] No uploads until documentation is in place

### 2. CREATE OSM WIKI PAGE
- [ ] Create comprehensive project documentation
- [ ] Include: goals, methodology, sources, validation process
- [ ] Explain the 200 building/day limit rationale
- [ ] Link to HOTOSM tasks being worked on
- [ ] Add contact information

**Template wiki page URL**: `https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements`

**Content to include**:
```
= DPW2025 - Digital Public Works 2025 =

== Project Overview ==
DPW2025 is a structured mapping initiative supporting 36 youth mappers 
in informal settlements around Nairobi, Kenya. The project runs from 
January-March 2026.

== Goals ==
* Map buildings in underserved informal settlements
* Train local youth in digital mapping skills
* Support urban planning and disaster preparedness
* Contribute quality data to OpenStreetMap

== Methodology ==
* Mappers work through HOT Tasking Manager tasks
* Daily limit of 200 buildings per mapper (quality control)
* All work validated by trained validators
* Tasks may be completed across multiple days/mappers

== Data Sources ==
* Bing aerial imagery
* Maxar Premium imagery (via HOTOSM)
* Field surveys (where applicable)

== Quality Assurance ==
* Daily validation by trained validators
* Regular quality checks on random samples
* Feedback provided to mappers daily

== Changeset Comment Format ==
DPW2025: [Settlement Name] - HOTOSM Task #[number] - [status]
Example: "DPW2025: Huruma - HOTOSM Task #12345 - Partial (daily limit)"

== Contact ==
* Project Lead: [Your Name/Email]
* Wiki: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements

== Discussion ==
* Talk-ke mailing list: [link to discussion thread]
```

### 3. POST TO KENYA MAILING LIST
- [ ] Draft email to talk-ke@openstreetmap.org
- [ ] Explain project, apologize for lack of communication
- [ ] Invite feedback and collaboration
- [ ] Share wiki page link

**Draft email**:
```
Subject: DPW2025 - New mapping project in Nairobi informal settlements

Dear OSM Kenya community,

We apologize for not introducing ourselves earlier. We are running 
a mapping project called DPW2025, training 36 youth mappers to map 
buildings in Nairobi's informal settlements.

We've received feedback that our practices need improvement, and 
we're taking immediate steps to align with community standards.

Project details: https://wiki.openstreetmap.org/wiki/DPW2025_...

We welcome your feedback, suggestions, and collaboration.

Best regards,
[Your Name]
DPW2025 Project Team
```

### 4. IMPROVE CHANGESET COMMENTS
- [ ] Update mapper training materials
- [ ] Create changeset comment template
- [ ] Implement in the application code

**New changeset comment format**:
```
DPW2025: Mapping buildings in [Settlement] - HOTOSM Task #[number]
Status: [Partial - daily limit | Complete]
Source: [Bing/Maxar via HOTOSM]
Info: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements
```

### 5. FIX SOURCE TAGGING
- [ ] Audit recent changesets for incorrect source tags
- [ ] Correct any "mapbox" tags to actual source used
- [ ] Train mappers on proper source attribution

### 6. RESPOND TO WOODPECK
- [ ] Send professional response (use template above)
- [ ] Acknowledge issues
- [ ] Outline corrective actions
- [ ] Ask for guidance

---

## CODE CHANGES NEEDED

### Update Changeset Comment in Application

Current:
```typescript
comment: "#DPW2025"
```

Should be:
```typescript
comment: `DPW2025: Mapping buildings in ${settlement} - HOTOSM Task #${taskId} - ${status}
Source: ${imagery}
Info: https://wiki.openstreetmap.org/wiki/DPW2025_Nairobi_Informal_Settlements`
```

### Add Source Tag Tracking
- Capture which imagery source mapper used
- Add to changeset tags
- Include in database

---

## LONG-TERM IMPROVEMENTS

### 1. Community Engagement
- Regular updates to talk-ke mailing list
- Monthly progress reports
- Invite community validators
- Coordinate with local OSM groups

### 2. Documentation
- Keep wiki page updated
- Document lessons learned
- Share training materials
- Publish validation criteria

### 3. Quality Assurance
- Public validation reports
- Quality metrics dashboard
- Regular community review sessions

### 4. Mapper Training
- OSM etiquette and community standards
- Proper tagging standards
- When to ask for help
- How to engage with community feedback

---

## RESPONSE TO COMMON QUESTIONS

### "Why only map 3 out of 30 buildings?"
**Answer**: Our mappers have a daily limit of 200 buildings to maintain quality 
and prevent burnout. When they reach this limit mid-task, they save their 
progress and mark the task as incomplete. The task will be picked up the 
next day by the same or different mapper. This is coordinated through our 
validation system and HOTOSM task management.

### "Why use source=mapbox?"
**Answer**: This was a mistake in our training. Our mappers actually use 
Bing and Maxar (via HOTOSM) imagery. We are correcting this in all recent 
changesets and updating our training materials.

### "What is DPW2025?"
**Answer**: Digital Public Works 2025 is a youth employment and training 
program focused on mapping underserved areas in Nairobi. Full details: 
[wiki link]

---

## SUCCESS CRITERIA

✅ Response sent to woodpeck within 24 hours
✅ Wiki page created and published
✅ Talk-ke post made and community engaged
✅ Mapping paused until documentation approved
✅ Catherine's account unblocked after reading message
✅ No further DWG complaints
✅ Positive community feedback

---

## CONTACTS

**OSM DWG**: data@openstreetmap.org
**woodpeck**: via OSM messaging
**Kenya community**: talk-ke@openstreetmap.org
**HOT**: info@hotosm.org

---

## TIMELINE

**Day 1 (Today - Jan 9)**:
- ✅ Pause all mapping
- ✅ Draft response to woodpeck
- ⏳ Create wiki page
- ⏳ Post to talk-ke

**Day 2 (Jan 10)**:
- ⏳ Implement changeset comment improvements
- ⏳ Update mapper training
- ⏳ Audit and fix source tags

**Day 3 (Jan 11)**:
- ⏳ Resume mapping with new standards
- ⏳ Monitor community feedback
- ⏳ Follow up with woodpeck

---

**Remember**: The OSM community values transparency, communication, and quality. 
We made mistakes by not engaging earlier, but we can fix this by being 
responsive and cooperative now.
