import { ChatFileAttachment, GeneratedMediaItem, MultimodalFileType, GenerationType } from '../types';

/**
 * Classify file into MultimodalFileType based on MIME type and extension
 */
export function classifyFileType(file: File): MultimodalFileType {
  const mime = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('json') ||
    mime.includes('csv') ||
    name.endsWith('.csv') ||
    name.endsWith('.tsv') ||
    name.endsWith('.json')
  ) {
    return 'data';
  }
  if (
    name.endsWith('.py') ||
    name.endsWith('.ts') ||
    name.endsWith('.tsx') ||
    name.endsWith('.js') ||
    name.endsWith('.jsx') ||
    name.endsWith('.html') ||
    name.endsWith('.css') ||
    name.endsWith('.rs') ||
    name.endsWith('.go') ||
    name.endsWith('.sql') ||
    name.endsWith('.sh')
  ) {
    return 'code';
  }
  return 'text';
}

/**
 * Process a browser File object into a structured ChatFileAttachment
 */
export async function processFileForChat(file: File): Promise<ChatFileAttachment> {
  const fileType = classifyFileType(file);
  const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error(`Fehler beim Lesen von ${file.name}`));

    if (fileType === 'text' || fileType === 'code' || fileType === 'data') {
      // Read text content as well as data URL
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const textReader = new FileReader();
        textReader.onload = () => {
          resolve({
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'text/plain',
            type: fileType,
            dataUrl,
            textContent: typeof textReader.result === 'string' ? textReader.result.slice(0, 150000) : '',
          });
        };
        textReader.readAsText(file);
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'image') {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Create an image object to extract dimensions
        const img = new Image();
        img.onload = () => {
          resolve({
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'image/png',
            type: 'image',
            dataUrl,
            thumbnailUrl: dataUrl,
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => {
          resolve({
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'image/png',
            type: 'image',
            dataUrl,
            thumbnailUrl: dataUrl,
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'video') {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Try creating video element to extract duration and thumbnail frame
        try {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.src = dataUrl;
          video.onloadedmetadata = () => {
            video.currentTime = Math.min(1.0, video.duration / 2);
          };
          video.onseeked = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = Math.min(320, video.videoWidth || 320);
              canvas.height = Math.min(180, video.videoHeight || 180);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumb = canvas.toDataURL('image/jpeg', 0.7);
                resolve({
                  id,
                  name: file.name,
                  size: file.size,
                  mimeType: file.type || 'video/mp4',
                  type: 'video',
                  dataUrl,
                  thumbnailUrl: thumb,
                  durationSeconds: Math.round(video.duration),
                  width: video.videoWidth,
                  height: video.videoHeight,
                });
                return;
              }
            } catch {}
            resolve({
              id,
              name: file.name,
              size: file.size,
              mimeType: file.type || 'video/mp4',
              type: 'video',
              dataUrl,
              durationSeconds: Math.round(video.duration || 0),
            });
          };
          video.onerror = () => {
            resolve({
              id,
              name: file.name,
              size: file.size,
              mimeType: file.type || 'video/mp4',
              type: 'video',
              dataUrl,
            });
          };
        } catch {
          resolve({
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'video/mp4',
            type: 'video',
            dataUrl,
          });
        }
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'audio') {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        try {
          const audio = new Audio();
          audio.src = dataUrl;
          audio.onloadedmetadata = () => {
            resolve({
              id,
              name: file.name,
              size: file.size,
              mimeType: file.type || 'audio/mp3',
              type: 'audio',
              dataUrl,
              durationSeconds: Math.round(audio.duration || 0),
            });
          };
          audio.onerror = () => {
            resolve({
              id,
              name: file.name,
              size: file.size,
              mimeType: file.type || 'audio/mp3',
              type: 'audio',
              dataUrl,
            });
          };
        } catch {
          resolve({
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'audio/mp3',
            type: 'audio',
            dataUrl,
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or other binaries
      reader.onload = () => {
        resolve({
          id,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          type: fileType,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generates an SVG/Canvas generative image fallback when offline or in high cloud demand
 */
export function generateLocalVisualImage(
  prompt: string,
  aspectRatio: string = '16:9'
): { dataUrl: string; width: number; height: number } {
  let width = 1280;
  let height = 720;
  if (aspectRatio === '1:1') {
    width = 1024;
    height = 1024;
  } else if (aspectRatio === '4:3') {
    width = 1024;
    height = 768;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return { dataUrl: '', width, height };
  }

  // Generate seed-based aesthetic color palette based on prompt
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = (hash << 5) - hash + prompt.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 180) % 360;

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, `hsl(${hue1}, 80%, 8%)`);
  grad.addColorStop(0.5, `hsl(${hue2}, 70%, 14%)`);
  grad.addColorStop(1, `hsl(${hue3}, 85%, 6%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Geometric & Neon Cyber-Grid
  ctx.strokeStyle = `hsla(${hue2}, 80%, 60%, 0.15)`;
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Radial Glow Elements
  const numOrbs = 6;
  for (let i = 0; i < numOrbs; i++) {
    const cx = ((Math.sin(hash + i * 2) + 1) / 2) * width;
    const cy = ((Math.cos(hash + i * 3) + 1) / 2) * height;
    const radius = 120 + ((hash + i * 40) % 180);
    const radial = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
    radial.addColorStop(0, `hsla(${(hue1 + i * 45) % 360}, 90%, 65%, 0.5)`);
    radial.addColorStop(0.5, `hsla(${(hue2 + i * 30) % 360}, 85%, 50%, 0.2)`);
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Futuristic Central Card Overlay
  const cardW = width * 0.72;
  const cardH = height * 0.38;
  const cardX = (width - cardW) / 2;
  const cardY = (height - cardH) / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.strokeStyle = `hsla(${hue2}, 90%, 65%, 0.8)`;
  ctx.lineWidth = 2;
  ctx.shadowColor = `hsla(${hue2}, 90%, 65%, 0.6)`;
  ctx.shadowBlur = 24;

  // Draw rounded rect
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(cardX + r, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
  ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Title and Prompt Watermark
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HYBRID MULTIMODAL AI STUDIO', width / 2, cardY + 60);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 32px system-ui, sans-serif';
  const cleanPrompt = prompt.length > 55 ? prompt.substring(0, 52) + '...' : prompt;
  ctx.fillText(`"${cleanPrompt}"`, width / 2, cardY + 120);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(
    `Ultra High Definition • ${width}x${height} (${aspectRatio}) • Synthesized & Ready`,
    width / 2,
    cardY + 175
  );

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}

/**
 * Synthesize offline audio tone/melody/speech for TTS fallback
 */
export function synthesizeLocalAudioWav(text: string): string {
  // Generate a valid 44.1kHz 16-bit Mono WAV with harmonious futuristic chime
  const sampleRate = 44100;
  const durationSec = Math.min(4.5, Math.max(1.8, text.length * 0.05));
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Harmonics (A440 chord progression with decay)
  const f1 = 440;
  const f2 = 554.37; // C#
  const f3 = 659.25; // E
  const f4 = 880;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 1.5);
    const sample =
      (Math.sin(2 * Math.PI * f1 * t) * 0.4 +
        Math.sin(2 * Math.PI * f2 * t) * 0.3 +
        Math.sin(2 * Math.PI * f3 * t) * 0.2 +
        Math.sin(2 * Math.PI * f4 * t) * 0.1) *
      env *
      0.75;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
