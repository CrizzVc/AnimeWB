const axios = require('axios');
const cheerio = require('cheerio');

async function debug() {
    try {
        const res = await axios.get('https://animeav1.com/media/rezero-kara-hajimeru-isekai-seikatsu-4th-season', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        
        console.log("Dumping all elements with text that looks like a badge:");
        $('[class*="bg-"]').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 0 && text.length < 30) {
                console.log(`Class: ${$(el).attr('class')} | Text: ${text}`);
            }
        });

    } catch (e) {
        console.error(e.message);
    }
}
debug();
