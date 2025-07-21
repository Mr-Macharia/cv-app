
import React, { useState } from 'react';
import { CopyIcon, DownloadIcon, CheckIcon, SparklesIcon } from './icons';

interface OutputDisplayProps {
  content: string;
  isLoading: boolean;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ content, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AI_Co-pilot_Document.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleDownloadPDF = async (content: string) => {
    const response = await fetch('http://localhost:8000/generate_pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content }),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.pdf';
    a.click();
  };
  // Add button to call this
  return (
    <div className="bg-slate-800 rounded-lg flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-slate-100">Generated Document</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            disabled={!content || isLoading}
            className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-300"
            aria-label="Copy text"
          >
            {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon />}
          </button>
          <button
            onClick={() => handleDownloadPDF(content)}
            disabled={!content || isLoading}
            className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-300"
            aria-label="Download PDF"
          >
            <DownloadIcon /> PDF
          </button>
          <button
            onClick={handleDownload}
            disabled={!content || isLoading}
            className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-300"
            aria-label="Download text"
          >
            <DownloadIcon /> TXT
          </button>
        </div>
      </div>
      <div className="p-6 flex-grow overflow-y-auto">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <SparklesIcon className="w-12 h-12 text-cyan-400 animate-pulse" />
                <p className="mt-4 text-lg font-semibold">Generating your document...</p>
                <p className="text-sm">The AI co-pilot is crafting your content.</p>
            </div>
        ) : content ? (
          <pre className="whitespace-pre-wrap font-sans text-slate-300">{content}</pre>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
                <p>Your generated CV or Cover Letter will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default OutputDisplay;
