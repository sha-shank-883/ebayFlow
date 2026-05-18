// backend/src/lib/openai.ts
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-placeholder';

/**
 * OpenAI client instance
 */
export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Optimizes an eBay listing title and description for SEO
 */
export async function optimizeListing(title: string, description: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert eBay UK SEO specialist. Your goal is to optimize listing titles and descriptions to maximize visibility and conversion for UK buyers. Use British English spelling.',
        },
        {
          role: 'user',
          content: `Optimize this eBay listing:\nTitle: ${title}\nDescription: ${description}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    console.error('OpenAI Optimization Error:', error);
    throw error;
  }
}

export default openai;
