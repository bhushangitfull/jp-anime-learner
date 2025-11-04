import { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import TranslationPanel from './components/TranslationPanel';
import MobileTranslationPanel from './components/MobileTranslationPanel';
import dictionaryService from './services/dictionaryService';
import furiganaService from './services/furiganaService';
import translationAPIService from './services/translationAPIService';
import { initDB } from './services/storageService';
import { Film, Play, Search, Grid, List, Trash2 } from 'lucide-react';

function App() {
  const [selectedText, setSelectedText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Video library state
  const [currentView, setCurrentView] = useState('library'); // 'library' or 'player'
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Initialize IndexedDB
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Filter videos based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos(videos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVideos(videos.filter(video => video.name.toLowerCase().includes(query)));
    }
  }, [searchQuery, videos]);

  const handleSelectFiles = async (e) => {
    const files = Array.from(e.target.files);
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    
    const videoInfos = videoFiles.map((file) => {
      return {
        id: Date.now() + Math.random(),
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        type: file.type,
        file: file, // Keep the actual file object
        url: URL.createObjectURL(file),
        timestamp: Date.now()
      };
    });

    videoInfos.sort((a, b) => a.name.localeCompare(b.name));
    setVideos(prev => [...prev, ...videoInfos]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const playVideo = (video) => {
    console.log('Playing video:', video);
    setSelectedVideo(video);
    setCurrentView('player');
  };

  const handleBackToLibrary = () => {
    setCurrentView('library');
    setSelectedVideo(null);
    setSelectedText('');
  };

  const deleteVideo = (videoId, e) => {
    e.stopPropagation();
    if (confirm('Remove this video from library?')) {
      setVideos(prev => prev.filter(v => v.id !== videoId));
    }
  };

  const handleTextSelect = (text) => {
    setSelectedText(text);
  };

  const handleClearSelection = () => {
    setSelectedText('');
  };

  // VIDEO PLAYER VIEW
  if (currentView === 'player' && selectedVideo) {
    const useMobileLayout = isMobile || isFullscreen;

    if (useMobileLayout) {
      return (
        <div className="w-full h-screen overflow-hidden bg-gray-900 relative">
          <VideoPlayer 
            onTextSelect={handleTextSelect}
            initialVideo={selectedVideo}
            onBack={handleBackToLibrary}
          />
          <MobileTranslationPanel
            selectedText={selectedText}
            onClear={handleClearSelection}
            isVisible={!!selectedText}
            isFullscreen={isFullscreen}
            dictionaryService={dictionaryService}
            furiganaService={furiganaService}
            translationAPIService={translationAPIService}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-900">
        <div className="w-full md:w-[70%] h-full flex-shrink-0 border-r border-gray-700">
          <VideoPlayer 
            onTextSelect={handleTextSelect}
            initialVideo={selectedVideo}
            onBack={handleBackToLibrary}
          />
        </div>
        <div className="w-full md:w-[30%] flex-1 h-full overflow-hidden bg-gray-800">
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <TranslationPanel 
              selectedText={selectedText}
              onClear={handleClearSelection}
            />
          </div>
        </div>
      </div>
    );
  }

  // VIDEO LIBRARY VIEW
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Film className="text-blue-500" size={32} />
              <h1 className="text-2xl font-bold">Anime Library</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Film className="w-20 h-20 mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold mb-3">No Videos Yet</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Add videos to your library to start learning Japanese with anime
            </p>
            
            <div className="flex justify-center">
              <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition cursor-pointer">
                <Film size={20} />
                Select Videos
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleSelectFiles}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-8 text-sm text-gray-500 max-w-md">
              <p>Choose multiple videos to add to your library</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div className="text-sm text-gray-400">
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
                {searchQuery && ` (filtered from ${videos.length})`}
              </div>
              
              <div className="flex">
                <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
                  <Film size={16} />
                  Add Videos
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleSelectFiles}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading videos...</p>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVideos.map(video => (
                  <div
                    key={video.id}
                    onClick={() => playVideo(video)}
                    className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition group relative"
                  >
                    <div className="aspect-video bg-gray-700 relative flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-600" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition">
                        {video.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{video.size}</span>
                        <span>{video.type.split('/')[1].toUpperCase()}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => deleteVideo(video.id, e)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredVideos.map(video => (
                  <div
                    key={video.id}
                    onClick={() => playVideo(video)}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-750 hover:ring-2 hover:ring-blue-500 transition group flex items-center gap-4 relative"
                  >
                    <div className="w-32 h-18 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                      <Film className="w-8 h-8 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 truncate group-hover:text-blue-400 transition">
                        {video.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{video.size}</span>
                        <span>•</span>
                        <span>{video.type.split('/')[1].toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <Play className="w-8 h-8 text-gray-600 group-hover:text-blue-500 transition flex-shrink-0" />

                    <button
                      onClick={(e) => deleteVideo(video.id, e)}
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;