const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow TV app to connect

// Serve the frontend files (webOS TV app) from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Helper function to get Anime details from an anime page HTML
function extractAnimeDetails(html) {
    const $ = cheerio.load(html); 
    const title = $('h1.Title').text().trim();
    const synopsis = $('.Description p').text().trim();
    let cover = $('.AnimeCover .Image figure img').attr('src');
    if (cover && cover.startsWith('/')) {
        cover = 'https://www4.animeflv.net' + cover;
    }
    
    let episodes = [];
    $('script').each((i, el) => {
        const text = $(el).html();
        if(text && text.includes('var episodes = [')) {
            const match = text.match(/var episodes = (\[.*?\]);/);
            const animeSlugMatch = text.match(/var anime_info = \[.*,"(.*?)",/);
            
            if(match && animeSlugMatch) {
                try {
                    const epData = JSON.parse(match[1]); // e.g. [[220, 12345], [219, 12344]] -> [EpisodeNum, EpisodeId]
                    const animeSlug = animeSlugMatch[1];
                    episodes = epData.map(e => ({
                        episode: e[0],
                        url: `https://www4.animeflv.net/ver/${animeSlug}-${e[0]}`
                    }));
                } catch (e) {
                    console.error("Error parsing episodes array:", e);
                }
            }
        }
    });
    
    return { title, synopsis, cover, episodes };
}

app.get('/api/servers', async (req, res) => {
    const episodeUrl = req.query.url;
    if (!episodeUrl) return res.status(400).json({ error: "Missing 'url' parameter" });

    try {
        const response = await axios.get(episodeUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = response.data;
        const $ = cheerio.load(html);
        let serversJson = null;

        $('script').each((index, element) => {
            const scriptContent = $(element).html();
            if (scriptContent && scriptContent.includes('var videos = {')) {
                const match = scriptContent.match(/var videos = (\{.*?\});/);
                if (match && match[1]) {
                    try { serversJson = JSON.parse(match[1]); } catch (e) {}
                }
            }
        });

        if (serversJson && serversJson.SUB) {
            return res.json({ success: true, servers: serversJson.SUB });
        } else {
            return res.status(404).json({ error: "Could not find video servers in the page." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch from AnimeFLV." });
    }
});

app.get('/api/latest', async (req, res) => {
    try {
        const response = await axios.get('https://www4.animeflv.net/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const latestEpisodes = [];

        $('.ListEpisodios li a').each((index, element) => {
            const urlPath = $(element).attr('href');
            const url = 'https://www4.animeflv.net' + urlPath;
            const title = $(element).find('.Title').text().trim();
            const episode = $(element).find('.Capi').text().trim();
            let image = $(element).find('img').attr('src');
            if (image && image.startsWith('/')) image = 'https://www4.animeflv.net' + image;

            latestEpisodes.push({ title, episode, image, url });
        });

        return res.json({ success: true, data: latestEpisodes });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch latest episodes." });
    }
});

app.get('/api/anime-details', async (req, res) => {
    const inputUrl = req.query.url;
    if (!inputUrl) return res.status(400).json({ error: "Missing 'url' parameter" });

    try {
        let animeUrl = inputUrl;
        
        // If it's an episode URL, fetch it first to find the Anime link
        if (inputUrl.includes('/ver/')) {
            const epResponse = await axios.get(inputUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ep = cheerio.load(epResponse.data);
            const animePath = $ep('.CapNvLs').attr('href');
            if (!animePath) return res.status(404).json({ error: "Could not find anime link in episode." });
            animeUrl = 'https://www4.animeflv.net' + animePath;
        }

        // Fetch Anime Page
        const response = await axios.get(animeUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const details = extractAnimeDetails(response.data);
        return res.json({ success: true, data: details });

    } catch (error) {
        console.error("Error fetching anime details:", error.message);
        return res.status(500).json({ error: "Failed to fetch anime details." });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing 'q' parameter" });

    try {
        const response = await axios.get(`https://www4.animeflv.net/browse?q=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('.ListAnimes li article').each((i, el) => {
            // AnimeFLV has the title in an <h3> with class Title
            const title = $(el).find('h3.Title').text().trim();
            const urlPath = $(el).find('a').attr('href');
            const url = 'https://www4.animeflv.net' + urlPath;
            let image = $(el).find('img').attr('src');
            if (image && image.startsWith('/')) image = 'https://www4.animeflv.net' + image;

            results.push({ title, url, image });
        });

        return res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error in search:", error.message);
        return res.status(500).json({ error: "Failed to search anime." });
    }
});

app.get('/api/browse', async (req, res) => {
    const page = req.query.page || 1;
    try {
        const response = await axios.get(`https://www4.animeflv.net/browse?page=${page}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('.ListAnimes li article').each((i, el) => {
            const title = $(el).find('h3.Title').text().trim();
            const urlPath = $(el).find('a').attr('href');
            const url = 'https://www4.animeflv.net' + urlPath;
            let image = $(el).find('img').attr('src');
            if (image && image.startsWith('/')) image = 'https://www4.animeflv.net' + image;

            results.push({ title, url, image });
        });

        return res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error in browse:", error.message);
        return res.status(500).json({ error: "Failed to browse anime." });
    }
});

app.listen(PORT, () => {
    console.log(`AnimeFLV Scraper Backend running at http://localhost:${PORT}`);
});
