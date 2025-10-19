/**
 * Translation API Service
 * Uses MyMemory Translation API (FREE, no API key needed)
 * Limit: 1000 requests/day (plenty for personal use)
 */

class TranslationAPIService {
  constructor() {
    this.baseURL = 'https://api.mymemory.translated.net/get';
    this.cache = new Map();
  }

  /**
   * Translate text from Japanese to English
   */
  async translate(text) {
    // Check cache
    if (this.cache.has(text)) {
      console.log('Using cached translation');
      return this.cache.get(text);
    }

    try {
      const url = `${this.baseURL}?q=${encodeURIComponent(text)}&langpair=ja|en`;
      console.log('Translating:', text);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Translation API failed');
      }

      const data = await response.json();
      
      if (data.responseStatus === 200) {
        const result = {
          original: text,
          translated: data.responseData.translatedText,
          match: data.responseData.match || 0
        };
        
        // Cache result
        this.cache.set(text, result);
        return result;
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

const translationAPIService = new TranslationAPIService();
export default translationAPIService;