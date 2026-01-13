import { tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { experimental_generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { put } from "@vercel/blob";
import type { ChatMessage } from "@/lib/types";

type GenerateImageProps = {
  dataStream: UIMessageStreamWriter<ChatMessage>;
};

export const generateImage = ({ dataStream }: GenerateImageProps) =>
  tool({
    description: "Generate, create, or make an image, picture, photo, or illustration based on a text description. Use this tool whenever the user asks to create, generate, draw, make, or produce any kind of visual image.",
    inputSchema: z.object({
      prompt: z
        .string()
        .describe("A detailed text description of the image to generate. Be as descriptive as possible about the subject, style, colors, composition, and mood."),
    }),
    execute: async ({ prompt }) => {
      console.log("🎨 generateImage tool called with prompt:", prompt);

      try {
        // Generate the image with DALL-E
        const { image } = await experimental_generateImage({
          model: openai.image("dall-e-3"),
          prompt,
          n: 1,
          size: "1024x1024",
        });

        console.log("✅ Image generated successfully");

        // Convert base64 to buffer
        console.log("🔄 Converting image to buffer...");
        const imageBuffer = Buffer.from(image.base64, "base64");
        console.log("🔄 Buffer size:", imageBuffer.length, "bytes");

        // Upload to Vercel Blob storage
        const filename = `generated-${Date.now()}.png`;
        console.log("🔄 Uploading to Blob as:", filename);

        const blob = await put(filename, imageBuffer, {
          access: "public",
          contentType: "image/png",
        });

        console.log("📦 Image uploaded to Blob:", blob.url);

        // Send the image URL to the UI via dataStream (transient, not in history)
        dataStream.write({
          type: "data-image",
          data: blob.url,
          transient: true,
        });

        // Return structured data with the image URL
        return {
          success: true,
          imageUrl: blob.url,
          message: "Image generated successfully",
        };
      } catch (error) {
        console.error("❌ Error generating image:", error);
        throw error;
      }
    },
  });
