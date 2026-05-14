const axios = require('axios');
const cheerio = require('cheerio');

async function debug() {
    try {
        const res = await axios.get('https://animeav1.com/media/ganbare-nakamura-kun', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        
        console.log("Details Page HTML Sample:");
        // Title
        console.log("H1:", $('h1').text().trim());
        // Image
        console.log("Images:");
        $('img').each((i, el) => {
            console.log(`Image ${i}:`, $(el).attr('src'), "Alt:", $(el).attr('alt'));
        });
        // Synopsis
        console.log("Synopsis Candidate:", $('.text-subs.leading-relaxed').text().trim());

    } catch (e) {
        console.error(e.message);
    }
}
debug();
