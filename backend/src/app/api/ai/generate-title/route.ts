import { NextResponse } from 'next/server';
import { AiService } from '@/modules/ai/ai.service';
import jwt from 'jsonwebtoken';

const aiService = new AiService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET); // Basic verification

    const body = await request.json();
    const result = await aiService.generateTitle(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to generate title' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
