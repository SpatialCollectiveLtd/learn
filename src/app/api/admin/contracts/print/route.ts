import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Database } from '../../../_lib/database';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const youthIds = searchParams.get('youth_ids');
    
    if (!youthIds) {
      return NextResponse.json(
        { success: false, message: 'Youth IDs required' },
        { status: 400 }
      );
    }

    const idsArray = youthIds.split(',');

    // Fetch contracts for the specified youth IDs
    const result = await Database.query(`
      SELECT 
        sc.contract_id,
        sc.youth_id,
        sc.signed_at,
        sc.signature_data,
        yp.full_name,
        yp.email,
        yp.phone_number,
        yp.program_type,
        ct.content AS template_content,
        ct.title AS contract_title
      FROM signed_contracts sc
      JOIN youth_participants yp ON sc.youth_id = yp.youth_id
      JOIN contract_templates ct ON sc.template_id = ct.template_id
      WHERE sc.youth_id = ANY($1) AND sc.is_valid = TRUE
      ORDER BY yp.full_name
    `, [idsArray]);

    if (result.rows.length === 0) {
      return new NextResponse(
        '<html><body><h1>No signed contracts found for the specified participants</h1></body></html>',
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Generate HTML for printing all contracts
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Signed Contracts</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
          .contract-page {
            page-break-after: always;
          }
          .contract-page:last-child {
            page-break-after: auto;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </head>
      <body>
        <button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000;">
          Print All
        </button>
    `;

    // Add each contract
    for (const contract of result.rows) {
      let contractHtml = contract.template_content;
      
      // Replace placeholders with actual data
      contractHtml = contractHtml
        .replace(/\{\{PARTICIPANT_NAME\}\}/g, contract.full_name)
        .replace(/\{\{YOUTH_ID\}\}/g, contract.youth_id)
        .replace(/\{\{PARTICIPANT_EMAIL\}\}/g, contract.email)
        .replace(/\{\{PARTICIPANT_PHONE\}\}/g, contract.phone_number || 'N/A')
        .replace(/\{\{SIGNATURE_DATE\}\}/g, new Date(contract.signed_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }))
        .replace(/\{\{CONTRACT_ID\}\}/g, contract.contract_id)
        .replace(/\{\{SIGNATURE_TIMESTAMP\}\}/g, new Date(contract.signed_at).toLocaleString('en-KE'))
        .replace(/\{\{START_DATE\}\}/g, new Date(contract.signed_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }))
        .replace(/\{\{CONTRACT_DURATION\}\}/g, '6 months (renewable based on performance)')
        .replace(/\{\{TRAINING_STIPEND\}\}/g, 'KES 500')
        .replace(/\{\{PRODUCTION_RATE\}\}/g, 'KES 15 per completed parcel')
        .replace(/\{\{IP_ADDRESS\}\}/g, 'Digital Signature');

      html += `<div class="contract-page">${contractHtml}</div>`;
    }

    html += `</body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Print contracts error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while generating contracts' },
      { status: 500 }
    );
  }
}
