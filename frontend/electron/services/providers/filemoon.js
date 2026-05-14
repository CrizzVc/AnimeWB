const axios = require('axios');
const { extractM3U8FromText } = require('../extractors/extractM3U8');
const { extractPacked } = require('../extractors/decodeSources');

module.exports = {
    name: 'Filemoon',
    canHandle: (url) => url.includes('filemoon') || url.includes('fmoon'),
    extract: async (url) => {
        try {
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = res.data;
            
            let m3u8 = extractM3U8FromText(html);
            if (m3u8) {
                return {
                    streamUrl: m3u8,
                    isDirect: true,
                    subtitles: []
                };
            }
            
            const packedScripts = extractPacked(html);
            if (packedScripts.length > 0) {
                console.log("Filemoon stream is packed. Real extraction requires unpacker.");
            }
            
            throw new Error("No stream found in Filemoon or stream is obfuscated.");
        } catch (e) {
            console.error("Filemoon extractor error:", e.message);
            throw e;
        }
    }
};
