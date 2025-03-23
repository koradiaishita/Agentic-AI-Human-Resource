import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Users, UserCheck, Award, BookOpen, DollarSign, Building2, Menu, X, Bot, FileText, CheckCircle2, XCircle, Calendar, MessageSquare, UserPlus, Target, LineChart as ChartLineUp, GraduationCap, BadgeCheck, PartyPopper, ScrollText, Scale, HeartHandshake, Gauge, Trophy, AlertCircle, Upload, Video, PlusCircle } from 'lucide-react';
import { VideoInterview } from './components/VideoInterview';

// Add type declaration for HTMLVideoElement.captureStream
declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
}

// Define candidate type
interface Candidate {
  name: string;
  role: string;
  score: number;
  status: string;
}

// Define candidates dictionary type
interface CandidatesDict {
  [key: string]: Candidate;
}

// Define recruitment stage type
interface RecruitmentStage {
  stage: string;
  icon: JSX.Element;
  status?: string;
  actions: string[];
}

// Define agent type
interface Agent {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  workflow: RecruitmentStage[];
}

// Define KPI Types
type KPIStatus = 'not-started' | 'in-progress' | 'at-risk' | 'completed';

interface KPI {
  id: string;
  title: string;
  description: string;
  target: string;
  progress: number; // 0-100
  status: KPIStatus;
  dueDate: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  kpiId: string;
}

interface Achievement {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  date: string;
  impact: string;
}

const SAMPLE_RESUMES: CandidatesDict = {
  'john-doe.txt': {
    name: 'John Doe',
    role: 'Software Engineer',
    score: 85,
    status: 'pending'
  },
  'jane-smith.txt': {
    name: 'Jane Smith',
    role: 'Product Manager',
    score: 92,
    status: 'pending'
  }
};

// Add these utility functions at the top level
const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const videoUrl = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');
    video.src = videoUrl;
    await video.play();

    const stream = video.captureStream();
    const audioTrack = stream.getAudioTracks()[0];
    const mediaRecorder = new MediaRecorder(new MediaStream([audioTrack]));
    
    return new Promise((resolve) => {
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = () => resolve(new Blob(audioChunks, { type: 'audio/webm' }));
      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), video.duration * 1000);
    });
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw error;
  }
};

const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // In a real implementation, you would:
    // 1. Upload the audio to your server
    // 2. Use a service like Google Cloud Speech-to-Text or AWS Transcribe
    // 3. Return the transcription
    
    // For demo, we'll simulate a delay and return sample text
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Hi, I'm a software engineer with 5 years of experience...";
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

const analyzeTranscript = async (transcript: string): Promise<{
  introduction: string;
  skills: string[];
  challenges: string;
}> => {
  try {
    // In a real implementation, you would:
    // 1. Use NLP to analyze the transcript
    // 2. Extract key information using AI (e.g., OpenAI's GPT)
    // 3. Return structured data
    
    // For demo, we'll process the actual transcript to extract some basic information
    const skills = transcript.match(/\b(JavaScript|Python|React|Node\.js|TypeScript|AWS)\b/gi) || [];
    const challengeMatch = transcript.match(/challenge[^.]*\./i);
    
    return {
      introduction: transcript.slice(0, 150) + "...",
      skills: Array.from(new Set(skills)),
      challenges: challengeMatch ? challengeMatch[0] : "Not mentioned"
    };
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    throw error;
  }
};

// Add Gemini API integration for dynamic question generation
const generateQuestionsWithGemini = async (role: string): Promise<string[]> => {
  try {
    const apiKey = "AIzaSyBAJ900aAaOo_SqIuneHq79VqofYyOyfNU";
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    
    // Create a prompt that explains the task and provides context
    const prompt = `
      Generate 4 detailed, technical interview questions specifically for a ${role} position.
      These questions should assess deep knowledge in the field, problem-solving abilities, and experience.
      Format your response as a clear list of 4 questions only with no additional text or numbering.
      Each question should be on a new line.
    `;
    
    // Make the API call
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the generated text from the response
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';
    
    // Split the text into separate questions
    const questions = generatedText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.includes('?'));
    
    // Ensure we have at least some questions (use fallbacks if needed)
    return questions.length > 0 ? questions : [
      "What are your greatest professional strengths?",
      "How do you handle challenges in your work?",
      "What's your approach to learning new skills?",
      "How do you collaborate with team members from different backgrounds?"
    ];
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    // Fallback questions if the API call fails
    return [
      "What are your greatest professional strengths?",
      "How do you handle challenges in your work?",
      "What's your approach to learning new skills?",
      "How do you collaborate with team members from different backgrounds?"
    ];
  }
};

// Modify the getInterviewQuestions function to use Gemini
const getInterviewQuestions = async (role: string) => {
  // Keep the fixed questions
  const introduction = "Tell us about your relevant experience.";
  const interest = "What interests you about this position?";
  const challenge = "Describe a challenging project you've worked on.";
  
  // Get dynamic questions from Gemini
  const geminiQuestions = await generateQuestionsWithGemini(role);
  
  // Build question set
  return {
    introduction,
    interest,
    challenge,
    // Use the first 4 questions from Gemini (or fewer if less are returned)
    gemini1: geminiQuestions[0] || "What are your greatest professional strengths?",
    gemini2: geminiQuestions[1] || "How do you handle challenges in your work?",
    gemini3: geminiQuestions[2] || "What's your approach to learning new skills?",
    gemini4: geminiQuestions[3] || "How do you collaborate with team members?"
  };
};

