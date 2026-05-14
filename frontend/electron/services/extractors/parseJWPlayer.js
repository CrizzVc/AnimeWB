const parseJWPlayer = (html) => {
    const result = {
        sources: [],
        tracks: []
    };

    try {
        const sourcesMatch = html.match(/sources:\s*(\[[^\]]+\])/);
        if (sourcesMatch) {
            const sourcesStr = sourcesMatch[1];
            const fileRegex = /file\s*:\s*["']([^"']+)["']/g;
            
            let match;
            while ((match = fileRegex.exec(sourcesStr)) !== null) {
                result.sources.push({ file: match[1] });
            }
        }

        const tracksMatch = html.match(/tracks:\s*(\[[^\]]+\])/);
        if (tracksMatch) {
            const tracksStr = tracksMatch[1];
            const trackBlocks = tracksStr.split('}').filter(b => b.includes('file'));
            
            trackBlocks.forEach(block => {
                const fileM = block.match(/file\s*:\s*["']([^"']+)["']/);
                const labelM = block.match(/label\s*:\s*["']([^"']+)["']/);
                const kindM = block.match(/kind\s*:\s*["']([^"']+)["']/);
                
                if (fileM && (!kindM || kindM[1] === 'captions' || kindM[1] === 'subtitles')) {
                    result.tracks.push({
                        file: fileM[1],
                        label: labelM ? labelM[1] : 'Subtítulos'
                    });
                }
            });
        }
    } catch (error) {
        console.error("Error parsing JWPlayer config:", error);
    }

    return result;
};

module.exports = {
    parseJWPlayer
};
