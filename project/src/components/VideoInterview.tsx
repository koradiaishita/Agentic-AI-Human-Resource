import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Video, StopCircle, PlayCircle, Loader } from 'lucide-react';

interface VideoInterviewProps {
  onComplete: (videoBlob: Blob) => void;
  role?: string; // Optional role for dynamic questions
}

// Function to generate questions with simulated Gemini API
const generateGeminiQuestions = async (role: string = 'Software Engineer'): Promise<string[]> => {
  // Simulate a delay for the API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate response from Gemini based on role
  const roleSpecificQuestions: Record<string, string[]> = {
    "Software Engineer": [
      "Describe how you would design a scalable microservice architecture for a high-traffic e-commerce platform.",
      "How would you implement a system that requires both consistency and high availability?",
      "Explain how you approach testing in your development process, from unit tests to integration tests.",
      "How do you ensure the security of the applications you develop?",
      "Tell us about a time when you had to optimize code for performance.",
      "How do you approach learning new programming languages or frameworks?"
    ],
    "Data Scientist": [
      "How would you approach building a recommendation system for a content streaming platform?",
      "Describe a time when you had to balance model accuracy with computational efficiency.",
      "How would you detect and handle outliers in a dataset with millions of records?",
      "Explain how you would build and deploy a machine learning model in a production environment.",
      "How do you validate that your models are fair and unbiased?",
      "What techniques do you use for feature selection in your models?"
    ],
    "UX Designer": [
      "How do you approach designing for accessibility while maintaining aesthetic appeal?",
      "Describe your process for conducting user research before beginning a design project.",
      "How do you measure the success of a user interface design after implementation?",
      "What strategies do you use when stakeholders have conflicting requirements?",
      "How do you ensure consistency across a large design system?",
      "Tell us about a time when user testing completely changed your design approach."
    ],
    "Project Manager": [
      "How do you prioritize tasks when all stakeholders believe their requirements are high priority?",
      "Describe how you would recover a project that's significantly behind schedule.",
      "How do you manage communication between technical and non-technical team members?",
      "What metrics do you use to track project health and success?",
      "How do you handle team conflicts in a project environment?",
      "Describe your approach to risk management in complex projects."
    ],
    "Marketing Specialist": [
      "How would you develop a content strategy for a new product launch?",
      "Describe how you would measure ROI across different marketing channels.",
      "How do you stay compliant with privacy regulations while maximizing marketing effectiveness?",
      "What approach would you take to revitalize a marketing campaign that isn't meeting its goals?",
      "How do you identify and target specific audience segments?",
      "Tell us about a marketing campaign you've led that delivered exceptional results."
    ]
  };
  
  // Get questions for the specific role or use default
  const questions = roleSpecificQuestions[role] || roleSpecificQuestions["Software Engineer"];
  
  // Add fixed questions (always included)
  const fixedQuestions = [
    "Tell us about your relevant experience.",
    "What interests you about this position?",
    "Describe a challenging project you've worked on."
  ];
  
  // Combine fixed questions with role-specific ones
  return [...fixedQuestions, ...questions.slice(0, 4)];
};

export const VideoInterview: React.FC<VideoInterviewProps> = ({ onComplete, role = 'Software Engineer' }) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Load questions when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const questions = await generateGeminiQuestions(role);
        setInterviewQuestions(questions);
        setLoadingQuestions(false);
      } catch (error) {
        console.error('Error loading interview questions:', error);
        // Fallback questions
        setInterviewQuestions([
          "Tell us about your relevant experience.",
          "What interests you about this position?",
          "Describe a challenging project you've worked on.",
          "What are your greatest professional strengths?",
          "How do you handle challenges in your work?",
          "What's your approach to learning new skills?",
          "How do you collaborate with team members from different backgrounds?"
        ]);
        setLoadingQuestions(false);
      }
    };
    
    loadQuestions();
  }, [role]);

  const handleStartRecording = useCallback(() => {
    setRecording(true);
    setRecordedChunks([]);
    const stream = webcamRef.current?.video?.srcObject as MediaStream;
    if (stream) {
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.start();
    }
  }, [webcamRef, setRecordedChunks]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setShowPreview(true);
    }
  }, [mediaRecorderRef]);

  const handleSubmit = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      onComplete(blob);
    }
  }, [recordedChunks, onComplete]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={true}
          className="w-full rounded-lg"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          {!recording ? (
            <button
              onClick={handleStartRecording}
              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
            >
              <PlayCircle className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <StopCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="space-y-4">
          <h3 className="font-semibold">Preview Your Recording</h3>
          <video
            controls
            className="w-full rounded-lg"
            src={URL.createObjectURL(new Blob(recordedChunks, { type: 'video/webm' }))}
          />
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowPreview(false);
                setRecordedChunks([]);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Retake
            </button>
            <button
              onClick={handleSubmit}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Submit Interview
            </button>
          </div>
        </div>
      )}

      {loadingQuestions ? (
        <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
          <Loader className="w-5 h-5 text-indigo-600 animate-spin mr-2" />
          <p>Generating interview questions with AI...</p>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <h3 className="font-semibold">Interview Questions:</h3>
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Powered by Gemini</span>
          </div>
          <ol className="list-decimal list-inside space-y-2">
            {interviewQuestions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};