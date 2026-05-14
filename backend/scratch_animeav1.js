const axios = require('axios');
const cheerio = require('cheerio');

async function testAnimeAV1() {
    try {
        console.log("Fetching home page...");
        const response = await axios.get('https://animeav1.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        
        console.log("Latest Episodes:");
        const latest = [];
        // Based on subagent: div.grid within recent updates
        // Let's try to find them. 
        // Searching for text "Episodios RECIENTEMENTE ACTUALIZADO"
        const sectionTitle = $('h2').filter((i, el) => $(el).text().includes('RECIENTEMENTE ACTUALIZADO'));
        const grid = sectionTitle.next('div.grid');
        
        grid.find('> div').each((i, el) => {
            if (i >= 5) return;
            const link = $(el).find('a[href^="/media/"]');
            const title = $(el).find('div.font-bold').text().trim();
            const episode = $(el).find('div.text-xs').text().trim();
            const image = $(el).find('img').attr('src');
            latest.push({ title, episode, image, url: 'https://animeav1.com' + link.attr('href') });
        });
        console.log(latest);

        console.log("\nTesting Search (Naruto)...");
        // Check if there is a search endpoint. Usually it's /search?q=
        const searchResponse = await axios.get('https://animeav1.com/search?q=naruto', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $s = cheerio.load(searchResponse.data);
        const results = [];
        $s('div.grid > div').each((i, el) => {
            if (i >= 5) return;
            const link = $(el).find('a[href^="/media/"]');
            const title = $(el).find('div.font-bold').text().trim();
            const image = $(el).find('img').attr('src');
            results.push({ title, image, url: 'https://animeav1.com' + link.attr('href') });
        });
        console.log(results);

    } catch (e) {
        console.error(e.message);
    }
}

testAnimeAV1();
