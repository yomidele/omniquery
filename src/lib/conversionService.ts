import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export type ConversionPipeline =
  | "pdf-to-jpg"
  | "pdf-to-png"
  | "jpg-to-pdf"
  | "png-to-pdf"
  | "jpg-to-png"
  | "png-to-jpg"
  | "image-compress";

export interface ConversionOption {
  id: ConversionPipeline;
  label: string;
  inputAccept: string;
  inputFormats: string[];
  outputFormat: string;
  category: string;
}

export const CONVERSION_OPTIONS: ConversionOption[] = [
  { id: "pdf-to-jpg", label: "PDF → JPG", inputAccept: ".pdf", inputFormats: ["pdf"], outputFormat: "jpg", category: "Document → Image" },
  { id: "pdf-to-png", label: "PDF → PNG", inputAccept: ".pdf", inputFormats: ["pdf"], outputFormat: "png", category: "Document → Image" },
  { id: "jpg-to-pdf", label: "JPG → PDF", inputAccept: ".jpg,.jpeg", inputFormats: ["jpg", "jpeg"], outputFormat: "pdf", category: "Image → Document" },
  { id: "png-to-pdf", label: "PNG → PDF", inputAccept: ".png", inputFormats: ["png"], outputFormat: "pdf", category: "Image → Document" },
  { id: "jpg-to-png", label: "JPG → PNG", inputAccept: ".jpg,.jpeg", inputFormats: ["jpg", "jpeg"], outputFormat: "png", category: "Image → Image" },
  { id: "png-to-jpg", label: "PNG → JPG", inputAccept: ".png", inputFormats: ["png"], outputFormat: "jpg", category: "Image → Image" },
  { id: "image-compress", label: "Compress Image", inputAccept: ".jpg,.jpeg,.png,.webp", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormat: "jpg", category: "Image → Image" },
];

export function getAcceptForPipeline(pipeline: ConversionPipeline): string {
  return CONVERSION_OPTIONS.find((o) => o.id === pipeline)?.inputAccept || "*";
}

async function pdfToImages(file: File, format: "jpg" | "png", onProgress?: (p: number) => void): Promise<Blob[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(Math.round((i / pdf.numPages) * 90));
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), mimeType, 0.92)
    );
    blobs.push(blob);
  }
  return blobs;
}

async function imageToPdf(file: File): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const bytes = new Uint8Array(await file.arrayBuffer()) as unknown as ArrayBuffer;
  const isJpg = file.type === "image/jpeg";
  const img = isJpg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes);
  const page = pdfDoc.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

async function convertImage(file: File, toFormat: "jpg" | "png", quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  if (toFormat === "jpg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  const mimeType = toFormat === "png" ? "image/png" : "image/jpeg";
  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), mimeType, quality)
  );
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.75)
  );
}

export interface ConversionResult {
  blobs: Blob[];
  fileNames: string[];
  mimeType: string;
}

export async function convertFile(
  file: File,
  pipeline: ConversionPipeline,
  onProgress?: (p: number) => void
): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^.]+$/, "");
  onProgress?.(10);

  switch (pipeline) {
    case "pdf-to-jpg": {
      const blobs = await pdfToImages(file, "jpg", onProgress);
      return {
        blobs,
        fileNames: blobs.map((_, i) => `${baseName}_page${i + 1}.jpg`),
        mimeType: "image/jpeg",
      };
    }
    case "pdf-to-png": {
      const blobs = await pdfToImages(file, "png", onProgress);
      return {
        blobs,
        fileNames: blobs.map((_, i) => `${baseName}_page${i + 1}.png`),
        mimeType: "image/png",
      };
    }
    case "jpg-to-pdf":
    case "png-to-pdf": {
      onProgress?.(50);
      const blob = await imageToPdf(file);
      onProgress?.(90);
      return { blobs: [blob], fileNames: [`${baseName}.pdf`], mimeType: "application/pdf" };
    }
    case "jpg-to-png": {
      onProgress?.(50);
      const blob = await convertImage(file, "png");
      onProgress?.(90);
      return { blobs: [blob], fileNames: [`${baseName}.png`], mimeType: "image/png" };
    }
    case "png-to-jpg": {
      onProgress?.(50);
      const blob = await convertImage(file, "jpg");
      onProgress?.(90);
      return { blobs: [blob], fileNames: [`${baseName}.jpg`], mimeType: "image/jpeg" };
    }
    case "image-compress": {
      onProgress?.(50);
      const blob = await compressImage(file);
      onProgress?.(90);
      return { blobs: [blob], fileNames: [`${baseName}_compressed.jpg`], mimeType: "image/jpeg" };
    }
    default:
      throw new Error(`Unsupported pipeline: ${pipeline}`);
  }
}
