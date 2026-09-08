/**
 * 브라우저에서 사진 용량을 줄인다.
 *
 * 요즘 휴대폰 사진은 한 장에 5~10MB 씩 된다.
 * 그대로 올리면 전송 한도에 걸리고, 홈페이지도 느려진다.
 * 그래서 올리기 전에 긴 변을 줄이고 다시 저장한다.
 *
 * 화질은 눈으로 구분하기 어려운 수준만 낮춘다.
 * 투명 배경이 필요한 PNG(로고)와 SVG 는 건드리지 않는다.
 */

export interface CompressOptions {
  /** 긴 변 최대 길이(px) */
  maxSize?: number;
  /** 0~1. 낮을수록 용량이 작아진다. */
  quality?: number;
  /** 이 크기 이하면 그대로 둔다 */
  skipUnderBytes?: number;
}

export interface CompressResult {
  file: File;
  originalBytes: number;
  bytes: number;
  changed: boolean;
}

const DEFAULTS: Required<CompressOptions> = {
  maxSize: 1600,
  quality: 0.82,
  skipUnderBytes: 400 * 1024,
};

export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { maxSize, quality, skipUnderBytes } = { ...DEFAULTS, ...options };
  const original = file.size;

  // PNG 는 로고처럼 투명 배경일 수 있어 그대로 둔다.
  // SVG 와 GIF 도 다시 그리면 망가진다.
  const untouchable = /image\/(png|svg\+xml|gif)/.test(file.type);
  if (untouchable || file.size <= skipUnderBytes || !file.type.startsWith("image/")) {
    return { file, originalBytes: original, bytes: original, changed: false };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, originalBytes: original, bytes: original, changed: false };

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= original) {
      // 줄여도 이득이 없으면 원본을 쓴다
      return { file, originalBytes: original, bytes: original, changed: false };
    }

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    const compressed = new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });

    return { file: compressed, originalBytes: original, bytes: compressed.size, changed: true };
  } catch {
    // 브라우저가 지원하지 않으면 원본을 그대로 올린다
    return { file, originalBytes: original, bytes: original, changed: false };
  }
}

/** 사람이 읽기 좋은 크기 표기 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
