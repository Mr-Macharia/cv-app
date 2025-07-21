export const generateCV = async (jobDescription: string): Promise<string> => {
  try {
    const response = await fetch('http://localhost:8000/api/generate-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: jobDescription }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error generating CV:", error);
    return "An error occurred while generating the CV. Please check the console.";
  }
};

export const generateCoverLetter = async (jobDescription: string): Promise<string> => {
  try {
    const response = await fetch('http://localhost:8000/api/generate-cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_description: jobDescription }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("Error generating Cover Letter:", error);
    return "An error occurred while generating the Cover Letter. Please check the console.";
  }
};
