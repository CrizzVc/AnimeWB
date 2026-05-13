import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api';
import './index.css';

const STATES = {
    PROFILES: 'PROFILES',
    HOME: 'HOME',
    DETAILS: 'DETAILS',
    SERVER_MODAL: 'SERVER_MODAL',
    PLAYER: 'PLAYER',
    SEARCH: 'SEARCH',
    EXTENSIONS_MODAL: 'EXTENSIONS_MODAL'
};

const EXTENSIONS = [
    { id: 'animeflv', name: 'AnimeFLV', icon: 'AF', color: '#ff8a00' },
    { id: 'monoschinos', name: 'MonoChinos', icon: 'MC', color: '#00e5ff' },
    { id: 'tioanime', name: 'TioAnime', icon: 'TA', color: '#ff00e5' }
];

const DEFAULT_PROFILES = [
    { id: 1, name: 'User 1', avatar: 'https://ui-avatars.com/api/?name=U1&background=00E5FF&color=fff', background: '', favorites: [] }
];

function App() {
    const [profiles, setProfiles] = useState(() => {
        const saved = localStorage.getItem('profiles');
        return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
    });
    const [activeProfile, setActiveProfile] = useState(null);
    const [editingProfile, setEditingProfile] = useState(null);
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [view, setView] = useState(STATES.PROFILES);
    const [currentSource, setCurrentSource] = useState('animeflv');
    const [latest, setLatest] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [selectedAnime, setSelectedAnime] = useState(null);
    const [details, setDetails] = useState(null);
    const [servers, setServers] = useState([]);
    const [playerUrl, setPlayerUrl] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [status, setStatus] = useState('');
    const [clock, setClock] = useState(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));

    // Navigation state for "spatial" focus simulation
    const [rowIndex, setRowIndex] = useState(0); // 0: Latest, 1: Favorites, -1: Header
    const [colIndex, setColIndex] = useState(0);
    const [searchIndex, setSearchIndex] = useState(-1); // -1: input focused

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
        if (activeProfile) {
            const filteredFavs = activeProfile.favorites.filter(f => f.source === currentSource);
            setFavorites(filteredFavs);
        }
    }, [activeProfile, currentSource]);

    const loadLatest = async () => {
        setStatus('Cargando últimos episodios...');
        try {
            const data = await api.fetchLatest();
            setLatest(data);
            setStatus('');
        } catch (e) {
            setStatus('Error al cargar datos.');
        }
    };

    const handleAnimeClick = (anime) => {
        setSelectedAnime(anime);
        openDetails(anime); // Skip ACTION_MODAL
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

    const selectProfile = (profile) => {
        setActiveProfile(profile);
        setColIndex(0);
        setRowIndex(0);
        setView(STATES.HOME);
    };

    const fileInputRef = useRef(null);
    const [fileType, setFileType] = useState('avatar'); // 'avatar' or 'background'

    const openFileExplorer = (type) => {
        setFileType(type);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && editingProfile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                setEditingProfile(prev => ({
                    ...prev,
                    [fileType]: base64
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const saveProfile = () => {
        if (!editingProfile) return;
        
        let updatedProfiles;
        if (isCreatingProfile) {
            updatedProfiles = [...profiles, editingProfile];
        } else {
            updatedProfiles = profiles.map(p => p.id === editingProfile.id ? editingProfile : p);
        }
        
        setProfiles(updatedProfiles);
        localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
        
        if (activeProfile && activeProfile.id === editingProfile.id) {
            setActiveProfile(editingProfile);
        }
        
        setEditingProfile(null);
        setIsCreatingProfile(false);
    };

    const deleteProfile = (profileId) => {
        if (profiles.length <= 1) {
            alert('Debe haber al menos un perfil.');
            return;
        }
        if (confirm('¿Estás seguro de que quieres eliminar este perfil?')) {
            const updatedProfiles = profiles.filter(p => p.id !== profileId);
            setProfiles(updatedProfiles);
            localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
            setEditingProfile(null);
            setColIndex(0);
        }
    };

    const addUser = () => {
        if (profiles.length >= 5) {
            alert('Límite de 5 usuarios alcanzado.');
            return;
        }
        setIsCreatingProfile(true);
        setEditingProfile({
            id: Date.now(),
            name: '',
            avatar: 'https://ui-avatars.com/api/?name=New&background=random&color=fff',
            background: '',
            favorites: []
        });
    };

    const toggleFavorite = (anime) => {
        if (!activeProfile) return;
        
        const isFav = activeProfile.favorites.some(f => f.url === anime.url);
        let newProfileFavorites;
        
        if (isFav) {
            newProfileFavorites = activeProfile.favorites.filter(f => f.url !== anime.url);
        } else {
            newProfileFavorites = [
                { 
                    title: anime.title, 
                    url: anime.url, 
                    image: anime.image || anime.cover,
                    source: currentSource 
                }, 
                ...activeProfile.favorites
            ];
        }

        const updatedProfile = { ...activeProfile, favorites: newProfileFavorites };
        const updatedProfiles = profiles.map(p => p.id === activeProfile.id ? updatedProfile : p);
        
        setProfiles(updatedProfiles);
        setActiveProfile(updatedProfile);
        localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
    };

    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            setStatus('Buscando...');
            const results = await api.searchAnime(searchQuery);
            setSearchResults(results);
            setSearchIndex(-1); // reset focus to input
            setStatus('');
        }
    };

    const selectSource = (sourceId) => {
        setCurrentSource(sourceId);
        setView(STATES.HOME);
        loadLatest(); // Reload content for the new source
    };

    const goBack = () => {
        if (view === STATES.PLAYER) setView(STATES.SERVER_MODAL);
        else if (view === STATES.SERVER_MODAL) setView(details ? STATES.DETAILS : STATES.HOME);
        else if (view === STATES.DETAILS) setView(STATES.HOME);
        else if (view === STATES.SEARCH) setView(STATES.HOME);
        else if (view === STATES.EXTENSIONS_MODAL) setView(STATES.HOME);
        else if (view === STATES.HOME) setView(STATES.PROFILES);
    };

    // Keyboard navigation simulation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') goBack();

            if (view === STATES.PROFILES) {
                if (e.key === 'ArrowRight') setColIndex(prev => Math.min(prev + 1, profiles.length));
                if (e.key === 'ArrowLeft') setColIndex(prev => Math.max(prev - 1, 0));
                if (e.key === 'Enter') {
                    if (colIndex === profiles.length) addUser();
                    else selectProfile(profiles[colIndex]);
                }
            } else if (view === STATES.HOME) {
                if (e.key === 'ArrowRight') setColIndex(prev => Math.min(prev + 1, (rowIndex === 0 ? latest.length : favorites.length) - 1));
                if (e.key === 'ArrowLeft') setColIndex(prev => Math.max(prev - 1, 0));
                if (e.key === 'ArrowDown') {
                    if (rowIndex === -1) {
                        setRowIndex(0);
                        setColIndex(prev => Math.min(prev, latest.length > 0 ? latest.length - 1 : 0));
                    }
                    else if (rowIndex === 0) {
                        setRowIndex(1);
                        setColIndex(prev => favorites.length > 0 ? Math.min(prev, favorites.length - 1) : 0);
                    }
                }
                if (e.key === 'ArrowUp') {
                    if (rowIndex === 1) {
                        setRowIndex(0);
                        setColIndex(prev => Math.min(prev, latest.length > 0 ? latest.length - 1 : 0));
                    }
                    else if (rowIndex === 0) {
                        setRowIndex(-1);
                    }
                }
                if (e.key === 'Enter') {
                    if (rowIndex === -1) setView(STATES.SEARCH);
                    else {
                        const data = rowIndex === 0 ? latest : favorites;
                        if (data[colIndex]) handleAnimeClick(data[colIndex]);
                    }
                }
            } else if (view === STATES.SEARCH) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    setSearchIndex(prev => {
                        const next = Math.min(prev + 1, searchResults.length - 1);
                        if (next > -1 && document.activeElement.tagName === 'INPUT') {
                            document.activeElement.blur();
                        }
                        const el = document.getElementById(`search-card-${next}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        return next;
                    });
                }
                if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setSearchIndex(prev => {
                        const next = prev - 1;
                        if (next < 0) {
                            document.querySelector('.search-input')?.focus();
                            return -1;
                        }
                        const el = document.getElementById(`search-card-${next}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        return next;
                    });
                }
                if (e.key === 'Enter' && searchIndex >= 0) {
                    handleAnimeClick(searchResults[searchIndex]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, rowIndex, colIndex, latest, favorites, details]);

    return (
        <div id="app-root">
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileChange} 
            />
            {view === STATES.PROFILES ? (
                <div className="profiles-screen" style={{ backgroundImage: profiles[colIndex]?.background ? `url(${profiles[colIndex].background})` : 'none' }}>
                    <h1 className="profiles-title">¿Quién está viendo?</h1>
                    <div className="profiles-container">
                        {profiles.map((p, idx) => (
                            <div 
                                key={p.id} 
                                className={`profile-card ${colIndex === idx ? 'focused' : ''}`}
                                onClick={() => selectProfile(p)}
                            >
                                <div className="profile-avatar-wrapper">
                                    <img src={p.avatar} alt={p.name} className="profile-avatar" />
                                </div>
                                <div className="profile-name">{p.name}</div>
                            </div>
                        ))}
                        {profiles.length < 5 && (
                            <div 
                                className={`profile-card add-profile-card ${colIndex === profiles.length ? 'focused' : ''}`}
                                onClick={addUser}
                            >
                                <div className="profile-avatar-wrapper add-icon">
                                    <span>+</span>
                                </div>
                                <div className="profile-name">Agregar perfil</div>
                            </div>
                        )}
                    </div>

                    <button className="edit-floating-btn" onClick={() => { setIsCreatingProfile(false); setEditingProfile(profiles[colIndex] || profiles[0]); }}>✎</button>

                    {editingProfile && (
                        <div className="side-panel-overlay" onClick={(e) => e.target.className === 'side-panel-overlay' && setEditingProfile(null)}>
                            <div className="side-panel">
                                <div className="side-panel-header">
                                    <h2>{isCreatingProfile ? 'Crear Perfil' : 'Editar Perfil'}</h2>
                                    {!isCreatingProfile && (
                                        <button className="delete-btn-top" onClick={() => deleteProfile(editingProfile.id)} title="Eliminar Perfil">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="edit-field">
                                    <label>Nombre</label>
                                    <input 
                                        type="text" 
                                        value={editingProfile.name} 
                                        onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                                    />
                                </div>
                                <div className="edit-field">
                                    <label>Avatar</label>
                                    <div className="avatar-preview" onClick={() => openFileExplorer('avatar')}>
                                        <img src={editingProfile.avatar} alt="Avatar" />
                                        <span>Cambiar</span>
                                    </div>
                                </div>
                                <div className="edit-field">
                                    <label>Fondo</label>
                                    <div className="bg-preview" onClick={() => openFileExplorer('background')}>
                                        {editingProfile.background ? <img src={editingProfile.background} /> : <div className="no-bg">Sin fondo</div>}
                                        <span>Cambiar</span>
                                    </div>
                                </div>
                                <div className="side-panel-actions">
                                    <button className="modal-btn save" onClick={saveProfile}>Guardar</button>
                                    <button className="modal-btn" onClick={() => setEditingProfile(null)}>Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div id="app-container">
                    <header>
                    <div className="header-left">
                        <div className="header-user" onClick={() => changeAvatar(activeProfile.id)}>
                            <img src={activeProfile?.avatar} className="header-avatar" alt="User" />
                        </div>
                        <span className="nav-link active">Home</span>
                        <span className="nav-link">Catálogo de Anime</span>
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

                        <div className="source-indicator" onClick={() => setView(STATES.EXTENSIONS_MODAL)}>
                            <div className="source-circle" style={{ backgroundColor: EXTENSIONS.find(e => e.id === currentSource)?.color }}>
                                {EXTENSIONS.find(e => e.id === currentSource)?.icon}
                            </div>
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

                    <div className="carousel-container mt-40">
                        <h2 className="section-title"><span className="title-marker"></span>I Recommend</h2>
                        <div className="carousel-wrapper">
                            {favorites.length > 0 ? (
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
                            ) : (
                                <div className={`empty-favorites ${rowIndex === 1 ? 'focused' : ''}`}>
                                    <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor" style={{opacity: 0.5}}>
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                    <p>Your favorites list is empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <div id="status">{status}</div>
            </div>
            )}

            {/* Modals */}
            {view === STATES.SERVER_MODAL && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Seleccionar Servidor</h2>
                        <div className="server-grid">
                            {servers.map((s, idx) => (
                                <button key={idx} className="modal-btn" onClick={() => playVideo(s)}>{s.title}</button>
                            ))}
                        </div>
                        <button className="modal-btn" onClick={() => setView(details ? STATES.DETAILS : STATES.HOME)}>Atrás</button>
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
                                id={`search-card-${idx}`}
                                key={idx}
                                className={`card ${searchIndex === idx ? 'focused' : ''}`}
                                style={{ backgroundImage: `url(${anime.image})`, height: '300px' }}
                                onClick={() => handleAnimeClick(anime)}
                            >
                                <div className="card-overlay-gradient"></div>
                                <div className="card-info" style={{ opacity: 1, transform: 'translateY(0)' }}>
                                    <div className="card-title" style={{ fontSize: '1.2rem' }}>{anime.title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="modal-btn" style={{ width: '200px', alignSelf: 'center' }} onClick={() => setView(STATES.HOME)}>Cerrar</button>
                </div>
            )}

            {view === STATES.EXTENSIONS_MODAL && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>Seleccionar Extensión</h2>
                        <div className="extensions-grid">
                            {EXTENSIONS.map((ext) => (
                                <div 
                                    key={ext.id} 
                                    className={`extension-card ${currentSource === ext.id ? 'active' : ''}`}
                                    onClick={() => selectSource(ext.id)}
                                >
                                    <div className="extension-icon" style={{ backgroundColor: ext.color }}>
                                        {ext.icon}
                                    </div>
                                    <div className="extension-name">{ext.name}</div>
                                </div>
                            ))}
                        </div>
                        <button className="modal-btn" onClick={() => setView(STATES.HOME)}>Cerrar</button>
                    </div>
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
