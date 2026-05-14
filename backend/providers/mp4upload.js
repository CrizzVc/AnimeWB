const axios = require('axios');

const mp4upload = {
    name: 'MP4Upload',
    canHandle: (url) => url.includes('mp4upload.com'),
    extract: async (url) => {
        const embedUrl = url.includes('embed-') ? url : url.replace('.com/', '.com/embed-') + '.html';
        const response = await axios.get(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = response.data;
        
        // MP4Upload uses a packed script or direct src in script
        // Look for: player.src("https://... .mp4")
        const srcMatch = html.match(/src:\s*"(https:\/\/.*?\.mp4)"/);
        if (srcMatch) {
            return {
                streamUrl: srcMatch[1],
                type: 'mp4'
            };
        }
        
        // Alternative match
        const scriptMatch = html.match(/script[\s\S]*?player\.src\("(.*?)"\)/);
        if (scriptMatch) {
            return {
                streamUrl: scriptMatch[1],
                type: 'mp4'
            };
        }

        throw new Error("Could not find video source in MP4Upload");
    }
};

module.exports = mp4upload;
