
import React from 'react';

interface JobInputProps {
  value: string;
  onChange: (value: string) => void;
}

const JobInput: React.FC<JobInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg p-4">
      <h2 className="text-xl font-bold text-slate-100 mb-3 border-b border-slate-700 pb-3">
        Job Description
      </h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here..."
        className="w-full flex-grow bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-slate-300"
      />
    </div>
  );
};

export default JobInput;
