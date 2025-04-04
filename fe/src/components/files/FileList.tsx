// fe/src/components/files/FileList.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
}

interface FileListProps {
  workspaceId: string;
  onSelectFile?: (file: File) => void;
  selectedFileIds?: string[];
  showSelectButton?: boolean;
}

export function FileList({ 
  workspaceId, 
  onSelectFile, 
  selectedFileIds = [],
  showSelectButton = false
}: FileListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (workspaceId) {
      fetchFiles();
    }
  }, [workspaceId]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/files/workspace/${workspaceId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch files');
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      // Refresh the list
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isFileSelected = (fileId: string): boolean => {
    return selectedFileIds.includes(fileId);
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('json')) return '📋';
    if (fileType.includes('markdown')) return '📑';
    return '📁';
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Error: {error}
        <Button variant="link" onClick={fetchFiles} className="ml-2">
          Retry
        </Button>
      </div>
    );
  }

  if (files.length === 0) {
    return <div className="text-center py-4 text-gray-500">No files found</div>;
  }

  return (
    <div className="space-y-2">
      {files.map(file => (
        <div 
          key={file.id}
          className={`p-3 border rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            isFileSelected(file.id) ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' : ''
          }`}
          onClick={() => onSelectFile?.(file)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl">{getFileIcon(file.type)}</span>
            <div>
              <h4 className="font-medium truncate max-w-[200px]">{file.name}</h4>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showSelectButton && (
              <Button
                size="sm"
                variant={isFileSelected(file.id) ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFile?.(file);
                }}
              >
                {isFileSelected(file.id) ? 'Selected' : 'Select'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={(e) => handleDeleteFile(file.id, e)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FileList;