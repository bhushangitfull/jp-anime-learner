import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, FileText, Languages } from 'lucide-react';
import SubtitleDisplay from './SubtitleDisplay';
import MobileTranslationPanel from './MobileTranslationPanel';
import { loadSRTFile, getCurrentSubtitle } from '../utils/srtParser';
import dictionaryService from '../services/dictionaryService';
import furiganaService from '../services/furiganaService';
import translationAPIService from '../services/translationAPIService';

function VideoPlayer({ onTextSelect }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [subtitleFileName, setSubtitleFileName] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const subtitleInputRef = useRef(null);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[VideoPlayer] selectedText=', selectedText, 'showMobilePanel=', showMobilePanel, 'isFullscreen=', isFullscreen);
  }, [selectedText, showMobilePanel, isFullscreen]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      
      // Show mobile panel when entering fullscreen on mobile
      if (isFs && isMobile) {
        setShowMobilePanel(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isMobile]);

  // Handle video upload
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Handle subtitle upload
  const handleSubtitleUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.srt')) {
      try {
        const parsedSubtitles = await loadSRTFile(file);
        setSubtitles(parsedSubtitles);
        setSubtitleFileName(file.name);
        console.log(`Loaded ${parsedSubtitles.length} subtitles`);
      } catch (error) {
        console.error('Error loading subtitles:', error);
        alert('Failed to load subtitle file. Please check the file format.');
      }
    }
  };

  // Update current subtitle
  useEffect(() => {
    if (subtitles.length > 0) {
      const subtitle = getCurrentSubtitle(subtitles, currentTime + subtitleOffset);
      setCurrentSubtitle(subtitle);
    }
  }, [currentTime, subtitles, subtitleOffset]);

  // Play/Pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  useEffect(() => {
    let animationFrameId;
    
    const updateTime = () => {
      if (videoRef.current && !videoRef.current.paused) {
        handleTimeUpdate();
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };
    
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (event) => {
    if (videoRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.parentElement.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustSubtitleOffset = (direction) => {
    const newOffset = subtitleOffset + (direction * 0.5);
    setSubtitleOffset(newOffset);
  };

  // Handle text selection from subtitle
  const handleTextSelect = (text) => {
    setSelectedText(text);
    if (onTextSelect) {
      onTextSelect(text);
    }
    // Always show panel when text is selected in fullscreen or mobile
    setShowMobilePanel(true);
  };

  const handleClearSelection = () => {
    setSelectedText('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && videoFile) {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft' && videoRef.current) {
        videoRef.current.currentTime -= 5;
      } else if (e.code === 'ArrowRight' && videoRef.current) {
        videoRef.current.currentTime += 5;
      } else if (e.code === 'KeyS') {
        setShowSubtitles((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, videoFile]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isMobile) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* File Upload Section */}
      {!videoFile && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-6">
            <label className="cursor-pointer">
              <div className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
                📁 Load Video File
              </div>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
            <p className="text-gray-400 text-sm">
              Supported formats: MP4, WebM, OGG
            </p>
          </div>
        </div>
      )}

      {/* Video Player Section */}
      {videoFile && (
        <div className="flex flex-col h-full">
          {/* Subtitle Upload Bar - Hide in fullscreen */}
          {!isFullscreen && (
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  <FileText size={16} />
                  Load Subtitle (.srt)
                  <input
                    ref={subtitleInputRef}
                    type="file"
                    accept=".srt"
                    onChange={handleSubtitleUpload}
                    className="hidden"
                  />
                </label>
                {subtitleFileName && (
                  <span className="text-green-400 text-sm">
                    ✓ {subtitleFileName}
                  </span>
                )}
                {subtitleFileName && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustSubtitleOffset(-1)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      -0.5s
                    </button>
                    <button
                      onClick={() => adjustSubtitleOffset(1)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                    >
                      +0.5s
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setVideoFile(null);
                  setSubtitles([]);
                  setSubtitleFileName('');
                  setIsPlaying(false);
                }}
                className="text-gray-400 hover:text-white transition text-sm"
              >
                Change Video
              </button>
            </div>
          )}

          {/* Video Display */}
          <div 
            ref={videoContainerRef}
            className="relative flex-1 bg-black flex items-center justify-center overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && !isMobile && setShowControls(false)}
          >
            <video
              ref={videoRef}
              src={videoFile}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onClick={togglePlay}
              className="w-full h-full object-contain"
            />

            {/* Subtitle Display */}
            {showSubtitles && (
              <SubtitleDisplay 
                subtitle={currentSubtitle} 
                onTextSelect={handleTextSelect}
                isMobile={isMobile}
              />
            )}

            {/* Translation Toggle Button (Fullscreen) */}
            {isFullscreen && selectedText && !showMobilePanel && (
              <button
                onClick={() => setShowMobilePanel(true)}
                className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-30 hover:bg-blue-700 transition"
                style={{ touchAction: 'manipulation' }}
              >
                <Languages size={24} />
              </button>
            )}

            {/* Fullscreen Mobile Translation Panel (rendered inside fullscreen container) */}
            {/* Inner translation panel only in fullscreen */}
            {isFullscreen && selectedText && (
              <MobileTranslationPanel
                selectedText={selectedText}
                onClear={handleClearSelection}
                isVisible={showMobilePanel}
                isFullscreen={true}
                containerRef={videoContainerRef}
                onToggle={() => setShowMobilePanel(!showMobilePanel)}
                dictionaryService={dictionaryService}
                furiganaService={furiganaService}
                translationAPIService={translationAPIService}
              />
            )}

            {/* Controls */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 z-20 ${
                showControls || isMobile ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Progress Bar */}
              <div 
                ref={progressBarRef}
                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4 relative group"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-blue-500 rounded-full relative"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-blue-500 transition"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>

                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {!isMobile && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-blue-500 transition"
                      >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-blue-500 transition"
                  >
                    <Maximize size={20} />
                  </button>
                  <button
                    onClick={() => setShowSubtitles((s) => !s)}
                    className="text-white hover:text-blue-500 transition text-sm px-2"
                  >
                    {showSubtitles ? 'CC' : 'CC'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Translation Panel - only render when not fullscreen */}
      {!isFullscreen && (
        <MobileTranslationPanel
          selectedText={selectedText}
          onClear={handleClearSelection}
          isVisible={showMobilePanel && isMobile}
          isFullscreen={false}
          containerRef={null}
          onToggle={() => setShowMobilePanel(!showMobilePanel)}
          dictionaryService={dictionaryService}
          furiganaService={furiganaService}
          translationAPIService={translationAPIService}
        />
      )}
    </div>
  );
}

export default VideoPlayer;