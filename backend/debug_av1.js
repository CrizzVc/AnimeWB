const axios = require('axios');
const cheerio = require('cheerio');

async function debug() {
    try {
        const res = await axios.get('https://animeav1.com/media/rezero-kara-hajimeru-isekai-seikatsu-4th-season', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        
        console.log("Searching for related/similar anime...");
        // Look for sections like "También te puede gustar" or "Relacionados"
        const section = $('h2, h3').filter((i, el) => {
            const text = $(el).text().toLowerCase();
            return text.includes('relacionado') || text.includes('gustar') || text.includes('similares');
        });
        
        console.log("Section found:", section.text());
        
        const grid = section.nextAll('.grid').first();
        const related = [];
        grid.children().each((i, el) => {
            const title = $(el).find('header div, div.font-bold, h3').first().text().trim();
            const url = $(el).find('a').attr('href');
            const image = $(el).find('img').attr('src');
            if (url) {
                related.push({ title, url: 'https://animeav1.com' + url, image });
            }
        });
        
        console.log("Related items found:", related.length);
        if (related.length > 0) console.log("First related:", related[0]);

    } catch (e) {
        console.error(e.message);
    }
}
debug();
