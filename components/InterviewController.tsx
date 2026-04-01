
import React, { useState, useEffect } from 'react';
import type { User } from '@firebase/auth';
import { generateDeterministicQuestion, evaluateAnswerNumeric, pickNextSkill, updateSkillState, INITIAL_SKILLS } from '../services/ollamaService';
import type { InterviewConfig, SkillState, QuestionAndAnswer } from '../types';
import { useSpeech } from '../hooks/useSpeechRecognition';
import { TargetIcon, PerformanceIcon, ClockIcon, CheckIcon, TrendingDownIcon, MicIcon, StopIcon } from './icons';

const TOTAL_QUESTIONS = 7;

export const InterviewController = ({ user }: { user: User }) => {
    const [pageState, setPageState] = useState<'setup' | 'session' | 'results'>('setup');
    const [config, setConfig] = useState<InterviewConfig>({ jobRole: '', interviewType: 'Technical' });
    const [skills, setSkills] = useState<SkillState[]>(INITIAL_SKILLS);
    const [qnaHistory, setQnaHistory] = useState<QuestionAndAnswer[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [activeSkill, setActiveSkill] = useState("");
    const [requiresCode, setRequiresCode] = useState(false);
    const [codeValue, setCodeValue] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    
    const { isListening, transcript, startListening, stopListening, speak, setTranscript } = useSpeech();

    const startInterview = async () => {
        setPageState('session');
        await nextTurn(INITIAL_SKILLS);
    };

    const nextTurn = async (currentSkills: SkillState[]) => {
        setIsEvaluating(true);
        const skill = pickNextSkill(currentSkills);
        setActiveSkill(skill);
        const skillState = currentSkills.find(s => s.name === skill)!;
        
        const { question, requiresCode: nextRequiresCode } = await generateDeterministicQuestion(config.jobRole, skill, skillState.confidence);
        
        setCurrentQuestion(question);
        setRequiresCode(nextRequiresCode);
        setCodeValue("");
        setIsEvaluating(false);
        
        speak(question, () => {
            startListening();
        });
    };

    const handleSubmitAnswer = async () => {
        stopListening();
        setIsEvaluating(true);
        
        const { score, feedback } = await evaluateAnswerNumeric(currentQuestion, transcript, requiresCode ? codeValue : undefined);
        
        const updatedSkills = updateSkillState(skills, activeSkill, score);
        setSkills(updatedSkills);
        
        setQnaHistory(prev => [...prev, {
            question: currentQuestion,
            answer: transcript,
            skillEvaluated: activeSkill,
            score: feedback.score, // Use display score 0-10 for history
            feedback: feedback,
            requiresCode: requiresCode,
            code: requiresCode ? codeValue : undefined
        }]);

        setTranscript('');
        
        if (qnaHistory.length + 1 >= TOTAL_QUESTIONS) {
            setPageState('results');
        } else {
            await nextTurn(updatedSkills);
        }
    };

    // Calculate overall score from normalized skill confidence
    const getOverallScore = () => {
        const sumConfidence = skills.reduce((acc, s) => acc + s.confidence, 0);
        return Math.round((sumConfidence / skills.length) * 100);
    };

    if (pageState === 'setup') {
        return (
            <div className="w-full max-w-2xl mx-auto bg-white p-10 rounded-[2rem] border border-gray-200 shadow-xl">
                <h2 className="text-3xl font-black text-gray-900 mb-6">Setup Interview</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Target Job Role</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Security Guard, Software Engineer..." 
                            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                            value={config.jobRole}
                            onChange={(e) => setConfig({...config, jobRole: e.target.value})}
                        />
                    </div>
                    <button 
                        onClick={startInterview}
                        disabled={!config.jobRole}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-gray-200 transition-all"
                    >
                        Initialize Adaptive Engine
                    </button>
                </div>
            </div>
        );
    }

    if (pageState === 'session') {
        return (
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {skills.map(s => (
                        <div key={s.name} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-2">{s.name}</p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${s.confidence * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-[9px] font-bold text-gray-400">Uncertainty: {Math.round(s.uncertainty * 100)}%</span>
                                <span className="text-[9px] font-black text-indigo-600">{Math.round(s.confidence * 100)}%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-200 shadow-2xl flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <TargetIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">{currentQuestion}</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Input Area */}
                        <div className={`flex-grow space-y-4 ${requiresCode ? 'md:w-1/2' : 'w-full'}`}>
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Verbal Response</label>
                                <button 
                                    onClick={() => isListening ? stopListening() : startListening()}
                                    className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {isListening ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="w-full min-h-[120px] bg-gray-50 rounded-2xl p-6 italic text-gray-600 border border-gray-100 shadow-inner text-sm leading-relaxed">
                                {transcript || "Recording your verbal signals..."}
                            </div>
                        </div>

                        {/* Optional Code Area */}
                        {requiresCode && (
                            <div className="md:w-1/2 space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Code Implementation</label>
                                <textarea 
                                    value={codeValue}
                                    onChange={(e) => setCodeValue(e.target.value)}
                                    placeholder="// Write your code solution here..."
                                    className="w-full h-[180px] p-6 bg-[#1e1e1e] text-green-400 font-mono text-xs rounded-2xl border border-gray-700 shadow-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center pt-4 border-t border-gray-100">
                        <button 
                            onClick={handleSubmitAnswer}
                            disabled={isEvaluating || (!transcript && !codeValue)}
                            className="group px-12 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:bg-gray-300 disabled:shadow-none disabled:translate-y-0"
                        >
                            {isEvaluating ? (
                                <span className="flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 animate-spin" />
                                    Calibrating...
                                </span>
                            ) : "Submit Answer"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white p-12 rounded-[3rem] border border-gray-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold text-green-700 bg-green-50 rounded-full">
                    <CheckIcon className="w-4 h-4" />
                    Assessment Complete
                </div>
                <h2 className="text-5xl font-black text-gray-900 mb-4">{getOverallScore()}%</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Final Confidence Level</p>
            </div>

            <div className="space-y-6 mb-12">
                {skills.map(s => (
                    <div key={s.name} className="flex items-center gap-6">
                        <div className="w-36 text-[11px] font-black text-gray-400 uppercase">{s.name}</div>
                        <div className="flex-grow bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${s.confidence * 100}%` }}></div>
                        </div>
                        <div className="w-16 text-right font-black text-gray-900">{Math.round(s.confidence * 100)}%</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                    onClick={() => setPageState('setup')}
                    className="py-5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl"
                >
                    Reset Interview
                </button>
                <button 
                    onClick={() => window.location.reload()}
                    className="py-5 bg-white text-indigo-600 border-2 border-indigo-100 font-bold rounded-2xl hover:border-indigo-600 transition-all"
                >
                    Save Results
                </button>
            </div>
        </div>
    );
};
