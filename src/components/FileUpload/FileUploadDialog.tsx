import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useAppStore } from '../../store/appStore';
import { SpreadsheetData } from '../../store/appStore';

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({ open, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { addSpreadsheet, addMultipleSpreadsheets } = useAppStore();

  // Process ALL worksheets from an Excel file (enhanced for multi-worksheet support)
  const processAllExcelWorksheets = useCallback(async (file: File): Promise<SpreadsheetData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const results: SpreadsheetData[] = [];
          
          // Process each worksheet
          workbook.SheetNames.forEach((worksheetName, index) => {
            const worksheet = workbook.Sheets[worksheetName];
            
            // Convert to JSON with header row
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: '',
            }) as any[][];

            if (jsonData.length > 0) {
              // First row as headers
              const headers = jsonData[0].map(h => h?.toString() || '');
              const dataRows = jsonData.slice(1);

              const spreadsheetData: SpreadsheetData = {
                id: `sheet_${Date.now()}_${index}`,
                name: `${file.name.replace(/\.[^/.]+$/, '')} - ${worksheetName}`,
                filename: file.name,
                data: dataRows,
                headers,
                lastModified: Date.now(),
                source: 'upload',
                tags: {},
                metadata: {
                  worksheetName,
                  worksheetIndex: index,
                  originalFileName: file.name,
                },
              };

              results.push(spreadsheetData);
            }
          });

          if (results.length === 0) {
            throw new Error('File appears to be empty or contains no valid worksheets');
          }

          resolve(results);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // Process single worksheet for backward compatibility
  const processExcelFile = useCallback(async (file: File): Promise<SpreadsheetData> => {
    const allWorksheets = await processAllExcelWorksheets(file);
    return allWorksheets[0]; // Return first worksheet for compatibility
  }, [processAllExcelWorksheets]);

  const processCSVFile = useCallback(async (file: File): Promise<SpreadsheetData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            
            if (data.length === 0) {
              throw new Error('File appears to be empty');
            }

            // First row as headers
            const headers = data[0];
            const dataRows = data.slice(1);

            const spreadsheetData: SpreadsheetData = {
              id: `sheet_${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
              filename: file.name,
              data: dataRows,
              headers,
              lastModified: Date.now(),
              source: 'upload',
              tags: {},
              metadata: {},
            };

            resolve(spreadsheetData);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err),
      });
    });
  }, []);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((i / files.length) * 100);

        // Check file type
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'xlsx' || extension === 'xls') {
          // Load ALL worksheets from Excel files
          const allWorksheets = await processAllExcelWorksheets(file);
          addMultipleSpreadsheets(allWorksheets);
        } else if (extension === 'csv') {
          const spreadsheetData = await processCSVFile(file);
          addSpreadsheet(spreadsheetData);
        } else {
          throw new Error(`Unsupported file type: ${extension}`);
        }
      }

      setUploadProgress(100);
      setSuccess(`Successfully uploaded ${files.length} file(s)`);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setUploading(false);
        setUploadProgress(0);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [addSpreadsheet, onClose, processExcelFile, processCSVFile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileUpload(acceptedFiles);
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const handleClose = () => {
    if (!uploading) {
      onClose();
      setError(null);
      setSuccess(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon />
          Upload Spreadsheets
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'primary.50' : 'grey.50',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          
          {isDragActive ? (
            <Typography variant="h6" color="primary">
              Drop the files here...
            </Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Drag & drop spreadsheet files here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to select files
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="Excel (.xlsx, .xls)" size="small" variant="outlined" />
                <Chip label="CSV (.csv)" size="small" variant="outlined" />
              </Box>
            </>
          )}
        </Box>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Uploading... {Math.round(uploadProgress)}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Supported formats:</strong>
            <br />
            • Excel files (.xlsx, .xls)
            <br />
            • CSV files (.csv)
            <br />
            • Maximum file size: 50MB per file
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog; 