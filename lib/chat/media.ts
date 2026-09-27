// Fotos y notas de voz del chat: se preparan en el navegador para que viajen
// chicas y en un formato que el modelo entiende (JPEG y WAV 16 kHz mono).

const LADO_MAX = 1600;
export const AUDIO_MAX_S = 60;

export async function comprimirImagen(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, mal) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => mal(new Error("imagen_invalida"));
      i.src = url;
    });
    const k = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * k);
    canvas.height = Math.round(img.naturalHeight * k);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sin_canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// MediaRecorder graba webm/opus (Android) o mp4/aac (iPhone); ninguno sirve
// directo al modelo, así que se decodifica y se reescribe como WAV 16 kHz mono.
export async function aWav16k(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let decodificado: AudioBuffer;
  try {
    decodificado = await ctx.decodeAudioData(buf);
  } finally {
    void ctx.close();
  }
  const duracion = Math.min(decodificado.duration, AUDIO_MAX_S);
  const offline = new OfflineAudioContext(1, Math.ceil(duracion * 16000), 16000);
  const fuente = offline.createBufferSource();
  fuente.buffer = decodificado;
  fuente.connect(offline.destination);
  fuente.start();
  const pcm = (await offline.startRendering()).getChannelData(0);

  const datos = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const texto = (o: number, s: string) => [...s].forEach((c, i) => datos.setUint8(o + i, c.charCodeAt(0)));
  texto(0, "RIFF");
  datos.setUint32(4, 36 + pcm.length * 2, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  datos.setUint32(16, 16, true);
  datos.setUint16(20, 1, true);
  datos.setUint16(22, 1, true);
  datos.setUint32(24, 16000, true);
  datos.setUint32(28, 32000, true);
  datos.setUint16(32, 2, true);
  datos.setUint16(34, 16, true);
  texto(36, "data");
  datos.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i += 1) {
    const v = Math.max(-1, Math.min(1, pcm[i]));
    datos.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return await new Promise<string>((ok, mal) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).replace(/^data:[^;]*;/, "data:audio/wav;"));
    r.onerror = () => mal(r.error);
    r.readAsDataURL(new Blob([datos.buffer], { type: "audio/wav" }));
  });
}

export function puedeGrabar(): boolean {
  return typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}
