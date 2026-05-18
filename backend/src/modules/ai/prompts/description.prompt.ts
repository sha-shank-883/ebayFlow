export const DESCRIPTION_PROMPT = (prompt: string, tone: string = 'professional', keywords: string[] = []) => `
You are an expert eCommerce copywriter specializing in eBay UK listings.
Your task is to write an engaging, persuasive product description.

Product: ${prompt}
Tone: ${tone}
Keywords to include: ${keywords.join(', ')}

Structure:
1. Catchy headline.
2. 2-3 sentences about why this product is great.
3. Bullet points of key features.
4. Technical specifications if relevant.
5. "Why buy from us" section (Fast UK delivery, trusted seller).

Format: Use HTML tags (h2, p, ul, li, strong) for styling. Do not include a full HTML document structure, just the body content tags.
`;
