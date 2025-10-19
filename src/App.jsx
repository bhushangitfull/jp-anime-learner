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
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      {/* Left side - Video Player (70% on md+) */}
      <div className="w-full md:w-[70%] md:border-r md:border-gray-700 h-[60vh] md:h-full">
        <VideoPlayer onTextSelect={handleTextSelect} />
      </div>

      {/* Right side - Translation Panel (30% on md+) */}
      <div className="w-full md:w-[30%] bg-gray-800 p-4 md:p-6 h-[40vh] md:h-full overflow-auto">
        <TranslationPanel 
          selectedText={selectedText}
          onClear={handleClearSelection}
        />
      </div>
    </div>
  );
}

export default App;