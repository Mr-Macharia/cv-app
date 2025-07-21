import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { SparklesIcon } from './icons';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatHistory, onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg p-4">
      <div className="flex items-center mb-4 border-b border-slate-700 pb-3">
        <SparklesIcon className="w-6 h-6 text-cyan-400 mr-3" />
        <h2 className="text-xl font-bold text-slate-100">Profile Co-pilot</h2>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 text-slate-200 ${
                msg.sender === 'user' ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isProfileComplete && (
            <div className="text-center p-4 bg-slate-700/50 rounded-lg my-4">
                <p className="font-semibold text-cyan-400">Profile complete!</p>
                <p className="text-slate-300 text-sm">You can now add a job description and generate your documents.</p>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {!isProfileComplete && (
        <form onSubmit={handleSubmit} className="mt-4 flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLoading ? "Co-pilot is typing..." : "Type your answer..."}
            className="flex-grow bg-slate-900 border border-slate-700 rounded-l-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-r-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            disabled={!inputValue.trim() || isLoading}
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatInterface;