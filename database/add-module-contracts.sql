-- Module-Specific Contract Templates Setup
-- Run this script when you have the final contract content for each module

-- IMPORTANT: Replace the placeholder content below with your actual HTML contract content
-- Use these placeholders in your content:
--   {{PARTICIPANT_NAME}} - Youth's full name
--   {{PARTICIPANT_EMAIL}} - Youth's email address
--   {{PROGRAM_TYPE}} - Program type (automatically capitalized)
--   {{SIGN_DATE}} - Contract signing date
--   {{YOUTH_ID}} - Youth participant ID

-- ============================================
-- DIGITIZATION MODULE CONTRACT
-- ============================================
INSERT INTO contract_templates (program_type, version, title, content, created_by, is_active) VALUES
(
  'digitization',
  '1.0',
  'Digitization Training Agreement',
  '<!-- REPLACE THIS WITH YOUR DIGITIZATION CONTRACT HTML -->
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1>Digitization Training Agreement</h1>
    <p><strong>Date:</strong> {{SIGN_DATE}}</p>
    
    <p>This training agreement ("Agreement") is made between:</p>
    <ul>
      <li><strong>Spatial Collective</strong> (the "Organization")</li>
      <li><strong>{{PARTICIPANT_NAME}}</strong>, Youth ID: {{YOUTH_ID}} (the "Participant")</li>
    </ul>
    
    <h2>1. Training Program</h2>
    <p>The Participant is enrolled in the <strong>{{PROGRAM_TYPE}}</strong> training program, which covers:</p>
    <ul>
      <li>Digital mapping fundamentals</li>
      <li>Satellite image interpretation</li>
      <li>JOSM (Java OpenStreetMap Editor) workflows</li>
      <li>OpenStreetMap data quality standards</li>
    </ul>
    
    <h2>2. Participant Responsibilities</h2>
    <p>The Participant agrees to:</p>
    <ul>
      <li>Complete all assigned training modules and assessments</li>
      <li>Maintain high data quality standards in all mapping tasks</li>
      <li>Follow OpenStreetMap community guidelines and best practices</li>
      <li>Use provided tools and resources responsibly</li>
      <li>Communicate progress and challenges with trainers</li>
    </ul>
    
    <h2>3. Data and Confidentiality</h2>
    <p>[ADD YOUR SPECIFIC TERMS HERE]</p>
    
    <h2>4. Certification</h2>
    <p>Upon successful completion of all modules and assessments, the Participant will receive certification in {{PROGRAM_TYPE}}.</p>
    
    <h2>5. Agreement</h2>
    <p>By signing below, the Participant acknowledges that they have read, understood, and agree to abide by the terms of this Agreement.</p>
    
    <p style="margin-top: 40px;">
      <strong>Participant:</strong> {{PARTICIPANT_NAME}}<br>
      <strong>Email:</strong> {{PARTICIPANT_EMAIL}}<br>
      <strong>Date Signed:</strong> {{SIGN_DATE}}
    </p>
  </div>',
  'STEA8103SA',  -- Created by super admin
  FALSE  -- Set to FALSE until content is finalized, then update to TRUE
);

-- ============================================
-- MOBILE MAPPING MODULE CONTRACT
-- ============================================
INSERT INTO contract_templates (program_type, version, title, content, created_by, is_active) VALUES
(
  'mobile_mapping',
  '1.0',
  'Mobile Mapping Training Agreement',
  '<!-- REPLACE THIS WITH YOUR MOBILE MAPPING CONTRACT HTML -->
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1>Mobile Mapping Training Agreement</h1>
    <p><strong>Date:</strong> {{SIGN_DATE}}</p>
    
    <p>This training agreement is for the <strong>Mobile Mapping</strong> program.</p>
    
    <h2>Training Includes:</h2>
    <ul>
      <li>Mobile mapping applications (StreetComplete, Vespucci)</li>
      <li>GPS data collection techniques</li>
      <li>Field data validation</li>
      <li>Real-time mapping updates</li>
    </ul>
    
    <p><strong>Participant:</strong> {{PARTICIPANT_NAME}}</p>
    <p><strong>Youth ID:</strong> {{YOUTH_ID}}</p>
    <p><strong>Email:</strong> {{PARTICIPANT_EMAIL}}</p>
    
    <p>[ADD COMPLETE CONTRACT CONTENT HERE]</p>
  </div>',
  'STEA8103SA',
  FALSE
);

