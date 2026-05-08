const axios=require('axios');
const cheerio=require('cheerio');
axios.get('https://www4.animeflv.net/ver/naruto-1',{headers:{'User-Agent':'Mozilla/5.0'}})
.then(r => {
    const $ = cheerio.load(r.data); 
    const animeLink = $('.CapNvLs').attr('href'); 
    console.log('Anime Link:', animeLink); 
}).catch(console.error);
