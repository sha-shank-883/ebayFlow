import { NextResponse } from 'next/server';
import { AiService } from '@/modules/ai/ai.service';
import jwt from 'jsonwebtoken';

const aiService = new AiService();
const JWT_SECRET = process.env.JWT_SECRET;

function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET!) as any;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, prompt, tone, keywords } = body;

    if (type === 'title') {
      const result = await aiService.generateTitle({ prompt, tone, keywords });
      return NextResponse.json(result);
    }

    const result = await aiService.generateDescription({ prompt, tone, keywords });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
