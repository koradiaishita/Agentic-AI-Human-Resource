import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Users, UserCheck, Award, BookOpen, DollarSign, Building2, Menu, X, Bot, FileText, CheckCircle2, XCircle, Calendar, MessageSquare, UserPlus, Target, LineChart as ChartLineUp, GraduationCap, BadgeCheck, PartyPopper, ScrollText, Scale, HeartHandshake, Gauge, Trophy, AlertCircle, Upload, Video } from 'lucide-react';
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
    // In a real implementation, this would be an API key stored in environment variables
    // const API_KEY = process.env.GEMINI_API_KEY;
    
    // Create the prompt for Gemini
    const prompt = `You are an expert technical interviewer for a ${role} position.
    Generate 4 insightful interview questions that will help assess the candidate's technical skills, problem-solving abilities, and cultural fit.
    The questions should be specific to the ${role} role and help evaluate their expertise.
    Return just the questions without any additional text, numbered 1-4.`;
    
    // For demo purposes, we'll simulate the API call with a delay
    // In a real implementation, this would be an actual API call to Gemini
    // const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     contents: [{ parts: [{ text: prompt }] }],
    //     generationConfig: {
    //       temperature: 0.7,
    //       maxOutputTokens: 500,
    //     }
    //   })
    // });
    // const data = await response.json();
    // const generatedQuestions = data.candidates[0].content.parts[0].text.split('\n').filter(q => q.trim().length > 0);
    
    // Simulate a delay for the API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate response from Gemini based on role
    const roleSpecificQuestions: Record<string, string[]> = {
      "Software Engineer": [
        "Describe how you would design a scalable microservice architecture for a high-traffic e-commerce platform.",
        "How would you implement a system that requires both consistency and high availability? What trade-offs would you make?", 
        "Explain how you approach testing in your development process, from unit tests to integration tests.",
        "How do you ensure the security of the applications you develop?"
      ],
      "Data Scientist": [
        "How would you approach building a recommendation system for a content streaming platform?",
        "Describe a time when you had to balance model accuracy with computational efficiency.",
        "How would you detect and handle outliers in a dataset with millions of records?",
        "Explain how you would build and deploy a machine learning model in a production environment."
      ],
      "UX Designer": [
        "How do you approach designing for accessibility while maintaining aesthetic appeal?",
        "Describe your process for conducting user research before beginning a design project.",
        "How do you measure the success of a user interface design after implementation?",
        "What strategies do you use to convince stakeholders when your research contradicts their assumptions?"
      ],
      "Project Manager": [
        "How do you prioritize tasks when all stakeholders believe their requirements are high priority?",
        "Describe how you would recover a project that's significantly behind schedule.",
        "How do you manage communication between technical and non-technical team members?",
        "What metrics do you use to track project health and success?"
      ],
      "Marketing Specialist": [
        "How would you develop a content strategy for a new product launch?",
        "Describe how you would measure ROI across different marketing channels.",
        "How do you stay compliant with privacy regulations while maximizing marketing effectiveness?",
        "What approach would you take to revitalize a marketing campaign that isn't meeting its goals?"
      ]
    };
    
    // Default questions if role not found
    const defaultQuestions = [
      "What are your strategies for continuous professional development?",
      "How do you approach learning new technologies or methodologies?",
      "Describe your ideal team culture and working environment.",
      "What leadership qualities do you think are most important for success in this field?"
    ];
    
    return roleSpecificQuestions[role] || defaultQuestions;
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
    switch (currentStage) {
      case 0:
        return (
          <div className="mb-8">
            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-indigo-600">Drop the resumes here...</p>
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
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>{file.name}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleProcessStage}
                  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
            <h3 className="text-xl font-semibold">ATS Screening Results</h3>
            {Object.entries(candidates).map(([id, candidate]) => (
              <div key={id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold">{candidate.name}</h4>
                    <p className="text-gray-600">{candidate.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">{candidate.score}%</div>
                    <div className="text-sm text-gray-500">Match Score</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setSelectedCandidate(id);
                      handleProcessStage();
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
            <h3 className="text-xl font-semibold">Video Interview</h3>
            {selectedCandidate && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-lg font-semibold">{candidates[selectedCandidate].name}</h4>
                    <p className="text-gray-600">{candidates[selectedCandidate].role}</p>
                  </div>
                  <Video className="w-6 h-6 text-indigo-600" />
                </div>
                
                {interviewSummary ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold mb-2">Interview Summary</h5>
                      <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: interviewSummary }}></div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          handleCandidateAction(selectedCandidate, 'accept');
                          handleProcessStage();
                          setInterviewSummary(null);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Accept Candidate
                      </button>
                      <button
                        onClick={() => {
                          handleCandidateAction(selectedCandidate, 'reject');
                          handleProcessStage();
                          setInterviewSummary(null);
                        }}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject Candidate
                      </button>
                    </div>
                  </div>
                ) : (
                <button
                  onClick={() => setShowVideoInterview(true)}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Video Interview
                </button>
                )}
              </div>
            )}
            {showVideoInterview && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Video Interview</h3>
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
            <h3 className="text-xl font-semibold">Interview Assessment</h3>
            {selectedCandidate && (
              <div className="bg-white p-6 rounded-lg shadow-md">
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
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Accept Candidate
                  </button>
                  <button
                    onClick={() => {
                      handleCandidateAction(selectedCandidate, 'reject');
                      handleProcessStage();
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
            <h3 className="text-xl font-semibold">Onboarding</h3>
            {selectedCandidate && candidates[selectedCandidate].status === 'accept' && !offerLetterSent && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                    Offer Letter
                  </div>
                </div>
                
                <div className="border border-gray-200 p-6 rounded-lg mb-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold">OFFER LETTER</h3>
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
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Performance Tracking Stage</h3>
              <p className="text-gray-700">Monitor KPIs, track milestones, and record achievements</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
          </div>
        );

      case 2: // Feedback Collection Stage
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-indigo-700">Feedback Collection Stage</h3>
              <p className="text-gray-700">Gather peer reviews, collect manager feedback, and process self-assessments</p>
            </div>
            <p className="text-center text-gray-600">This stage is under development</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8" />
              <h1 className="text-2xl font-bold">HR Agentic AI Platform</h1>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <nav className={`lg:w-1/4 ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">AI Agents</h2>
              <div className="space-y-2">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      selectedAgent === agent.id
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {agent.icon}
                    <span>{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <main className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                {selectedAgentData?.icon}
                <h2 className="text-2xl font-bold">{selectedAgentData?.name}</h2>
              </div>
              
              <p className="text-gray-600 mb-8">{selectedAgentData?.description}</p>

              {selectedAgent === 'recruitment' && renderRecruitmentContent()}
              {selectedAgent === 'performance' && renderPerformanceContent()}

              <div className="space-y-6">
                {selectedAgentData?.workflow.map((stage, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg p-6 ${
                      selectedAgent === 'recruitment' 
                        ? getStageColor(stage.status) 
                        : selectedAgent === 'performance'
                          ? (index === performanceStage 
                              ? 'bg-blue-100 text-blue-800'
                              : index < performanceStage
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800')
                        : 'bg-indigo-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      {stage.icon}
                      <h3 className="text-lg font-semibold">{stage.stage}</h3>
                      {selectedAgent === 'recruitment' && stage.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                      {selectedAgent === 'performance' && index < performanceStage && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                    </div>
                    <ul className="space-y-3 ml-8">
                      {stage.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-current rounded-full"></div>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Agent Status</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600">Active and ready to assist</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;