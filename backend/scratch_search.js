const axios = require('axios');
const cheerio = require('cheerio');

async function testSearch() {
    try {
        const response = await axios.get('https://www4.animeflv.net/browse?q=naruto', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        const results = [];
        $('.ListAnimes li article').each((i, el) => {
            const title = $(el).find('.Title').text().trim();
            const url = 'https://www4.animeflv.net' + $(el).find('a').attr('href');
            let image = $(el).find('img').attr('src');
            if (image && image.startsWith('/')) image = 'https://www4.animeflv.net' + image;
            results.push({ title, url, image });
        });
        console.log(results.slice(0, 3));
    } catch (e) {
        console.error(e);
    }
}

testSearch();
