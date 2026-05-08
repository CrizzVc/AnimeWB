// webOS TV Advanced Navigation Logic
const API_BASE_URL = 'http://192.168.1.17:3000'; // Cambia esto si tu IP cambia

document.addEventListener('DOMContentLoaded', async () => {
    // States
    const STATES = {
        CAROUSEL: 'CAROUSEL',
        ACTION_MODAL: 'ACTION_MODAL',
        DETAILS: 'DETAILS',
        SERVER_MODAL: 'SERVER_MODAL',
        PLAYER: 'PLAYER',
        SEARCH: 'SEARCH'
    };
    let currentState = STATES.CAROUSEL;

    // DOM Elements
    const statusElement = document.getElementById('status');
    const heroBg = document.getElementById('hero-bg');
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    
    // Header Elements
    const searchBtn = document.getElementById('btn-search');
    
    // Carousel Elements
    const latestCarousel = document.getElementById('carousel');
    const favCarousel = document.getElementById('carousel-fav');
    const favContainer = document.getElementById('fav-carousel-container');

    // Action Modal Elements
    const actionModal = document.getElementById('action-modal');
    const btnActionPlay = document.getElementById('btn-action-play');
    const btnActionDetails = document.getElementById('btn-action-details');
    
    // Details Elements
    const detailsView = document.getElementById('details-view');
    const detailsCover = document.getElementById('details-cover');
    const detailsTitle = document.getElementById('details-title');
    const detailsSynopsis = document.getElementById('details-synopsis');
    const detailsEpisodesContainer = document.getElementById('details-episodes');
    const btnDetailFav = document.getElementById('btn-detail-fav');

    // Server Modal Elements
    const serverModal = document.getElementById('server-modal');
    const serverButtonsContainer = document.getElementById('server-buttons');

    // Search Elements
    const searchView = document.getElementById('search-view');
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');

    // Player Elements
    const playerOverlay = document.getElementById('player-overlay');
    const videoFrame = document.getElementById('video-frame');
    const playerTitle = document.getElementById('player-title');
    
    // Data & Navigation State
    let episodesData = [];
    let favoritesData = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    let rowIdx = 0; // -1: Header, 0: Latest, 1: Favorites
    let colIdx = 0;
    
    let actionModalIdx = 0; // 0 = Reproducir, 1 = Mas Episodios
    let targetAnime = null; // Current anime object for actions
    
    let detailEpisodesData = [];
    let detailIdx = 0;
    let isDetailFavFocused = false;
    
    let serverButtons = [];
    let serverIdx = 0;

    let searchResultsData = [];
    let searchGridIdx = 0;

    // Initialize clock
    setInterval(() => {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
    }, 1000);

    // Initial Load
    renderFavorites();
    fetchLatest();

    async function fetchLatest() {
        statusElement.innerText = "Conectando...";
        try {
            const response = await fetch(`${API_BASE_URL}/api/latest`);
            const result = await response.json();
            if (result.success && result.data) {
                episodesData = result.data;
                renderCarousel(latestCarousel, episodesData);
                rowIdx = 0;
                updateFocusMain();
                statusElement.innerText = "";
            }
        } catch (e) {
            statusElement.innerText = "Error.";
        }
    }

    // --- FAVORITES LOGIC ---
    function toggleFavorite(anime) {
        const index = favoritesData.findIndex(f => f.url === anime.url);
        if (index > -1) {
            favoritesData.splice(index, 1);
            btnDetailFav.classList.remove('active');
        } else {
            favoritesData.unshift({
                title: anime.title,
                url: anime.url,
                image: anime.image || anime.cover
            });
            btnDetailFav.classList.add('active');
        }
        localStorage.setItem('favorites', JSON.stringify(favoritesData));
        renderFavorites();
    }

    function renderFavorites() {
        if (favoritesData.length === 0) {
            favContainer.classList.add('hidden');
        } else {
            favContainer.classList.remove('hidden');
            renderCarousel(favCarousel, favoritesData);
        }
    }

    // --- CAROUSEL RENDERING ---
    function renderCarousel(container, data) {
        container.innerHTML = '';
        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'card focusable';
            card.style.backgroundImage = `url('${item.image || item.cover}')`;
            card.innerHTML = `
                <div class="card-info">
                    ${item.episode ? `<div class="card-episode">${item.episode}</div>` : ''}
                    <div class="card-title">${item.title}</div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function updateFocusMain() {
        searchBtn.classList.remove('focused');
        document.querySelectorAll('.card').forEach(el => el.classList.remove('focused'));

        if (rowIdx === -1) {
            searchBtn.classList.add('focused');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const container = rowIdx === 0 ? latestCarousel : favCarousel;
        const parentContainer = rowIdx === 0 ? document.getElementById('latest-carousel-container') : favContainer;
        const data = rowIdx === 0 ? episodesData : favoritesData;
        
        if (colIdx < 0) colIdx = 0;
        if (colIdx >= data.length) colIdx = data.length - 1;

        const cards = container.querySelectorAll('.card');
        if (cards[colIdx]) {
            cards[colIdx].classList.add('focused');
            
            // Horizontal Scroll
            const cardWidth = 310;
            const offset = colIdx * cardWidth;
            container.style.transform = `translateX(-${Math.max(0, offset - 300)}px)`;
            
            // Vertical Scroll (Camera follow)
            parentContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Update Hero
            const item = data[colIdx];
            heroBg.style.backgroundImage = `url('${item.image || item.cover}')`;
            heroTitle.innerText = item.title;
            heroSubtitle.innerText = item.episode || "Anime";
        }
    }

    // --- SEARCH ---
    function openSearchView() {
        currentState = STATES.SEARCH;
        searchView.classList.remove('hidden');
        searchResultsContainer.innerHTML = '';
        searchResultsData = [];
        searchInput.value = '';
        searchInput.focus();
    }

    function closeSearchView() {
        searchView.classList.add('hidden');
        currentState = STATES.CAROUSEL;
        rowIdx = -1;
        updateFocusMain();
    }

    async function performSearch(query) {
        if (!query) return;
        statusElement.innerText = `Buscando "${query}"...`;
        try {
            const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
            const result = await res.json();
            if (result.success && result.data) {
                searchResultsData = result.data;
                renderSearchResults();
                if (searchResultsData.length > 0) {
                    searchInput.blur();
                    updateFocusSearchGrid(0);
                }
            }
        } catch (e) { statusElement.innerText = "Error."; }
    }

    function renderSearchResults() {
        searchResultsContainer.innerHTML = '';
        searchResultsData.forEach((anime, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.backgroundImage = `url('${anime.image}')`;
            card.innerHTML = `<div class="card-info"><div class="card-title">${anime.title}</div></div>`;
            searchResultsContainer.appendChild(card);
        });
    }

    function updateFocusSearchGrid(idx) {
        if (idx < 0) idx = 0;
        if (idx >= searchResultsData.length) idx = searchResultsData.length - 1;
        searchGridIdx = idx;
        const cards = searchResultsContainer.querySelectorAll('.card');
        cards.forEach((el, i) => {
            if (i === idx) {
                el.classList.add('focused');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else el.classList.remove('focused');
        });
        if (idx >= 0) searchInput.blur();
    }

    // --- ACTION MODAL ---
    function openActionModal(anime) {
        currentState = STATES.ACTION_MODAL;
        targetAnime = anime;
        actionModal.classList.remove('hidden');
        updateFocusActionModal(0);
    }
    
    function closeActionModal() {
        actionModal.classList.add('hidden');
        if (detailsView.classList.contains('hidden')) {
            if (!searchView.classList.contains('hidden')) {
                currentState = STATES.SEARCH;
                updateFocusSearchGrid(searchGridIdx);
            } else {
                currentState = STATES.CAROUSEL;
                updateFocusMain();
            }
        }
    }

    function updateFocusActionModal(idx) {
        if (idx < 0) idx = 0;
        if (idx > 1) idx = 1;
        actionModalIdx = idx;
        btnActionPlay.classList.toggle('focused', idx === 0);
        btnActionDetails.classList.toggle('focused', idx === 1);
    }

    // --- DETAILS VIEW ---
    async function openDetailsView() {
        statusElement.innerText = "Cargando...";
        try {
            const res = await fetch(`${API_BASE_URL}/api/anime-details?url=${encodeURIComponent(targetAnime.url)}`);
            const result = await res.json();
            if (result.success && result.data) {
                const data = result.data;
                detailsTitle.innerText = data.title;
                detailsSynopsis.innerText = data.synopsis || "Sin sinopsis.";
                detailsCover.src = data.cover;
                detailEpisodesData = data.episodes;
                detailsEpisodesContainer.innerHTML = '';
                detailEpisodesData.forEach(ep => {
                    const btn = document.createElement('button');
                    btn.className = 'modal-btn episode-btn';
                    btn.innerHTML = `<span>Episodio ${ep.episode}</span>`;
                    detailsEpisodesContainer.appendChild(btn);
                });
                
                // Set Fav status
                const isFav = favoritesData.some(f => f.url === targetAnime.url);
                btnDetailFav.classList.toggle('active', isFav);

                detailsView.classList.remove('hidden');
                actionModal.classList.add('hidden');
                currentState = STATES.DETAILS;
                isDetailFavFocused = false;
                updateFocusDetails(0);
                statusElement.innerText = "";
            }
        } catch (e) { statusElement.innerText = "Error."; }
    }

    function closeDetailsView() {
        detailsView.classList.add('hidden');
        if (!searchView.classList.contains('hidden')) {
            currentState = STATES.SEARCH;
            updateFocusSearchGrid(searchGridIdx);
        } else {
            closeActionModal();
        }
    }

    function updateFocusDetails(idx) {
        isDetailFavFocused = false;
        btnDetailFav.classList.remove('focused');

        if (idx < 0) idx = 0;
        if (idx >= detailEpisodesData.length) idx = detailEpisodesData.length - 1;
        detailIdx = idx;
        const btns = detailsEpisodesContainer.querySelectorAll('.episode-btn');
        btns.forEach((el, i) => {
            if (i === idx) {
                el.classList.add('focused');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else el.classList.remove('focused');
        });
    }

    function focusDetailFav() {
        isDetailFavFocused = true;
        document.querySelectorAll('.episode-btn').forEach(el => el.classList.remove('focused'));
        btnDetailFav.classList.add('focused');
    }

    // --- SERVER MODAL ---
    async function openServerModal(episodeUrl) {
        statusElement.innerText = "Buscando...";
        try {
            const res = await fetch(`${API_BASE_URL}/api/servers?url=${encodeURIComponent(episodeUrl)}`);
            const json = await res.json();
            if (json.success && json.servers.length > 0) {
                serverButtonsContainer.innerHTML = '';
                serverButtons = json.servers;
                serverButtons.forEach(s => {
                    const btn = document.createElement('button');
                    btn.className = 'modal-btn';
                    btn.innerText = s.title;
                    serverButtonsContainer.appendChild(btn);
                });
                serverModal.classList.remove('hidden');
                currentState = STATES.SERVER_MODAL;
                updateFocusServer(0);
                statusElement.innerText = "";
            }
        } catch (e) { statusElement.innerText = "Error."; }
    }

    function closeServerModal() {
        serverModal.classList.add('hidden');
        if (!detailsView.classList.contains('hidden')) {
            currentState = STATES.DETAILS;
            if (isDetailFavFocused) focusDetailFav();
            else updateFocusDetails(detailIdx);
        } else if (!actionModal.classList.contains('hidden')) {
            currentState = STATES.ACTION_MODAL;
            updateFocusActionModal(actionModalIdx);
        }
    }

    function updateFocusServer(idx) {
        if (idx < 0) idx = 0;
        if (idx >= serverButtons.length) idx = serverButtons.length - 1;
        serverIdx = idx;
        const btns = serverButtonsContainer.querySelectorAll('.modal-btn');
        btns.forEach((el, i) => {
            if (i === idx) el.classList.add('focused');
            else el.classList.remove('focused');
        });
    }

    // --- PLAYER ---
    function openPlayer(serverCode) {
        let videoUrl = serverCode;
        if (videoUrl.includes('?')) {
            if (!videoUrl.includes('autoplay=')) videoUrl += '&autoplay=1';
        } else videoUrl += '?autoplay=1';
        videoFrame.src = videoUrl;
        playerOverlay.classList.remove('hidden');
        currentState = STATES.PLAYER;
    }

    function closePlayer() {
        playerOverlay.classList.add('hidden');
        videoFrame.src = "";
        closeServerModal();
    }

    // --- KEY HANDLING ---
    document.addEventListener('keydown', (e) => {
        const KEY_LEFT = 37, KEY_UP = 38, KEY_RIGHT = 39, KEY_DOWN = 40, KEY_ENTER = 13, KEY_ESC = 27, KEY_BACK = 461;
        const isBack = e.keyCode === KEY_ESC || e.keyCode === KEY_BACK;

        switch (currentState) {
            case STATES.CAROUSEL:
                if (e.keyCode === KEY_UP) {
                    if (rowIdx === 0) { rowIdx = -1; updateFocusMain(); }
                    else if (rowIdx === 1) { rowIdx = 0; colIdx = 0; updateFocusMain(); }
                } else if (e.keyCode === KEY_DOWN) {
                    if (rowIdx === -1) { rowIdx = 0; colIdx = 0; updateFocusMain(); }
                    else if (rowIdx === 0 && favoritesData.length > 0) { rowIdx = 1; colIdx = 0; updateFocusMain(); }
                } else if (e.keyCode === KEY_LEFT) {
                    if (rowIdx !== -1) updateFocusCarouselInRow(-1);
                } else if (e.keyCode === KEY_RIGHT) {
                    if (rowIdx !== -1) updateFocusCarouselInRow(1);
                } else if (e.keyCode === KEY_ENTER) {
                    if (rowIdx === -1) openSearchView();
                    else {
                        const data = (rowIdx === 0) ? episodesData : favoritesData;
                        openActionModal(data[colIdx]);
                    }
                }
                break;

            case STATES.SEARCH:
                if (isBack) { e.preventDefault(); closeSearchView(); }
                else if (e.keyCode === KEY_ENTER) {
                    if (document.activeElement === searchInput) performSearch(searchInput.value);
                    else if (searchResultsData.length > 0) {
                        targetAnime = searchResultsData[searchGridIdx];
                        openDetailsView();
                    }
                } else if (e.keyCode === KEY_UP) {
                    if (searchGridIdx < 6) searchInput.focus();
                    else updateFocusSearchGrid(searchGridIdx - 6);
                } else if (e.keyCode === KEY_DOWN) {
                    if (document.activeElement === searchInput) { if (searchResultsData.length > 0) updateFocusSearchGrid(0); }
                    else updateFocusSearchGrid(searchGridIdx + 6);
                } else if (e.keyCode === KEY_LEFT) {
                    if (document.activeElement !== searchInput) updateFocusSearchGrid(searchGridIdx - 1);
                } else if (e.keyCode === KEY_RIGHT) {
                    if (document.activeElement !== searchInput) updateFocusSearchGrid(searchGridIdx + 1);
                }
                break;

            case STATES.ACTION_MODAL:
                if (isBack) { e.preventDefault(); closeActionModal(); }
                else if (e.keyCode === KEY_UP) updateFocusActionModal(actionModalIdx - 1);
                else if (e.keyCode === KEY_DOWN) updateFocusActionModal(actionModalIdx + 1);
                else if (e.keyCode === KEY_ENTER) {
                    if (actionModalIdx === 0) openServerModal(targetAnime.url);
                    else openDetailsView();
                }
                break;
            
            case STATES.DETAILS:
                if (isBack) { e.preventDefault(); closeDetailsView(); }
                else if (e.keyCode === KEY_LEFT) { if (!isDetailFavFocused) focusDetailFav(); }
                else if (e.keyCode === KEY_RIGHT) { if (isDetailFavFocused) updateFocusDetails(detailIdx); }
                else if (e.keyCode === KEY_UP) { if (!isDetailFavFocused) updateFocusDetails(detailIdx - 1); }
                else if (e.keyCode === KEY_DOWN) { if (!isDetailFavFocused) updateFocusDetails(detailIdx + 1); }
                else if (e.keyCode === KEY_ENTER) {
                    if (isDetailFavFocused) toggleFavorite(targetAnime);
                    else openServerModal(detailEpisodesData[detailIdx].url);
                }
                break;

            case STATES.SERVER_MODAL:
                if (isBack) { e.preventDefault(); closeServerModal(); }
                else if (e.keyCode === KEY_UP || e.keyCode === KEY_LEFT) updateFocusServer(serverIdx - 1);
                else if (e.keyCode === KEY_DOWN || e.keyCode === KEY_RIGHT) updateFocusServer(serverIdx + 1);
                else if (e.keyCode === KEY_ENTER) openPlayer(serverButtons[serverIdx].code);
                break;

            case STATES.PLAYER:
                if (isBack) { e.preventDefault(); closePlayer(); }
                break;
        }
    });

    function updateFocusCarouselInRow(dir) {
        colIdx += dir;
        updateFocusMain();
    }
});
