/**
 * 브라우저에서 사진 용량을 줄인다.
 *
 * 요즘 휴대폰 사진은 한 장에 5~10MB 씩 되고, 화면 캡처(PNG)는 더 큰 경우도 있다.
 * 그래서 크기를 일일이 확인하지 않아도 되도록, 고르는 즉시 목표 용량 아래로
 * 들어갈 때까지 화질과 크기를 단계적으로 낮춘다.
 *
 * 애니메이션 GIF 와 SVG 는 다시 그리면 망가지므로 건드리지 않는다.
 */

export interface CompressOptions {
  /** 긴 변 최대 길이(px) */
  maxSize?: number;
  /** 이 용량 아래로 만든다 (bytes) */
  targetBytes?: number;
  /** 투명 배경을 지켜야 하는 로고 등. PNG 로 저장한다. */
  keepTransparency?: boolean;
}

export interface CompressResult {
  file: File;
  originalBytes: number;
  bytes: number;
  changed: boolean;
}

const DEFAULTS: Required<CompressOptions> = {
  maxSize: 1600,
  targetBytes: 700 * 1024,
  keepTransparency: false,
};

/** 다시 그려도 되는 형식인지 */
function reencodable(type: string): boolean {
  return /^image\/(jpeg|jpg|png|webp|bmp|heic|heif|avif)$/.test(type);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(bitmap: ImageBitmap, maxSize: number): HTMLCanvasElement | null {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // JPEG 는 투명을 표현하지 못해서 검게 나온다. 흰 배경을 먼저 깐다.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { maxSize, targetBytes, keepTransparency } = { ...DEFAULTS, ...options };
  const original = file.size;
  const keep = (): CompressResult => ({
    file,
    originalBytes: original,
    bytes: original,
    changed: false,
  });

  if (!reencodable(file.type)) return keep();

  try {
    const bitmap = await createImageBitmap(file);

    // 투명 배경을 지켜야 하면 PNG 로 두고 크기만 줄인다.
    if (keepTransparency) {
      const canvas = draw(bitmap, Math.min(maxSize, 1024));
      bitmap.close();
      if (!canvas) return keep();

      const blob = await toBlob(canvas, "image/png", 1);
      if (!blob || blob.size >= original) return keep();
      return done(file, blob, "png", original);
    }

    // 목표 용량에 들어갈 때까지 화질 → 크기 순으로 낮춘다.
    for (const width of [maxSize, 1280, 1024, 800]) {
      const canvas = draw(bitmap, width);
      if (!canvas) break;

      for (const quality of [0.82, 0.7, 0.6, 0.5, 0.4]) {
        const blob = await toBlob(canvas, "image/jpeg", quality);
        if (!blob) continue;
        if (blob.size <= targetBytes) {
          bitmap.close();
          // 원본이 이미 더 작으면 원본을 쓴다
          return blob.size >= original ? keep() : done(file, blob, "jpg", original);
        }
      }
    }

    // 여기까지 왔으면 가장 작게 만든 것이라도 쓴다. 원본보다는 훨씬 작다.
    const canvas = draw(bitmap, 800);
    bitmap.close();
    if (!canvas) return keep();

    const blob = await toBlob(canvas, "image/jpeg", 0.4);
    if (!blob || blob.size >= original) return keep();
    return done(file, blob, "jpg", original);
  } catch {
    // 브라우저가 지원하지 않으면 원본을 그대로 쓴다
    return keep();
  }
}

function done(source: File, blob: Blob, ext: string, original: number): CompressResult {
  const name = source.name.replace(/\.[^.]+$/, "") + "." + ext;
  const file = new File([blob], name, {
    type: ext === "png" ? "image/png" : "image/jpeg",
    lastModified: Date.now(),
  });
  return { file, originalBytes: original, bytes: file.size, changed: true };
}

/** 사람이 읽기 좋은 크기 표기 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
