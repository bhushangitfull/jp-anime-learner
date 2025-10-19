import { useEffect, useRef } from 'react';

function SubtitleDisplay({ subtitle, onTextSelect }) {
  const subtitleRef = useRef(null);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // Check if selection is from subtitle element
      if (selectedText && subtitleRef.current?.contains(selection.anchorNode)) {
        onTextSelect(selectedText);
      }
    };

    // Listen for mouseup (when user finishes selecting)
    document.addEventListener('mouseup', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [onTextSelect]);

  // Don't render if no subtitle
  if (!subtitle) return null;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-auto px-4">
      <div 
        ref={subtitleRef}
        className="bg-black bg-opacity-80 px-6 py-3 rounded-lg max-w-4xl cursor-text select-text"
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text'
        }}
      >
        <p className="subtitle text-white text-xl md:text-2xl font-medium leading-relaxed text-center whitespace-pre-wrap">
          {subtitle.text}
        </p>
      </div>
    </div>
  );
}

export default SubtitleDisplay;