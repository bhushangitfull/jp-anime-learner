import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import TranslationPanel from './components/TranslationPanel';

function App() {
  const [selectedText, setSelectedText] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const panelRef = useRef(null);

  const handleTextSelect = (text) => {
    setSelectedText(text);
    // Auto-open panel when text is selected on mobile
    if (window.innerWidth < 768) {
      setIsPanelOpen(true);
    }
    console.log('Selected text:', text);
  };

  const handleClearSelection = () => {
    setSelectedText('');
    setIsPanelOpen(false);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && !isPanelOpen) {
      setIsPanelOpen(true);
    } else if (isSwipeDown && isPanelOpen) {
      setIsPanelOpen(false);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-900">
      {/* Video Player */}
      <div className="w-full md:w-[70%] h-full flex-shrink-0 md:border-r border-gray-700 relative">
        <VideoPlayer onTextSelect={handleTextSelect} />

        {/* Mobile Toggle Button */}
        {selectedText && (
          <button
            onClick={togglePanel}
            className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95"
            aria-label="Toggle translation panel"
          >
            {isPanelOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            {!isPanelOpen && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* Translation Panel - Swipeable on Mobile */}
      <div
        ref={panelRef}
        className={`
          fixed md:relative
          bottom-0 md:bottom-auto
          left-0 md:left-auto
          right-0 md:right-auto
          w-full md:w-[30%]
          bg-gray-800
          transition-transform duration-300 ease-out
          z-40
          md:translate-y-0
          ${isPanelOpen ? 'translate-y-0' : 'translate-y-full'}
          md:h-full
          ${isPanelOpen ? 'h-[75vh]' : 'h-0'}
          overflow-hidden md:overflow-visible
          rounded-t-2xl md:rounded-none
          shadow-2xl md:shadow-none
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - Mobile Only */}
        <div className="md:hidden bg-gray-700 p-3 flex flex-col items-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-500 rounded-full mb-2" />
          <p className="text-xs text-gray-400">
            {isPanelOpen ? 'Swipe down to close' : 'Swipe up to open'}
          </p>
        </div>

        {/* Panel Content */}
        <div className="h-full overflow-y-auto p-4 md:p-6">
          <TranslationPanel 
            selectedText={selectedText}
            onClear={handleClearSelection}
          />
        </div>
      </div>

      {/* Backdrop */}
      {isPanelOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity duration-300"
          onClick={togglePanel}
        />
      )}
    </div>
  );
}

export default App;