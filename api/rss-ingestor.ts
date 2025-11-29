// Vercel Serverless Function: api/rss-ingestor.ts
// This function fetches news headlines from predefined RSS feeds and stores them
// in a database table for the main news generator to process.

const RSS_FEEDS = [
    { source: 'Kooora', url: 'https://www.kooora.com/rss/main.xml' },
    { source: 'Goal.com', url: 'https://www.goal.com/ar/feeds/news' },
    { source: 'Sky Sports', url: 'https://www.skysports.com/rss/12040' }
];

const parseRssFeed = async (feedUrl: string, source: string) => {
    console.log(`Simulating fetch from ${feedUrl}`);
    await new Promise(res => setTimeout(res, 200)); 
    const mockItems = [
        { title: `خبر عاجل من ${source}: الهلال يفوز بالدوري`, link: `https://example.com/news/${Date.now()}`, pubDate: new Date().toISOString() },
        { title: `صفقة انتقال كبرى في ${source}`, link: `https://example.com/news/${Date.now()+1}`, pubDate: new Date().toISOString() },
    ];
    return mockItems;
};

export default async function handler(request: any, response: any) {
    const authHeader = request.headers['authorization'];
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedSecret) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
        let totalIngested = 0;
        
        for (const feed of RSS_FEEDS) {
            try {
                const items = await parseRssFeed(feed.url, feed.source);
                // In the real version, we would save `items` to Supabase here.
                // For now, we just log that we received them.
                console.log(`Ingested ${items.length} items from ${feed.source}.`);
                totalIngested += items.length;
            } catch (feedError) {
                console.error(`Failed to process feed ${feed.source}:`, feedError);
            }
        }
        
        return response.status(200).json({ message: `Successfully ingested ${totalIngested} new potential stories.` });

    } catch (error: any) {
        console.error("Error in rss-ingestor handler:", error);
        return response.status(500).json({ error: error.message });
    }
}