const axios = require('axios');
const { extractM3U8FromText } = require('../extractors/extractM3U8');
const { parseJWPlayer } = require('../extractors/parseJWPlayer');

module.exports = {
    name: 'Streamwish',
    canHandle: (url) => url.includes('streamwish') || url.includes('strwish') || url.includes('swish'),
    extract: async (url) => {
        try {
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const html = res.data;
            
            const { sources, tracks } = parseJWPlayer(html);
            if (sources.length > 0 && sources[0].file) {
                return {
                    streamUrl: sources[0].file,
                    isDirect: true,
                    subtitles: tracks || []
                };
            }
            
            const m3u8 = extractM3U8FromText(html);
            if (m3u8) {
                return {
                    streamUrl: m3u8,
                    isDirect: true,
                    subtitles: []
                };
            }
            
            throw new Error("No stream found in Streamwish");
        } catch (e) {
            console.error("Streamwish extractor error:", e.message);
            throw e;
        }
    }
};
