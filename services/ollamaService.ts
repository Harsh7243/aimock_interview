
import type { Difficulty, InterviewType, Feedback, ResumeAnalysis, SkillState } from "../types";

// PROXY_URL points to our Vercel Serverless Function
const PROXY_URL = "/api/proxy";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const VISION_MODEL = "google/gemini-2.0-flash-001"; 

/**
 * Clean and parse JSON from AI response
 */
const parseAIJSON = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse AI JSON:", text);
    throw new Error("Invalid response format from AI");
  }
};

/**
 * Call our secure backend proxy instead of OpenRouter directly.
 */
const callOpenRouter = async (messages: any[], model: string = DEFAULT_MODEL, responseFormat?: any, maxTokens: number = 4000) => {
  const body: any = {
    model,
    messages,
    max_tokens: maxTokens,
    response_format: responseFormat || { type: "json_object" }
  };

  // Only add plugins if there's a file in the messages
  const hasFile = messages.some(m => 
    Array.isArray(m.content) && m.content.some((c: any) => c.type === "file")
  );

  if (hasFile) {
    body.plugins = [
      {
        id: "file-parser",
        pdf: { engine: "native" }
      }
    ];
  }

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Proxy API error:", errorData);
    const errorMessage = errorData.error?.message || errorData.error || response.statusText;
    throw new Error(`AI Service error: ${errorMessage}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
};

// --- DETERMINISTIC UTILS ---

/**
 * Checks if a job role typically requires a code editor.
 */
const isCodeCentricRole = (role: string): boolean => {
  const codeKeywords = [
    'software', 'developer', 'engineer', 'programmer', 'coder', 'web', 'frontend', 
    'backend', 'fullstack', 'data scientist', 'data engineer', 'devops', 'embedded', 'react', 'javascript', 'python'
  ];
  const r = role.toLowerCase();
  return codeKeywords.some(kw => r.includes(kw));
};

// --- INTERVIEW ENGINE ---

export const generateQuestion = async (
  jobRole: string,
  interviewType: InterviewType,
  difficulty: Difficulty,
  questionNumber: number,
  previousQuestions: string[],
  resumeData?: { base64: string, mimeType: string },
  forceCoding?: boolean
): Promise<{ question: string, requiresCode: boolean, difficulty: Difficulty }> => {
  const isTechRole = isCodeCentricRole(jobRole);

  let prompt = `You are an expert interviewer. Generate question #${questionNumber} for a ${difficulty} level ${interviewType} interview for the role of ${jobRole}.
               Avoid these previous questions: ${previousQuestions.join(', ') || 'None'}.
               The role ${isTechRole ? 'is' : 'is NOT'} code-centric.
               ${forceCoding === true ? 'CRITICAL: This MUST be a coding question. Ask the candidate to implement a solution to a problem.' : 
                 forceCoding === false ? 'CRITICAL: This MUST be a conceptual/verbal question. DO NOT ask for code.' :
                 'MIX MODALITIES: Most technical questions should be conceptual (verbal). Only 1 in 3 should be coding-based.'}
               Return the response in JSON format with these fields:
               - question: string
               - requiresCode: boolean (Set to true if and only if the role is technical and this specifically requires writing code. Most questions should be verbal.)
               - difficulty: string (enum: ["easy", "medium", "hard"])`;

  const messages: any[] = [
    { role: "system", content: "You are an expert interviewer. You must respond strictly in JSON format." },
    { role: "user", content: [] }
  ];

  const userContent: any[] = [{ type: "text", text: prompt }];

  if (resumeData) {
    if (resumeData.mimeType === "application/pdf") {
      userContent.push({
        type: "file",
        file: {
          filename: "resume.pdf",
          file_data: `data:${resumeData.mimeType};base64,${resumeData.base64}`
        }
      });
    } else {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${resumeData.mimeType};base64,${resumeData.base64}`
        }
      });
    }
    
    userContent[0].text += `\nCRITICAL: The candidate has provided a resume. Your PRIMARY GOAL is to verify the claims made in the resume and test the candidate's authenticity. 
               Ask questions that probe specific experiences, projects, or skills mentioned in the resume to ensure they actually performed the work.`;
  }

  messages[1].content = userContent;

  try {
    const content = await callOpenRouter(messages, resumeData ? VISION_MODEL : DEFAULT_MODEL);
    const res = parseAIJSON(content);
    
    // Apply logic overrides
    if (forceCoding !== undefined) {
      res.requiresCode = forceCoding;
    } else {
      if (!isTechRole) res.requiresCode = false;
      if (questionNumber === 1 || questionNumber > 8) res.requiresCode = false;
    }
    
    return res;
  } catch (e) {
    console.error("Generate question error:", e);
    return { 
      question: `Could you describe your experience as a ${jobRole}?`, 
      requiresCode: forceCoding || false, 
      difficulty: "medium" 
    };
  }
};

