
import React from 'react';
import { LoadingSpinner } from './icons';

interface ActionButtonsProps {
  onGenerateCV: () => void;
  onGenerateCoverLetter: () => void;
  isLoading: boolean;
  isReady: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onGenerateCV, onGenerateCoverLetter, isLoading, isReady }) => {
  const commonButtonClasses = "w-full flex items-center justify-center font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out disabled:cursor-not-allowed";
  const disabledClasses = "bg-slate-700 text-slate-500";
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-3">
       <button
        onClick={onGenerateCV}
        disabled={!isReady || isLoading}
        className={`${commonButtonClasses} ${isReady && !isLoading ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : disabledClasses} `}
      >
        {isLoading ? <LoadingSpinner /> : 'Generate CV'}
      </button>
      <button
        onClick={onGenerateCoverLetter}
        disabled={!isReady || isLoading}
        className={`${commonButtonClasses} ${isReady && !isLoading ? 'bg-teal-600 hover:bg-teal-500 text-white' : disabledClasses}`}
      >
        {isLoading ? <LoadingSpinner /> : 'Generate Cover Letter'}
      </button>
      {!isReady && (
        <p className="text-xs text-center text-slate-400 pt-2">
            Please complete your profile and add a job description to enable generation.
        </p>
      )}
    </div>
  );
};

export default ActionButtons;
