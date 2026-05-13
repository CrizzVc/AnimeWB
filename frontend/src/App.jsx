import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import './index.css';

const STATES = {
    HOME: 'HOME',
    ACTION_MODAL: 'ACTION_MODAL',
    DETAILS: 'DETAILS',
    SERVER_MODAL: 'SERVER_MODAL',
    PLAYER: 'PLAYER',
    SEARCH: 'SEARCH'
};

function App() {
    const [view, setView] = useState(STATES.HOME);
    const [latest, setLatest] = useState([]);
    const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favorites') || '[]'));
    const [selectedAnime, setSelectedAnime] = useState(null);
    const [details, setDetails] = useState(null);
    const [servers, setServers] = useState([]);
    const [playerUrl, setPlayerUrl] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [status, setStatus] = useState('');
    const [heroImage, setHeroImage] = useState('');
    const [clock, setClock] = useState(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

    // Navigation state for "spatial" focus simulation
    const [rowIndex, setRowIndex] = useState(0); // 0: Latest, 1: Favorites, -1: Header
    const [colIndex, setColIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setClock(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        loadLatest();
    }, []);

    useEffect(() => {
        if (view === STATES.HOME) {
            const data = rowIndex === 0 ? latest : favorites;
            if (data && data[colIndex]) {
                setHeroImage(data[colIndex].image || data[colIndex].cover);
            }
        }
    }, [rowIndex, colIndex, latest, favorites, view]);

    const loadLatest = async () => {
        setStatus('Cargando últimos episodios...');
        try {
            const data = await api.fetchLatest();
            setLatest(data);
            if (data.length > 0) setHeroImage(data[0].image);
            setStatus('');
        } catch (e) {
            setStatus('Error al cargar datos.');
        }
    };

    const handleAnimeClick = (anime) => {
        setSelectedAnime(anime);
        setView(STATES.ACTION_MODAL);
    };

    const openDetails = async (anime) => {
        setStatus('Cargando detalles...');
        try {
            const data = await api.fetchDetails(anime.url);
            setDetails(data);
            setView(STATES.DETAILS);
            setStatus('');
        } catch (e) {
            setStatus('Error al cargar detalles.');
        }
    };

    const openServers = async (url) => {
        setStatus('Buscando servidores...');
        try {
            const data = await api.fetchServers(url);
            setServers(data);
            setView(STATES.SERVER_MODAL);
            setStatus('');
        } catch (e) {
            setStatus('Error al cargar servidores.');
        }
    };

    const playVideo = (server) => {
        let url = server.code;
        if (!url.includes('autoplay=')) {
            url += (url.includes('?') ? '&' : '?') + 'autoplay=1';
        }
        setPlayerUrl(url);
        setView(STATES.PLAYER);
    };

    const toggleFavorite = (anime) => {
        const isFav = favorites.some(f => f.url === anime.url);
        let newFavs;
        if (isFav) {
            newFavs = favorites.filter(f => f.url !== anime.url);
        } else {
            newFavs = [{ title: anime.title, url: anime.url, image: anime.image || anime.cover }, ...favorites];
        }
        setFavorites(newFavs);
        localStorage.setItem('favorites', JSON.stringify(newFavs));
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            setStatus('Buscando...');
            const results = await api.searchAnime(searchQuery);
            setSearchResults(results);
            setStatus('');
        }
    };

    const goBack = () => {
        if (view === STATES.PLAYER) setView(STATES.SERVER_MODAL);
        else if (view === STATES.SERVER_MODAL) setView(details ? STATES.DETAILS : STATES.ACTION_MODAL);
        else if (view === STATES.DETAILS) setView(selectedAnime ? STATES.ACTION_MODAL : STATES.HOME);
        else if (view === STATES.ACTION_MODAL) setView(STATES.HOME);
        else if (view === STATES.SEARCH) setView(STATES.HOME);
    };

    // Keyboard navigation simulation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') goBack();
            
            if (view === STATES.HOME) {
                if (e.key === 'ArrowRight') setColIndex(prev => Math.min(prev + 1, (rowIndex === 0 ? latest.length : favorites.length) - 1));
                if (e.key === 'ArrowLeft') setColIndex(prev => Math.max(prev - 1, 0));
                if (e.key === 'ArrowDown') {
                    if (rowIndex === -1) setRowIndex(0);
                    else if (rowIndex === 0 && favorites.length > 0) setRowIndex(1);
                }
                if (e.key === 'ArrowUp') {
                    if (rowIndex === 1) setRowIndex(0);
                    else if (rowIndex === 0) setRowIndex(-1);
                }
                if (e.key === 'Enter') {
                    if (rowIndex === -1) setView(STATES.SEARCH);
                    else {
                        const data = rowIndex === 0 ? latest : favorites;
                        if (data[colIndex]) handleAnimeClick(data[colIndex]);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, rowIndex, colIndex, latest, favorites, details]);

    return (
        <div id="app-root">
            <div id="app-container">
                <header>
                    <div className="header-left">
                        <span className="nav-link">Home</span>
                        <span className="nav-link active">Movie</span>
                        <span className="nav-link">TV Series</span>
                        <span className="nav-link">Variety</span>
                        <span className="nav-link">Music</span>
                        <span className="nav-link">More</span>
                    </div>
                    <div className="header-right">
                        <div 
                            className={`search-pill ${rowIndex === -1 ? 'focused' : ''}`}
                            onClick={() => setView(STATES.SEARCH)}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <span>Search</span>
                        </div>
                    </div>
                </header>

                <main>
                    <div className="carousel-container">
                        <div className="carousel-wrapper">
                            <div className="carousel" style={{ transform: rowIndex === 0 ? `translateX(-${colIndex * 215}px)` : 'none' }}>
                                {latest.map((anime, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`card large-card ${rowIndex === 0 && colIndex === idx ? 'expanded' : ''}`}
                                        style={{ backgroundImage: `url(${anime.image})` }}
                                        onClick={() => handleAnimeClick(anime)}
                                    >
                                        <div className="card-overlay-gradient"></div>
                                        <div className="card-info">
                                            <div className="card-title">{anime.title}</div>
                                            <div className="card-rating">
                                                <span className="score">8.{Math.floor(Math.random() * 9)}</span>
                                                <span className="stars">★★★★☆</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {favorites.length > 0 && (
                        <div className="carousel-container mt-40">
                            <h2 className="section-title"><span className="title-marker"></span>I Recommend</h2>
                            <div className="carousel-wrapper">
                                <div className="carousel" style={{ transform: rowIndex === 1 ? `translateX(-${colIndex * 165}px)` : 'none' }}>
                                    {favorites.map((anime, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`card small-card ${rowIndex === 1 && colIndex === idx ? 'focused' : ''}`}
                                            style={{ backgroundImage: `url(${anime.image})` }}
                                            onClick={() => handleAnimeClick(anime)}
                                        >
                                            <div className="card-overlay-gradient"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <div id="status">{status}</div>
            </div>

            {/* Modals */}
            {view === STATES.ACTION_MODAL && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{selectedAnime?.title}</h2>
                        <button className="modal-btn" onClick={() => openServers(selectedAnime.url)}>Reproducir Episodio</button>
                        <button className="modal-btn" onClick={() => openDetails(selectedAnime)}>Más Episodios</button>
                        <button className="modal-btn" onClick={() => setView(STATES.HOME)}>Cerrar</button>
                    </div>
                </div>
            )}

            {view === STATES.SERVER_MODAL && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Seleccionar Servidor</h2>
                        <div className="server-grid">
                            {servers.map((s, idx) => (
                                <button key={idx} className="modal-btn" onClick={() => playVideo(s)}>{s.title}</button>
                            ))}
                        </div>
                        <button className="modal-btn" onClick={() => setView(details ? STATES.DETAILS : STATES.ACTION_MODAL)}>Atrás</button>
                    </div>
                </div>
            )}

            {view === STATES.DETAILS && details && (
                <div className="view-overlay">
                    <div className="details-left">
                        <img src={details.cover} className="details-cover" alt="Cover" />
                        <button 
                            className={`modal-btn ${favorites.some(f => f.url === selectedAnime?.url) ? 'active' : ''}`}
                            onClick={() => toggleFavorite(selectedAnime || details)}
                        >
                            {favorites.some(f => f.url === selectedAnime?.url) ? '❤️ En Favoritos' : '🤍 Añadir a Favoritos'}
                        </button>
                    </div>
                    <div className="details-right">
                        <h1>{details.title}</h1>
                        <p>{details.synopsis}</p>
                        <h3>Episodios</h3>
                        <div className="episodes-list">
                            {details.episodes.map((ep, idx) => (
                                <div key={idx} className="episode-item" onClick={() => openServers(ep.url)}>
                                    Episodio {ep.episode}
                                </div>
                            ))}
                        </div>
                        <button className="modal-btn" onClick={() => setView(STATES.HOME)}>Cerrar</button>
                    </div>
                </div>
            )}

            {view === STATES.SEARCH && (
                <div className="view-overlay" style={{ flexDirection: 'column' }}>
                    <div className="search-header">
                        <input 
                            autoFocus
                            className="search-input" 
                            placeholder="Buscar anime..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
                    </div>
                    <div className="search-results">
                        {searchResults.map((anime, idx) => (
                            <div 
                                key={idx} 
                                className="card" 
                                style={{ backgroundImage: `url(${anime.image})`, height: '300px' }}
                                onClick={() => handleAnimeClick(anime)}
                            >
                                <div className="card-info">
                                    <div className="card-title">{anime.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="modal-btn" style={{ width: '200px', alignSelf: 'center' }} onClick={() => setView(STATES.HOME)}>Cerrar</button>
                </div>
            )}

            {view === STATES.PLAYER && (
                <div id="player-overlay">
                    <iframe id="video-frame" src={playerUrl} allowFullScreen allow="autoplay"></iframe>
                    <button 
                        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 3000 }} 
                        className="modal-btn" 
                        onClick={() => setView(STATES.SERVER_MODAL)}
                    >
                        Cerrar Reproductor
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
