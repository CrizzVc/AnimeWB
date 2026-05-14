import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import VideoControls from './VideoControls';

const VideoPlayer = ({ src, title, nextEpisode, onBack, onEnded }) => {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const containerRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(() => {
        return parseFloat(localStorage.getItem('player-volume')) || 0.7;
    });
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [subtitles, setSubtitles] = useState([]);
    const [currentSubtitle, setCurrentSubtitle] = useState(-1);
    const [isBuffering, setIsBuffering] = useState(true);

    // Initialize HLS or native player
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const levels = hls.levels.map(l => ({
                    height: l.height,
                    bitrate: l.bitrate
                }));
                setQualities(levels);
                
                // Resume from saved progress if available
                const savedProgress = localStorage.getItem(`progress-${src}`);
                if (savedProgress) {
                    video.currentTime = parseFloat(savedProgress);
                }
                
                video.play().catch(e => console.log("Autoplay blocked", e));
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                if (currentQuality === -1) {
                    // Auto quality switch update if needed
                }
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [src]);

    // Handle Time Updates and Buffering
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => {
            setProgress(video.currentTime);
            // Save progress every 5 seconds to local storage
            if (Math.floor(video.currentTime) % 5 === 0) {
                localStorage.setItem(`progress-${src}`, video.currentTime.toString());
            }
        };

        const onDurationChange = () => setDuration(video.duration);
        
        const onProgress = () => {
            if (video.buffered.length > 0) {
                setBuffered(video.buffered.end(video.buffered.length - 1));
            }
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsBuffering(true);
        const onPlaying = () => setIsBuffering(false);

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('progress', onProgress);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('playing', onPlaying);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('progress', onProgress);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('playing', onPlaying);
        };
    }, [src]);

    // Volume handling
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent scrolling
            if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key.toLowerCase()) {
                case ' ':
                    togglePlay();
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 'arrowleft':
                    skip(-10);
                    break;
                case 'arrowright':
                    skip(10);
                    break;
                case 'arrowup':
                    setVolume(v => Math.min(1, v + 0.1));
                    break;
                case 'arrowdown':
                    setVolume(v => Math.max(0, v - 0.1));
                    break;
                case 'm':
                    setIsMuted(prev => !prev);
                    break;
                case 'escape':
                    if (isFullscreen) toggleFullscreen();
                    break;
                default:
                    break;
            }
            showControls();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Mouse movement to show/hide controls
    const showControls = useCallback(() => {
        setIsControlsVisible(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        
        if (isPlaying) {
            hideTimeoutRef.current = setTimeout(() => {
                setIsControlsVisible(false);
            }, 3000);
        }
    }, [isPlaying]);

    // Fullscreen handling
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const seek = (time) => {
        videoRef.current.currentTime = time;
        setProgress(time);
    };

    const skip = (seconds) => {
        videoRef.current.currentTime += seconds;
    };

    const handleVolumeChange = (newVolume) => {
        setVolume(newVolume);
        localStorage.setItem('player-volume', newVolume.toString());
        if (newVolume > 0) setIsMuted(false);
    };

    const handleQualityChange = (index) => {
        setCurrentQuality(index);
        if (hlsRef.current) {
            hlsRef.current.currentLevel = index;
        }
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group"
            onMouseMove={showControls}
            onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
        >
            <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                onEnded={onEnded}
            />

            {/* Buffering Indicator */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="w-16 h-16 border-4 border-anime-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(255,138,0,0.4)]"></div>
                </div>
            )}

            {/* Controls Layer */}
            <VideoControls 
                isPlaying={isPlaying}
                progress={progress}
                duration={duration}
                buffered={buffered}
                volume={volume}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
                isVisible={isControlsVisible}
                title={title}
                qualities={qualities}
                currentQuality={currentQuality}
                subtitles={subtitles}
                currentSubtitle={currentSubtitle}
                onTogglePlay={togglePlay}
                onSeek={seek}
                onSkip={skip}
                onVolumeChange={handleVolumeChange}
                onToggleMute={() => setIsMuted(!isMuted)}
                onToggleFullscreen={toggleFullscreen}
                onQualityChange={handleQualityChange}
                onSubtitleChange={setCurrentSubtitle}
                onBack={onBack}
                onNextEpisode={nextEpisode}
            />
        </div>
    );
};

export default VideoPlayer;
