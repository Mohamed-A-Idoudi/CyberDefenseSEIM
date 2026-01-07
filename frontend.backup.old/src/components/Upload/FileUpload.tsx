import { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { uploadLogs } from '@/services/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/json', 'text/plain'];
    const validExtensions = ['.csv', '.json', '.log', '.txt'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV, JSON, or log file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadedFile(null);

    try {
      const response = await uploadLogs(file);
      
      if (response.success) {
        setUploadedFile(file.name);
        toast({
          title: 'Upload successful',
          description: `${file.name} uploaded successfully${response.count ? ` (${response.count} entries)` : ''}`,
        });
        onUploadSuccess?.();
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Logs
        </h3>
        {uploadedFile && (
          <button
            onClick={clearUploadedFile}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {uploadedFile ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/30">
          <CheckCircle className="h-5 w-5 text-success" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{uploadedFile}</p>
            <p className="text-xs text-muted-foreground">Uploaded successfully</p>
          </div>
        </div>
      ) : (
        <label
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-muted/30",
            isUploading && "pointer-events-none opacity-70"
          )}
        >
          <input
            type="file"
            accept=".csv,.json,.log,.txt"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <>
              <div className={cn(
                "p-4 rounded-full mb-4 transition-colors",
                isDragActive ? "bg-primary/20" : "bg-muted"
              )}>
                <FileText className={cn(
                  "h-8 w-8",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {isDragActive ? 'Drop file here' : 'Drag & drop log file'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse • CSV, JSON, LOG
              </p>
            </>
          )}
        </label>
      )}
    </div>
  );
}

export default FileUpload;
