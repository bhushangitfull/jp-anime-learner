/**
 * Furigana Service
 * Converts Japanese text to Hiragana and Romaji
 * Uses Kuroshiro for accurate conversion
 */

import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

class FuriganaService {
  constructor() {
    this.kuroshiro = null;
    this.isInitialized = false;
    this.isInitializing = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isInitialized;
    }

    this.isInitializing = true;

    try {
      this.kuroshiro = new Kuroshiro();
      await this.kuroshiro.init(new KuromojiAnalyzer());
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('Kuroshiro initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Kuroshiro:', error);
      this.isInitializing = false;
      this.isInitialized = false;
      return false;
    }
  }

  async toHiragana(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.kuroshiro) {
      console.error('Kuroshiro not initialized');
      return text;
    }

    try {
      const result = await this.kuroshiro.convert(text, {
        to: 'hiragana',
        mode: 'normal'
      });
      return result;
    } catch (error) {
      console.error('Error converting to hiragana:', error);
      return text;
    }
  }

  async toRomaji(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.kuroshiro) {
      console.error('Kuroshiro not initialized');
      return text;
    }

    try {
      const result = await this.kuroshiro.convert(text, {
        to: 'romaji',
        mode: 'normal',
        romajiSystem: 'hepburn' // Use Hepburn romanization (most common)
      });
      return result;
    } catch (error) {
      console.error('Error converting to romaji:', error);
      return text;
    }
  }

  async toKatakana(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.kuroshiro) {
      console.error('Kuroshiro not initialized');
      return text;
    }

    try {
      const result = await this.kuroshiro.convert(text, {
        to: 'katakana',
        mode: 'normal'
      });
      return result;
    } catch (error) {
      console.error('Error converting to katakana:', error);
      return text;
    }
  }

  /**
   * Get furigana (reading) for kanji with HTML markup
   */
  async toFurigana(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.kuroshiro) {
      console.error('Kuroshiro not initialized');
      return text;
    }

    try {
      const result = await this.kuroshiro.convert(text, {
        to: 'hiragana',
        mode: 'furigana'
      });
      return result;
    } catch (error) {
      console.error('Error converting to furigana:', error);
      return text;
    }
  }
}

const furiganaService = new FuriganaService();
export default furiganaService;