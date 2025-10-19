

class DictionaryService {
  constructor() {
    this.dictionary = null;
    this.isLoaded = false;
    this.isLoading = false;
  }

  async loadDictionary() {
    if (this.isLoaded) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch('/data/jmdict-eng-3.5.0.json');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dictionary');
      }

      const data = await response.json();
      this.dictionary = this.indexDictionary(data.words);
      this.isLoaded = true;
      this.isLoading = false;

      console.log(`Dictionary loaded: ${Object.keys(this.dictionary).length} entries`);
      return true;

    } catch (error) {
      console.error('Error loading dictionary:', error);
      this.isLoading = false;
      this.dictionary = {};
      this.isLoaded = true;
      return false;
    }
  }

  indexDictionary(words) {
    console.log('Starting dictionary indexing...');
    const indexed = {};
    let count = 0;

    words.forEach((entry) => {
      count++;
      if (count % 10000 === 0) {
        console.log(`Indexing progress: ${count}/${words.length} words`);
      }

      // Index by kanji
      if (entry.kanji) {
        entry.kanji.forEach(k => {
          const key = k.text.trim();
          if (!indexed[key]) indexed[key] = [];
          if (!indexed[key].some(e => e.id === entry.id)) {
            indexed[key].push(entry);
          }

          // Also index by common verb forms if it looks like a verb
          if (entry.sense?.some(s => s.partOfSpeech?.some(pos => pos.includes('verb')))) {
            // Common verb endings
            const endings = ['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'];
            if (endings.some(end => key.endsWith(end))) {
              // Add dictionary form and -masu form
              const stem = key.slice(0, -1);
              const masuForm = stem + 'ます';
              if (!indexed[masuForm]) indexed[masuForm] = [];
              if (!indexed[masuForm].some(e => e.id === entry.id)) {
                indexed[masuForm].push(entry);
              }
            }
          }
        });
      }

      // Index by kana readings
      if (entry.kana) {
        entry.kana.forEach(k => {
          const key = k.text.trim();
          if (!indexed[key]) indexed[key] = [];
          if (!indexed[key].some(e => e.id === entry.id)) {
            indexed[key].push(entry);
          }
        });
      }
    });

    console.log('Dictionary indexed with', Object.keys(indexed).length, 'entries');
    // Debug: Log some common words to verify indexing
    const commonWords = ['洗う', '見る', '食べる', '全身'];
    commonWords.forEach(word => {
      console.log(`Check if "${word}" is indexed:`, indexed[word] ? 'Yes' : 'No');
    });

    return indexed;
  }

  /**
   * Clean text by removing common particles and markers
   */
  cleanText(text) {
    // Remove common particles from the end
    const particles = ['は', 'が', 'を', 'に', 'へ', 'と', 'や', 'の', 'で', 'も', 'から', 'まで'];
    let cleaned = text.trim();
    
    for (const particle of particles) {
      if (cleaned.endsWith(particle)) {
        cleaned = cleaned.slice(0, -particle.length);
      }
    }
    
    return cleaned;
  }

  /**
   * Try multiple variations of the text
   */
  getTextVariations(text) {
    const variations = [text];
    
    // Add cleaned version (without particles)
    const cleaned = this.cleanText(text);
    if (cleaned !== text) {
      variations.push(cleaned);
    }
    
    // Add progressively shorter versions
    for (let i = text.length - 1; i > 0; i--) {
      variations.push(text.substring(0, i));
    }
    
    return variations;
  }

  lookup(text) {
    if (!this.isLoaded || !this.dictionary) {
      console.warn('Dictionary not loaded');
      return [];
    }

    const cleanText = text.trim();
    console.log('Looking up:', cleanText);
    
    // Try exact match first
    let results = this.dictionary[cleanText] || [];
    if (results.length > 0) {
      console.log('Found exact match');
      return results.map(entry => this.formatEntry(entry));
    }
    
    // Try cleaned version (without particles)
    const cleaned = this.cleanText(cleanText);
    if (cleaned !== cleanText) {
      console.log('Trying cleaned version:', cleaned);
      results = this.dictionary[cleaned] || [];
      if (results.length > 0) {
        console.log('Found match with cleaned version');
        return results.map(entry => this.formatEntry(entry));
      }
    }

    // Try looking up by kana if the input is not kanji
    if (!/[\u4e00-\u9faf]/.test(cleanText)) {
      console.log('Looking up by kana');
      const kanaResults = Object.values(this.dictionary)
        .flat()
        .filter(entry => 
          entry.kana && entry.kana.some(k => k.text === cleanText)
        );
      if (kanaResults.length > 0) {
        console.log('Found match by kana');
        return kanaResults.map(entry => this.formatEntry(entry));
      }
    }
    
    console.log('No matches found');
    return [];
  }

  formatEntry(entry) {
    const kanji = entry.kanji?.[0]?.text || '';
    const kana = entry.kana?.[0]?.text || '';
    
    const meanings = [];
    const partsOfSpeech = [];

    if (entry.sense) {
      entry.sense.forEach(sense => {
        if (sense.partOfSpeech) {
          sense.partOfSpeech.forEach(pos => {
            if (!partsOfSpeech.includes(pos)) {
              partsOfSpeech.push(pos);
            }
          });
        }

        if (sense.gloss) {
          sense.gloss.forEach(g => {
            if (g.lang === 'eng' && !meanings.includes(g.text)) {
              meanings.push(g.text);
            }
          });
        }
      });
    }

    return {
      kanji,
      kana,
      meanings: meanings.slice(0, 5),
      partsOfSpeech: this.simplifyPartOfSpeech(partsOfSpeech),
      common: entry.tags?.includes('common') || false
    };
  }

  simplifyPartOfSpeech(posList) {
    const simplified = [];
    
    posList.forEach(pos => {
      if (pos.includes('noun')) simplified.push('noun');
      else if (pos.includes('verb')) simplified.push('verb');
      else if (pos.includes('adjective')) simplified.push('adjective');
      else if (pos.includes('adverb')) simplified.push('adverb');
      else if (pos.includes('particle')) simplified.push('particle');
      else if (pos.includes('expression')) simplified.push('expression');
    });

    return [...new Set(simplified)];
  }

  /**
   * Find best match - tries multiple strategies
   */
  findBestMatch(text) {
    const cleanText = text.trim();
    
    console.log('Looking up:', cleanText);
    console.log('Dictionary loaded status:', this.isLoaded);
    console.log('Dictionary entries:', this.dictionary ? Object.keys(this.dictionary).length : 0);
    
    // Strategy 1: Exact match
    let results = this.lookup(cleanText);
    if (results.length > 0) {
      console.log('Found exact match for:', cleanText);
      return results;
    }

    // Strategy 2: Remove particles
    const cleaned = this.cleanText(cleanText);
    if (cleaned !== cleanText) {
      console.log('Trying without particles:', cleaned);
      results = this.lookup(cleaned);
      if (results.length > 0) {
        console.log('Found match without particles:', cleaned);
        return results;
      }
    }

    // Debug: Check for similar entries
    const similarEntries = Object.keys(this.dictionary || {})
      .filter(key => key.includes(cleanText) || cleanText.includes(key))
      .slice(0, 5);
    console.log('Similar entries in dictionary:', similarEntries);

    // Strategy 3: Progressive substring from start
    console.log('Trying substrings...');
    for (let i = cleanText.length - 1; i > 0; i--) {
      const substring = cleanText.substring(0, i);
      results = this.lookup(substring);
      if (results.length > 0) {
        console.log('Found match with substring:', substring);
        return results;
      }
    }

    console.log('No matches found for:', cleanText);
    return [];
  }
}

const dictionaryService = new DictionaryService();
export default dictionaryService;