import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../_lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;

    if (!pool) {
      throw new Error('Database connection not available');
    }

    // Fetch the specific contract
    const result = await pool.query(`
      SELECT 
        sc.contract_id,
        sc.youth_id,
        sc.signed_at,
        sc.signature_data,
        sc.ip_address,
        yp.full_name,
        yp.email,
        yp.phone_number,
        yp.program_type,
        ct.content AS template_content,
        ct.title AS contract_title
      FROM signed_contracts sc
      JOIN youth_participants yp ON sc.youth_id = yp.youth_id
      JOIN contract_templates ct ON sc.template_id = ct.template_id
      WHERE sc.contract_id = $1 AND sc.is_valid = TRUE
    `, [contractId]);

    if (result.rows.length === 0) {
      return new NextResponse(
        '<html><body><h1>Contract not found</h1></body></html>',
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const contract = result.rows[0];
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
      .replace(/\{\{IP_ADDRESS\}\}/g, contract.ip_address || 'N/A')
      .replace(/\{\{START_DATE\}\}/g, new Date(contract.signed_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }))
      .replace(/\{\{CONTRACT_DURATION\}\}/g, '6 months (renewable based on performance)')
      .replace(/\{\{TRAINING_STIPEND\}\}/g, 'KES 500')
      .replace(/\{\{PRODUCTION_RATE\}\}/g, 'KES 15 per completed parcel');

    // Wrap in full HTML with print button
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${contract.contract_title} - ${contract.youth_id}</title>
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="no-print" onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000;">
          Print Contract
        </button>
        ${contractHtml}
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('View contract error:', error);
    return new NextResponse(
      '<html><body><h1>Error loading contract</h1></body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
