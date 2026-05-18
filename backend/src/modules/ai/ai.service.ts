import { OpenAI } from 'openai';
import { GenerateContentDto } from './dto/generate-content.dto';
import { TITLE_PROMPT } from './prompts/title.prompt';
import { DESCRIPTION_PROMPT } from './prompts/description.prompt';

export class AiService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateDescription(dto: GenerateContentDto) {
    try {
      if (!this.openai) {
        // Fallback to simulated for dev if no API key
        return {
          content: `<h2>Premium ${dto.prompt}</h2>
<p>Discover the exceptional quality of our ${dto.prompt}. Designed with both functionality and style in mind, this product stands out in its category.</p>
<ul>
  <li>High-quality materials</li>
  <li>Durable construction</li>
  <li>Perfect for everyday use</li>
</ul>
<p>Don't miss out on adding this essential item to your collection.</p>`,
        };
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert eCommerce copywriter.' },
          { role: 'user', content: DESCRIPTION_PROMPT(dto.prompt, dto.tone, dto.keywords) }
        ],
        temperature: 0.7,
      });

      return { content: response.choices[0].message.content };
    } catch (error) {
      console.error('AI Description Generation Failed:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  async generateTitle(dto: GenerateContentDto) {
    try {
      if (!this.openai) {
        return {
          content: `Premium ${dto.prompt} - High Quality & Durable`,
        };
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert eCommerce copywriter.' },
          { role: 'user', content: TITLE_PROMPT(dto.prompt, dto.keywords) }
        ],
        temperature: 0.7,
      });

      return { content: response.choices[0].message.content };
    } catch (error) {
      console.error('AI Title Generation Failed:', error);
      throw new Error('Failed to generate AI title');
    }
  }
}
