// be/src/lib/embeddings/generate-embeddings.ts
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for a text using OpenAI's embedding API
 * @param text Text to embed
 * @returns Array of embeddings as numbers
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Split text into chunks for embedding
 * @param text Text to split
 * @param maxChunkLength Maximum length of each chunk
 * @param overlap Number of characters to overlap between chunks
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  maxChunkLength: number = 1000,
  overlap: number = 200
): string[] {
  if (!text || text.length <= maxChunkLength) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + maxChunkLength;
    
    // Don't cut in the middle of a paragraph if possible
    if (endIndex < text.length) {
      // Try to find a paragraph break
      const paragraphBreak = text.indexOf("\n\n", endIndex - 100);
      if (paragraphBreak !== -1 && paragraphBreak < endIndex + 100) {
        endIndex = paragraphBreak;
      } else {
        // Try to find a sentence break
        const sentenceBreak = text.indexOf(". ", endIndex - 100);
        if (sentenceBreak !== -1 && sentenceBreak < endIndex + 50) {
          endIndex = sentenceBreak + 1; // Include the period
        } else {
          // Try to find a space
          const spaceBreak = text.lastIndexOf(" ", endIndex);
          if (spaceBreak !== -1 && spaceBreak > endIndex - 100) {
            endIndex = spaceBreak;
          }
        }
      }
    }

    // Add this chunk
    chunks.push(text.substring(startIndex, endIndex).trim());

    // Move to next chunk starting position, with overlap
    startIndex = endIndex - overlap;
    if (startIndex < 0) startIndex = 0;
  }

  return chunks;
}

/**
 * Process a file's contents into chunks and generate embeddings for each chunk
 * @param fileText Text content from the file
 * @returns Array of objects with text chunks and their embeddings
 */
export async function processFileForEmbeddings(
  fileText: string
): Promise<Array<{ text: string; embedding: number[] }>> {
  try {
    const chunks = chunkText(fileText);
    const results = [];

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      if (chunk.trim().length > 0) {
        const embedding = await generateEmbedding(chunk);
        results.push({
          text: chunk,
          embedding: embedding
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing file for embeddings:", error);
    throw error;
  }
}