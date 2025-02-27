// be/src/lib/processing/process-file.ts
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createFileItem, getFileById } from '../../db/files';
import { processFileForEmbeddings } from '../embeddings/generate-embeddings';

/**
 * Extract text content from a file based on its type
 */
export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Handle different file types
    if (fileType.includes('pdf')) {
      return extractTextFromPdf(filePath);
    } else if (fileType.includes('text') || 
              fileType.includes('markdown') || 
              fileType.includes('json') ||
              path.extname(filePath).toLowerCase() === '.md' ||
              path.extname(filePath).toLowerCase() === '.txt') {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Process a file to extract text, generate embeddings, and store in the database
 */
export async function processFile(fileId: string): Promise<boolean> {
  try {
    // Get file details from the database
    const file = await getFileById(fileId);
    
    if (!file) {
      throw new Error(`File not found with ID: ${fileId}`);
    }
    
    // Extract text from the file
    const fileText = await extractTextFromFile(file.file_path, file.type);
    
    // Process the text and generate embeddings
    const chunksWithEmbeddings = await processFileForEmbeddings(fileText);
    
    // Store each chunk with its embedding in the database
    for (const { text, embedding } of chunksWithEmbeddings) {
      await createFileItem({
        user_id: file.user_id,
        file_id: file.id,
        content: text,
        embedding: embedding
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}