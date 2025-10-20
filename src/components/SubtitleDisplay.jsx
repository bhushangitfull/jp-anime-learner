import { useEffect, useRef, useState } from 'react';

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
    touchStartRef.current = Date.now();
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    
    const touchDuration = Date.now() - touchStartRef.current;
    
    // Long press (> 300ms) = enable text selection mode
    if (touchDuration > 300) {
      setIsSelecting(true);
      return;
    }
    
    // Quick tap = select word at tap position
    if (touchDuration < 300 && !isSelecting) {
      const touch = e.changedTouches[0];
      const range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
      
      if (range && subtitleRef.current?.contains(range.startContainer)) {
        const textNode = range.startContainer;
        const text = textNode.textContent;
        const offset = range.startOffset;
        
        // Find word boundaries
        let start = offset;
        let end = offset;
        
        // Expand to word boundaries
        while (start > 0 && !/\s/.test(text[start - 1])) start--;
        while (end < text.length && !/\s/.test(text[end])) end++;
        
        const word = text.substring(start, end).trim();
        if (word) {
          onTextSelect(word);
          
          // Visual feedback
          const selection = window.getSelection();
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.setStart(textNode, start);
          newRange.setEnd(textNode, end);
          selection.addRange(newRange);
          
          setTimeout(() => selection.removeAllRanges(), 1000);
        }
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
          isMobile ? 'cursor-pointer' : 'cursor-text'
        } select-text`}
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          WebkitTouchCallout: isSelecting ? 'default' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <p className="subtitle text-white text-xl md:text-2xl font-medium leading-relaxed text-center whitespace-pre-wrap">
          {subtitle.text}
        </p>
        {isMobile && !isSelecting && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Tap to select word • Long press to select text
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