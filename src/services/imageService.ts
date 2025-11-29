
// This service acts as a "Virtual Image Server"
// Since we cannot scrape or host images directly in the browser environment,
// we map keywords (returned by AI) to a curated list of high-quality, reliable URLs.

// We use "Vibe-based" image selection. Instead of 1 specific image for Al-Hilal, 
// we have a pool of "Blue Football" images that fit the context 90% of the time.

const IMAGE_POOLS = {
  // Blue Vibe (Hilal, Kuwait, Zenit style)
  BLUE: [
    'https://images.unsplash.com/photo-1563299796-b729d0af54a5?auto=format&fit=crop&q=80&w=1000', // Stadium Blue
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=1000', // Blue player
    'https://images.unsplash.com/photo-1628891638290-72124506371c?auto=format&fit=crop&q=80&w=1000', // Blue kit
    'https://images.unsplash.com/photo-1566932769119-7a1fb6d7ce23?auto=format&fit=crop&q=80&w=1000', // Blue crowd
    'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=1000', // Football on blue field
    'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1000', // Dark Blue
    'https://images.unsplash.com/photo-1551280857-2b9be51c84dd?auto=format&fit=crop&q=80&w=1000', // Blue shirt back
  ],

  // Yellow Vibe (Nassr, Ittihad, Wasl, Qadsia)
  YELLOW: [
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&q=80&w=1000', // Yellow/Black
    'https://images.unsplash.com/photo-1610996884021-3b7c433362a2?auto=format&fit=crop&q=80&w=1000', // Yellow Jersey
    'https://images.unsplash.com/photo-1544698310-74ea9d188d17?auto=format&fit=crop&q=80&w=1000', // Yellow Training
    'https://images.unsplash.com/photo-1628717341663-0007b0ee2597?auto=format&fit=crop&q=80&w=1000', // Yellow Vibe
    'https://images.unsplash.com/photo-1569512349884-a690e8c89895?auto=format&fit=crop&q=80&w=1000', // Gold/Trophy
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&q=80&w=1000', // Bright Stadium
  ],

  // Red Vibe (Ahli UAE, Duhail, Bahrain, Oman)
  RED: [
    'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?auto=format&fit=crop&q=80&w=1000', // Red Stadium
    'https://images.unsplash.com/photo-1494199505231-85c78c3c9940?auto=format&fit=crop&q=80&w=1000', // Red Ball
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=1000', // Red Action
    'https://images.unsplash.com/photo-1599309650228-406b74549f3e?auto=format&fit=crop&q=80&w=1000', // Red Kit
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000', // Red Flare/Crowd
    'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&q=80&w=1000', // Red intense
  ],

  // Green Vibe (Ahli Saudi, Saudi National, Ettifaq)
  GREEN: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000', // Green Field Focus
    'https://images.unsplash.com/photo-1624880357913-a8539238245b?auto=format&fit=crop&q=80&w=1000', // Green Stadium
    'https://images.unsplash.com/photo-1580218868662-7935478441c2?auto=format&fit=crop&q=80&w=1000', // Green/White
    'https://images.unsplash.com/photo-1556637319-a9c1488c227b?auto=format&fit=crop&q=80&w=1000', // Green Grass
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000', // Green shirt
  ],

  // White/Black/Neutral Vibe (Sadd, Shabab, General)
  NEUTRAL: [
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=1000', // Player Kicking
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1000', // Ball Net
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1000', // Night Match
    'https://images.unsplash.com/photo-1510051640316-cee39563ddab?auto=format&fit=crop&q=80&w=1000', // Floodlights
    'https://images.unsplash.com/photo-1551972251-12070d63502a?auto=format&fit=crop&q=80&w=1000', // Tactics/Coach
    'https://images.unsplash.com/photo-1606925797300-0b35e9d17927?auto=format&fit=crop&q=80&w=1000', // Trophy
    'https://images.unsplash.com/photo-1626248982390-3460bb07604d?auto=format&fit=crop&q=80&w=1000', // VAR/Ref
  ],

  // Specific Stars (Approximate lookalikes or public domain if available, mostly reusing vibes for now to be safe)
  RONALDO: [
     'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/800px-Cristiano_Ronaldo_2018.jpg',
     'https://upload.wikimedia.org/wikipedia/commons/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg'
  ],
  NEYMAR: [
      'https://upload.wikimedia.org/wikipedia/commons/b/bb/Neymar_Jr._with_Al_Hilal%2C_3_October_2023_-_03_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Neymar_850_1705.jpg/800px-20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Neymar_850_1705.jpg'
  ]
};