-- ============================================
-- HOUSEHOLD SURVEY MODULE CONTRACT
-- ============================================
INSERT INTO contract_templates (program_type, version, title, content, created_by, is_active) VALUES
(
  'household_survey',
  '1.0',
  'Household Survey Training Agreement',
  '<!-- REPLACE THIS WITH YOUR HOUSEHOLD SURVEY CONTRACT HTML -->
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1>Household Survey Training Agreement</h1>
    <p><strong>Date:</strong> {{SIGN_DATE}}</p>
    
    <p>This training agreement is for the <strong>Household Survey</strong> program.</p>
    
    <h2>Training Includes:</h2>
    <ul>
      <li>Survey methodology and ethics</li>
      <li>Data collection forms and protocols</li>
      <li>Community engagement techniques</li>
      <li>Data privacy and protection</li>
    </ul>
    
    <p><strong>Participant:</strong> {{PARTICIPANT_NAME}}</p>
    <p><strong>Youth ID:</strong> {{YOUTH_ID}}</p>
    <p><strong>Email:</strong> {{PARTICIPANT_EMAIL}}</p>
    
    <p>[ADD COMPLETE CONTRACT CONTENT HERE]</p>
  </div>',
  'STEA8103SA',
  FALSE
);

-- ============================================
-- MICROTASKING MODULE CONTRACT
-- ============================================
INSERT INTO contract_templates (program_type, version, title, content, created_by, is_active) VALUES
(
  'microtasking',
  '1.0',
  'Microtasking Training Agreement',
  '<!-- REPLACE THIS WITH YOUR MICROTASKING CONTRACT HTML -->
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
    <h1>Microtasking Training Agreement</h1>
    <p><strong>Date:</strong> {{SIGN_DATE}}</p>
    
    <p>This training agreement is for the <strong>Microtasking</strong> program.</p>
    
    <h2>Training Includes:</h2>
    <ul>
      <li>Task manager platforms and workflows</li>
      <li>Quality assurance protocols</li>
      <li>Efficient task completion strategies</li>
      <li>MapRoulette and other microtasking tools</li>
    </ul>
    
    <p><strong>Participant:</strong> {{PARTICIPANT_NAME}}</p>
    <p><strong>Youth ID:</strong> {{YOUTH_ID}}</p>
    <p><strong>Email:</strong> {{PARTICIPANT_EMAIL}}</p>
    
    <p>[ADD COMPLETE CONTRACT CONTENT HERE]</p>
  </div>',
  'STEA8103SA',
  FALSE
);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after inserting to verify all templates were added
SELECT 
  program_type,
  version,
  title,
  is_active,
  created_at
FROM contract_templates
ORDER BY program_type;

-- ============================================
-- TO ACTIVATE CONTRACTS WHEN READY
-- ============================================
-- After replacing placeholder content with actual contracts, run:
-- UPDATE contract_templates SET is_active = TRUE WHERE program_type = 'digitization';
-- UPDATE contract_templates SET is_active = TRUE WHERE program_type = 'mobile_mapping';
-- UPDATE contract_templates SET is_active = TRUE WHERE program_type = 'household_survey';
-- UPDATE contract_templates SET is_active = TRUE WHERE program_type = 'microtasking';

-- Or activate all at once:
-- UPDATE contract_templates SET is_active = TRUE WHERE created_by = 'STEA8103SA';
