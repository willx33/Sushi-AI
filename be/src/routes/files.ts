// be/src/routes/files.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createFile, getFileById, getFilesByWorkspaceId, deleteFile, createFileWorkspace } from '../db/files';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get all files for a workspace
router.get('/workspace/:workspaceId', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const files = await getFilesByWorkspaceId(workspaceId);
    res.json({ files });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file by ID
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ file });
  } catch (error: any) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload a file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { workspaceId, userId, description } = req.body;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'Workspace ID and User ID are required' });
    }
    
    const fileRecord = {
      user_id: userId,
      name: req.file.originalname,
      description: description || null,
      file_path: req.file.path,
      size: req.file.size,
      type: req.file.mimetype
    };
    
    // Save file metadata to database
    const savedFile = await createFile(fileRecord);
    
    if (!savedFile) {
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }
    
    // Associate file with workspace
    await createFileWorkspace({
      user_id: userId,
      file_id: savedFile.id,
      workspace_id: workspaceId
    });
    
    // TODO: Process file for embeddings (will be implemented later)
    
    res.json({ file: savedFile });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a file
router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // Get file to check if it exists and get the file path
    const file = await getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete the file from storage if it exists
    if (file.file_path && fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
    
    // Delete file from database
    const success = await deleteFile(fileId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;