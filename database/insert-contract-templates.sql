-- ============================================
-- SPATIAL COLLECTIVE CONTRACT TEMPLATES
-- Professional A4 Format with Letterhead
-- ============================================

-- Insert comprehensive Digitization Program contract
INSERT INTO contract_templates (
  program_type,
  version,
  title,
  content,
  is_active,
  created_by
) VALUES (
  'digitization',
  'v3.0',
  'Digitization Training and Service Agreement',
  '<!DOCTYPE html>
<html>
<head>
<style>
  @page {
    size: A4;
    margin: 2cm 2.5cm;
  }
  
  body {
    font-family: "Segoe UI", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #222;
    max-width: 210mm;
    margin: 0 auto;
    background: white;
  }
  
  .letterhead {
    text-align: center;
    border-bottom: 3px solid #dc2626;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  
  .logo {
    width: 120px;
    height: 120px;
    margin: 0 auto 15px;
  }
  
  .company-name {
    font-size: 24pt;
    font-weight: bold;
    color: #dc2626;
    margin: 10px 0 5px;
    letter-spacing: 2px;
  }
  
  .company-address {
    font-size: 10pt;
    color: #666;
    margin: 5px 0;
  }
  
  .document-title {
    text-align: center;
    font-size: 18pt;
    font-weight: bold;
    color: #222;
    margin: 30px 0 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .document-subtitle {
    text-align: center;
    font-size: 12pt;
    color: #666;
    margin-bottom: 30px;
  }
  
  .section {
    margin: 25px 0;
    page-break-inside: avoid;
  }
  
  .section-title {
    font-size: 13pt;
    font-weight: bold;
    color: #dc2626;
    border-bottom: 2px solid #dc2626;
    padding-bottom: 5px;
    margin: 20px 0 15px;
  }
  
  .subsection-title {
    font-size: 12pt;
    font-weight: bold;
    color: #222;
    margin: 15px 0 10px;
  }
  
  .clause {
    margin: 12px 0 12px 20px;
    text-align: justify;
  }
  
  .clause-number {
    font-weight: bold;
    color: #dc2626;
    margin-right: 10px;
  }
  
  .sub-clause {
    margin: 8px 0 8px 40px;
    text-align: justify;
  }
  
  .parties-info {
    background: #f9fafb;
    border-left: 4px solid #dc2626;
    padding: 15px 20px;
    margin: 20px 0;
  }
  
  .party-label {
    font-weight: bold;
    color: #dc2626;
    margin-bottom: 5px;
  }
  
  .signature-section {
    margin-top: 50px;
    page-break-inside: avoid;
  }
  
  .signature-box {
    border: 2px solid #e5e7eb;
    padding: 20px;
    margin: 15px 0;
    background: #f9fafb;
  }
  
  .signature-line {
    border-bottom: 2px solid #222;
    width: 300px;
    margin: 30px 0 10px;
  }
  
  .signature-label {
    font-weight: bold;
    margin-top: 10px;
  }
  
  .important-note {
    background: #fef2f2;
    border-left: 4px solid #dc2626;
    padding: 15px 20px;
    margin: 20px 0;
    font-style: italic;
  }
  
  ul {
    margin: 10px 0 10px 30px;
  }
  
  li {
    margin: 8px 0;
    text-align: justify;
  }
  
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
    text-align: center;
    font-size: 9pt;
    color: #666;
  }
</style>
</head>
<body>

<!-- LETTERHEAD -->
<div class="letterhead">
  <div class="logo">
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" fill="none" stroke="#dc2626" stroke-width="3"/>
      <g fill="#dc2626">
        <rect x="60" y="100" width="15" height="30"/>
        <rect x="80" y="85" width="15" height="45"/>
        <rect x="100" y="75" width="15" height="55"/>
        <circle cx="130" cy="110" r="5"/>
        <circle cx="145" cy="115" r="4"/>
      </g>
    </svg>
  </div>
  <div class="company-name">SPATIAL COLLECTIVE</div>
  <div class="company-address">P.O. Box 51972, Ngong Hills Hotel Business Suite</div>
  <div class="company-address">Ngong Road, Nairobi, Kenya</div>
  <div class="company-address">Email: info@spatialcollective.co.ke | Tel: +254 XXX XXX XXX</div>
</div>

<!-- DOCUMENT TITLE -->
<div class="document-title">Digitization Training and Service Agreement</div>
<div class="document-subtitle">Youth Participant Contract</div>

<!-- PARTIES -->
<div class="section">
  <div class="section-title">1. PARTIES TO THE AGREEMENT</div>
  
  <div class="parties-info">
    <div class="party-label">THE EMPLOYER:</div>
    <p><strong>Spatial Collective Limited</strong><br>
    Registered Company in Kenya<br>
    P.O. Box 51972, Ngong Hills Hotel Business Suite, Ngong Road<br>
    Nairobi, Kenya<br>
    (Hereinafter referred to as "the Company" or "Spatial Collective")</p>
  </div>
  
  <div class="parties-info">
    <div class="party-label">THE PARTICIPANT:</div>
    <p><strong>{{PARTICIPANT_NAME}}</strong><br>
    Youth ID: {{YOUTH_ID}}<br>
    Email: {{PARTICIPANT_EMAIL}}<br>
    Phone: {{PARTICIPANT_PHONE}}<br>
    (Hereinafter referred to as "the Participant" or "Youth Trainee")</p>
  </div>
</div>

<!-- PREAMBLE -->
<div class="section">
  <div class="section-title">2. PREAMBLE</div>
  
  <div class="clause">
    <span class="clause-number">2.1</span>
    <strong>WHEREAS</strong> Spatial Collective Limited is a company engaged in geospatial data collection, digitization, mapping services, and capacity building in the field of Geographic Information Systems (GIS) and spatial data management;
  </div>
  
  <div class="clause">
    <span class="clause-number">2.2</span>
    <strong>AND WHEREAS</strong> the Participant has expressed interest in acquiring practical skills in digitization, data entry, quality assurance, and geospatial data processing;
  </div>
  
  <div class="clause">
    <span class="clause-number">2.3</span>
    <strong>AND WHEREAS</strong> the Company has agreed to provide comprehensive training and employment opportunities to the Participant under the Digitization Program;
  </div>
  
  <div class="clause">
    <span class="clause-number">2.4</span>
    <strong>NOW THEREFORE</strong> the parties agree to enter into this Training and Service Agreement upon the terms and conditions hereinafter contained.
  </div>
</div>

<!-- SCOPE OF WORK -->
<div class="section">
  <div class="section-title">3. SCOPE OF WORK AND JOB DESCRIPTION</div>
  
  <div class="subsection-title">3.1 Primary Responsibilities</div>
  
  <div class="clause">
    The Participant shall be engaged as a <strong>Digitization Trainee</strong> and shall undertake the following duties:
  </div>
  
  <ul>
    <li><strong>Data Digitization:</strong> Converting physical maps, paper records, and hand-drawn sketches into digital formats using specialized GIS software including QGIS, ArcGIS, and web-based mapping platforms.</li>
    
    <li><strong>Data Entry and Processing:</strong> Accurate transcription of attribute data, GPS coordinates, feature descriptions, and metadata into designated database systems and spreadsheets.</li>
    
    <li><strong>Quality Assurance:</strong> Conducting systematic checks on digitized data to ensure accuracy, completeness, and adherence to established quality standards and data specifications.</li>
    
    <li><strong>Map Preparation:</strong> Creating clean, georeferenced base maps from satellite imagery, aerial photographs, and existing cartographic materials.</li>
    
    <li><strong>Feature Extraction:</strong> Identifying and digitizing geographic features including buildings, roads, water bodies, land parcels, administrative boundaries, and infrastructure elements.</li>
    
    <li><strong>Data Validation:</strong> Cross-referencing digitized information with source materials, ground truth data, and quality control protocols to ensure data integrity.</li>
    
    <li><strong>Documentation:</strong> Maintaining detailed records of digitization progress, quality metrics, error logs, and project milestones in accordance with company procedures.</li>
    
    <li><strong>Collaboration:</strong> Working effectively within teams, participating in daily briefings, and communicating progress and challenges to supervisors and quality control staff.</li>
  </ul>
  
  <div class="subsection-title">3.2 Training Components</div>
  
  <div class="clause">
    The Company shall provide comprehensive training covering:
  </div>
  
  <ul>
    <li>Introduction to Geographic Information Systems (GIS) and spatial data concepts</li>
    <li>Hands-on training with digitization software and mapping tools</li>
    <li>Data quality standards, validation techniques, and error detection</li>
    <li>Map projection systems, coordinate reference systems, and georeferencing</li>
    <li>Attribute data management and database fundamentals</li>
    <li>Workflow optimization and productivity enhancement techniques</li>
    <li>Professional ethics in data handling and confidentiality</li>
    <li>Health and safety protocols for extended computer work</li>
    <li>Project management basics and task prioritization</li>
    <li>Communication skills and professional workplace etiquette</li>
    <li>Understanding spatial analysis and data interpretation</li>
    <li>File management, backup procedures, and data security</li>
  </ul>
  
  <div class="subsection-title">3.3 Equipment and Tools</div>
  
  <div class="clause">
    The Company shall provide all necessary equipment and software including:
  </div>
  
  <ul>
    <li>Desktop computer or workstation with required specifications</li>
    <li>Licensed GIS software (QGIS, ArcGIS, or equivalent)</li>
    <li>High-resolution monitor for detailed digitization work</li>
    <li>Mouse, keyboard, and ergonomic accessories</li>
    <li>Internet connectivity for cloud-based platforms</li>
    <li>Access to reference materials and documentation</li>
    <li>Personal protective equipment where necessary</li>
  </ul>
  
  <div class="subsection-title">3.4 Performance Standards</div>
  
  <div class="clause">
    <span class="clause-number">3.4.1</span>
    The Participant is expected to maintain a minimum accuracy rate of 95% in all digitization tasks, as measured by quality control assessments.
  </div>
  
  <div class="clause">
    <span class="clause-number">3.4.2</span>
    Daily productivity targets shall be communicated by the supervisor and may vary based on task complexity and data source quality.
  </div>
  
  <div class="clause">
    <span class="clause-number">3.4.3</span>
    The Participant must demonstrate continuous improvement in speed and accuracy throughout the training period.
  </div>
  
  <div class="clause">
    <span class="clause-number">3.4.4</span>
    Regular performance reviews shall be conducted weekly during training and monthly thereafter.
  </div>
  
  <div class="clause">
    <span class="clause-number">3.4.5</span>
    Feedback and constructive criticism shall be provided to support professional development and skill enhancement.
  </div>
</div>

<!-- DURATION AND WORKING HOURS -->
<div class="section">
  <div class="section-title">4. DURATION AND WORKING ARRANGEMENTS</div>
  
  <div class="clause">
    <span class="clause-number">4.1</span>
    <strong>Contract Duration:</strong> This agreement shall commence on {{START_DATE}} and shall continue for an initial period of {{CONTRACT_DURATION}}, subject to performance review and renewal at the sole discretion of the Company.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.2</span>
    <strong>Working Hours:</strong> The standard working week shall consist of 40 hours, typically distributed as Monday to Friday, 8:00 AM to 5:00 PM, with a one-hour lunch break. The Company reserves the right to adjust working hours based on project requirements with reasonable notice.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.3</span>
    <strong>Overtime:</strong> Participants may be required to work additional hours during peak project periods. Overtime work shall be compensated in accordance with Kenyan labor laws.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.4</span>
    <strong>Probation Period:</strong> The first 30 days of engagement shall constitute a probationary period during which either party may terminate this agreement with 7 days'' written notice.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.5</span>
    <strong>Leave Entitlement:</strong> After successful completion of probation, the Participant shall be entitled to annual leave as per Kenyan Employment Act provisions, pro-rated based on contract duration.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.6</span>
    <strong>Sick Leave:</strong> Participants are entitled to sick leave upon production of a valid medical certificate. Excessive absenteeism may result in contract review.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.7</span>
    <strong>Public Holidays:</strong> All Kenyan public holidays shall be observed. Work on public holidays shall be compensated at premium rates.
  </div>
  
  <div class="clause">
    <span class="clause-number">4.8</span>
    <strong>Remote Work:</strong> Remote work arrangements may be considered based on project requirements and demonstrated performance, subject to management approval.
  </div>
</div>

<!-- REMUNERATION -->
<div class="section">
  <div class="section-title">5. REMUNERATION AND BENEFITS</div>
  
  <div class="clause">
    <span class="clause-number">5.1</span>
    <strong>Training Stipend:</strong> During the initial training phase (first 2 weeks), the Participant shall receive a training stipend of {{TRAINING_STIPEND}} per day, paid bi-weekly.
  </div>
  
  <div class="clause">
    <span class="clause-number">5.2</span>
    <strong>Production Payment:</strong> Upon successful completion of training and achieving required quality standards, the Participant shall transition to a production-based payment structure of {{PRODUCTION_RATE}} per unit of completed work, with quality bonuses for exceptional performance.
  </div>
  
  <div class="clause">
    <span class="clause-number">5.3</span>
    <strong>Payment Schedule:</strong> All payments shall be made bi-weekly via mobile money transfer (M-PESA) or bank transfer to the account nominated by the Participant.
  </div>
  
  <div class="clause">
    <span class="clause-number">5.4</span>
    <strong>Statutory Deductions:</strong> The Company shall make all required statutory deductions including but not limited to PAYE, NHIF, and NSSF where applicable under Kenyan law.
  </div>
  
  <div class="clause">
    <span class="clause-number">5.5</span>
    <strong>Additional Benefits:</strong>
  </div>
  
  <ul>
    <li>Certificate of completion upon successful training</li>
    <li>Reference letter for future employment opportunities</li>
    <li>Access to company learning resources and materials</li>
    <li>Tea/coffee breaks during working hours</li>
    <li>Performance-based bonuses for exceeding quality targets</li>
    <li>Professional development opportunities and skill upgrading</li>
    <li>Mentorship from experienced GIS professionals</li>
    <li>Networking opportunities within the geospatial industry</li>
  </ul>
  
  <div class="clause">
    <span class="clause-number">5.6</span>
    <strong>Payment Transparency:</strong> Participants shall receive detailed payment statements showing hours worked, production units, bonuses, deductions, and net payment.
  </div>
  
  <div class="clause">
    <span class="clause-number">5.7</span>
    <strong>Advancement Opportunities:</strong> Exceptional performers may be considered for advanced roles including Quality Control Officer, Team Leader, or Trainer positions.
  </div>
</div>

<!-- CONFIDENTIALITY -->
<div class="section">
  <div class="section-title">6. CONFIDENTIALITY AND DATA PROTECTION</div>
  
  <div class="clause">
    <span class="clause-number">6.1</span>
    The Participant acknowledges that during the course of employment, they may have access to confidential information including but not limited to client data, proprietary methodologies, business strategies, pricing information, and unpublished datasets.
  </div>
  
  <div class="clause">
    <span class="clause-number">6.2</span>
    The Participant agrees to maintain strict confidentiality regarding all company information and client data, both during employment and after termination of this agreement.
  </div>
  
  <div class="clause">
    <span class="clause-number">6.3</span>
    The Participant shall not, without prior written authorization:
  </div>
  
  <ul>
    <li>Disclose, share, or publish any project data or information</li>
    <li>Make copies of company data for personal use</li>
    <li>Use confidential information for personal gain or third-party benefit</li>
    <li>Discuss project details with unauthorized persons</li>
    <li>Remove any data storage devices or documents from company premises</li>
  </ul>
  
  <div class="clause">
    <span class="clause-number">6.4</span>
    Breach of confidentiality shall constitute grounds for immediate termination and may result in legal action for damages.
  </div>
  
  <div class="clause">
    <span class="clause-number">6.5</span>
    <strong>Data Protection Compliance:</strong> The Participant shall comply with the Kenya Data Protection Act, 2019, and handle all personal data in accordance with data protection principles.
  </div>
  
  <div class="clause">
    <span class="clause-number">6.6</span>
    <strong>Non-Disclosure Agreement:</strong> This confidentiality obligation shall survive termination of employment and remain in effect indefinitely for trade secrets and for a period of 3 years for other confidential information.
  </div>
  
  <div class="clause">
    <span class="clause-number">6.7</span>
    <strong>Security Protocols:</strong> Participants must use strong passwords, lock workstations when away, report security breaches immediately, and comply with all IT security policies.
  </div>
</div>

<!-- INTELLECTUAL PROPERTY -->
<div class="section">
  <div class="section-title">7. INTELLECTUAL PROPERTY RIGHTS</div>
  
  <div class="clause">
    <span class="clause-number">7.1</span>
    All work products, data, maps, databases, documentation, and materials created by the Participant during the course of employment shall be the exclusive property of Spatial Collective Limited.
  </div>
  
  <div class="clause">
    <span class="clause-number">7.2</span>
    The Participant hereby assigns all rights, title, and interest in any intellectual property created during employment to the Company.
  </div>
  
  <div class="clause">
    <span class="clause-number">7.3</span>
    The Company retains the right to use, modify, distribute, and commercialize all work products without additional compensation to the Participant.
  </div>
</div>

<!-- CODE OF CONDUCT -->
<div class="section">
  <div class="section-title">8. CODE OF CONDUCT AND PROFESSIONAL ETHICS</div>
  
  <div class="clause">
    <span class="clause-number">8.1</span>
    <strong>Professional Behavior:</strong> The Participant shall maintain professional conduct at all times, treating colleagues, supervisors, and clients with respect and courtesy.
  </div>
  
  <div class="clause">
    <span class="clause-number">8.2</span>
    <strong>Attendance and Punctuality:</strong> The Participant shall adhere to designated working hours, notify supervisors of absences promptly, and maintain a reliable attendance record.
  </div>
  
  <div class="clause">
    <span class="clause-number">8.3</span>
    <strong>Dress Code:</strong> Business casual attire is required. The Participant must present a neat and professional appearance.
  </div>
  
  <div class="clause">
    <span class="clause-number">8.4</span>
    <strong>Prohibited Activities:</strong>
  </div>
  
  <ul>
    <li>Use of company resources for personal business or activities</li>
    <li>Harassment, discrimination, or bullying of any kind</li>
    <li>Substance abuse or reporting to work under the influence</li>
    <li>Unauthorized use of company name or branding</li>
    <li>Engaging in activities that conflict with company interests</li>
    <li>Falsification of data, timesheets, or work records</li>
  </ul>
  
  <div class="clause">
    <span class="clause-number">8.5</span>
    <strong>Social Media:</strong> The Participant shall not post company-related content, project information, or client details on social media platforms without express written permission.
  </div>
  
  <div class="clause">
    <span class="clause-number">8.6</span>
    <strong>Conflict of Interest:</strong> Participants must disclose any potential conflicts of interest and shall not engage in competing business activities during employment.
  </div>
  
  <div class="clause">
    <span class="clause-number">8.7</span>
    <strong>Grievance Procedure:</strong> Any workplace concerns should be raised first with immediate supervisor, then HR, following the company's grievance resolution process.
  </div>
  
  <div class="clause">
    <span class="clause-number">8.8</span>
    <strong>Equal Opportunity:</strong> Spatial Collective is an equal opportunity employer. All participants shall be treated fairly regardless of gender, age, religion, ethnicity, or disability.
  </div>
</div>

<!-- HEALTH AND SAFETY -->
<div class="section">
  <div class="section-title">9. HEALTH, SAFETY, AND WELFARE</div>
  
  <div class="clause">
    <span class="clause-number">9.1</span>
    The Company shall provide a safe working environment compliant with Kenyan occupational health and safety regulations.
  </div>
  
  <div class="clause">
    <span class="clause-number">9.2</span>
    The Participant shall:
  </div>
  
  <ul>
    <li>Follow all safety protocols and guidelines</li>
    <li>Report any health and safety concerns immediately</li>
    <li>Use equipment and facilities responsibly</li>
    <li>Take regular breaks to prevent eye strain and repetitive stress injuries</li>
    <li>Maintain proper ergonomic posture during computer work</li>
  </ul>
  
  <div class="clause">
    <span class="clause-number">9.3</span>
    The Company shall not be liable for any illness or injury sustained outside of working hours or due to the Participant''s negligence.
  </div>
  
  <div class="clause">
    <span class="clause-number">9.4</span>
    <strong>Workplace Wellness:</strong> The Company encourages regular eye tests, stretch breaks every hour, and proper hydration throughout the workday.
  </div>
  
  <div class="clause">
    <span class="clause-number">9.5</span>
    <strong>Emergency Procedures:</strong> Participants shall familiarize themselves with fire exits, assembly points, first aid facilities, and emergency contact numbers.
  </div>
  
  <div class="clause">
    <span class="clause-number">9.6</span>
    <strong>Mental Health Support:</strong> The Company recognizes the importance of mental wellbeing. Participants experiencing stress or burnout should speak confidentially with management.
  </div>
  
  <div class="clause">
    <span class="clause-number">9.7</span>
    <strong>Work-Life Balance:</strong> While dedication is valued, the Company encourages healthy work-life balance and discourages excessive overtime.
  </div>
</div>

<!-- TRAINING AND DEVELOPMENT -->
<div class="section">
  <div class="section-title">9A. TRAINING, CERTIFICATION AND CAREER DEVELOPMENT</div>
  
  <div class="clause">
    <span class="clause-number">9A.1</span>
    <strong>Structured Training Program:</strong> The Participant shall undergo a comprehensive 2-week intensive training covering GIS fundamentals, software proficiency, quality assurance, and professional workplace skills.
  </div>
  
  <div class="clause">
    <span class="clause-number">9A.2</span>
    <strong>Assessment and Evaluation:</strong> Progress shall be assessed through practical tests, accuracy checks, and supervisor evaluations at the end of each training week.
  </div>
  
  <div class="clause">
    <span class="clause-number">9A.3</span>
    <strong>Certification Requirements:</strong> Upon successful completion of training and achieving minimum 90% pass rate in assessments, participants shall receive:
  </div>
  
  <ul>
    <li>Spatial Collective Digitization Training Certificate</li>
    <li>Digital badge for LinkedIn and professional profiles</li>
    <li>Detailed skills assessment report</li>
    <li>Letter of recommendation (upon request after 3 months)</li>
  </ul>
  
  <div class="clause">
    <span class="clause-number">9A.4</span>
    <strong>Continuous Learning:</strong> The Company shall provide ongoing training opportunities, lunch-and-learn sessions, and access to online resources for skill enhancement.
  </div>
  
  <div class="clause">
    <span class="clause-number">9A.5</span>
    <strong>Industry Exposure:</strong> High-performing participants may be selected for client site visits, industry conferences, or professional networking events.
  </div>
  
  <div class="clause">
    <span class="clause-number">9A.6</span>
    <strong>Knowledge Sharing:</strong> Experienced participants may be requested to mentor new trainees, contributing to the program's sustainability.
  </div>
</div>

<!-- TERMINATION -->
<div class="section">
  <div class="section-title">10. TERMINATION OF AGREEMENT</div>
  
  <div class="clause">
    <span class="clause-number">10.1</span>
    <strong>Termination by Company:</strong> The Company may terminate this agreement with 14 days'' written notice or payment in lieu of notice.
  </div>
  
  <div class="clause">
    <span class="clause-number">10.2</span>
    <strong>Termination by Participant:</strong> The Participant may terminate this agreement with 14 days'' written notice to allow for proper handover.
  </div>
  
  <div class="clause">
    <span class="clause-number">10.3</span>
    <strong>Summary Dismissal:</strong> The Company reserves the right to terminate this agreement immediately without notice for:
  </div>
  
  <ul>
    <li>Gross misconduct or insubordination</li>
    <li>Breach of confidentiality or data protection obligations</li>
    <li>Theft, fraud, or dishonesty</li>
    <li>Repeated poor performance despite warnings</li>
    <li>Unauthorized absence for 3 consecutive days</li>
    <li>Criminal conviction affecting employment suitability</li>
  </ul>
  
  <div class="clause">
    <span class="clause-number">10.4</span>
    <strong>Return of Property:</strong> Upon termination, the Participant shall immediately return all company property including access cards, equipment, documents, and data.
  </div>
  
  <div class="clause">
    <span class="clause-number">10.5</span>
    <strong>Final Settlement:</strong> All outstanding payments shall be settled within 7 working days of the effective termination date.
  </div>
</div>

<!-- DISPUTE RESOLUTION -->
<div class="section">
  <div class="section-title">11. DISPUTE RESOLUTION</div>
  
  <div class="clause">
    <span class="clause-number">11.1</span>
    In the event of any dispute arising from this agreement, the parties shall first attempt to resolve the matter through good faith negotiations.
  </div>
  
  <div class="clause">
    <span class="clause-number">11.2</span>
    If negotiations fail, the dispute shall be referred to mediation under the auspices of the Chartered Institute of Arbitrators (Kenya Branch).
  </div>
  
  <div class="clause">
    <span class="clause-number">11.3</span>
    This agreement shall be governed by and construed in accordance with the laws of Kenya.
  </div>
  
  <div class="clause">
    <span class="clause-number">11.4</span>
    The courts of Kenya shall have exclusive jurisdiction over any disputes that cannot be resolved through mediation.
  </div>
  
  <div class="clause">
    <span class="clause-number">11.5</span>
    <strong>Arbitration Costs:</strong> Each party shall bear their own costs unless the arbitrator determines otherwise based on the merits of the case.
  </div>
</div>

<!-- PARTICIPANT RIGHTS -->
<div class="section">
  <div class="section-title">11A. PARTICIPANT RIGHTS AND PROTECTIONS</div>
  
  <div class="clause">
    <span class="clause-number">11A.1</span>
    <strong>Right to Fair Treatment:</strong> All participants have the right to be treated with dignity, respect, and fairness in all aspects of employment.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.2</span>
    <strong>Right to Safe Working Environment:</strong> Participants have the right to work in conditions that meet health and safety standards without risk to wellbeing.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.3</span>
    <strong>Right to Training:</strong> All participants shall receive adequate training, supervision, and support to perform their duties effectively.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.4</span>
    <strong>Right to Timely Payment:</strong> Participants have the right to receive agreed compensation on time and in full, with clear payment documentation.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.5</span>
    <strong>Right to Privacy:</strong> Personal information shall be handled confidentially and in compliance with data protection laws.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.6</span>
    <strong>Freedom from Discrimination:</strong> Participants shall not face discrimination based on gender, age, religion, ethnicity, disability, or any other protected characteristic.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.7</span>
    <strong>Right to Raise Concerns:</strong> Participants may raise workplace concerns, report misconduct, or file grievances without fear of retaliation.
  </div>
  
  <div class="clause">
    <span class="clause-number">11A.8</span>
    <strong>Contract Modification Rights:</strong> Participants may request contract reviews or modifications through formal channels. Requests shall be considered in good faith by management.
  </div>
</div>

<!-- GENERAL PROVISIONS -->
<div class="section">
  <div class="section-title">12. GENERAL PROVISIONS</div>
  
  <div class="clause">
    <span class="clause-number">12.1</span>
    <strong>Entire Agreement:</strong> This document constitutes the entire agreement between the parties and supersedes all prior negotiations, understandings, or agreements.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.2</span>
    <strong>Amendments:</strong> No modification of this agreement shall be valid unless made in writing and signed by both parties.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.3</span>
    <strong>Severability:</strong> If any provision of this agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.4</span>
    <strong>Waiver:</strong> Failure by either party to enforce any provision shall not constitute a waiver of that provision or any other provision.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.5</span>
    <strong>Notices:</strong> All notices under this agreement shall be in writing and delivered to the addresses specified in Section 1.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.6</span>
    <strong>Force Majeure:</strong> Neither party shall be liable for failure to perform due to circumstances beyond reasonable control including natural disasters, pandemics, government actions, or civil unrest.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.7</span>
    <strong>Assignment:</strong> This agreement is personal to the Participant and may not be assigned or transferred without written consent of the Company.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.8</span>
    <strong>Language:</strong> This agreement is executed in English. In case of translation, the English version shall prevail in case of discrepancies.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.9</span>
    <strong>Electronic Execution:</strong> This agreement may be executed electronically, and electronic signatures shall have the same legal effect as handwritten signatures.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.10</span>
    <strong>Record Retention:</strong> Both parties shall maintain copies of this agreement and related documentation for a minimum period of 7 years.
  </div>
  
  <div class="clause">
    <span class="clause-number">12.11</span>
    <strong>Compliance with Laws:</strong> Both parties agree to comply with all applicable Kenyan laws including Employment Act 2007, Occupational Safety and Health Act 2007, and Data Protection Act 2019.
  </div>
</div>

<!-- ACKNOWLEDGMENT -->
<div class="section">
  <div class="important-note">
    <strong>IMPORTANT:</strong> By signing this agreement, the Participant acknowledges that they have:
    <ul>
      <li>Read and understood all terms and conditions</li>
      <li>Had the opportunity to seek independent legal advice</li>
      <li>Accepted the position voluntarily without coercion</li>
      <li>Provided accurate information in their application</li>
      <li>Agreed to comply with all company policies and procedures</li>
    </ul>
  </div>
</div>

<!-- SIGNATURES -->
<div class="signature-section">
  <div class="section-title">13. EXECUTION OF AGREEMENT</div>
  
  <p style="text-align: justify; margin: 20px 0;">
    IN WITNESS WHEREOF, the parties hereto have executed this Agreement on the date and year first written below.
  </p>
  
  <div class="signature-box">
    <div class="party-label">FOR AND ON BEHALF OF SPATIAL COLLECTIVE LIMITED:</div>
    
    <div class="signature-line"></div>
    <div class="signature-label">Authorized Signatory</div>
    <p style="margin: 5px 0;">Name: _________________________________</p>
    <p style="margin: 5px 0;">Title: _________________________________</p>
    <p style="margin: 5px 0;">Date: _________________________________</p>
    
    <div style="margin-top: 20px;">
      <p style="font-size: 9pt; color: #666;">Company Stamp:</p>
      <div style="width: 150px; height: 80px; border: 2px dashed #ccc; margin-top: 10px;"></div>
    </div>
  </div>
  
  <div class="signature-box">
    <div class="party-label">THE PARTICIPANT:</div>
    
    <div class="signature-line"></div>
    <div class="signature-label">Participant Signature (Digital)</div>
    <p style="margin: 5px 0;">Name: {{PARTICIPANT_NAME}}</p>
    <p style="margin: 5px 0;">Youth ID: {{YOUTH_ID}}</p>
    <p style="margin: 5px 0;">Date: {{SIGNATURE_DATE}}</p>
    <p style="margin: 5px 0;">IP Address: {{IP_ADDRESS}}</p>
  </div>
  
  <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; font-size: 10pt;">
      <strong>Digital Signature Verification:</strong><br>
      This document has been signed electronically on {{SIGNATURE_TIMESTAMP}} from IP address {{IP_ADDRESS}}. 
      The digital signature is legally binding under the Kenya Information and Communications Act.
      Contract ID: {{CONTRACT_ID}}
    </p>
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  <p><strong>Spatial Collective Limited</strong></p>
  <p>P.O. Box 51972, Ngong Hills Hotel Business Suite, Ngong Road, Nairobi, Kenya</p>
  <p>Email: info@spatialcollective.co.ke | Website: www.spatialcollective.co.ke</p>
  <p style="margin-top: 10px; font-size: 8pt;">
    This is a computer-generated document. No physical signature is required for digital agreements.
  </p>
</div>

</body>
</html>',
  TRUE,
  NULL
);

-- Note: Repeat similar comprehensive contracts for other program types
-- (mobile_mapping, household_survey, microtasking) with program-specific job descriptions

