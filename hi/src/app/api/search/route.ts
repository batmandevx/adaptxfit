import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const num = Math.min(parseInt(searchParams.get('num') || '8'), 20);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Import ZAI SDK (server-side only)
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const results = await zai.functions.invoke('web_search', {
      query: query.trim(),
      num: num,
    });

    return NextResponse.json({
      success: true,
      query: query,
      totalResults: results.length,
      results: results.map((item: any) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        domain: item.host_name,
        date: item.date,
        favicon: item.favicon,
      })),
    });
  } catch (error) {
    // The optional web-search SDK (z-ai-web-dev-sdk) needs a config/key that may
    // not be present in this environment. Degrade gracefully with an empty result
    // set (HTTP 200) instead of surfacing a 500 error to the UI.
    console.warn('Search unavailable:', error instanceof Error ? error.message : error);
    let q = '';
    try {
      q = new URL(req.url).searchParams.get('q') ?? '';
    } catch {
      /* ignore */
    }
    return NextResponse.json({
      success: false,
      query: q,
      totalResults: 0,
      results: [],
      message: 'Live web search is currently unavailable.',
    });
  }
}
