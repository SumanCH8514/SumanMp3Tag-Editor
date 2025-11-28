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
        resolve({
          title: tags.title || '',
          artist: tags.artist || '',
          album: tags.album || '',
          genre: tags.genre || '',
          year: tags.year || '',
          track: tags.track || '',
          comment: tags.comment ? tags.comment.text : '',
          cover: cover
          // Note: jsmediatags might not read all fields like Album Artist (TPE2) or Copyright (TCOP) easily in all versions, 
          // but we'll try to map what we can or rely on what's available.
          // For this demo, we'll initialize them as empty if not found.
        });
      },
      onError: (error) => {
        console.warn("Error reading tags:", error);
        resolve({ 
          title: '', artist: '', album: '', 
          genre: '', year: '', track: '', comment: '', 
          cover: null 
        });
      }
    });
  });
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
  if (metadata.comment) writer.setFrame('COMM', {
    description: '',
    text: metadata.comment,
    language: 'eng'
  });
  if (metadata.copyright) writer.setFrame('TCOP', metadata.copyright);
  
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
