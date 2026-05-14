const axios = require('axios');
const { extractMP4FromText } = require('../extractors/extractM3U8');

module.exports = {
    name: 'YourUpload',
    canHandle: (url) => url.includes('yourupload'),
    extract: async (url) => {
        try {
            const embedUrl = url.includes('/watch/') ? url.replace('/watch/', '/embed/') : url;
            
            const res = await axios.get(embedUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.yourupload.com/' }
            });
            const html = res.data;
            
            const metaMatch = html.match(/property="og:video"\s*content="([^"]+)"/);
            if (metaMatch) {
                return {
                    streamUrl: metaMatch[1],
                    isDirect: true,
                    subtitles: []
                };
            }

            const mp4 = extractMP4FromText(html);
            if (mp4) {
                return {
                    streamUrl: mp4,
                    isDirect: true,
                    subtitles: []
                };
            }
            
            throw new Error("No stream found in YourUpload");
        } catch (e) {
            console.error("YourUpload extractor error:", e.message);
            throw e;
        }
    }
};
