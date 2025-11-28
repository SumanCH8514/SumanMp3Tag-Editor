import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;

export const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  // Load ffmpeg.wasm from a CDN or local public folder
  // Using unpkg for simplicity in this demo, but for production should be local
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  
  return ffmpeg;
};

export const convertToMp3 = async (file, onProgress) => {
  const ffmpeg = await loadFFmpeg();
  
  const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
  const outputName = 'output.mp3';
  
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  
  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) onProgress(progress);
  });
  
  await ffmpeg.exec(['-i', inputName, '-b:a', '192k', outputName]);
  
  const data = await ffmpeg.readFile(outputName);
  
  // Cleanup
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);
  
  return new Blob([data.buffer], { type: 'audio/mp3' });
};

const fetchFile = async (file) => {
  return new Uint8Array(await file.arrayBuffer());
};
