
import React from 'react';
import CodeBlock from './CodeBlock';

interface MessageRendererProps {
  content: string;
  isDarkMode?: boolean;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content, isDarkMode = true }) => {
  // Regular expression to match code blocks with optional language
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({
          type: 'text',
          content: textBefore,
          key: `text_${lastIndex}`
        });
      }
    }

    // Add the code block
    const language = match[1] || 'text';
    const code = match[2].trim();
    parts.push({
      type: 'code',
      content: code,
      language: language,
      key: `code_${match.index}`
    });

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last code block
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText,
        key: `text_${lastIndex}`
      });
    }
  }

  // If no code blocks found, render as plain text
  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div className="space-y-3">
      {parts.map((part) => {
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={part.key}
              code={part.content}
              language={part.language}
              isDarkMode={isDarkMode}
            />
          );
        } else {
          return (
            <div key={part.key} className="whitespace-pre-wrap">
              {part.content}
            </div>
          );
        }
      })}
    </div>
  );
};

export default MessageRenderer;
