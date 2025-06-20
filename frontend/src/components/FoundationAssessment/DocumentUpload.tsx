import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  MessageCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../../shared/services/apiClient';

interface DocumentUploadProps {
  organizationId: string;
  onComplete: () => void;
  onSwitchToGuided: () => void;
  onBack: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

interface ParseResult {
  extractedContent: any;
  confidence: number;
  needsGuidedCompletion: boolean;
  identifiedGaps: string[];
  suggestedQuestions: string[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  organizationId,
  onComplete,
  onSwitchToGuided,
  onBack,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError(`File type not supported: ${file.name}`);
        continue;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name} (max 10MB)`);
        continue;
      }
      
      try {
        const content = await readFileAsText(file);
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          content
        });
      } catch (err) {
        setError(`Failed to read file: ${file.name}`);
      }
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        
        if (file.type === 'application/pdf') {
          // For PDF files, read as base64 and let backend handle extraction
          if (typeof result === 'string') {
            resolve(result);
          } else if (result instanceof ArrayBuffer) {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(result);
            const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
            const base64 = btoa(binary);
            resolve(base64);
          } else {
            reject(new Error('Unexpected file format'));
          }
        } else {
          // For text files, read as text
          resolve(result as string);
        }
      };
      reader.onerror = reject;
      
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    setParsing(true);
    setError('');
    
    try {
      const response = await apiClient.uploadTheoryOfChangeDocuments(
        organizationId,
        files.map(file => ({
          filename: file.name,
          content: file.content,
          type: file.type
        }))
      );
      
      if (response.success) {
        setParseResult(response.data);
      } else {
        setError(response.message || 'Failed to parse documents');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload documents';
      
      // Check if this is a service unavailable error
      if (errorMessage.includes('service is currently unavailable') || errorMessage.includes('configuration error')) {
        setError(`${errorMessage}\n\nWe recommend using the guided conversation approach to build your theory of change step by step.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setParsing(false);
    }
  };

  const handleContinueWithParsed = () => {
    onComplete();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('presentation')) return '📊';
    return '📄';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Pathway Selection
      </button>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Upload Your Documents
      </h2>
      
      <p className="text-gray-600 mb-6">
        Upload your strategy documents, logic models, program descriptions, or any other 
        files that describe your work. Our AI will extract your theory of change elements.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 whitespace-pre-line">{error}</p>
              {(error.includes('service is currently unavailable') || error.includes('configuration error')) && (
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={onSwitchToGuided}
                    className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Use Guided Conversation
                  </button>
                  <button
                    onClick={() => setError('')}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!parseResult ? (
        <>
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, Word, PowerPoint, and text files (max 10MB each)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Uploaded Files ({files.length})
              </h3>
              
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getFileIcon(file.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={onSwitchToGuided}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Switch to Guided Approach
            </button>
            
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || parsing}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {parsing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing Documents...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze Documents
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* Parse Results */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Analysis Results
            </h3>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Confidence:</span>
              <span className={`font-medium ${
                parseResult.confidence >= 0.8 ? 'text-green-600' :
                parseResult.confidence >= 0.6 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {Math.round(parseResult.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Extraction Summary */}
          <div className={`p-4 rounded-lg border ${
            parseResult.confidence >= 0.8 ? 'bg-green-50 border-green-200' :
            parseResult.confidence >= 0.6 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {parseResult.confidence >= 0.8 ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  {parseResult.confidence >= 0.8 ? 
                    'Strong theory of change elements found!' :
                    parseResult.confidence >= 0.6 ?
                    'Some theory of change elements found' :
                    'Limited theory of change elements found'
                  }
                </p>
                <p className="text-sm text-gray-700">
                  {parseResult.needsGuidedCompletion ?
                    'We recommend completing missing elements through guided conversation.' :
                    'Your theory of change appears to be well-documented.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Identified Gaps */}
          {parseResult.identifiedGaps.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-900 mb-3">Areas that need clarification:</h4>
              <ul className="space-y-1">
                {parseResult.identifiedGaps.map((gap, index) => (
                  <li key={index} className="text-amber-800 text-sm flex items-start">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Questions */}
          {parseResult.suggestedQuestions.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">Questions to consider:</h4>
              <ul className="space-y-1">
                {parseResult.suggestedQuestions.map((question, index) => (
                  <li key={index} className="text-blue-800 text-sm flex items-start">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {parseResult.needsGuidedCompletion && (
              <button
                onClick={onSwitchToGuided}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Complete with Guided Conversation
              </button>
            )}
            
            <button
              onClick={handleContinueWithParsed}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Continue with Extracted Theory
            </button>
          </div>
        </div>
      )}
    </div>
  );
};