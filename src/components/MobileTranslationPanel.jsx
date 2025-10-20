import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Loader2, BookOpen, Globe, Copy, Check } from 'lucide-react';

function MobileTranslationPanel({ 
  selectedText, 
  onClear,
  isVisible,
  onToggle,
  dictionaryService,
  furiganaService,
  translationAPIService 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [hiragana, setHiragana] = useState('');
  const [romaji, setRomaji] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('dictionary');
  const [apiTranslation, setApiTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Process selected text
  useEffect(() => {
    if (!selectedText) return;

    const processText = async () => {
      setIsLoading(true);
      setError('');
      setApiTranslation(null);

      try {
        const [hira, roma] = await Promise.all([
          furiganaService.toHiragana(selectedText),
          furiganaService.toRomaji(selectedText)
        ]);

        setHiragana(hira);
        setRomaji(roma);

        const results = dictionaryService.findBestMatch(selectedText);
        if (results.length > 0) {
          setTranslation(results[0]);
        } else {
          setTranslation(null);
          setError('Not found in dictionary. Try Online Translation tab.');
        }

        setCopied(false);

      } catch (err) {
        console.error('Translation error:', err);
        setError('Translation error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    processText();
    setIsOpen(true); // Auto-open when text is selected
  }, [selectedText]);

  useEffect(() => {
    if (activeTab === 'online' && selectedText && !apiTranslation && !isTranslating) {
      fetchOnlineTranslation();
    }
  }, [activeTab, selectedText]);

  const fetchOnlineTranslation = async () => {
    setIsTranslating(true);
    try {
      const result = await translationAPIService.translate(selectedText);
      setApiTranslation(result);
    } catch (err) {
      console.error('API translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClear) onClear();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-md bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Content */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-700">
            <h2 className="text-lg font-bold text-white">Translation</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedText ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BookOpen className="w-12 h-12 mb-4 text-gray-600" />
                <p className="text-gray-400">Select subtitle text to translate</p>
              </div>
            ) : (
              <>
                {/* Selected Text */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xs text-gray-400">Selected Text</h3>
                    <button
                      onClick={copyToClipboard}
                      className="text-gray-400 hover:text-white transition"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-2xl text-white font-medium mb-3">{selectedText}</p>
                  
                  {hiragana && hiragana !== selectedText && (
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <p className="text-xs text-gray-400 mb-1">Hiragana</p>
                      <p className="text-lg text-blue-300">{hiragana}</p>
                    </div>
                  )}

                  {romaji && (
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <p className="text-xs text-gray-400 mb-1">Romaji</p>
                      <p className="text-base text-green-300 italic font-medium">{romaji}</p>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('dictionary')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'dictionary'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    📚 Dictionary
                  </button>
                  <button
                    onClick={() => setActiveTab('online')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === 'online'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    🌐 Online
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'dictionary' ? (
                  isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    </div>
                  ) : translation ? (
                    <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                      <h3 className="text-xs text-gray-400">Dictionary Translation</h3>
                      <ul className="space-y-2">
                        {translation.meanings.map((meaning, index) => (
                          <li key={index} className="text-white">
                            <span className="text-blue-400 mr-2">{index + 1}.</span>
                            {meaning}
                          </li>
                        ))}
                      </ul>
                      {translation.partsOfSpeech && translation.partsOfSpeech.length > 0 && (
                        <div className="border-t border-gray-600 pt-3">
                          <p className="text-xs text-gray-400 mb-2">Word Type</p>
                          <div className="flex flex-wrap gap-2">
                            {translation.partsOfSpeech.map((pos, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                                {pos}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe size={16} className="text-blue-400" />
                        <h3 className="text-xs text-gray-400">Online Translation</h3>
                      </div>
                      {isTranslating ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        </div>
                      ) : apiTranslation ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">English:</p>
                            <p className="text-lg text-white">{apiTranslation.translated}</p>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={fetchOnlineTranslation}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Get Translation
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Button (when panel is closed) */}
      {!isOpen && selectedText && (
        <button
          onClick={handleToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg z-40 hover:bg-blue-700 transition"
          style={{ touchAction: 'manipulation' }}
        >
          <ChevronLeft size={24} />
        </button>
      )}
    </>
  );
}

export default MobileTranslationPanel;