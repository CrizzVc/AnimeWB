const axios=require('axios');
const cheerio=require('cheerio');
axios.get('https://www4.animeflv.net/anime/naruto',{headers:{'User-Agent':'Mozilla/5.0'}})
.then(r => {
    const $ = cheerio.load(r.data); 
    const title = $('h1.Title').text().trim();
    const synopsis = $('.Description p').text().trim();
    const cover = 'https://www4.animeflv.net' + $('.AnimeCover .Image figure img').attr('src');
    
    let episodes = [];
    $('script').each((i, el) => {
        const text = $(el).html();
        if(text.includes('var episodes = [')) {
            const match = text.match(/var episodes = (\[.*?\]);/);
            if(match) {
                const epData = JSON.parse(match[1]); // e.g. [[220, 12345], [219, 12344]] -> [EpisodeNum, EpisodeId]
                const animeSlug = text.match(/var anime_info = \[.*,"(.*?)",/)[1];
                episodes = epData.map(e => ({
                    episode: e[0],
                    url: `https://www4.animeflv.net/ver/${animeSlug}-${e[0]}`
                }));
            }
        }
    });
    console.log({title, synopsis: synopsis.substring(0, 50), cover, episodesCount: episodes.length, firstEp: episodes[0]});
}).catch(console.error);
