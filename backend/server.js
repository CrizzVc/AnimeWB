const express = require('express');
const cors = require('cors');
const path = require('path');
const { animeProvider } = require('./providers/animeProvider');
const sources = require('./sources');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '..')));

// Middleware to get the correct source
const getSource = (req) => {
    const sourceId = req.query.source || req.headers['x-source'];
    return sources.getSource(sourceId);
};

app.get('/api/latest', async (req, res) => {
    try {
        const source = getSource(req);
        const data = await source.getLatest();
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Latest error:", error.message);
        return res.status(500).json({ error: "Failed to fetch latest episodes." });
    }
});

app.get('/api/anime-details', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing 'url' parameter" });

    try {
        const source = getSource(req);
        const data = await source.getDetails(url);
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Details error:", error.message);
        return res.status(500).json({ error: "Failed to fetch anime details." });
    }
});

app.get('/api/servers', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing 'url' parameter" });

    try {
        const source = getSource(req);
        const servers = await source.getServers(url);
        return res.json({ success: true, servers });
    } catch (error) {
        console.error("Servers error:", error.message);
        return res.status(500).json({ error: "Failed to fetch servers." });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing 'q' parameter" });

    try {
        const source = getSource(req);
        const data = await source.search(query);
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Search error:", error.message);
        return res.status(500).json({ error: "Failed to search anime." });
    }
});

app.get('/api/browse', async (req, res) => {
    const page = req.query.page || 1;
    try {
        const source = getSource(req);
        const data = await source.browse(page);
        return res.json({ success: true, data });
    } catch (error) {
        console.error("Browse error:", error.message);
        return res.status(500).json({ error: "Failed to browse anime." });
    }
});

app.get('/api/extract', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing 'url' parameter" });

    try {
        const result = await animeProvider.extract(url);
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("Extraction error for", url, error.message);
        return res.status(500).json({ error: "Extraction failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Modular Anime Backend running at http://localhost:${PORT}`);
});