// Map keywords to specific pools
const KEYWORD_MAPPING: Record<string, string[]> = {
  // Blue Teams
  'الهلال': IMAGE_POOLS.BLUE,
  'hilal': IMAGE_POOLS.BLUE,
  'الكويت': IMAGE_POOLS.BLUE,
  'kuwait': IMAGE_POOLS.BLUE,
  'الغرافة': IMAGE_POOLS.BLUE,
  'النصر الاماراتي': IMAGE_POOLS.BLUE,

  // Yellow Teams
  'النصر': IMAGE_POOLS.YELLOW,
  'nassr': IMAGE_POOLS.YELLOW,
  'الاتحاد': IMAGE_POOLS.YELLOW,
  'ittihad': IMAGE_POOLS.YELLOW,
  'الوصل': IMAGE_POOLS.YELLOW,
  'wasl': IMAGE_POOLS.YELLOW,
  'القادسية': IMAGE_POOLS.YELLOW,

  // Red Teams
  'الدحيل': IMAGE_POOLS.RED,
  'الريان': IMAGE_POOLS.RED,
  'العربي': IMAGE_POOLS.RED,
  'البحرين': IMAGE_POOLS.RED,
  'عمان': IMAGE_POOLS.RED,
  'oman': IMAGE_POOLS.RED,
  'الاهلي الاماراتي': IMAGE_POOLS.RED,
  'شباب الاهلي': IMAGE_POOLS.RED,

  // Green Teams
  'الاهلي': IMAGE_POOLS.GREEN,
  'ahli': IMAGE_POOLS.GREEN,
  'السعودية': IMAGE_POOLS.GREEN,
  'saudi': IMAGE_POOLS.GREEN,
  'الاتفاق': IMAGE_POOLS.GREEN,

  // Stars
  'رونالدو': IMAGE_POOLS.RONALDO,
  'ronaldo': IMAGE_POOLS.RONALDO,
  'نيمار': IMAGE_POOLS.NEYMAR,
  'neymar': IMAGE_POOLS.NEYMAR,
};

const getRandomImage = (pool: string[]): string => {
  if (!pool || pool.length === 0) return IMAGE_POOLS.NEUTRAL[0];
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getSmartImageUrl = (keyword?: string | null): string => {
  if (!keyword) return getRandomImage(IMAGE_POOLS.NEUTRAL);

  const lowerKey = keyword.toLowerCase().trim();
  
  // 1. Check specific mapping
  for (const [key, pool] of Object.entries(KEYWORD_MAPPING)) {
    if (lowerKey.includes(key)) {
      return getRandomImage(pool);
    }
  }

  // 2. Fallback based on league context clues in keyword
  if (lowerKey.includes('سعودي') || lowerKey.includes('saudi')) return getRandomImage(IMAGE_POOLS.GREEN);
  if (lowerKey.includes('امارات') || lowerKey.includes('uae')) return getRandomImage(IMAGE_POOLS.NEUTRAL);
  if (lowerKey.includes('أحمر') || lowerKey.includes('red')) return getRandomImage(IMAGE_POOLS.RED);
  if (lowerKey.includes('أزرق') || lowerKey.includes('blue')) return getRandomImage(IMAGE_POOLS.BLUE);

  // 3. Final Fallback
  return getRandomImage(IMAGE_POOLS.NEUTRAL);
};
