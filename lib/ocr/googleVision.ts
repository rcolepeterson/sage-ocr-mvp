import vision from "@google-cloud/vision";
import { OCRProvider } from "./index";

const client = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || "{}",
  ),
});

export const googleVisionProvider: OCRProvider = {
  async detectText(imageBase64: string) {
    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const [result] = await client.textDetection({ image: { content: base64 } });
    return result.textAnnotations?.[0]?.description || "";
  },
};
