import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';
import { ID3Writer } from 'browser-id3-writer';

export const readTags = (file) => {
  return new Promise((resolve, reject) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        const { tags } = tag;
        let cover = null;
        if (tags.picture) {
          const { data, format } = tags.picture;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          cover = `data:${format};base64,${window.btoa(base64String)}`;
        }
        let lyrics = '';
        if (tags.USLT) {
          lyrics = tags.USLT.data ? (tags.USLT.data.lyrics || tags.USLT.data.text || '') : '';
        } else if (tags.lyrics) {
          lyrics = typeof tags.lyrics === 'string' ? tags.lyrics : (tags.lyrics.lyrics || tags.lyrics.text || '');
        }

        resolve({
          title: tags.title || '',
          artist: tags.artist || '',
          album: tags.album || '',
          genre: tags.genre || '',
          year: tags.year || '',
          track: tags.track || '',
          comment: tags.comment ? tags.comment.text : '',
          lyrics: lyrics,
          cover: cover
        });
      },
      onError: (error) => {
        console.warn("Error reading tags:", error);
        resolve({ 
          title: '', artist: '', album: '', 
          genre: '', year: '', track: '', comment: '', lyrics: '',
          cover: null 
        });
      }
    });
  });
};

export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      URL.revokeObjectURL(url);
      resolve(dur && !isNaN(dur) && isFinite(dur) ? dur : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
};

export const applyLyricsBranding = (lyrics, durationInSeconds = null) => {
  if (!lyrics || !lyrics.trim()) return '';
  
  const rawPrefix = "This Song is Download from Songs.SumanOnline.Com";
  const rawSuffix = "SumanMusic";

  let result = lyrics.trim();
  const hasLrcTimestamps = /\[\d{2}:\d{2}\.\d{2,3}\]/.test(result);

  if (hasLrcTimestamps) {
    const lrcPrefix = `[00:00.00] ${rawPrefix}`;

    if (durationInSeconds && durationInSeconds > 0) {
      const maxAllowedMs = Math.floor(durationInSeconds * 1000);
      const lines = result.split('\n');
      const filteredLines = lines.filter(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
        if (!match) return true;
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const msStr = match[3].padEnd(2, '0').substring(0, 2);
        const ms = parseInt(msStr, 10);
        const lineMs = (min * 60 + sec) * 1000 + ms * 10;
        return lineMs <= maxAllowedMs || line.includes(rawPrefix) || line.includes(rawSuffix);
      });
      result = filteredLines.join('\n').trim();
    }

    if (result.startsWith(rawPrefix)) {
      result = `${lrcPrefix}\n${result.substring(rawPrefix.length).trim()}`;
    } else if (!result.includes(rawPrefix)) {
      result = `${lrcPrefix}\n${result}`;
    }

    result = result.replace(new RegExp(`(?:\\[\\d{2}:\\d{2}\\.\\d{2,3}\\]\\s*)?${rawSuffix}$`, 'im'), '').trim();

    const matches = [...result.matchAll(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g)];
    let lastLineMs = 0;
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const min = parseInt(lastMatch[1], 10);
      const sec = parseInt(lastMatch[2], 10);
      const msStr = lastMatch[3].padEnd(2, '0').substring(0, 2);
      const ms = parseInt(msStr, 10);
      lastLineMs = (min * 60 + sec) * 1000 + ms * 10;
    }

    let suffixTimeMs = 0;
    if (durationInSeconds && durationInSeconds > 0) {
      const totalDurationMs = Math.floor(durationInSeconds * 1000);
      const targetNearEndMs = Math.max(0, totalDurationMs - 1500);
      
      if (lastLineMs < targetNearEndMs) {
        suffixTimeMs = targetNearEndMs;
      } else {
        suffixTimeMs = Math.min(totalDurationMs - 300, lastLineMs + 1000);
      }
    } else if (lastLineMs > 0) {
      suffixTimeMs = lastLineMs + 2000;
    } else {
      suffixTimeMs = 1000;
    }

    const newMin = Math.floor(suffixTimeMs / 60000);
    suffixTimeMs %= 60000;
    const newSec = Math.floor(suffixTimeMs / 1000);
    const newMs = Math.floor((suffixTimeMs % 1000) / 10);

    const pad = (n) => String(n).padStart(2, '0');
    const suffixTimestamp = `[${pad(newMin)}:${pad(newSec)}.${pad(newMs)}]`;

    result = `${result}\n${suffixTimestamp} ${rawSuffix}`;
  } else {
    if (!result.startsWith(rawPrefix)) {
      result = `${rawPrefix}\n\n${result}`;
    }
    if (!result.endsWith(rawSuffix)) {
      result = `${result}\n\n${rawSuffix}`;
    }
  }

  return result;
};

export const writeTags = async (file, metadata, coverFile) => {
  const arrayBuffer = await file.arrayBuffer();
  const writer = new ID3Writer(arrayBuffer);
  
  if (metadata.title) writer.setFrame('TIT2', metadata.title);
  if (metadata.artist) writer.setFrame('TPE1', [metadata.artist]);
  if (metadata.album) writer.setFrame('TALB', metadata.album);
  if (metadata.genre) writer.setFrame('TCON', [metadata.genre]);
  if (metadata.year) writer.setFrame('TYER', metadata.year);
  if (metadata.albumArtist) writer.setFrame('TPE2', metadata.albumArtist);
  if (metadata.track) writer.setFrame('TRCK', metadata.track);
  if (metadata.composer) writer.setFrame('TCOM', [metadata.composer]);
  if (metadata.comment) writer.setFrame('COMM', {
    description: '',
    text: metadata.comment,
    language: 'eng'
  });
  if (metadata.copyright) writer.setFrame('TCOP', metadata.copyright);
  
  const finalLyrics = applyLyricsBranding(metadata.lyrics, metadata.duration);
  if (finalLyrics) writer.setFrame('USLT', {
    description: '',
    lyrics: finalLyrics,
    language: 'eng'
  });
  
  if (coverFile) {
    const coverBuffer = await coverFile.arrayBuffer();
    writer.setFrame('APIC', {
      type: 3,
      data: coverBuffer,
      description: 'Cover',
      useUnicodeEncoding: false
    });
  }

  writer.addTag();
  return writer.getBlob();
};
