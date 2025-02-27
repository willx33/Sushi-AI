// fe/src/components/chat/ContextPanel.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import FileList from '../files/FileList';
import FileUpload from '../files/FileUpload';
import { useAuth } from '@/context/AuthContext';

interface ContextPanelProps {
  workspaceId: string;
  selectedFileIds: string[];
  onSelectFile: (fileId: string) => void;
}

export function ContextPanel({ 
  workspaceId, 
  selectedFileIds, 
  onSelectFile 
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'upload'>('files');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { user } = useAuth();

  // Reset success/error messages when switching tabs
  useEffect(() => {
    setUploadSuccess(false);
    setUploadError(null);
  }, [activeTab]);

  const handleFileUploaded = (file: any) => {
    setUploadSuccess(true);
    setUploadError(null);
    
    // Process the file for embeddings
    processFileForEmbeddings(file.id);
  };

  const handleUploadError = (error: string) => {
    setUploadSuccess(false);
    setUploadError(error);
  };

  const processFileForEmbeddings = async (fileId: string) => {
    try {
      const response = await fetch(`/api/retrieval/process/${fileId}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file');
      }
    } catch (error) {
      console.error('Error processing file for embeddings:', error);
      // We don't show this error to the user since the file was uploaded successfully
    }
  };

  return (
    <div className="h-full flex flex-col border-l">
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'files' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'upload' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'files' ? (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Reference Files</h3>
              <p className="text-xs text-gray-500 mb-4">
                Select files to use as context for your chat.
              </p>
              
              <FileList 
                workspaceId={workspaceId}
                selectedFileIds={selectedFileIds}
                onSelectFile={(file) => onSelectFile(file.id)}
                showSelectButton
              />
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium mb-2">Upload File</h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload a file to use as context. Supported formats: PDF, TXT, MD, JSON.
            </p>
            
            <FileUpload 
              workspaceId={workspaceId}
              onUploadComplete={handleFileUploaded}
              onError={handleUploadError}
            />
            
            {uploadSuccess && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 text-sm rounded-md">
                File uploaded successfully! It will be processed for retrieval.
              </div>
            )}
            
            {uploadError && (
              <div className="mt-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">
                Error: {uploadError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextPanel;