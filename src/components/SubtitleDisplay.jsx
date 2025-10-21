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
    
    // Prevent default to avoid unwanted text selection
    if (!isSelecting) {
      e.preventDefault();
    }
    
    touchStartRef.current = {
      time: Date.now(),
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      target: e.target
    };
  };

  const findKanjiWord = (node, offset) => {
    const text = node.textContent;
    let start = offset;
    let end = offset;

    // Helper to check if character is Kanji
    const isKanji = (char) => {
      const code = char.charCodeAt(0);
      return (code >= 0x4e00 && code <= 0x9faf) || // Kanji
             (code >= 0x3040 && code <= 0x309f) || // Hiragana
             (code >= 0x30a0 && code <= 0x30ff);   // Katakana
    };

    // Find start of word (looking for non-Japanese character or space)
    while (start > 0 && isKanji(text[start - 1])) {
      start--;
    }

    // Find end of word (looking for non-Japanese character or space)
    while (end < text.length && isKanji(text[end])) {
      end++;
    }

    return { start, end, word: text.substring(start, end) };
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    
    const touchDuration = Date.now() - touchStartRef.current.time;
    const touch = e.changedTouches[0];
    
    // For quick taps, try to select the kanji word
    if (touchDuration < 300 && !isSelecting) {
      const range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
      
      if (range && subtitleRef.current?.contains(range.startContainer)) {
        const { start, end, word } = findKanjiWord(range.startContainer, range.startOffset);
        
        if (word) {
          // Create a new range for the word
          const newRange = document.createRange();
          newRange.setStart(range.startContainer, start);
          newRange.setEnd(range.startContainer, end);
          
          // Update selection
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          onTextSelect(word);
          
          // Clear selection after feedback
          setTimeout(() => selection.removeAllRanges(), 1500);
        }
      }
    } else if (touchDuration >= 300 && !isSelecting) {
      // Long press activates selection mode
      setIsSelecting(true);
      e.preventDefault();
    } else if (isSelecting) {
      // In selection mode, check if we have a valid selection
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && subtitleRef.current?.contains(selection.anchorNode)) {
        onTextSelect(selectedText);
        setIsSelecting(false);
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
        onTouchMove={(e) => isSelecting && e.stopPropagation()}
        style={{
          WebkitTouchCallout: isSelecting ? 'default' : 'none',
          WebkitUserSelect: isSelecting ? 'text' : 'none',
          userSelect: isSelecting ? 'text' : 'none',
          touchAction: isSelecting ? 'auto' : 'none'
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