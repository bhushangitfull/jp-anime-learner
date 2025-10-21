import { useEffect, useRef, useState } from 'react';
import styles from './SubtitleDisplay.module.css';

function SubtitleDisplay({ subtitle, onTextSelect, isMobile }) {
  const subtitleRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const touchStartRef = useRef(null);

  // Desktop text selection
  useEffect(() => {
    if (isMobile) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && subtitleRef.current?.contains(selection.anchorNode)) {
        onTextSelect(selectedText);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [onTextSelect, isMobile]);

  // Mobile touch selection
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartRef.current = {
      time: Date.now(),
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleSelectionChange = () => {
    if (!isMobile) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && subtitleRef.current?.contains(selection.anchorNode)) {
      onTextSelect(selectedText);
    }
  };

  // Add selection change listener
  useEffect(() => {
    if (isMobile) {
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }
  }, [isMobile]);

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    
    const touchDuration = Date.now() - touchStartRef.current.time;
    
    // For long press, just enable selection mode
    if (touchDuration >= 300) {
      setIsSelecting(true);
    } else {
      // For quick taps, check if we have a selection
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && subtitleRef.current?.contains(selection.anchorNode)) {
        onTextSelect(selectedText);
      }
    }
  };

  // Handle selection in selection mode
  const handleSelectionModeEnd = () => {
    if (!isSelecting) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      onTextSelect(selectedText);
    }
    
    setIsSelecting(false);
  };

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('touchend', handleSelectionModeEnd);
      return () => document.removeEventListener('touchend', handleSelectionModeEnd);
    }
  }, [isSelecting]);

  if (!subtitle) return null;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-auto px-4">
      <div 
        ref={subtitleRef}
        className={`bg-black bg-opacity-80 px-6 py-3 rounded-lg max-w-4xl ${
          styles.subtitleContainer
        } ${isSelecting ? styles.selectionMode : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          WebkitTouchCallout: 'default',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          touchAction: 'manipulation',
          cursor: 'text'
        }}
      >
        <p className={`subtitle text-white text-xl md:text-2xl font-medium leading-relaxed text-center whitespace-pre-wrap ${styles.subtitleText}`}>
          {subtitle.text}
        </p>
        {isMobile && !isSelecting && (
          <p className="text-xs text-gray-400 text-center mt-2">
            
          </p>
        )}
        {isMobile && isSelecting && (
          <p className="text-xs text-green-400 text-center mt-2 animate-pulse">
            Selection mode active - select text now
          </p>
        )}
      </div>
    </div>
  );
}

export default SubtitleDisplay;