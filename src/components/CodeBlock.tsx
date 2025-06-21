
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language: string;
  isDarkMode?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, isDarkMode = true }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <span className="text-sm text-gray-300 font-mono">{language}</span>
        <Button
          onClick={handleCopy}
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-gray-300 hover:text-white hover:bg-gray-700"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
