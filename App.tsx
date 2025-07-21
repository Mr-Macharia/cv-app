import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import JobInput from './components/JobInput';
import ActionButtons from './components/ActionButtons';
import OutputDisplay from './components/OutputDisplay';
import { generateCV, generateCoverLetter } from './services/geminiService';
import { ChatMessage } from './types';

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [outputContent, setOutputContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);

  const handleBotResponse = useCallback((data: any) => {
    if (data.response) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: data.response }]);
    }
    if (data.profile_complete) {
      setIsProfileComplete(true);
    }
  }, []);

  const sendChatMessage = useCallback(async (history: ChatMessage[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_history: history }),
      });

      if (response.ok) {
        const data = await response.json();
        handleBotResponse(data);
      } else {
        const errorText = await response.text();
        handleBotResponse({ response: `Sorry, an error occurred: ${errorText}` });
      }
    } catch (error) {
      console.error("Error in chat:", error);
      handleBotResponse({ response: "Sorry, I couldn't connect to the server." });
    } finally {
      setIsLoading(false);
    }
  }, [handleBotResponse]);

  useEffect(() => {
    // Start the conversation only once when the app loads
    if (chatHistory.length === 0) {
      sendChatMessage([]);
    }
  }, [sendChatMessage]); // Correct dependency

  const handleUserMessage = (message: string) => {
    const newHistory = [...chatHistory, { sender: 'user', text: message }];
    setChatHistory(newHistory);
    sendChatMessage(newHistory);
  };

  const handleGenerate = async (generator: (jobDesc: string) => Promise<string>) => {
    if (!jobDescription.trim() || isLoading) return;
    setIsLoading(true);
    setOutputContent('');
    try {
      const content = await generator(jobDescription);
      setOutputContent(content);
    } catch (error) {
      console.error("Generation failed:", error);
      setOutputContent(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-slate-200 font-sans p-4 flex flex-col md:flex-row gap-4">
      <div className="flex flex-col w-full md:w-2/5 lg:w-1/3 gap-4">
        {!isProfileComplete ? (
          <div className="flex-grow min-h-[300px]">
            <ChatInterface
              chatHistory={chatHistory}
              onSendMessage={handleUserMessage}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <>
            <div className="h-1/3 min-h-[200px]">
              <JobInput value={jobDescription} onChange={setJobDescription} />
            </div>
            <div>
              <ActionButtons
                onGenerateCV={() => handleGenerate(generateCV)}
                onGenerateCoverLetter={() => handleGenerate(generateCoverLetter)}
                isLoading={isLoading}
                isReady={!!jobDescription.trim()}
              />
            </div>
          </>
        )}
      </div>
      <div className="w-full md:w-3/5 lg:w-2/3 h-full">
        <OutputDisplay content={outputContent} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;