// fe/src/components/files/FileUpload.tsx
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  workspaceId: string;
  onUploadComplete?: (file: any) => void;
  onError?: (error: string) => void;
}

export function FileUpload({ workspaceId, onUploadComplete, onError }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      onError?.('File size exceeds 50MB limit');
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      'text/plain', 'text/markdown', 'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword', 'application/json'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      onError?.('Unsupported file type. Please upload TXT, MD, PDF, DOCX, DOC, or JSON files.');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      formData.append('userId', user?.id || '');
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        // Track upload progress
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      onUploadComplete?.(data.file);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.md,.pdf,.docx,.doc,.json"
      />
      
      {isUploading ? (
        <div className="w-full">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-in-out" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-center mt-2">Uploading: {uploadProgress}%</p>
        </div>
      ) : (
        <Button 
          onClick={triggerFileInput}
          className="w-full"
          variant="outline"
        >
          Upload File
        </Button>
      )}
    </div>
  );
}

export default FileUpload;