import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withRateLimit } from '@/lib/rate-limit';

// GET email logs (Admin Only) with Resilience Fallback
export const GET = withAuth<any>(
  async (req: NextRequest) => {
    const rateLimitResponse = await withRateLimit(req, "apiLimit");
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const eventType = searchParams.get('eventType');
      const search = searchParams.get('search');
      
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '15', 10);
      const skip = (page - 1) * limit;

      const where: any = {};

      if (status) {
        where.status = status;
      }
      if (eventType) {
        where.eventType = eventType;
      }
      if (search) {
        where.OR = [
          { recipient: { contains: search } },
          { subject: { contains: search } }
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.emailLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.emailLog.count({ where })
      ]);

      return NextResponse.json({
        logs: logs || [],
        pagination: {
          total: total || 0,
          page,
          limit,
          totalPages: Math.ceil((total || 0) / limit) || 1
        }
      });
    } catch (error) {
      console.error('Error fetching email history:', error);
      // Resilience fallback directly from array if DB error occurs
      return NextResponse.json({
        logs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 1
        }
      });
    }
  },
  { role: 'ADMIN', requireApproved: true }
);
