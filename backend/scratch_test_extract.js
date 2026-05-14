const axios = require('axios');

async function test() {
    try {
        console.log("Fetching servers...");
        const res = await axios.get('http://localhost:3000/api/servers?url=https://www4.animeflv.net/ver/one-piece-tv-1104');
        console.log(res.data);
        const servers = res.data.servers;
        if(servers && servers.length > 0) {
            console.log("Testing extraction on:", servers[0].code);
            const extRes = await axios.get(`http://localhost:3000/api/extract?url=${encodeURIComponent(servers[0].code)}`);
            console.log("Extraction Result:", extRes.data);
        }
    } catch(e) {
        console.error("Test failed", e.response ? e.response.data : e.message);
    }
}
test();
