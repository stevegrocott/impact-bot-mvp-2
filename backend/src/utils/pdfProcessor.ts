/**
 * PDF Processing Utility
 * Handles PDF text extraction for document analysis
 */

import pdfParse from 'pdf-parse';
import { logger } from './logger';

export interface ProcessedDocument {
  filename: string;
  content: string;
  type: string;
  originalType: string;
  wordCount: number;
  processingMethod: 'text' | 'pdf_extraction' | 'base64_decode';
}

export class PDFProcessor {
  /**
   * Process a document based on its type and content format
   */
  static async processDocument(
    filename: string,
    content: string,
    type: string
  ): Promise<ProcessedDocument> {
    try {
      const originalType = type;
      
      // Handle PDF files
      if (type === 'application/pdf') {
        logger.info(`Processing PDF document: ${filename}`);
        
        // Check if content is base64 encoded
        const extractedText = await this.extractTextFromPDF(content);
        
        return {
          filename,
          content: extractedText,
          type: 'text/plain',
          originalType,
          wordCount: this.countWords(extractedText),
          processingMethod: 'pdf_extraction'
        };
      }
      
      // Handle base64 encoded content (fallback)
      if (this.isBase64(content)) {
        logger.info(`Processing base64 content: ${filename}`);
        
        try {
          const decodedContent = Buffer.from(content, 'base64').toString('utf-8');
          return {
            filename,
            content: decodedContent,
            type: 'text/plain',
            originalType,
            wordCount: this.countWords(decodedContent),
            processingMethod: 'base64_decode'
          };
        } catch (error) {
          logger.warn(`Failed to decode base64 content for ${filename}, treating as plain text`);
        }
      }
      
      // Handle plain text files
      return {
        filename,
        content,
        type,
        originalType,
        wordCount: this.countWords(content),
        processingMethod: 'text'
      };
      
    } catch (error) {
      logger.error(`Error processing document ${filename}:`, error);
      throw new Error(`Failed to process document ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF content (base64 or buffer)
   */
  private static async extractTextFromPDF(content: string): Promise<string> {
    try {
      let pdfBuffer: Buffer;
      
      // Handle base64 encoded PDF
      if (this.isBase64(content)) {
        pdfBuffer = Buffer.from(content, 'base64');
      } else {
        // Assume it's already a buffer or string representation
        pdfBuffer = Buffer.from(content);
      }
      
      // Extract text using pdf-parse
      const data = await pdfParse(pdfBuffer);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      // Clean up the extracted text
      const cleanedText = this.cleanExtractedText(data.text);
      
      logger.info(`Successfully extracted ${cleanedText.length} characters from PDF`, {
        pages: data.numpages,
        version: data.version,
        wordCount: this.countWords(cleanedText)
      });
      
      return cleanedText;
      
    } catch (error) {
      logger.error('PDF text extraction failed:', error);
      throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a string is base64 encoded
   */
  private static isBase64(str: string): boolean {
    try {
      // Basic base64 pattern check
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Pattern.test(str)) {
        return false;
      }
      
      // Try to decode - if it fails, it's not valid base64
      Buffer.from(str, 'base64');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean extracted text by removing excessive whitespace and formatting artifacts
   */
  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common PDF artifacts
      .replace(/\f/g, '\n') // Form feed to newline
      .replace(/\r\n/g, '\n') // Windows line endings
      .replace(/\r/g, '\n') // Mac line endings
      // Remove excessive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Count words in text content
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Validate document for processing
   */
  static validateDocument(filename: string, content: string, type: string): void {
    if (!filename || filename.trim().length === 0) {
      throw new Error('Document filename is required');
    }
    
    if (!content || content.length === 0) {
      throw new Error('Document content is empty');
    }
    
    // Check file size (content length as rough estimate)
    const maxSize = 10 * 1024 * 1024; // 10MB in characters/bytes
    if (content.length > maxSize) {
      throw new Error(`Document ${filename} is too large (max 10MB)`);
    }
    
    // Validate supported file types
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!supportedTypes.includes(type)) {
      throw new Error(`Unsupported document type: ${type}`);
    }
  }
}