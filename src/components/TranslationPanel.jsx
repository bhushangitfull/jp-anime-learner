import { useState, useEffect } from 'react';
import { Loader2, BookOpen, X, ExternalLink, Copy, Check, Globe } from 'lucide-react';
import dictionaryService from '../services/dictionaryService';
import furiganaService from '../services/furiganaService';
import translationAPIService from '../services/translationAPIService';

function TranslationPanel({ selectedText, onClear }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [translation, setTranslation] = useState(null);
  const [hiragana, setHiragana] = useState('');
  const [romaji, setRomaji] = useState('');
  const [error, setError] = useState('');
  const [googleTranslateUrl, setGoogleTranslateUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('dictionary');
  const [apiTranslation, setApiTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      setIsInitializing(true);
      try {
        await Promise.all([
          dictionaryService.loadDictionary(),
          furiganaService.initialize()
        ]);
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize services:', err);
        setError('Failed to load dictionary. Online translation will still work.');
        setIsInitializing(false);
      }
    };

    initServices();
  }, []);

  // Process selected text
  useEffect(() => {
    if (!selectedText || isInitializing) return;

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

        const encodedText = encodeURIComponent(selectedText);
        const translateUrl = `https://translate.google.com/?sl=ja&tl=en&text=${encodedText}&op=translate`;
        setGoogleTranslateUrl(translateUrl);

        setCopied(false);

      } catch (err) {
        console.error('Translation error:', err);
        setError('Translation error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    processText();
  }, [selectedText, isInitializing]);

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

  // Loading state
  if (isInitializing) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Loading dictionary...</p>
      </div>
    );
  }

  // Empty state
  if (!selectedText) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <BookOpen className="w-12 h-12 mb-4 text-gray-600" />
        <h2 className="text-xl font-bold mb-2 text-white">Translation Panel</h2>
        <p className="text-sm mb-2 text-gray-400">Select subtitle text to translate</p>
        <div className="mt-4 text-xs text-gray-500 space-y-1 text-center">
          <p>1. Load video</p>
          <p>2. Load .srt subtitle</p>
          <p>3. Click and drag to select text</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable container for ALL content */}
      <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch">
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-gray-800 z-10 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Translation</h2>
            {onClear && (
              <button
                onClick={onClear}
                className="text-gray-400 hover:text-white transition"
                title="Clear selection"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Selected Text with Pronunciation */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xs text-gray-400">Selected Text</h3>
            <button
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-white transition"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
          <p className="text-2xl text-white font-medium mb-3 select-text">{selectedText}</p>
          
          {hiragana && hiragana !== selectedText && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              <p className="text-xs text-gray-400 mb-1">Furigana (Hiragana Reading)</p>
              <p className="text-lg text-blue-300">{hiragana}</p>
            </div>
          )}

          {romaji && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              <p className="text-xs text-gray-400 mb-1">Romaji (Pronunciation Guide)</p>
              <p className="text-base text-green-300 italic font-medium">{romaji}</p>
            </div>
          )}

          <div className="border-t border-gray-600 pt-2 mt-2">
            <p className="text-xs text-gray-500">
              💡 Romaji shows how to pronounce the Japanese text in English letters
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'dictionary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📚 Dictionary
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'online'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🌐 Online
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dictionary' ? (
          // Dictionary Tab
          <div className="pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : translation ? (
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="text-xs text-gray-400">Dictionary Translation</h3>
                
                <div>
                  <ul className="space-y-2">
                    {translation.meanings.map((meaning, index) => (
                      <li key={index} className="text-white">
                        <span className="text-blue-400 mr-2">{index + 1}.</span>
                        {meaning}
                      </li>
                    ))}
                  </ul>
                </div>

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

                {translation.common && (
                  <div className="border-t border-gray-600 pt-3">
                    <span className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded">
                      ⭐ Common Word
                    </span>
                  </div>
                )}

                {translation.kanji && translation.kanji !== translation.kana && (
                  <div className="border-t border-gray-600 pt-3">
                    <p className="text-xs text-gray-400 mb-2">Kanji Reading</p>
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-medium">{translation.kanji}</span>
                      {' → '}
                      <span className="text-blue-300">{translation.kana}</span>
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-600 pt-3">
                  <p className="text-xs text-gray-500">
                    📖 Dictionary shows word-by-word meanings
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
                <p className="text-gray-400 text-xs mt-2">
                  Switch to Online tab for translation.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Online Translation Tab
          <div className="space-y-3 pb-4">
            <a
              href={googleTranslateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm transition"
            >
              <ExternalLink size={16} />
              <div className="flex-1 text-left">
                <div className="font-medium">Open in Google Translate</div>
                <div className="text-xs text-blue-200">See full context and examples</div>
              </div>
            </a>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={16} className="text-blue-400" />
                <h3 className="text-xs text-gray-400">Quick Online Translation</h3>
              </div>

              {isTranslating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : apiTranslation ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">English Translation:</p>
                    <p className="text-lg text-white">{apiTranslation.translated}</p>
                  </div>
                  <button
                    onClick={() => {
                      setApiTranslation(null);
                      fetchOnlineTranslation();
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Refresh Translation
                  </button>
                  <div className="text-xs text-gray-500 border-t border-gray-600 pt-2">
                    Powered by MyMemory Translation API
                  </div>
                </div>
              ) : (
                <button
                  onClick={fetchOnlineTranslation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  Get Online Translation
                </button>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">📢 About Pronunciation:</p>
              <p className="text-xs text-gray-300">
                Romaji pronunciation is shown at the top in the "Selected Text" section. 
                Google Translate also shows romaji when you open it in a new tab.
              </p>
            </div>

            <div className="text-xs text-gray-500 bg-gray-700 rounded-lg p-3">
              <p className="mb-2"><strong>💡 Tips:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Romaji is always shown at the top</li>
                <li>• Online translation works for phrases & sentences</li>
                <li>• Dictionary is faster for single words</li>
                <li>• Click "Open in Google Translate" for audio pronunciation</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TranslationPanel;