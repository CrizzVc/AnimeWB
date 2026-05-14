const API_BASE_URL = 'http://localhost:3000';

export const fetchLatest = async (source = 'animeflv') => {
    const res = await fetch(`${API_BASE_URL}/api/latest?source=${source}`);
    const data = await res.json();
    return data.success ? data.data : [];
};

export const fetchDetails = async (url, source = 'animeflv') => {
    const res = await fetch(`${API_BASE_URL}/api/anime-details?url=${encodeURIComponent(url)}&source=${source}`);
    const data = await res.json();
    return data.success ? data.data : null;
};

export const fetchServers = async (url, source = 'animeflv') => {
    const res = await fetch(`${API_BASE_URL}/api/servers?url=${encodeURIComponent(url)}&source=${source}`);
    const data = await res.json();
    return data.success ? data.servers : [];
};

export const searchAnime = async (query, source = 'animeflv') => {
    const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&source=${source}`);
    const data = await res.json();
    return data.success ? data.data : [];
};

export const fetchCatalog = async (page = 1, source = 'animeflv') => {
    const res = await fetch(`${API_BASE_URL}/api/browse?page=${page}&source=${source}`);
    const data = await res.json();
    return data.success ? data.data : [];
};

export const extractStream = async (url) => {
    const res = await fetch(`${API_BASE_URL}/api/extract?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.success ? data : null;
};
