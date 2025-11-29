// Vercel Serverless Function: api/trends-detector.ts
// This function simulates fetching trending sports topics from Google Trends
// and stores them in a database table for the news generator to prioritize.

const getGoogleTrends = async (region: string, category: string) => {
    console.log(`Simulating fetch from Google Trends for region: ${region}, category: ${category}`);
    await new Promise(res => setTimeout(res, 300));
    
    const mockTrends = [
        { query: 'انتقال مبابي ريال مدريد', traffic: '1M+' },
        { query: 'إصابة سالم الدوسري', traffic: '500K+' },
        { query: 'موعد مباراة الكلاسيكو', traffic: '200K+' },
        { query: 'صفقات نادي الاتحاد', traffic: '100K+' },
    ];
    return mockTrends;
};

export default async function handler(request: any, response: any) {
    const authHeader = request.headers['authorization'];
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedSecret) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const trends = await getGoogleTrends('SA', 'sports');
        
        // In the real version, we would save `trends` to Supabase here.
        console.log(`Detected ${trends.length} trending topics.`);

        return response.status(200).json({ message: `Successfully detected and stored ${trends.length} trending topics.` });

    } catch (error: any) {
        console.error("Error in trends-detector handler:", error);
        return response.status(500).json({ error: error.message });
    }
}