function App() {
  const [selectedAgent, setSelectedAgent] = useState('recruitment');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [candidates, setCandidates] = useState<CandidatesDict>(SAMPLE_RESUMES);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showVideoInterview, setShowVideoInterview] = useState(false);
  const [interviewSummary, setInterviewSummary] = useState<string | null>(null);
  const [offerLetterSent, setOfferLetterSent] = useState(false);
  const [documentationComplete, setDocumentationComplete] = useState(false);
  const [rejectionEmailSent, setRejectionEmailSent] = useState(false);
  const [performanceStage, setPerformanceStage] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [goals, setGoals] = useState<Record<string, Array<{id: string; description: string; status: 'pending' | 'approved' | 'rejected'; metrics: string; alignment: string}>>>({
    'john-doe': [
      {
        id: '1',
        description: 'Improve system performance by optimizing database queries',
        status: 'pending',
        metrics: 'Reduce average query time by 30% within 3 months',
        alignment: 'Technical Excellence'
      },
      {
        id: '2',
        description: 'Lead the implementation of automated testing for critical components',
        status: 'pending',
        metrics: 'Achieve 80% test coverage for core modules by Q3',
        alignment: 'Quality Assurance'
      },
      {
        id: '3',
        description: 'Mentor junior developers on best coding practices',
        status: 'pending',
        metrics: 'Conduct 2 workshops per quarter and provide weekly code reviews',
        alignment: 'Team Development'
      }
    ],
    'jane-smith': [
      {
        id: '1',
        description: 'Develop and implement a machine learning model for predictive analytics',
        status: 'pending',
        metrics: 'Achieve prediction accuracy of 85% or higher by end of Q2',
        alignment: 'Innovation & Research'
      },
      {
        id: '2',
        description: 'Create data visualization dashboard for executive team',
        status: 'pending',
        metrics: 'Deliver interactive dashboard with 5 key business metrics by end of Q1',
        alignment: 'Business Intelligence'
      },
      {
        id: '3',
        description: 'Optimize data processing pipeline for big data workflows',
        status: 'pending',
        metrics: 'Reduce processing time by 40% while maintaining data integrity',
        alignment: 'Technical Excellence'
      }
    ],
    'alex-johnson': [
      {
        id: '1',
        description: 'Design user-centered interfaces for mobile application',
        status: 'pending',
        metrics: 'Increase user engagement by 25% and reduce bounce rate by 15%',
        alignment: 'Customer Experience'
      },
      {
        id: '2',
        description: 'Create comprehensive design system for product consistency',
        status: 'pending',
        metrics: 'Implement design system across 3 product lines by end of year',
        alignment: 'Brand Consistency'
      },
      {
        id: '3',
        description: 'Conduct user research and testing for new features',
        status: 'pending',
        metrics: 'Complete 5 user testing sessions and incorporate findings into design',
        alignment: 'User-Centered Design'
      }
    ]
  });

  const [employees, setEmployees] = useState([
    {
      id: 'john-doe',
      name: 'John Doe',
      position: 'Senior Software Engineer',
      department: 'Engineering',
      avatar: '👨‍💻'
    },
    {
      id: 'jane-smith',
      name: 'Jane Smith',
      position: 'Data Scientist',
      department: 'Analytics',
      avatar: '👩‍🔬'
    },
    {
      id: 'alex-johnson',
      name: 'Alex Johnson',
      position: 'UX Designer',
      department: 'Design',
      avatar: '🧑‍🎨'
    }
  ]);

  const [companyGoals, setCompanyGoals] = useState([
    {
      id: 'goal1',
      name: 'Technical Excellence',
      description: 'Build robust, scalable systems with industry-leading performance'
    },
    {
      id: 'goal2',
      name: 'Innovation & Research',
      description: 'Pioneer new approaches and technologies that drive industry advancement'
    },
    {
      id: 'goal3',
      name: 'Quality Assurance',
      description: 'Ensure all deliverables meet the highest standards of quality and reliability'
    },
    {
      id: 'goal4',
      name: 'Team Development',
      description: 'Foster growth and knowledge sharing within and across teams'
    },
    {
      id: 'goal5',
      name: 'Customer Experience',
      description: 'Create intuitive, delightful experiences that exceed customer expectations'
    },
    {
      id: 'goal6',
      name: 'Business Intelligence',
      description: 'Deliver actionable insights that drive strategic business decisions'
    },
    {
      id: 'goal7',
      name: 'Brand Consistency',
      description: 'Maintain cohesive brand identity across all products and platforms'
    },
    {
      id: 'goal8',
      name: 'User-Centered Design',
      description: 'Develop solutions based on deep understanding of user needs and behaviors'
    }
  ]);

  const [employeeKPIs, setEmployeeKPIs] = useState<Record<string, KPI[]>>({
    'john-doe': [
      {
        id: 'kpi1',
        title: 'Code Quality',
        description: 'Maintain code quality standards across projects',
        target: '< 3 bugs per 1000 lines of code',
        progress: 65,
        status: 'in-progress',
        dueDate: '2023-12-31'
      },
      {
        id: 'kpi2',
        title: 'System Performance',
        description: 'Improve system response time',
        target: '< 100ms response time for 99% of API requests',
        progress: 30,
        status: 'in-progress',
        dueDate: '2023-11-15'
      }
    ],
    'jane-smith': [
      {
        id: 'kpi3',
        title: 'Model Accuracy',
        description: 'Improve prediction accuracy of recommendation system',
        target: '> 92% accuracy on test set',
        progress: 80,
        status: 'in-progress',
        dueDate: '2023-12-15'
      }
    ],
    'alex-johnson': [
      {
        id: 'kpi4',
        title: 'User Satisfaction',
        description: 'Improve user satisfaction scores for new designs',
        target: '> 4.5/5 average user rating',
        progress: 50,
        status: 'at-risk',
        dueDate: '2023-10-30'
      }
    ]
  });

  const [employeeMilestones, setEmployeeMilestones] = useState<Record<string, Milestone[]>>({
    'john-doe': [
      {
        id: 'milestone1',
        title: 'Implement Automated Testing',
        description: 'Set up CI/CD pipeline with automated testing',
        dueDate: '2023-10-15',
        completed: true,
        kpiId: 'kpi1'
      },
      {
        id: 'milestone2',
        title: 'Code Review Process',
        description: 'Establish peer code review process',
        dueDate: '2023-11-01',
        completed: false,
        kpiId: 'kpi1'
      },
      {
        id: 'milestone3',
        title: 'Database Optimization',
        description: 'Optimize database queries for improved response time',
        dueDate: '2023-10-20',
        completed: false,
        kpiId: 'kpi2'
      }
    ],
    'jane-smith': [
      {
        id: 'milestone4',
        title: 'Data Cleaning Pipeline',
        description: 'Develop automated data cleaning pipeline',
        dueDate: '2023-10-25',
        completed: true,
        kpiId: 'kpi3'
      },
      {
        id: 'milestone5',
        title: 'Feature Engineering',
        description: 'Identify and implement new features for the model',
        dueDate: '2023-11-10',
        completed: false,
        kpiId: 'kpi3'
      }
    ],
    'alex-johnson': [
      {
        id: 'milestone6',
        title: 'User Research',
        description: 'Conduct user interviews and analyze feedback',
        dueDate: '2023-09-30',
        completed: true,
        kpiId: 'kpi4'
      },
      {
        id: 'milestone7',
        title: 'Prototype Testing',
        description: 'Test new design prototypes with user group',
        dueDate: '2023-10-15',
        completed: false,
        kpiId: 'kpi4'
      }
    ]
  });

  const [employeeAchievements, setEmployeeAchievements] = useState<Record<string, Achievement[]>>({
    'john-doe': [
      {
        id: 'achievement1',
        employeeId: 'john-doe',
        title: 'Reduced Server Costs',
        description: 'Optimized cloud infrastructure to reduce monthly costs',
        date: '2023-09-20',
        impact: 'Reduced AWS costs by 30% while maintaining performance'
      }
    ],
    'jane-smith': [
      {
        id: 'achievement2',
        employeeId: 'jane-smith',
        title: 'Improved Data Pipeline',
        description: 'Redesigned ETL processes for greater efficiency',
        date: '2023-09-15',
        impact: 'Reduced data processing time by 45%'
      }
    ],
    'alex-johnson': []
  });

  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [newAchievementData, setNewAchievementData] = useState({
    title: '',
    description: '',
    impact: ''
  });
  
  // Add milestone form state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestoneData, setNewMilestoneData] = useState({
    title: '',
    description: '',
    dueDate: '',
    kpiId: ''
  });
  
  // Add feedback-related state
  const [feedbacks, setFeedbacks] = useState<Record<string, Array<{
    id: string;
    employeeId: string;
    reviewerId: string;
    reviewerType: 'peer' | 'manager' | 'self';
    rating: number;
    strengths: string;
    improvements: string;
    submittedAt: string;
  }>>>({
    'john-doe': [
      {
        id: '1',
        employeeId: 'john-doe',
        reviewerId: 'jane-smith',
        reviewerType: 'peer',
        rating: 4,
        strengths: 'Excellent technical skills, always willing to help team members',
        improvements: 'Could improve on documentation and knowledge sharing',
        submittedAt: '2023-10-01'
      },
      {
        id: '2',
        employeeId: 'john-doe',
        reviewerId: 'manager-1',
        reviewerType: 'manager',
        rating: 4.5,
        strengths: 'Delivers high quality work consistently, great problem solver',
        improvements: 'Should take more initiative in architecture discussions',
        submittedAt: '2023-10-05'
      }
    ],
    'jane-smith': [
      {
        id: '3',
        employeeId: 'jane-smith',
        reviewerId: 'john-doe',
        reviewerType: 'peer',
        rating: 4.5,
        strengths: 'Excellent data analysis skills, clear communication',
        improvements: 'Could benefit from more cross-functional collaboration',
        submittedAt: '2023-10-03'
      }
    ],
    'alex-johnson': []
  });
  
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [newFeedbackData, setNewFeedbackData] = useState({
    rating: 3,
    strengths: '',
    improvements: '',
    reviewerType: 'peer' as 'peer' | 'manager' | 'self'
  });

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const johnDoeResponse = await fetch('/src/resumes/john-doe.txt');
        const janeSmithResponse = await fetch('/src/resumes/jane-smith.txt');
        
        if (johnDoeResponse.ok && janeSmithResponse.ok) {
          const johnDoeText = await johnDoeResponse.text();
          const janeSmithText = await janeSmithResponse.text();
          
          const johnDoeFile = new File([johnDoeText], 'john-doe.txt', { type: 'text/plain' });
          const janeSmithFile = new File([janeSmithText], 'jane-smith.txt', { type: 'text/plain' });
          
          setUploadedFiles([johnDoeFile, janeSmithFile]);
        }
      } catch (error) {
        console.error('Error loading resumes:', error);
      }
    };

    loadResumes();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const handleProcessStage = () => {
    if (currentStage < 4) {
      setCurrentStage(currentStage + 1);
      
      // Reset previous stage statuses when moving to next stage
      setInterviewSummary(null);
      
      // Don't reset documentation status when moving to onboarding
      if (currentStage < 3) {
        setOfferLetterSent(false);
        setDocumentationComplete(false);
      }
    }
  };

  const handleCandidateAction = (candidateId: string, action: 'accept' | 'reject') => {
    setCandidates(prev => ({
      ...prev,
      [candidateId]: {
        ...prev[candidateId],
        status: action
      }
    }));
  };

  const handleVideoInterviewComplete = async (videoBlob: Blob) => {
    setShowVideoInterview(false);
    
    if (!selectedCandidate) return;
    
    // Show loading state while generating questions
    setInterviewSummary(`
      <div class="space-y-4">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    `);
    
    try {
      const candidateRole = candidates[selectedCandidate].role;
      const questions = await getInterviewQuestions(candidateRole);
      
      // Hardcoded interview summary based on selected candidate
      let summary = "";
      
      if (selectedCandidate === 'john-doe.txt') {
        summary = `
          <div class="space-y-4">
            <div>
              <h6 class="font-semibold">Self Introduction:</h6>
              <p class="text-gray-700">I'm John Doe, a software engineer with 5 years of experience building web applications. I graduated from MIT with a Computer Science degree and have worked for leading tech companies.</p>
            </div>
            
            <div>
              <h6 class="font-semibold">Question Responses:</h6>
              
              <div class="ml-4 space-y-3 mt-2">
                <div>
                  <p class="font-medium text-indigo-600">${questions.introduction}</p>
                  <p class="text-gray-700">I've spent the last 5 years working on full-stack development for fintech applications. I've built scalable APIs using Node.js and React frontends that handle millions of transactions daily. My experience includes leading a team of 4 developers on a major platform migration.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.interest}</p>
                  <p class="text-gray-700">I'm particularly excited about this position because of the emphasis on scalable architecture and the opportunity to work with cutting-edge technologies. The company's focus on innovation and your approach to solving real customer problems aligns perfectly with my career goals.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.challenge}</p>
                  <p class="text-gray-700">I led a team through a difficult product launch with tight deadlines and changing requirements. We successfully delivered by implementing agile methodologies and maintaining clear communication. We had to rebuild the authentication system a week before launch due to security issues, but we managed it without delaying the release.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini1}</p>
                  <p class="text-gray-700">When debugging complex issues, I follow a systematic approach. I first isolate the problem by reproducing it in a controlled environment, then I use logging and debugging tools to trace the execution flow. I also leverage metrics and error monitoring systems to identify patterns in production environments.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini2}</p>
                  <p class="text-gray-700">I stay updated with technology trends through several channels: I follow key tech blogs and newsletters, participate in GitHub discussions, attend regular meetups and conferences, and spend time on weekend projects exploring new frameworks and languages.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini3}</p>
                  <p class="text-gray-700">In cross-functional teams, I focus on clear communication and understanding each team member's perspective. I make sure to document technical concepts for non-technical stakeholders, and I enjoy learning about other disciplines. I find that regular stand-ups and shared project management tools help keep everyone aligned.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini4}</p>
                  <p class="text-gray-700">I once deployed a feature that caused a partial outage because I didn't thoroughly test an edge case. From this, I learned the importance of comprehensive testing and implementing proper CI/CD pipelines. This experience led me to become an advocate for test-driven development and automated testing.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h6 class="font-semibold">Relevant Skills:</h6>
              <p class="text-gray-700">React, Node.js, TypeScript, AWS, CI/CD pipelines, MongoDB</p>
            </div>
            
            <div>
              <h6 class="font-semibold">Challenges Faced:</h6>
              <p class="text-gray-700">Leading a team through a difficult product launch with tight deadlines and changing requirements. Successfully delivered by implementing agile methodologies and maintaining clear communication.</p>
            </div>
          </div>
        `;
      } else if (selectedCandidate === 'jane-smith.txt') {
        summary = `
          <div class="space-y-4">
            <div>
              <h6 class="font-semibold">Self Introduction:</h6>
              <p class="text-gray-700">Hello, I'm Jane Smith. I have a background in data science and have transitioned from academic research to industry applications, with a focus on machine learning models.</p>
            </div>
            
            <div>
              <h6 class="font-semibold">Question Responses:</h6>
              
              <div class="ml-4 space-y-3 mt-2">
                <div>
                  <p class="font-medium text-indigo-600">${questions.introduction}</p>
                  <p class="text-gray-700">I completed my Ph.D. in Statistics three years ago and then joined a fintech startup where I developed predictive models for credit risk assessment. My research background gave me strong analytical skills, and I've since built expertise in applying these to real-world business problems using Python and TensorFlow.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.interest}</p>
                  <p class="text-gray-700">This position interests me because it combines advanced analytics with practical business applications. I'm excited about the potential to work with large datasets and develop models that can drive actual business decisions and create measurable impact.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.challenge}</p>
                  <p class="text-gray-700">I had to optimize a computationally intensive algorithm to run on limited resources. By refactoring the code and implementing parallel processing techniques, I improved performance by 80%. This required deep analysis of the algorithm and creative solutions to maintain accuracy while reducing computational complexity.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini1}</p>
                  <p class="text-gray-700">When evaluating a machine learning model, I look beyond simple accuracy metrics. I use confusion matrices, ROC curves, and precision-recall curves to understand performance across different thresholds. For regression tasks, I examine RMSE, MAE, and R-squared values. I also consider the model's explainability, computational efficiency, and how well it generalizes to new data.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini2}</p>
                  <p class="text-gray-700">For data visualization, I primarily use Python libraries like Matplotlib, Seaborn, and Plotly. I select visualization techniques based on the data type and the story I want to tell. For exploratory analysis, I use scatter plots, histograms, and box plots. For presentations to stakeholders, I focus on clear, actionable visualizations like bar charts, line graphs with confidence intervals, and interactive dashboards.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini3}</p>
                  <p class="text-gray-700">In cross-functional teams, I serve as a bridge between technical and business stakeholders. I translate complex statistical concepts into business language and ensure my analyses address actual business needs. I collaborate closely with engineers on implementation and with product managers on feature development, using Jupyter notebooks to share interactive analyses.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini4}</p>
                  <p class="text-gray-700">During my PhD, I spent months developing a complex model that ultimately failed to outperform simpler approaches. This taught me the value of starting with baseline models and incrementally adding complexity only when needed. I learned that elegant simplicity often trumps complexity, and I now approach problems with a more pragmatic mindset.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h6 class="font-semibold">Relevant Skills:</h6>
              <p class="text-gray-700">Python, TensorFlow, PyTorch, SQL, Data visualization, Statistical analysis</p>
            </div>
            
            <div>
              <h6 class="font-semibold">Challenges Faced:</h6>
              <p class="text-gray-700">Optimizing a computationally intensive algorithm to run on limited resources. Improved performance by 80% through refactoring and implementing parallel processing techniques.</p>
            </div>
          </div>
        `;
      } else {
        summary = `
          <div class="space-y-4">
            <div>
              <h6 class="font-semibold">Self Introduction:</h6>
              <p class="text-gray-700">I'm a UX/UI designer with experience working with startups and enterprise clients across multiple industries. I focus on creating intuitive and accessible interfaces.</p>
            </div>
            
            <div>
              <h6 class="font-semibold">Question Responses:</h6>
              
              <div class="ml-4 space-y-3 mt-2">
                <div>
                  <p class="font-medium text-indigo-600">${questions.introduction}</p>
                  <p class="text-gray-700">I've been working as a UX/UI designer for over 6 years, initially at a digital agency where I designed for various clients, and then at a SaaS company where I led the redesign of their core product. I have experience with the entire design process from user research and wireframing to high-fidelity prototypes and design systems.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.interest}</p>
                  <p class="text-gray-700">This position appeals to me because it involves complex user experiences that need to be simplified. I'm excited about the challenge of making sophisticated functionality accessible to users with varying levels of technical expertise. I also appreciate the company's user-centered approach to product development.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.challenge}</p>
                  <p class="text-gray-700">I had to balance stakeholder requirements with user needs during a complete product redesign. Through user testing and iterative design, we achieved a 40% improvement in user satisfaction. The process involved difficult trade-offs, but by presenting research data and involving stakeholders in user testing sessions, we were able to align everyone's priorities.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini1}</p>
                  <p class="text-gray-700">I incorporate user feedback throughout my design process. I start with user interviews and surveys to understand pain points and needs. I create prototypes for usability testing, gathering both qualitative observations and quantitative metrics. After launch, I analyze user behavior data and feedback channels to continuously improve the design. I find that combining multiple feedback sources provides the most complete picture.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini2}</p>
                  <p class="text-gray-700">When balancing user needs with business requirements, I focus on finding solutions that satisfy both. For example, in a recent project, marketing wanted to add more promotional content to the dashboard, but users found it distracting. I designed a solution that highlighted promotions contextually based on user activity, which improved conversion rates without harming the user experience. The key is to frame design decisions in terms of business outcomes.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini3}</p>
                  <p class="text-gray-700">I thrive in cross-functional collaboration by establishing shared goals early in the process. I include developers in design discussions to ensure technical feasibility, and I work closely with product managers to align designs with business objectives. I use tools like Figma to create a single source of truth that all team members can access and comment on, which fosters transparency and alignment.</p>
                </div>
                
                <div>
                  <p class="font-medium text-indigo-600">${questions.gemini4}</p>
                  <p class="text-gray-700">Early in my career, I created a design that looked beautiful but failed in usability testing because I hadn't considered the actual context of use. This taught me that aesthetics must always serve function, and that assumptions need to be validated with real users. Now I always design with a clear understanding of user contexts and needs, which has led to much more successful outcomes.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h6 class="font-semibold">Relevant Skills:</h6>
              <p class="text-gray-700">Figma, Adobe XD, User research, Prototyping, Design systems</p>
            </div>
            
            <div>
              <h6 class="font-semibold">Challenges Faced:</h6>
              <p class="text-gray-700">Balancing stakeholder requirements with user needs during a complete product redesign. Achieved a 40% improvement in user satisfaction through user testing and iterative design.</p>
            </div>
          </div>
        `;
      }
      
      setInterviewSummary(summary);
    } catch (error) {
      console.error('Error generating interview summary:', error);
      // Fallback if there's an error
      setInterviewSummary(`
        <div class="space-y-4">
          <div class="text-red-600 p-4 bg-red-50 rounded-lg">
            There was an error generating the interview summary. Please try again.
          </div>
        </div>
      `);
    }
  };

  const getStageColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'current':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const agents: Agent[] = [
    {
      id: 'recruitment',
      name: 'Recruitment Agent',
      icon: <Users className="w-6 h-6" />,
      description: 'End-to-end recruitment automation with AI-driven candidate selection',
      workflow: [
        {
          stage: 'Resume Processing',
          icon: <FileText className="w-5 h-5" />,
          status: currentStage >= 0 ? (currentStage > 0 ? 'completed' : 'current') : 'pending',
          actions: [
            'Upload resumes to process',
            'Parse resume content and structure',
            'Extract key qualifications and skills'
          ]
        },
        {
          stage: 'ATS Screening',
          icon: <CheckCircle2 className="w-5 h-5" />,
          status: currentStage >= 1 ? (currentStage > 1 ? 'completed' : 'current') : 'pending',
          actions: [
            'Match skills with job requirements',
            'Score candidates based on criteria',
            'Generate shortlist recommendations'
          ]
        },
        {
          stage: 'Interview Coordination',
          icon: <Calendar className="w-5 h-5" />,
          status: currentStage >= 2 ? (currentStage > 2 ? 'completed' : 'current') : 'pending',
          actions: [
            'Schedule interviews with candidates',
            'Send automated reminders',
            'Coordinate with hiring managers'
          ]
        },
        {
          stage: 'Interview Assessment',
          icon: <MessageSquare className="w-5 h-5" />,
          status: currentStage >= 3 ? (currentStage > 3 ? 'completed' : 'current') : 'pending',
          actions: [
            'Record interview feedback',
            'Generate assessment reports',
            'Provide hiring recommendations'
          ]
        },
        {
          stage: 'Onboarding',
          icon: <UserPlus className="w-5 h-5" />,
          status: currentStage >= 4 ? (documentationComplete ? 'completed' : 'current') : 'pending',
          actions: [
            'Generate offer letters',
            'Initiate documentation process',
            'Create onboarding checklist'
          ]
        }
      ]
    },
    {
      id: 'performance',
      name: 'Performance Management Agent',
      icon: <UserCheck className="w-6 h-6" />,
      description: 'Continuous performance tracking and improvement system',
      workflow: [
        {
          stage: 'Goal Setting',
          icon: <Target className="w-5 h-5" />,
          actions: [
            'Define SMART objectives',
            'Align with company goals',
            'Set measurement criteria'
          ]
        },
        {
          stage: 'Performance Tracking',
          icon: <ChartLineUp className="w-5 h-5" />,
          actions: [
            'Monitor KPI progress',
            'Track milestone completion',
            'Record achievements'
          ]
        },
        {
          stage: 'Feedback Collection',
          icon: <MessageSquare className="w-5 h-5" />,
          actions: [
            'Gather peer reviews',
            'Collect manager feedback',
            'Process self-assessments'
          ]
        },
        {
          stage: 'Review Generation',
          icon: <ScrollText className="w-5 h-5" />,
          actions: [
            'Compile performance data',
            'Generate review reports',
            'Prepare improvement plans'
          ]
        },
        {
          stage: 'Recognition & Rewards',
          icon: <Trophy className="w-5 h-5" />,
          actions: [
            'Calculate performance scores',
            'Recommend promotions/rewards',
            'Generate recognition certificates'
          ]
        }
      ]
    },
    {
      id: 'learning',
      name: 'Learning & Development Agent',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'AI-driven learning path creation and skill development tracking',
      workflow: [
        {
          stage: 'Skill Assessment',
          icon: <Gauge className="w-5 h-5" />,
          actions: [
            'Evaluate current skills',
            'Identify skill gaps',
            'Define learning needs'
          ]
        },
        {
          stage: 'Learning Path Creation',
          icon: <GraduationCap className="w-5 h-5" />,
          actions: [
            'Design custom curricula',
            'Select learning resources',
            'Set learning milestones'
          ]
        },
        {
          stage: 'Progress Monitoring',
          icon: <ChartLineUp className="w-5 h-5" />,
          actions: [
            'Track course completion',
            'Monitor assessment scores',
            'Record practical applications'
          ]
        },
        {
          stage: 'Certification Management',
          icon: <BadgeCheck className="w-5 h-5" />,
          actions: [
            'Process certifications',
            'Update skill records',
            'Generate achievements'
          ]
        },
        {
          stage: 'Impact Assessment',
          icon: <Target className="w-5 h-5" />,
          actions: [
            'Measure learning effectiveness',
            'Track performance improvement',
            'Generate ROI reports'
          ]
        }
      ]
    },
    {
      id: 'compensation',
      name: 'Compensation & Benefits Agent',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'Automated compensation management and benefits administration',
      workflow: [
        {
          stage: 'Market Analysis',
          icon: <ChartLineUp className="w-5 h-5" />,
          actions: [
            'Analyze market rates',
            'Compare industry standards',
            'Track compensation trends'
          ]
        },
        {
          stage: 'Salary Review',
          icon: <Scale className="w-5 h-5" />,
          actions: [
            'Calculate adjustments',
            'Process promotions',
            'Generate increase letters'
          ]
        },
        {
          stage: 'Benefits Administration',
          icon: <HeartHandshake className="w-5 h-5" />,
          actions: [
            'Process benefit enrollments',
            'Track benefit usage',
            'Handle benefit queries'
          ]
        },
        {
          stage: 'Equity Management',
          icon: <Trophy className="w-5 h-5" />,
          actions: [
            'Calculate stock options',
            'Track vesting schedules',
            'Generate equity reports'
          ]
        },
        {
          stage: 'Compliance Checking',
          icon: <AlertCircle className="w-5 h-5" />,
          actions: [
            'Verify pay equity',
            'Check regulatory compliance',
            'Generate compliance reports'
          ]
        }
      ]
    },
    {
      id: 'culture',
      name: 'Culture & Engagement Agent',
      icon: <Building2 className="w-6 h-6" />,
      description: 'Proactive culture building and engagement monitoring system',
      workflow: [
        {
          stage: 'Engagement Monitoring',
          icon: <Gauge className="w-5 h-5" />,
          actions: [
            'Run pulse surveys',
            'Track participation metrics',
            'Analyze feedback patterns'
          ]
        },
        {
          stage: 'Culture Assessment',
          icon: <Target className="w-5 h-5" />,
          actions: [
            'Evaluate culture metrics',
            'Monitor team dynamics',
            'Track value alignment'
          ]
        },
        {
          stage: 'Event Management',
          icon: <PartyPopper className="w-5 h-5" />,
          actions: [
            'Plan team activities',
            'Coordinate celebrations',
            'Track participation'
          ]
        },
        {
          stage: 'Recognition Programs',
          icon: <Trophy className="w-5 h-5" />,
          actions: [
            'Process peer recognition',
            'Generate appreciation cards',
            'Track recognition metrics'
          ]
        },
        {
          stage: 'Action Planning',
          icon: <ScrollText className="w-5 h-5" />,
          actions: [
            'Generate improvement plans',
            'Track implementation',
            'Measure effectiveness'
          ]
        }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance & Policy Agent',
      icon: <Award className="w-6 h-6" />,
      description: 'Automated compliance monitoring and policy management system',
      workflow: [
        {
          stage: 'Policy Monitoring',
          icon: <AlertCircle className="w-5 h-5" />,
          actions: [
            'Track policy updates',
            'Monitor compliance deadlines',
            'Generate alerts'
          ]
        },
        {
          stage: 'Documentation Review',
          icon: <ScrollText className="w-5 h-5" />,
          actions: [
            'Audit policy documents',
            'Check version control',
            'Track acknowledgments'
          ]
        },
        {
          stage: 'Training Management',
          icon: <GraduationCap className="w-5 h-5" />,
          actions: [
            'Schedule compliance training',
            'Track completion rates',
            'Generate certificates'
          ]
        },
        {
          stage: 'Risk Assessment',
          icon: <Scale className="w-5 h-5" />,
          actions: [
            'Identify compliance risks',
            'Generate risk reports',
            'Track mitigation actions'
          ]
        },
        {
          stage: 'Reporting',
          icon: <FileText className="w-5 h-5" />,
          actions: [
            'Generate compliance reports',
            'Track audit findings',
            'Document resolutions'
          ]
        }
      ]
    }
  ];

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  const renderRecruitmentContent = () => {
    // Split into candidate side and HR side stages
    const isCandidateSide = currentStage <= 2; // Resume upload, ATS screening, Video interview
    const isHRSide = currentStage > 2; // Accept/reject, onboarding
    
    return (
      <div className="space-y-8">
        {/* Stage progression indicator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-blue-800">
              {isCandidateSide ? "Candidate Application Process" : "HR Selection & Onboarding"}
            </h2>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Stage {currentStage + 1}/5
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            {selectedAgentData?.workflow.map((stage, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStage 
                    ? 'bg-blue-600 text-white' 
                    : index === currentStage 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {React.cloneElement(stage.icon, { className: "w-5 h-5" })}
                </div>
                <div className="text-xs text-center font-medium text-gray-600">{stage.stage}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Content label */}
          <div className="mb-6">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              {isCandidateSide ? "Candidate Side" : "HR Side"}
            </div>
          </div>
          
          {/* Stage content */}
          {(() => {
            switch (currentStage) {
              case 0:
                return (
                  <div className="mb-8">
                    <div {...getRootProps()} className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                      <input {...getInputProps()} />
                      <Upload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                      {isDragActive ? (
                        <p className="text-blue-600">Drop the resumes here...</p>
                      ) : (
                        <p className="text-gray-500">Drag & drop resumes here, or click to select files</p>
                      )}
                      <p className="text-sm text-gray-400 mt-2">Supports PDF, DOC, DOCX, TXT</p>
                    </div>
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Uploaded Resumes:</h3>
                        <ul className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center space-x-2 text-sm">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span>{file.name}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={handleProcessStage}
                          className="mt-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity w-full"
                        >
                          Process Resumes
                        </button>
                      </div>
                    )}
                  </div>
                );

              case 1:
                return (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-blue-800">ATS Screening Results</h3>
                    {Object.entries(candidates).map(([id, candidate]) => (
                      <div key={id} className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-semibold">{candidate.name}</h4>
                            <p className="text-gray-600">{candidate.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{candidate.score}%</div>
                            <div className="text-sm text-gray-500">Match Score</div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-4">
                          <button
                            onClick={() => {
                              setSelectedCandidate(id);
                              handleProcessStage();
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Schedule Interview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );

              case 2:
                return (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-blue-800">Video Interview</h3>
                    {selectedCandidate && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h4 className="text-lg font-semibold">{candidates[selectedCandidate].name}</h4>
                            <p className="text-gray-600">{candidates[selectedCandidate].role}</p>
                          </div>
                          <Video className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        {interviewSummary ? (
                          <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h5 className="font-semibold mb-2 text-blue-800">Interview Summary</h5>
                              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: interviewSummary }}></div>
                            </div>
                            
                            <div className="flex gap-4">
                              <button
                                onClick={() => {
                                  handleCandidateAction(selectedCandidate, 'accept');
                                  handleProcessStage();
                                  setInterviewSummary(null);
                                }}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Accept Candidate
                              </button>
                              <button
                                onClick={() => {
                                  handleCandidateAction(selectedCandidate, 'reject');
                                  handleProcessStage();
                                  setInterviewSummary(null);
                                }}
                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Reject Candidate
                              </button>
                            </div>
                          </div>
                        ) : (
                        <button
                          onClick={() => setShowVideoInterview(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Start Video Interview
                        </button>
                        )}
                      </div>
                    )}
                    {showVideoInterview && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-blue-800">Video Interview</h3>
                            <button
                              onClick={() => setShowVideoInterview(false)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                          <VideoInterview 
                            onComplete={handleVideoInterviewComplete} 
                            role={selectedCandidate ? candidates[selectedCandidate].role : undefined}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );

              case 3:
                return (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-blue-800">HR Interview Assessment</h3>
                    {selectedCandidate && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-lg font-semibold">{candidates[selectedCandidate].name}</h4>
                            <p className="text-gray-600">{candidates[selectedCandidate].role}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <button
                            onClick={() => {
                              handleCandidateAction(selectedCandidate, 'accept');
                              handleProcessStage();
                            }}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Accept Candidate
                          </button>
                          <button
                            onClick={() => {
                              handleCandidateAction(selectedCandidate, 'reject');
                              handleProcessStage();
                            }}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Reject Candidate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case 4:
                return (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-blue-800">HR Onboarding</h3>
                    {selectedCandidate && candidates[selectedCandidate].status === 'accept' && !offerLetterSent && (
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-center mb-6">
                          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                            Offer Letter
                          </div>
                        </div>
                        
                        <div className="border border-blue-200 p-6 rounded-lg mb-6 bg-white">
                          <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-blue-800">OFFER LETTER</h3>
                            <p className="text-gray-500">Reference: OL-{Math.floor(Math.random() * 10000)}</p>
                          </div>
                          
                        <div className="space-y-4">
                            <p>Date: {new Date().toLocaleDateString()}</p>
                            
                            <p>Dear {candidates[selectedCandidate].name},</p>
                            
                            <p>We are pleased to offer you the position of <strong>{candidates[selectedCandidate].role}</strong> at our company. This letter outlines the terms and conditions of your employment.</p>
                            
                            <div className="space-y-2">
                              <p><strong>Start Date:</strong> {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                              <p><strong>Salary:</strong> ${(80000 + Math.floor(Math.random() * 40000)).toLocaleString()} per annum</p>
                              <p><strong>Location:</strong> Hybrid (3 days in office, 2 days remote)</p>
                              <p><strong>Reporting To:</strong> Team Lead, {candidates[selectedCandidate].role}</p>
                            </div>
                            
                            <p>Please confirm your acceptance by signing and returning this letter.</p>
                            
                            <p>Sincerely,<br />HR Department</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setOfferLetterSent(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Send Offer Letter to Candidate
                        </button>
                      </div>
                    )}
                    
                    {selectedCandidate && candidates[selectedCandidate].status === 'accept' && offerLetterSent && !documentationComplete && (
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-center mb-6">
                          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                            Documentation Process
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-center">The offer letter has been sent to {candidates[selectedCandidate].name}.</p>
                          
                          <h4 className="font-semibold">Required Documents:</h4>
                          <ul className="space-y-2">
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-gray-400" />
                              <span>Signed Offer Letter</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-gray-400" />
                              <span>Identity Proof</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-gray-400" />
                              <span>Address Proof</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-gray-400" />
                              <span>Educational Certificates</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-gray-400" />
                              <span>Previous Employment Records</span>
                            </li>
                          </ul>
                        </div>
                        
                        <button
                          onClick={() => setDocumentationComplete(true)}
                          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors mt-6"
                        >
                          Complete Documentation Process
                        </button>
                      </div>
                    )}
                    
                    {selectedCandidate && candidates[selectedCandidate].status === 'accept' && documentationComplete && (
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-center mb-6">
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Onboarding Complete
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-green-700">Onboarding Checklist Completed</h4>
                          <ul className="space-y-2">
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span>Offer letter accepted</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span>Documentation completed</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span>Welcome package prepared</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span>IT equipment assigned</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span>First-day orientation scheduled</span>
                            </li>
                          </ul>
                          
                          <div className="bg-green-50 p-4 rounded-lg mt-4 border border-green-200">
                            <div className="flex items-center">
                              <PartyPopper className="w-6 h-6 text-green-600 mr-2" />
                              <p className="text-green-800 font-semibold">Candidate is ready to join on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}!</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedCandidate && candidates[selectedCandidate].status === 'reject' && !rejectionEmailSent && (
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-center mb-6">
                          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full flex items-center">
                            <XCircle className="w-5 h-5 mr-2" />
                            Candidate Not Selected
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 p-6 rounded-lg mb-6">
                          <div className="border-b border-gray-200 pb-4 mb-4">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-sm text-gray-500">To:</p>
                                <p>{candidates[selectedCandidate].name} &lt;{candidates[selectedCandidate].name.toLowerCase().replace(' ', '.')}@example.com&gt;</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Date:</p>
                                <p>{new Date().toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm text-gray-500">From:</p>
                              <p>HR Department &lt;hr@yourcompany.com&gt;</p>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm text-gray-500">Subject:</p>
                              <p>Regarding Your Application for {candidates[selectedCandidate].role} Position</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4 text-gray-700">
                            <p>Dear {candidates[selectedCandidate].name},</p>
                            
                            <p>Thank you for your interest in the {candidates[selectedCandidate].role} position at our company and for taking the time to interview with us.</p>
                            
                            <p>After careful consideration, we have decided to move forward with other candidates whose qualifications and experience better align with our current needs. This decision was not easy, as we were impressed with many aspects of your background.</p>
                            
                            <p>We appreciate your interest in our company and would like to encourage you to apply for future positions that match your skills and experience. We will keep your resume on file and contact you if a suitable position becomes available.</p>
                            
                            <p>We wish you all the best in your job search and future career endeavors.</p>
                            
                            <p>Sincerely,<br />The HR Team</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setRejectionEmailSent(true)}
                          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Send Rejection Email
                        </button>
                      </div>
                    )}
                    
                    {selectedCandidate && candidates[selectedCandidate].status === 'reject' && rejectionEmailSent && (
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-center mb-6">
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Rejection Email Sent
                          </div>
                        </div>
                        <p className="text-center text-gray-600 mb-4">
                          The rejection email has been sent to {candidates[selectedCandidate].name}.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-600">The recruitment process for this candidate has been completed.</p>
                        </div>
                      </div>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })()}
        </div>
      </div>
    );
  };

  // Add the handleGoalAction function
  const handleGoalAction = (employeeId: string, goalId: string, action: 'approved' | 'rejected') => {
    setGoals(prev => {
      const employeeGoals = [...(prev[employeeId] || [])];
      const goalIndex = employeeGoals.findIndex(goal => goal.id === goalId);
      
      if (goalIndex !== -1) {
        employeeGoals[goalIndex] = {
          ...employeeGoals[goalIndex],
          status: action
        };
      }
      
      return {
        ...prev,
        [employeeId]: employeeGoals
      };
    });
  };

  // Add the handlePerformanceStage function
  const handlePerformanceStage = () => {
    if (performanceStage < 4) {
      setPerformanceStage(performanceStage + 1);
    }
  };

  // Add the handleNewGoal function
  const handleNewGoal = (employeeId: string, goalData: { description: string; metrics: string; alignment: string }) => {
    setGoals(prev => {
      const employeeGoals = [...(prev[employeeId] || [])];
      const newGoal = {
        id: Date.now().toString(),
        description: goalData.description,
        metrics: goalData.metrics,
        alignment: goalData.alignment,
        status: 'pending' as const
      };
      
      return {
        ...prev,
        [employeeId]: [...employeeGoals, newGoal]
      };
    });
  };

  // Add the renderPerformanceContent function
  const renderPerformanceContent = () => {
    switch (performanceStage) {
      case 0: // Goal Setting Stage
        return (
          <div className="space-y-8">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Company Goals Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyGoals.slice(0, 4).map(goal => (
                  <div key={goal.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-indigo-600">{goal.name}</h4>
                    <p className="text-gray-600 text-sm">{goal.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Employee selection sidebar */}
              <div className="md:w-1/3">
                <h3 className="text-lg font-semibold mb-4">Select Employee</h3>
                <div className="space-y-3">
                  {employees.map(employee => (
                    <div 
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee.id)}
                      className={`p-4 rounded-lg cursor-pointer ${
                        selectedEmployee === employee.id 
                          ? 'bg-indigo-100 border border-indigo-300' 
                          : 'bg-white border border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{employee.avatar}</div>
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Goal management area */}
              <div className="md:w-2/3">
                {selectedEmployee ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {employees.find(e => e.id === selectedEmployee)?.name}'s Goals
                      </h3>
                      <button
                        onClick={() => {
                          // Check if all goals have been actioned before proceeding
                          const employeeGoals = goals[selectedEmployee] || [];
                          const allActioned = employeeGoals.every(goal => goal.status !== 'pending');
                          
                          if (allActioned) {
                            handlePerformanceStage();
                          } else {
                            alert('Please review all goals before proceeding');
                          }
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Finalize Goals
                      </button>
                    </div>
                    
                    {/* Goals list */}
                    <div className="space-y-4">
                      {(goals[selectedEmployee] || []).map(goal => (
                        <div key={goal.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{goal.description}</h4>
                              <div className="mt-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Metrics:</span>
                                <p className="text-sm text-gray-700">{goal.metrics}</p>
                              </div>
                              <div className="mt-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Alignment:</span>
                                <p className="text-sm text-gray-700">{goal.alignment}</p>
                              </div>
                            </div>
                            <div className="ml-4">
                              {goal.status === 'pending' ? (
                                <div className="flex flex-col space-y-2">
                                  <button
                                    onClick={() => handleGoalAction(selectedEmployee, goal.id, 'approved')}
                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleGoalAction(selectedEmployee, goal.id, 'rejected')}
                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <div className={`px-3 py-1 rounded text-sm ${
                                  goal.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {goal.status === 'approved' ? 'Approved' : 'Rejected'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* New goal form */}
                    <div className="bg-gray-50 p-4 rounded-lg mt-6">
                      <h4 className="font-semibold mb-3">Add New Goal</h4>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const description = (form.elements.namedItem('description') as HTMLInputElement).value;
                          const metrics = (form.elements.namedItem('metrics') as HTMLInputElement).value;
                          const alignment = (form.elements.namedItem('alignment') as HTMLSelectElement).value;
                          
                          if (description && metrics && alignment) {
                            handleNewGoal(selectedEmployee, { description, metrics, alignment });
                            form.reset();
                          }
                        }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Goal Description</label>
                          <input 
                            type="text" 
                            name="description"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="What should be accomplished?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Criteria</label>
                          <input 
                            type="text" 
                            name="metrics"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="How will success be measured?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company Goal Alignment</label>
                          <select 
                            name="alignment"
                            required
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select alignment</option>
                            {companyGoals.map(goal => (
                              <option key={goal.id} value={goal.name}>{goal.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Add Goal
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Select an employee to view and manage their goals</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 1: // Performance Tracking Stage
        return (
          <div className="space-y-8">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Performance Tracking Dashboard</h3>
              <p className="text-gray-700">Monitor KPIs, track milestones, and record achievements</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Employee selection sidebar */}
              <div className="md:w-1/3">
                <h3 className="text-lg font-semibold mb-4">Select Employee</h3>
                <div className="space-y-3">
                  {employees.map(employee => (
                    <div 
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee.id)}
                      className={`p-4 rounded-lg cursor-pointer ${
                        selectedEmployee === employee.id 
                          ? 'bg-indigo-100 border border-indigo-300' 
                          : 'bg-white border border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{employee.avatar}</div>
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance tracking area */}
              <div className="md:w-2/3">
                {selectedEmployee ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {employees.find(e => e.id === selectedEmployee)?.name}'s Performance
                      </h3>
                      <button
                        onClick={() => handlePerformanceStage()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Next Stage
                      </button>
                    </div>
                    
                    {/* KPIs */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-lg mb-4">Key Performance Indicators</h4>
                      
                      <div className="space-y-4">
                        {/* Example KPI cards - would be dynamic in a real implementation */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-semibold">Code Quality</h5>
                              <p className="text-sm text-gray-600">Maintain code quality standards across projects</p>
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              In Progress
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500">TARGET</p>
                              <p className="text-sm">&lt; 3 bugs per 1000 lines of code</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">DUE DATE</p>
                              <p className="text-sm">2023-12-31</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">Progress</span>
                              <span className="text-xs font-medium">65%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: '65%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-semibold">System Performance</h5>
                              <p className="text-sm text-gray-600">Improve system response time</p>
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              At Risk
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500">TARGET</p>
                              <p className="text-sm">&lt; 100ms response time for 99% of API requests</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">DUE DATE</p>
                              <p className="text-sm">2023-11-15</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">Progress</span>
                              <span className="text-xs font-medium">30%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-red-500"
                                style={{ width: '30%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Milestones */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-lg mb-4">Milestones</h4>
                      
                      <div className="space-y-3">
                        {(employeeMilestones[selectedEmployee] || []).map(milestone => (
                          <div key={milestone.id} className="flex items-start border border-gray-200 rounded-lg p-3">
                            <input
                              type="checkbox"
                              checked={milestone.completed}
                              onChange={() => handleMilestoneToggle(selectedEmployee, milestone.id)}
                              className="mt-1 h-4 w-4 text-indigo-600 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between">
                                <h5 className={`font-medium ${milestone.completed ? 'line-through text-gray-500' : ''}`}>
                                  {milestone.title}
                                </h5>
                                <span className="text-xs text-gray-500">Due: {milestone.dueDate}</span>
                              </div>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Linked to: {employeeKPIs[selectedEmployee]?.find(k => k.id === milestone.kpiId)?.title || 'Unknown KPI'}
                              </p>
                            </div>
                          </div>
                        ))}

                        {(employeeMilestones[selectedEmployee] || []).length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No milestones defined yet
                          </div>
                        )}
                      </div>

                      {/* Add milestone button */}
                      <button 
                        className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        onClick={() => setShowMilestoneForm(true)}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" /> Add Milestone
                      </button>
                      
                      {/* Milestone Form Modal */}
                      {showMilestoneForm && selectedEmployee && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Add New Milestone</h3>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              if (newMilestoneData.title && newMilestoneData.description && newMilestoneData.dueDate && newMilestoneData.kpiId) {
                                handleNewMilestone(selectedEmployee, newMilestoneData);
                                setNewMilestoneData({ title: '', description: '', dueDate: '', kpiId: '' });
                                setShowMilestoneForm(false);
                              }
                            }}>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Title</label>
                                  <input 
                                    type="text" 
                                    value={newMilestoneData.title}
                                    onChange={(e) => setNewMilestoneData({...newMilestoneData, title: e.target.value})}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="E.g., Complete Code Review Process"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                  <textarea 
                                    value={newMilestoneData.description}
                                    onChange={(e) => setNewMilestoneData({...newMilestoneData, description: e.target.value})}
                                    required
                                    rows={2}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Brief description of this milestone"
                                  ></textarea>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                  <input 
                                    type="date" 
                                    value={newMilestoneData.dueDate}
                                    onChange={(e) => setNewMilestoneData({...newMilestoneData, dueDate: e.target.value})}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Related KPI</label>
                                  <select 
                                    value={newMilestoneData.kpiId}
                                    onChange={(e) => setNewMilestoneData({...newMilestoneData, kpiId: e.target.value})}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="">Select a KPI</option>
                                    {(employeeKPIs[selectedEmployee] || []).map(kpi => (
                                      <option key={kpi.id} value={kpi.id}>{kpi.title}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end space-x-3 mt-6">
                                <button
                                  type="button"
                                  onClick={() => setShowMilestoneForm(false)}
                                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                                >
                                  Add Milestone
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Select an employee to track performance</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2: // Feedback Collection Stage
        return (
          <div className="space-y-8">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Feedback Collection</h3>
              <p className="text-gray-700">Gather peer reviews, collect manager feedback, and process self-assessments</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Employee selection sidebar */}
              <div className="md:w-1/3">
                <h3 className="text-lg font-semibold mb-4">Select Employee</h3>
                <div className="space-y-3">
                  {employees.map(employee => (
                    <div 
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee.id)}
                      className={`p-4 rounded-lg cursor-pointer ${
                        selectedEmployee === employee.id 
                          ? 'bg-indigo-100 border border-indigo-300' 
                          : 'bg-white border border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{employee.avatar}</div>
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feedback area */}
              <div className="md:w-2/3">
                {selectedEmployee ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {employees.find(e => e.id === selectedEmployee)?.name}'s Feedback
                      </h3>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setNewFeedbackData({
                              rating: 3,
                              strengths: '',
                              improvements: '',
                              reviewerType: 'self'
                            });
                            setShowFeedbackForm(true);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Self Assessment
                        </button>
                        <button
                          onClick={() => handlePerformanceStage()}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Next Stage
                        </button>
                      </div>
                    </div>
                    
                    {/* Feedback Summary */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-lg mb-4">Feedback Summary</h4>
                      
                      {(feedbacks[selectedEmployee] || []).length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 bg-gray-100 p-4 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-500 mb-1">Peer Reviews</h5>
                              <p className="text-2xl font-bold">
                                {(feedbacks[selectedEmployee] || []).filter(f => f.reviewerType === 'peer').length}
                              </p>
                            </div>
                            <div className="flex-1 bg-gray-100 p-4 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-500 mb-1">Manager Feedback</h5>
                              <p className="text-2xl font-bold">
                                {(feedbacks[selectedEmployee] || []).filter(f => f.reviewerType === 'manager').length}
                              </p>
                            </div>
                            <div className="flex-1 bg-gray-100 p-4 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-500 mb-1">Self Assessment</h5>
                              <p className="text-2xl font-bold">
                                {(feedbacks[selectedEmployee] || []).filter(f => f.reviewerType === 'self').length}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">Average Rating</span>
                              <span className="text-sm font-medium">
                                {(
                                  feedbacks[selectedEmployee].reduce((sum, feedback) => sum + feedback.rating, 0) / 
                                  feedbacks[selectedEmployee].length
                                ).toFixed(1)}
                                /5
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full bg-indigo-500"
                                style={{ 
                                  width: `${(feedbacks[selectedEmployee].reduce((sum, feedback) => sum + feedback.rating, 0) / 
                                  feedbacks[selectedEmployee].length) * 20}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No feedback collected yet
                        </div>
                      )}
                    </div>
                    
                    {/* Feedback Collection */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-lg">Feedback Details</h4>
                        <button
                          onClick={() => {
                            setNewFeedbackData({
                              rating: 3,
                              strengths: '',
                              improvements: '',
                              reviewerType: 'peer'
                            });
                            setShowFeedbackForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          + Add Feedback
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {(feedbacks[selectedEmployee] || []).map(feedback => (
                          <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center">
                                  <span className="font-semibold mr-2">
                                    {feedback.reviewerType === 'self' 
                                      ? 'Self Assessment' 
                                      : feedback.reviewerType === 'manager'
                                        ? 'Manager Review'
                                        : `Peer Review from ${employees.find(e => e.id === feedback.reviewerId)?.name || 'Unknown'}`}
                                  </span>
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    {feedback.submittedAt}
                                  </span>
                                </div>
                                <div className="flex items-center mt-1">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <svg 
                                        key={star}
                                        className={`w-4 h-4 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="ml-1 text-sm text-gray-600">{feedback.rating.toFixed(1)}/5.0</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              <div className="bg-green-50 p-3 rounded">
                                <h5 className="text-sm font-semibold text-green-800 mb-2">Strengths</h5>
                                <p className="text-sm text-gray-700 whitespace-pre-line">{feedback.strengths}</p>
                              </div>
                              <div className="bg-amber-50 p-3 rounded">
                                <h5 className="text-sm font-semibold text-amber-800 mb-2">Areas for Improvement</h5>
                                <p className="text-sm text-gray-700 whitespace-pre-line">{feedback.improvements}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {(feedbacks[selectedEmployee] || []).length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No feedback collected yet
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Feedback Form Modal */}
                    {showFeedbackForm && selectedEmployee && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                          <h3 className="text-lg font-semibold mb-4">
                            {newFeedbackData.reviewerType === 'self' 
                              ? 'Self Assessment'
                              : newFeedbackData.reviewerType === 'manager'
                                ? 'Manager Feedback'
                                : 'Peer Review'}
                          </h3>
                          
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            if (newFeedbackData.strengths && newFeedbackData.improvements) {
                              // For this demo, we'll use the current user as the reviewer
                              // In a real app, you'd use the logged-in user's ID
                              const reviewerId = newFeedbackData.reviewerType === 'self' 
                                ? selectedEmployee 
                                : 'current-user-id';
                              
                              handleNewFeedback(
                                selectedEmployee, 
                                reviewerId, 
                                newFeedbackData
                              );
                              setShowFeedbackForm(false);
                            }
                          }}>
                            <div className="space-y-6">
                              {newFeedbackData.reviewerType !== 'self' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Type</label>
                                  <select
                                    value={newFeedbackData.reviewerType}
                                    onChange={(e) => setNewFeedbackData({
                                      ...newFeedbackData, 
                                      reviewerType: e.target.value as 'peer' | 'manager' | 'self'
                                    })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  >
                                    <option value="peer">Peer</option>
                                    <option value="manager">Manager</option>
                                  </select>
                                </div>
                              )}
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Rating</label>
                                <div className="flex items-center">
                                  <input 
                                    type="range" 
                                    min="1" 
                                    max="5" 
                                    step="0.5"
                                    value={newFeedbackData.rating}
                                    onChange={(e) => setNewFeedbackData({
                                      ...newFeedbackData, 
                                      rating: parseFloat(e.target.value)
                                    })}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="ml-3 text-lg font-semibold">{newFeedbackData.rating.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Needs Improvement</span>
                                  <span>Outstanding</span>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const suggestions = await generateFeedbackSuggestions(selectedEmployee, 'strengths');
                                      if (suggestions) {
                                        setNewFeedbackData({
                                          ...newFeedbackData, 
                                          strengths: suggestions
                                        });
                                      }
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                                  >
                                    {aiSuggestionsLoading ? (
                                      <>
                                        <span className="mr-1">Generating...</span>
                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      </>
                                    ) : (
                                      <>
                                        <span className="mr-1">AI Suggestions</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                        </svg>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <textarea 
                                  value={newFeedbackData.strengths}
                                  onChange={(e) => setNewFeedbackData({
                                    ...newFeedbackData, 
                                    strengths: e.target.value
                                  })}
                                  required
                                  rows={5}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="List key strengths and accomplishments..."
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-1">Be specific with examples of behaviors and impact</p>
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Areas for Improvement</label>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const suggestions = await generateFeedbackSuggestions(selectedEmployee, 'improvements');
                                      if (suggestions) {
                                        setNewFeedbackData({
                                          ...newFeedbackData, 
                                          improvements: suggestions
                                        });
                                      }
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                                  >
                                    {aiSuggestionsLoading ? (
                                      <>
                                        <span className="mr-1">Generating...</span>
                                        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      </>
                                    ) : (
                                      <>
                                        <span className="mr-1">AI Suggestions</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                        </svg>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <textarea 
                                  value={newFeedbackData.improvements}
                                  onChange={(e) => setNewFeedbackData({
                                    ...newFeedbackData, 
                                    improvements: e.target.value
                                  })}
                                  required
                                  rows={5}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Suggest areas for growth and development..."
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-1">Focus on actionable feedback, not personality</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                              <button
                                type="button"
                                onClick={() => setShowFeedbackForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                              >
                                Submit Feedback
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Select an employee to view and provide feedback</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3: // Review Generation Stage
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Review Generation Stage</h3>
              <p className="text-gray-700">Compile performance data, generate review reports, and prepare improvement plans</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
          </div>
        );

      case 4: // Recognition & Rewards Stage
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Recognition & Rewards Stage</h3>
              <p className="text-gray-700">Calculate performance scores, recommend promotions/rewards, and generate recognition certificates</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
          </div>
        );

      default:
        return null;
    }
  };

  // Handle milestone completion toggle
  const handleMilestoneToggle = (employeeId: string, milestoneId: string) => {
    setEmployeeMilestones(prev => {
      const employeeMilestoneList = [...(prev[employeeId] || [])];
      const milestoneIndex = employeeMilestoneList.findIndex(m => m.id === milestoneId);
      
      if (milestoneIndex !== -1) {
        employeeMilestoneList[milestoneIndex] = {
          ...employeeMilestoneList[milestoneIndex],
          completed: !employeeMilestoneList[milestoneIndex].completed
        };
      }
      
      return {
        ...prev,
        [employeeId]: employeeMilestoneList
      };
    });

    // Update KPI progress based on milestone completion
    updateKPIProgress(employeeId);
  };

  // Update KPI progress based on completed milestones
  const updateKPIProgress = (employeeId: string) => {
    const milestones = employeeMilestones[employeeId] || [];
    const kpis = employeeKPIs[employeeId] || [];
    
    // Group milestones by KPI
    const milestonesByKPI: Record<string, Milestone[]> = {};
    milestones.forEach(milestone => {
      if (!milestonesByKPI[milestone.kpiId]) {
        milestonesByKPI[milestone.kpiId] = [];
      }
      milestonesByKPI[milestone.kpiId].push(milestone);
    });
    
    // Update progress for each KPI
    const updatedKPIs = kpis.map(kpi => {
      const kpiMilestones = milestonesByKPI[kpi.id] || [];
      if (kpiMilestones.length === 0) return kpi;
      
      const completedCount = kpiMilestones.filter(m => m.completed).length;
      const progress = Math.round((completedCount / kpiMilestones.length) * 100);
      
      // Determine status based on progress and due date
      let status: KPIStatus = kpi.status;
      if (progress === 100) {
        status = 'completed';
      } else {
        const today = new Date();
        const dueDate = new Date(kpi.dueDate);
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        if (daysRemaining < 7 && progress < 70) {
          status = 'at-risk';
        } else if (progress > 0) {
          status = 'in-progress';
        } else {
          status = 'not-started';
        }
      }
      
      return { ...kpi, progress, status };
    });
    
    setEmployeeKPIs(prev => ({
      ...prev,
      [employeeId]: updatedKPIs
    }));
  };

  // Add new achievement
  const handleNewAchievement = (employeeId: string, achievementData: { title: string; description: string; impact: string }) => {
    const newAchievement: Achievement = {
      id: Date.now().toString(),
      employeeId,
      title: achievementData.title,
      description: achievementData.description,
      date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      impact: achievementData.impact
    };
    
    setEmployeeAchievements(prev => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] || []), newAchievement]
    }));
  };

  // Add new KPI
  const handleNewKPI = (employeeId: string, kpiData: { title: string; description: string; target: string; dueDate: string }) => {
    const newKPI: KPI = {
      id: Date.now().toString(),
      title: kpiData.title,
      description: kpiData.description,
      target: kpiData.target,
      progress: 0,
      status: 'not-started',
      dueDate: kpiData.dueDate
    };
    
    setEmployeeKPIs(prev => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] || []), newKPI]
    }));
  };

  // Add new milestone
  const handleNewMilestone = (employeeId: string, milestoneData: { title: string; description: string; dueDate: string; kpiId: string }) => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: milestoneData.title,
      description: milestoneData.description,
      dueDate: milestoneData.dueDate,
      completed: false,
      kpiId: milestoneData.kpiId
    };
    
    setEmployeeMilestones(prev => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] || []), newMilestone]
    }));
  };

  // Generate AI feedback suggestions
  const generateFeedbackSuggestions = async (employeeId: string, reviewType: 'strengths' | 'improvements') => {
    if (!selectedEmployee) return;
    
    setAiSuggestionsLoading(true);
    
    try {
      const apiKey = "AIzaSyBAJ900aAaOo_SqIuneHq79VqofYyOyfNU";
      const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
      
      const employee = employees.find(e => e.id === employeeId);
      const currentEmployeeKPIs = employeeKPIs[employeeId] || [];
      const currentEmployeeMilestones = employeeMilestones[employeeId] || [];
      
      // Calculate some metrics for context
      const completedMilestones = currentEmployeeMilestones.filter(m => m.completed).length;
      const totalMilestones = currentEmployeeMilestones.length;
      const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
      const atRiskKPIs = currentEmployeeKPIs.filter(k => k.status === 'at-risk').length;
      
      // Create a detailed prompt with employee context
      const prompt = `
        Generate professional feedback for a performance review of an employee who is a ${employee?.position || 'professional'} in the ${employee?.department || 'organization'}.

        Context about the employee:
        - Position: ${employee?.position || 'Not specified'}
        - Department: ${employee?.department || 'Not specified'}
        - Milestone completion rate: ${completionRate.toFixed(0)}% (${completedMilestones} completed out of ${totalMilestones})
        - KPIs at risk: ${atRiskKPIs}
        
        ${currentEmployeeKPIs.length > 0 ? `Current KPIs: ${currentEmployeeKPIs.map(k => k.title).join(', ')}` : ''}
        ${currentEmployeeMilestones.length > 0 ? `Recent milestones: ${currentEmployeeMilestones.map(m => m.title).join(', ')}` : ''}

        I need detailed, specific feedback on ${reviewType === 'strengths' ? 'strengths and positive qualities' : 'areas for improvement and development opportunities'}.
        
        Format your response as a bulleted list with 4-5 points, each beginning with "• ".
        Each point should be specific, actionable, and professionally phrased.
        Each point should be 1-2 sentences long.
        Do NOT include any other text, introduction or conclusion.
      `;
      
      // Make the API call
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the generated text
      let suggestions = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Ensure the text is properly formatted with bullet points
      if (!suggestions.includes('•')) {
        suggestions = suggestions.split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => `• ${line.trim()}`)
          .join('\n');
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating feedback suggestions:', error);
      // Fallback suggestions
      return reviewType === 'strengths' 
        ? "• Shows good technical skills\n• Works well with the team\n• Delivers consistently\n• Shows initiative in problem-solving"
        : "• Could improve communication\n• Should focus on documentation\n• Would benefit from more collaboration\n• Consider deeper domain learning";
    } finally {
      setAiSuggestionsLoading(false);
    }
  };
  
  // Handle new feedback submission
  const handleNewFeedback = (employeeId: string, reviewerId: string, feedbackData: {
    rating: number;
    strengths: string;
    improvements: string;
    reviewerType: 'peer' | 'manager' | 'self';
  }) => {
    const newFeedback = {
      id: Date.now().toString(),
      employeeId,
      reviewerId,
      reviewerType: feedbackData.reviewerType,
      rating: feedbackData.rating,
      strengths: feedbackData.strengths,
      improvements: feedbackData.improvements,
      submittedAt: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
    };
    
    setFeedbacks(prev => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] || []), newFeedback]
    }));
  };

  // Add the handleLeaveStage function
  const handleLeaveStage = () => {
    if (leaveStage < 4) {
      setLeaveStage(leaveStage + 1);
    }
  };

  // Add the handleNewLeaveRequest function
  const handleNewLeaveRequest = () => {
    if (!newLeaveRequest.employeeId || !newLeaveRequest.startDate || !newLeaveRequest.endDate) {
      return;
    }
    
    // Calculate duration (simple implementation - could be enhanced for working days only)
    const start = new Date(newLeaveRequest.startDate);
    const end = new Date(newLeaveRequest.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const request: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: newLeaveRequest.employeeId,
      type: newLeaveRequest.type,
      startDate: newLeaveRequest.startDate,
      endDate: newLeaveRequest.endDate,
      duration: diffDays,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0]
    };
    
    setLeaveRequests([...leaveRequests, request]);
    
    // Reset form
    setNewLeaveRequest({
      employeeId: '',
      type: 'vacation',
      startDate: '',
      endDate: ''
    });
    
    setShowLeaveForm(false);
  };

  // Add the handleLeaveAction function
  const handleLeaveAction = (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    setLeaveRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        // If approved, update leave balance
        if (action === 'approve' && request.status === 'pending') {
          setLeaveBalances(prev => prev.map(balance => {
            if (balance.employeeId === request.employeeId) {
              const updatedBalance = { ...balance };
              if (request.type === 'vacation') {
                updatedBalance.vacation -= request.duration;
              } else if (request.type === 'sick') {
                updatedBalance.sick -= request.duration;
              } else if (request.type === 'personal') {
                updatedBalance.personal -= request.duration;
              }
              return updatedBalance;
            }
            return balance;
          }));
        }
        
        return {
          ...request,
          status: action === 'approve' ? 'approved' : 'rejected',
          approverNotes: notes
        };
      }
      return request;
    }));
  };

  // Add a function to get employee leave balance
  const getEmployeeLeaveBalance = (employeeId: string): LeaveBalance | undefined => {
    return leaveBalances.find(balance => balance.employeeId === employeeId);
  };

  // Add the renderLeaveContent function
  const renderLeaveContent = () => {
    switch (leaveStage) {
      case 0: // Leave Request Stage
        return (
          <div className="space-y-8">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-700 mb-2">Leave Request Dashboard</h3>
              <p className="text-gray-700">Submit and manage time off requests with intelligent coverage analysis</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Employee selection sidebar */}
              <div className="md:w-1/3">
                <h3 className="text-lg font-semibold mb-4">Select Employee</h3>
                <div className="space-y-3">
                  {employees.map(employee => (
                    <div 
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee.id)}
                      className={`p-4 rounded-lg cursor-pointer ${
                        selectedEmployee === employee.id 
                          ? 'bg-indigo-100 border border-indigo-300' 
                          : 'bg-white border border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{employee.avatar}</div>
                        <div>
                          <h4 className="font-semibold">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                          <p className="text-xs text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Leave management area */}
              <div className="md:w-2/3">
                {selectedEmployee ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {employees.find(e => e.id === selectedEmployee)?.name}'s Leave Management
                      </h3>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setNewLeaveRequest({
                              ...newLeaveRequest,
                              employeeId: selectedEmployee
                            });
                            setShowLeaveForm(true);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Request Leave
                        </button>
                        <button
                          onClick={() => handleLeaveStage()}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Next Stage
                        </button>
                      </div>
                    </div>
                    
                    {/* Leave Balance */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-lg mb-4">Leave Balance</h4>
                      
                      {getEmployeeLeaveBalance(selectedEmployee) ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <h5 className="text-sm font-medium text-gray-500 mb-1">Vacation</h5>
                            <p className="text-2xl font-bold text-blue-600">
                              {getEmployeeLeaveBalance(selectedEmployee)?.vacation || 0}
                            </p>
                            <p className="text-xs text-gray-500">days remaining</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg text-center">
                            <h5 className="text-sm font-medium text-gray-500 mb-1">Sick Leave</h5>
                            <p className="text-2xl font-bold text-green-600">
                              {getEmployeeLeaveBalance(selectedEmployee)?.sick || 0}
                            </p>
                            <p className="text-xs text-gray-500">days remaining</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg text-center">
                            <h5 className="text-sm font-medium text-gray-500 mb-1">Personal</h5>
                            <p className="text-2xl font-bold text-purple-600">
                              {getEmployeeLeaveBalance(selectedEmployee)?.personal || 0}
                            </p>
                            <p className="text-xs text-gray-500">days remaining</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No leave balance information available
                        </div>
                      )}
                    </div>
                    
                    {/* Leave Requests */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="font-semibold text-lg mb-4">Leave Requests</h4>
                      
                      <div className="space-y-4">
                        {leaveRequests.filter(request => request.employeeId === selectedEmployee).length > 0 ? (
                          leaveRequests
                            .filter(request => request.employeeId === selectedEmployee)
                            .map(request => (
                              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center">
                                      <span className="font-semibold capitalize">{request.type} Leave</span>
                                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {request.status}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {request.startDate} to {request.endDate} ({request.duration} days)
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Requested on {request.requestDate}
                                    </p>
                                    {request.approverNotes && (
                                      <p className="text-sm italic mt-2 text-gray-600">
                                        Note: {request.approverNotes}
                                      </p>
                                    )}
                                  </div>
                                  {request.status === 'pending' && (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleLeaveAction(request.id, 'approve')}
                                        className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-medium"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleLeaveAction(request.id, 'reject')}
                                        className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-medium"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No leave requests found
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Leave Request Form Modal */}
                    {showLeaveForm && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                          <h3 className="text-lg font-semibold mb-4">Request Leave</h3>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            handleNewLeaveRequest();
                          }}>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                <select
                                  value={newLeaveRequest.type}
                                  onChange={(e) => setNewLeaveRequest({
                                    ...newLeaveRequest,
                                    type: e.target.value as any
                                  })}
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                  <option value="vacation">Vacation</option>
                                  <option value="sick">Sick Leave</option>
                                  <option value="personal">Personal Leave</option>
                                  <option value="parental">Parental Leave</option>
                                  <option value="bereavement">Bereavement</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={newLeaveRequest.startDate}
                                  onChange={(e) => setNewLeaveRequest({
                                    ...newLeaveRequest,
                                    startDate: e.target.value
                                  })}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={newLeaveRequest.endDate}
                                  onChange={(e) => setNewLeaveRequest({
                                    ...newLeaveRequest,
                                    endDate: e.target.value
                                  })}
                                  required
                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                              <button
                                type="button"
                                onClick={() => setShowLeaveForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                              >
                                Submit Request
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Select an employee to manage leave requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      // Add cases for the other leave management stages  
      case 1: // Coverage Analysis
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Team Coverage Analysis</h3>
              <p className="text-gray-700">AI-powered analysis of team availability and workload impact</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
            
            <button
              onClick={() => handleLeaveStage()}
              className="mx-auto block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Next Stage
            </button>
          </div>
        );
        
      case 2: // Approval Process
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Approval Workflow</h3>
              <p className="text-gray-700">Rule-based approval routing and policy compliance checks</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
            
            <button
              onClick={() => handleLeaveStage()}
              className="mx-auto block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Next Stage
            </button>
          </div>
        );
        
      case 3: // Calendar Integration
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Calendar Integration</h3>
              <p className="text-gray-700">Automatic updates to team calendars and work systems</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
            
            <button
              onClick={() => handleLeaveStage()}
              className="mx-auto block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Next Stage
            </button>
          </div>
        );
        
      case 4: // Leave Tracking
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Leave Analytics</h3>
              <p className="text-gray-700">Advanced reporting and predictive staffing insights</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static z-20 h-full w-64 bg-gradient-to-b from-blue-700 to-blue-900 text-white transition-transform duration-300 ease-in-out transform shadow-lg`}>
        <div className="p-4 border-b border-blue-600">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6" />
            <h1 className="text-xl font-semibold">Project Bolt</h1>
          </div>
          <p className="text-sm text-blue-200 mt-1">AI-Powered HR Management</p>
        </div>
        
        <div className="p-4">
          <h2 className="text-sm uppercase tracking-wider text-blue-300 mb-3">Agents</h2>
          <div className="space-y-1">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent.id);
                  setCurrentStage(0);
                  setShowSidebar(false);
                }}
                className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                  selectedAgent === agent.id 
                    ? 'bg-blue-800 text-white' 
                    : 'text-blue-100 hover:bg-blue-800/50'
                }`}
              >
                {agent.icon}
                <span>{agent.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {selectedAgentData ? selectedAgentData.name : 'Dashboard'}
              </h1>
            </div>
            <div>
              <span className="text-sm text-gray-500">Welcome, Admin</span>
            </div>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;