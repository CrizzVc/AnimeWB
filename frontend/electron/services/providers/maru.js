const axios = require('axios');

module.exports = {
    name: 'Maru',
    canHandle: (url) => url.includes('ok.ru') || url.includes('maru'),
    extract: async (url) => {
        try {
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const html = res.data;
            
            const match = html.match(/data-options="([^"]+)"/);
            if (match) {
                const optionsStr = match[1].replace(/&quot;/g, '"');
                const options = JSON.parse(optionsStr);
                
                if (options.flashvars && options.flashvars.metadataUrl) {
                    const metaRes = await axios.get(decodeURIComponent(options.flashvars.metadataUrl), {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    const metaJSON = metaRes.data;
                    
                    if (metaJSON.hlsManifestUrl) {
                        return {
                            streamUrl: metaJSON.hlsManifestUrl,
                            isDirect: true,
                            subtitles: []
                        };
                    }
                }
            }
            
            throw new Error("No stream found in Maru/Ok.ru");
        } catch (e) {
            console.error("Maru extractor error:", e.message);
            throw e;
        }
    }
};