export const evaluateAnswer = async (
  question: string,
  answer: string,
  difficulty: Difficulty,
  code?: string,
  duration?: number
): Promise<Feedback> => {
  const isSkipped = answer === "Skipped by user." || answer === "Skipped.";

  const prompt = `Evaluate the following interview response:
                 Difficulty: ${difficulty}
                 Question: ${question}
                 User's Answer: ${answer}
                 ${code ? `User's Code: ${code}` : ''}
                 Time taken: ${duration || 'unknown'} seconds.
                 
                 If the answer is "Skipped by user." or "Skipped", give a low score and identify exactly what concepts were missed in 'brushUpTopics'.
                 If the answer is incorrect or weak, identify exactly which concepts were missing and list them in 'brushUpTopics'.
                 Provide scores strictly between 0 and 10.
                 CRITICAL: Be detailed and objective in strengths, weaknesses, and suggestions. Provide at least 2-3 specific points for each.

                 Return the response in JSON format with these fields:
                 - score: number (0 to 10)
                 - strengths: string
                 - weaknesses: string
                 - suggestions: string
                 - brushUpTopics: string[] (A list of specific technical or behavioral topics the user should study)
                 - difficultyNext: string ("easy", "medium", or "hard")
                 - technicalKnowledge: number (0 to 10)
                 - problemSolving: number (0 to 10)
                 - communication: number (0 to 10)
                 - clarity: number (0 to 10)`;

  const messages = [
    { role: "system", content: "You are an expert interviewer. You must respond strictly in JSON format." },
    { role: "user", content: prompt }
  ];

  try {
    const content = await callOpenRouter(messages, DEFAULT_MODEL);
    const res = parseAIJSON(content);
    res.score = Math.max(0, Math.min(10, res.score));
    return res;
  } catch (e: any) {
    console.error("Evaluation error:", e);
    return {
      score: isSkipped ? 0 : 5,
      strengths: isSkipped ? "None (Skipped)" : "Provided a basic response.",
      weaknesses: isSkipped ? "User chose to skip the question." : `Evaluation service experienced a slight delay: ${e.message}`,
      suggestions: isSkipped ? "Try to attempt every question, even if briefly." : "Please check the results page for overall performance.",
      brushUpTopics: ["General Topic Refinement"],
      difficultyNext: "medium",
      technicalKnowledge: isSkipped ? 0 : 5,
      problemSolving: isSkipped ? 0 : 5,
      communication: isSkipped ? 0 : 5,
      clarity: isSkipped ? 0 : 5
    };
  }
};

export const analyzeResume = async (fileBase64: string, mimeType: string, jobDescription?: string): Promise<ResumeAnalysis> => {
  const messages = [
    { role: "system", content: "You are an expert resume analyzer. You must respond strictly in JSON format." },
    {
      role: "user",
      content: [
        { type: "text", text: `Analyze this resume against the following job target: ${jobDescription || "Professional role"}. 
          Return strictly JSON with the following structure:
          - jobTargetAlignment: { summary: string, semanticScore: number (0-100), explanation: string }
          - impactAnalysis: { gaps: string[], lowImpactBullets: string[], quantificationPriority: string[] }
          - skillGapAnalysis: { missingCritical: string[], unsupportedClaims: string[], overloadedSections: string[], skillClassification: { core: string[], supporting: string[], optional: string[] } }
          - structureAndScan: { findings: string[], reorderingSuggestions: string[], densityEvaluation: string }
          - languageEnhancement: { criticalImprovements: string[], toneShiftSuggestions: string, atsMitigationSteps: string[] }
          - interviewBridging: { likelyQuestions: string[], challengePoints: string[], evidenceNeeds: string[] }
          - riskLevel: string
          - priorityActionSteps: string[]` 
        },
        mimeType === "application/pdf" ? { 
          type: "file", 
          file: {
            filename: "resume.pdf",
            file_data: `data:${mimeType};base64,${fileBase64}`
          }
        } : {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${fileBase64}`
          }
        }
      ]
    }
  ];

  try {
    const content = await callOpenRouter(messages, VISION_MODEL);
    return parseAIJSON(content);
  } catch (e) {
    console.error("Analyze resume error:", e);
    throw e;
  }
};

