/**
 * Frontend Logger Utility
 * Provides proper logging instead of console.log statements
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp
    };

    // In development, use console methods for better debugging
    if (this.isDevelopment) {
      const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, data || '');
          break;
        case 'info':
          console.info(formattedMessage, data || '');
          break;
        case 'warn':
          console.warn(formattedMessage, data || '');
          break;
        case 'error':
          console.error(formattedMessage, data || '');
          break;
      }
    } else {
      // In production, you might want to send logs to a service
      // For now, just use console.log to avoid silent failures
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, data?: any): void {
    this.formatMessage('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.formatMessage('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.formatMessage('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.formatMessage('error', message, data);
  }
}

// Export singleton instance
export const logger = new Logger();