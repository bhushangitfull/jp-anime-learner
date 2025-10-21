import { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import TranslationPanel from './components/TranslationPanel';

function App() {
  const [selectedText, setSelectedText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari
    document.addEventListener('mozfullscreenchange', handleFullscreenChange); // Firefox
    document.addEventListener('MSFullscreenChange', handleFullscreenChange); // IE/Edge
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleTextSelect = (text) => {
    setSelectedText(text);
    console.log('Selected text:', text);
  };

  const handleClearSelection = () => {
    setSelectedText('');
  };

  // On mobile or fullscreen: VideoPlayer handles everything (including MobileTranslationPanel)
  // On desktop: Use split-screen layout with TranslationPanel
  const useMobileLayout = isMobile || isFullscreen;

  if (useMobileLayout) {
    // Mobile/Fullscreen Layout: Full screen video with integrated mobile panel
    return (
      <div className="w-full h-screen overflow-hidden bg-gray-900 relative">
        <VideoPlayer onTextSelect={handleTextSelect} />
        {selectedText && (
          <div className="absolute bottom-0 left-0 right-0 max-h-[50vh] bg-gray-900 shadow-lg z-50">
            <div className="h-full">
              <TranslationPanel 
                selectedText={selectedText}
                onClear={handleClearSelection}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout: Split screen with video on left, translation panel on right
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-900">
      {/* Left side - Video Player (70% on desktop) */}
      <div className="w-full md:w-[70%] h-full flex-shrink-0 border-r border-gray-700">
        <VideoPlayer onTextSelect={handleTextSelect} />
      </div>

      {/* Right side - Translation Panel (30% on desktop) */}
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

export default App;