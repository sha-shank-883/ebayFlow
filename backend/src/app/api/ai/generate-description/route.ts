// backend/src/app/api/ai/generate-description/route.ts
import { NextResponse } from 'next/server';
import { AiService } from '../../../../../modules/ai/ai.service';
import { descriptionPrompt } from '../../../../../modules/ai/prompts/description.prompt';
import jwt from 'jsonwebtoken';

const aiService = new AiService();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

async function getWorkspaceId(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) throw new Error('Unauthorized');
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as { workspaceId: string };
  
  if (!decoded.workspaceId) throw new Error('No workspace selected');
  return decoded.workspaceId;
}

export async function POST(request: Request) {
  try {
    await getWorkspaceId(request);
    const { title, features, tone } = await request.json();
    
    if (!title) throw new Error('Title is required');

    const prompt = descriptionPrompt(title, features, tone);
    const result = await aiService.generateContent({
      prompt,
      type: 'description'
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to generate description' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
