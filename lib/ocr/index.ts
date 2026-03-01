export interface OCRProvider {
  detectText(imageBase64: string): Promise<string>;
}
