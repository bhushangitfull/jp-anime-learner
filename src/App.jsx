import { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import TranslationPanel from './components/TranslationPanel';

function App() {
  const [selectedText, setSelectedText] = useState('');

  const handleTextSelect = (text) => {
    setSelectedText(text);
    console.log('Selected text:', text);
  };

  const handleClearSelection = () => {
    setSelectedText('');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-gray-900">
      {/* Left side - Video Player (70% on desktop, 50vh on mobile) */}
      <div className="w-full md:w-[70%] h-[50vh] md:h-full flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-700">
        <VideoPlayer onTextSelect={handleTextSelect} />
      </div>

      {/* Right side - Translation Panel (30% on desktop, remaining height on mobile) */}
      <div className="w-full md:w-[30%] flex-1 md:h-full overflow-hidden bg-gray-800">
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