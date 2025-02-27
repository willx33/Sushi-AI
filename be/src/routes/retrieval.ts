// be/src/routes/retrieval.ts
import express, { Request, Response } from 'express';
import { processFile } from '../lib/processing/process-file';
import { retrieveContext, formatContextForPrompt } from '../lib/rag/retrieve-context';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure file upload
const upload = multer({
  dest: path.join(__dirname, '../../temp')
});

// Process a file for embeddings
router.post('/process/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    // Process the file
    await processFile(fileId);
    
    res.json({ success: true, fileId });
  } catch (error: any) {
    console.error('Error processing file for embeddings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process an uploaded file
router.post('/process/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { fileId } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    // Clean up temp file when done
    const cleanupTempFile = () => {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    };
    
    try {
      // Process the file
      await processFile(fileId);
      
      // Clean up
      cleanupTempFile();
      
      res.json({ success: true, fileId });
    } catch (error) {
      // Clean up on error
      cleanupTempFile();
      throw error;
    }
  } catch (error: any) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search for similar content
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, fileIds, maxResults = 5, similarityThreshold = 0.75 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Retrieve context
    const contextItems = await retrieveContext(
      query,
      fileIds,
      maxResults,
      similarityThreshold
    );
    
    res.json({ 
      contextItems,
      totalResults: contextItems.length
    });
  } catch (error: any) {
    console.error('Error searching for context:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get formatted context for prompt
router.post('/context-for-prompt', async (req: Request, res: Response) => {
  try {
    const { query, fileIds, maxResults = 5, similarityThreshold = 0.75, maxLength = 5000 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Retrieve context
    const contextItems = await retrieveContext(
      query,
      fileIds,
      maxResults,
      similarityThreshold
    );
    
    // Format for prompt
    const formattedContext = formatContextForPrompt(
      contextItems.map(item => ({
        content: item.content,
        fileName: item.fileName
      })),
      maxLength
    );
    
    res.json({ 
      context: formattedContext,
      totalResults: contextItems.length
    });
  } catch (error: any) {
    console.error('Error getting context for prompt:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;