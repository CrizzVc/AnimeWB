const API_BASE_URL = 'http://localhost:3000'; // Assume backend is on 3000

export const fetchLatest = async () => {
    const res = await fetch(`${API_BASE_URL}/api/latest`);
    const data = await res.json();
    return data.success ? data.data : [];
};

export const fetchDetails = async (url) => {
    const res = await fetch(`${API_BASE_URL}/api/anime-details?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.success ? data.data : null;
};

export const fetchServers = async (url) => {
    const res = await fetch(`${API_BASE_URL}/api/servers?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    return data.success ? data.servers : [];
};

export const searchAnime = async (query) => {
    const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.success ? data.data : [];
};
