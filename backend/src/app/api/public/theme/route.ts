import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cached = await cache.get('public:theme');
    if (cached) return NextResponse.json(cached);

    const theme = await prisma.themeDesign.findFirst({
      where: { isActive: true, isDefault: true },
    });

    if (!theme) {
      return NextResponse.json({});
    }

    const result = {
      colors: theme.colors,
      fontFamily: theme.fontFamily,
      fontSizes: theme.fontSizes,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows,
      animations: theme.animations,
      layout: theme.layout,
    };

    await cache.set('public:theme', result, 300);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({});
  }
}
