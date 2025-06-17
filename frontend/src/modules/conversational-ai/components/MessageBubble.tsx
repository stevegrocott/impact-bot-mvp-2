import React, { useState } from 'react';
import { User, Bot, AlertCircle, Clock, Target, TrendingUp, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  messageType: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  relevanceScore?: number;
  explanation?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  showMetadata?: boolean;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showMetadata = false,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isUser = message.messageType === 'user';
  const isSystem = message.messageType === 'system';
  const isError = message.metadata?.error;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRelevanceLabel = (score?: number) => {
    if (!score) return 'No score';
    if (score >= 0.8) return 'High relevance';
    if (score >= 0.6) return 'Medium relevance';
    return 'Low relevance';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : isSystem 
            ? 'bg-gray-500 text-white'
            : 'bg-green-600 text-white'
          }
        `}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : isSystem ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Main Message Bubble */}
          <div className={`
            relative px-4 py-2 rounded-lg max-w-full
            ${isUser 
              ? 'bg-blue-600 text-white' 
              : isError
              ? 'bg-red-50 text-red-800 border border-red-200'
              : isSystem
              ? 'bg-gray-100 text-gray-800'
              : 'bg-gray-100 text-gray-800'
            }
          `}>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`
                absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                ${isUser ? 'hover:bg-blue-700' : 'hover:bg-gray-200'}
              `}
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>

            {/* Message Text */}
            <div className="pr-8 whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Relevance Score for Assistant Messages */}
            {!isUser && !isSystem && message.relevanceScore && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-xs">
                  <Target className="w-3 h-3" />
                  <span className={getRelevanceColor(message.relevanceScore)}>
                    {getRelevanceLabel(message.relevanceScore)} ({Math.round(message.relevanceScore * 100)}%)
                  </span>
                </div>
                {message.explanation && (
                  <div className="mt-1 text-xs text-gray-600">
                    {message.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatTime(message.createdAt)}</span>
            
            {showMetadata && (
              <>
                {message.tokensUsed && (
                  <>
                    <span>•</span>
                    <span>{message.tokensUsed} tokens</span>
                  </>
                )}
                
                {message.processingTimeMs && (
                  <>
                    <span>•</span>
                    <span>{message.processingTimeMs}ms</span>
                  </>
                )}
                
                {!isUser && !isSystem && (
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="hover:text-gray-700 underline"
                  >
                    {showDetails ? 'Hide' : 'Show'} details
                  </button>
                )}
              </>
            )}
          </div>

          {/* Detailed Metadata */}
          {showDetails && showMetadata && !isUser && !isSystem && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border text-xs max-w-full overflow-hidden">
              <div className="font-medium text-gray-700 mb-2">Message Details</div>
              
              {message.relevanceScore && (
                <div className="mb-2">
                  <span className="font-medium">Relevance Score:</span>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          message.relevanceScore >= 0.8 ? 'bg-green-500' :
                          message.relevanceScore >= 0.6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${message.relevanceScore * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-gray-600">
                      {Math.round(message.relevanceScore * 100)}%
                    </span>
                  </div>
                </div>
              )}
              
              {message.explanation && (
                <div className="mb-2">
                  <span className="font-medium">Explanation:</span>
                  <div className="text-gray-600 mt-1">{message.explanation}</div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 text-gray-600">
                {message.tokensUsed && (
                  <div>
                    <span className="font-medium">Tokens:</span> {message.tokensUsed}
                  </div>
                )}
                
                {message.processingTimeMs && (
                  <div>
                    <span className="font-medium">Processing:</span> {message.processingTimeMs}ms
                  </div>
                )}
                
                <div>
                  <span className="font-medium">ID:</span> {message.id}
                </div>
              </div>
              
              {Object.keys(message.metadata).length > 0 && (
                <div className="mt-2">
                  <span className="font-medium">Metadata:</span>
                  <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(message.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;