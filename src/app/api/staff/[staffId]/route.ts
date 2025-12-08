import { NextRequest, NextResponse } from 'next/server';
import { StaffModel } from '../../_lib/StaffModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.learn_STACK_SECRET_SERVER_KEY || process.env.JWT_SECRET || 'your-secret-key';

function verifyStaffToken(request: NextRequest): { staffId: string; role: string } | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      staffId: decoded.staffId,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

// DELETE: Remove staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const auth = verifyStaffToken(request);
    
    if (!auth || (auth.role !== 'admin' && auth.role !== 'superadmin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { staffId } = await params;

    // Cannot delete superadmin accounts
    const staffToDelete = await StaffModel.findById(staffId);
    if (!staffToDelete) {
      return NextResponse.json(
        { success: false, message: 'Staff member not found' },
        { status: 404 }
      );
    }

    if (staffToDelete.role === 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete superadmin accounts' },
        { status: 403 }
      );
    }

    // Admins can only delete trainers
    if (auth.role === 'admin' && staffToDelete.role !== 'trainer') {
      return NextResponse.json(
        { success: false, message: 'Admins can only delete trainer accounts' },
        { status: 403 }
      );
    }

    // Delete the staff member
    await StaffModel.delete(staffId);

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully',
    });

  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove staff member' },
      { status: 500 }
    );
  }
}
