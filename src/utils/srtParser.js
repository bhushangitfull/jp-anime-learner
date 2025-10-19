

/**
 * Convert SRT timestamp to seconds
 * @param {string} timestamp - Format: "00:00:10,500"
 * @returns {number} - Time in seconds
 */
function timestampToSeconds(timestamp) {
  const [time, milliseconds] = timestamp.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  return hours * 3600 + minutes * 60 + seconds + (parseInt(milliseconds) / 1000);
}

/**
 * Parse SRT file content
 * @param {string} content - Raw SRT file content
 * @returns {Array} - Array of subtitle objects
 */
export function parseSRT(content) {
  // Remove BOM if present
  content = content.replace(/^\uFEFF/, '');
  
  // Split by double newlines (subtitle blocks)
  const blocks = content.trim().split(/\n\s*\n/);
  
  const subtitles = [];
  
  for (const block of blocks) {
    const lines = block.split('\n');
    
    // Skip empty blocks
    if (lines.length < 3) continue;
    
    // Line 1: Index (we can ignore this)
    // Line 2: Timestamp
    // Line 3+: Subtitle text
    
    const timestampLine = lines[1];
    const textLines = lines.slice(2);
    
    // Parse timestamp: "00:00:10,500 --> 00:00:13,000"
    const timestampMatch = timestampLine.match(/(\S+)\s+-->\s+(\S+)/);
    
    if (!timestampMatch) continue;
    
    const startTime = timestampToSeconds(timestampMatch[1]);
    const endTime = timestampToSeconds(timestampMatch[2]);
    const text = textLines.join('\n').trim();
    
    // Skip empty subtitles
    if (!text) continue;
    
    subtitles.push({
      id: subtitles.length,
      startTime,
      endTime,
      text
    });
  }
  
  return subtitles;
}

/**
 * Find the current subtitle based on video time
 * @param {Array} subtitles - Array of subtitle objects
 * @param {number} currentTime - Current video time in seconds
 * @returns {Object|null} - Current subtitle or null
 */
export function getCurrentSubtitle(subtitles, currentTime) {
  return subtitles.find(
    sub => currentTime >= sub.startTime && currentTime <= sub.endTime
  ) || null;
}

/**
 * Load and parse SRT file
 * @param {File} file - SRT file from input
 * @returns {Promise<Array>} - Promise that resolves to subtitles array
 */
export async function loadSRTFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const subtitles = parseSRT(content);
        resolve(subtitles);
      } catch (error) {
        reject(new Error('Failed to parse SRT file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read as text, try UTF-8 first
    reader.readAsText(file, 'UTF-8');
  });
}