// --- ADAPTIVE INTERVIEW UTILS ---

export const INITIAL_SKILLS: SkillState[] = [
  { name: 'Technical Knowledge', confidence: 0.5, uncertainty: 0.5, history: [] },
  { name: 'Problem Solving', confidence: 0.5, uncertainty: 0.5, history: [] },
  { name: 'Communication', confidence: 0.5, uncertainty: 0.5, history: [] },
  { name: 'Clarity', confidence: 0.5, uncertainty: 0.5, history: [] }
];

export const pickNextSkill = (skills: SkillState[]): string => {
  return [...skills].sort((a, b) => b.uncertainty - a.uncertainty || a.confidence - b.confidence)[0].name;
};

export const updateSkillState = (skills: SkillState[], skillName: string, score: number): SkillState[] => {
  return skills.map(s => {
    if (s.name === skillName) {
      const normalizedScore = score / 10;
      const newHistory = [...s.history, normalizedScore];
      const newConfidence = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
      return {
        ...s,
        history: newHistory,
        confidence: newConfidence,
        uncertainty: Math.max(0.1, s.uncertainty * 0.8)
      };
    }
    return s;
  });
};

export const generateDeterministicQuestion = async (
  jobRole: string,
  skill: string,
  confidence: number,
  forceCoding?: boolean
): Promise<{ question: string, requiresCode: boolean }> => {
  const isTechRole = isCodeCentricRole(jobRole);
  const prompt = `Generate an interview question for a ${jobRole} role specifically testing '${skill}'. 
               The candidate's current estimated confidence in this skill is ${Math.round(confidence * 100)}%. 
               ${forceCoding === true ? 'CRITICAL: This MUST be a coding question. Ask the candidate to implement a solution.' : 
                 forceCoding === false ? 'CRITICAL: This MUST be a conceptual/verbal question. DO NOT ask for code.' :
                 'If it\'s technical, you may occasionally require code.'}
               Return JSON with 'question' and 'requiresCode'.`;

  const messages = [
    { role: "system", content: "You are an expert interviewer. You must respond strictly in JSON format." },
    { role: "user", content: prompt }
  ];

  try {
    const content = await callOpenRouter(messages, DEFAULT_MODEL);
    const res = JSON.parse(content);
    if (forceCoding !== undefined) {
        res.requiresCode = forceCoding;
    } else {
        if (!isTechRole) res.requiresCode = false;
    }
    return res;
  } catch (e) {
    console.error("Generate deterministic question error:", e);
    return { question: `How do you approach ${skill} in your daily work as a ${jobRole}?`, requiresCode: forceCoding || false };
  }
};

export const evaluateAnswerNumeric = async (
  question: string,
  answer: string,
  code?: string
): Promise<{ score: number, feedback: Feedback }> => {
  const feedback = await evaluateAnswer(question, answer, "medium", code);
  return {
    score: feedback.score,
    feedback: feedback
  };
};
