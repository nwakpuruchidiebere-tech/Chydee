// Audio utilities for Gemini Live (16kHz mic input, 24kHz playback) and TTS WAV playback

export function pcmToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  let binary = '';
  const bytes = new Uint8Array(int16Array.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function playAudioChunk(audioCtx: AudioContext, base64Pcm: string, nextStartTimeRef: { current: number }) {
  const binary = atob(base64Pcm);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }

  const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
  audioBuffer.getChannelData(0).set(float32);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);

  const currentTime = audioCtx.currentTime;
  const startTime = Math.max(currentTime, nextStartTimeRef.current);
  source.start(startTime);
  nextStartTimeRef.current = startTime + audioBuffer.duration;
}

export function playWavUrl(dataUrl: string): HTMLAudioElement {
  const audio = new Audio(dataUrl);
  audio.play().catch((err) => console.warn('Audio playback error:', err));
  return audio;
}
