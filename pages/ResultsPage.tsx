import React, { useState, useEffect } from 'react';
import type { User } from '@firebase/auth';
import { saveInterviewSession } from '../services/firebase';
import type { QuestionAndAnswer, InterviewSession, InterviewConfig } from '../types';
import { SparkIcon, AwardIcon, TargetIcon, PerformanceIcon, ClockIcon, CheckIcon, TrendingDownIcon, RefreshIcon } from '../components/icons';

interface ResultsPageProps {
    user: User;
    navigate: (path: string) => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ user, navigate }) => {
    const [sessionData, setSessionData] = useState<QuestionAndAnswer[] | null>(null);
    const [config, setConfig] = useState<InterviewConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [skillScores, setSkillScores] = useState({
        technicalKnowledge: 0,
        problemSolving: 0,
        communication: 0,
        clarity: 0,
    });
    const [performanceData, setPerformanceData] = useState({
        title: '',
        description: '',
        colorClass: 'text-blue-600',
        icon: <PerformanceIcon className="w-8 h-8 text-blue-600" />
    });

    const answeredQuestions = sessionData?.filter(qna => qna.feedback) || [];
    const overallScore = answeredQuestions.length > 0 ? answeredQuestions.reduce((acc, qna) => acc + (qna.feedback?.score || 0), 0) / answeredQuestions.length : 0;
    const overallScore100 = Math.round(overallScore * 10);

    useEffect(() => {
        const storedResults = sessionStorage.getItem('interviewResults');
        const storedConfig = sessionStorage.getItem('interviewConfig');

        if (!storedResults || !storedConfig) {
            navigate('/pre-interview');
            return;
        }
        setSessionData(JSON.parse(storedResults));
        setConfig(JSON.parse(storedConfig));
    }, []);

    useEffect(() => {
        if (!sessionData) return;
        setIsSaved(false); 
        
        const answered = sessionData.filter(qna => qna.feedback);
        if (answered.length === 0) return;

        const avgScores = answered.reduce((acc, qna) => {
            const tech = qna.feedback?.technicalKnowledge ?? qna.feedback?.score ?? 0;
            const problem = qna.feedback?.problemSolving ?? qna.feedback?.score ?? 0;
            const comm = qna.feedback?.communication ?? qna.feedback?.score ?? 0;
            const clarity = qna.feedback?.clarity ?? qna.feedback?.score ?? 0;
            
            acc.technicalKnowledge += tech;
            acc.problemSolving += problem;
            acc.communication += comm;
            acc.clarity += clarity;
            return acc;
        }, { technicalKnowledge: 0, problemSolving: 0, communication: 0, clarity: 0 });

        const numAnswers = answered.length;
        setSkillScores({
            technicalKnowledge: Math.round((avgScores.technicalKnowledge / numAnswers) * 10),
            problemSolving: Math.round((avgScores.problemSolving / numAnswers) * 10),
            communication: Math.round((avgScores.communication / numAnswers) * 10),
            clarity: Math.round((avgScores.clarity / numAnswers) * 10),
        });

        let data;
        if (overallScore100 >= 85) {
            data = { title: "Excellent!", description: "Outstanding performance! You showcased exceptional skills and deep knowledge. Keep up the fantastic work.", colorClass: "text-indigo-600", icon: <AwardIcon className="w-8 h-8 text-indigo-600" /> };
        } else if (overallScore100 >= 70) {
            data = { title: "Great Performance!", description: "You demonstrated strong technical knowledge and communication skills. Review the detailed feedback below to continue improving.", colorClass: "text-blue-600", icon: <PerformanceIcon className="w-8 h-8 text-blue-600" /> };
        } else if (overallScore100 >= 50) {
             data = { title: "Good Effort!", description: "A solid attempt. You have a good foundation, but there are areas for improvement. Focus on the suggestions to sharpen your skills.", colorClass: "text-green-600", icon: <TargetIcon className="w-8 h-8 text-green-600" /> };
        } else {
             data = { title: "Needs Improvement", description: "This was a valuable learning experience. Your score indicates some key areas need attention. Let's review the feedback to build a stronger foundation.", colorClass: "text-red-600", icon: <TrendingDownIcon className="w-8 h-8 text-red-600" /> };
        }
        setPerformanceData(data);
    }, [sessionData, overallScore100]);
    
    const handleSaveResults = async () => {
        if (!sessionData || !config) return;
        setIsSaving(true);
        if (answeredQuestions.length === 0) {
            setIsSaving(false);
            return;
        };

        const finalSession: InterviewSession = {
            userId: user.uid,
            config: config,
            questionsAndAnswers: sessionData,
            overallScore: parseFloat(overallScore.toFixed(1)),
            completedAt: new Date(),
        };
        try {
            await saveInterviewSession(finalSession);
            setIsSaved(true);
        } catch (error) {
            console.error("Failed to save session.", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const resetInterview = () => {
        navigate('/pre-interview');
    }

    const formatTime = (s?: number) => {
        if (!s) return 'N/A';
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}m ${secs}s`;
    };

    if (!sessionData) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                <SparkIcon className="w-16 h-16 text-cyan-500 animate-pulse mb-4" />
                <p className="text-2xl text-gray-600">Loading Results...</p>
            </div>
        );
    }
    
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (overallScore100 / 100) * circumference;
    
    const activeQnA = sessionData[activeTab];
    const strengthsList = activeQnA?.feedback?.strengths.split(/[.\n]/).filter(s => s.trim().length > 0) || [];
    const weaknessesList = activeQnA?.feedback?.weaknesses.split(/[.\n]/).filter(s => s.trim().length > 0) || [];
    const brushUpTopics = activeQnA?.feedback?.brushUpTopics || [];
    
    const getPerformanceTag = (score) => {
        if (score >= 90) return <span className="text-base font-medium px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">Exceptional Clarity</span>;
        if (score >= 75) return <span className="text-base font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Strong Communicator</span>;
        if (score >= 60) return <span className="text-base font-medium px-3 py-1 bg-green-100 text-green-800 rounded-full">Solid Foundation</span>;
        return <span className="text-base font-medium px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">Needs Practice</span>;
    }

    const SkillBar = ({ name, score }: { name: string, score: number }) => (
        <div>
            <div className="flex justify-between mb-1.5">
                <span className="text-xl font-medium text-gray-700">{name}</span>
                <span className="text-xl font-bold text-blue-600">{score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg flex items-center space-x-8">
                <div className="relative w-40 h-40 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                        <circle className={`${performanceData.colorClass} transition-all duration-1000`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-6xl font-bold ${performanceData.colorClass}`}>{overallScore100}</span>
                        <span className="text-lg font-medium text-gray-500">/ 100</span>
                    </div>
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                         {performanceData.icon}
                         <h2 className="text-4xl font-bold text-gray-800">{performanceData.title}</h2>
                    </div>
                    <p className="text-xl text-gray-600 mb-4">{performanceData.description}</p>
                    <div className="flex items-center space-x-4">
                        {getPerformanceTag(overallScore100)}
                        <span className="text-base font-medium px-3 py-1 bg-gray-100 text-gray-800 rounded-full">Technical Depth</span>
                        <span className="text-base font-medium px-3 py-1 bg-gray-100 text-gray-800 rounded-full">{answeredQuestions.length} Questions Completed</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <AwardIcon className="w-7 h-7 text-blue-600" />
                    <h3 className="text-3xl font-bold text-gray-800">Skills Assessment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <SkillBar name="Technical Knowledge" score={skillScores.technicalKnowledge} />
                    <SkillBar name="Communication" score={skillScores.communication} />
                    <SkillBar name="Problem Solving" score={skillScores.problemSolving} />
                    <SkillBar name="Clarity" score={skillScores.clarity} />
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
                 <div className="flex items-center gap-3 mb-4">
                    <TargetIcon className="w-7 h-7 text-blue-600" />
                    <h3 className="text-3xl font-bold text-gray-800">Question-by-Question Breakdown</h3>
                </div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        {sessionData.map((_, index) => (
                            <button key={index} onClick={() => setActiveTab(index)}
                                className={`${activeTab === index ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-2 border-b-2 font-semibold text-xl`}>
                                Q{index + 1}
                            </button>
                        ))}
                    </nav>
                </div>
                {activeQnA && (
                    <div className="pt-6">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-base mb-1">
                                    <ClockIcon className="w-5 h-5" />
                                    <span>Question {activeTab + 1}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-600 font-medium">Time taken: {formatTime(activeQnA.duration)}</span>
                                    {activeQnA.status === 'skipped' && <span className="ml-2 text-red-500 font-black uppercase text-xs">Skipped</span>}
                                </div>
                                <p className="text-2xl font-semibold text-gray-800">{activeQnA.question}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                 <span className="text-5xl font-bold text-blue-600">{activeQnA.feedback?.score || 0}/10</span>
                                 <p className="text-lg text-gray-500">Score</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                            <div>
                                <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2 text-xl"><CheckIcon /> Strengths</h4>
                                <ul className="space-y-1.5 text-lg text-gray-600 list-disc list-inside">
                                    {strengthsList.length > 0 ? strengthsList.map((item, i) => <li key={i}>{item}</li>) : <li className="italic text-gray-400">None identified</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-2 text-xl"><TrendingDownIcon /> Areas to Improve</h4>
                                <ul className="space-y-1.5 text-lg text-gray-600 list-disc list-inside">
                                    {weaknessesList.length > 0 ? weaknessesList.map((item, i) => <li key={i}>{item}</li>) : <li className="italic text-gray-400">None identified</li>}
                                </ul>
                            </div>
                        </div>
                        
                        {brushUpTopics.length > 0 && (
                            <div className="mb-6 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-3 text-xl">
                                    <RefreshIcon className="w-6 h-6" /> Topics to Brush Up
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {brushUpTopics.map((topic, i) => (
                                        <span key={i} className="px-4 py-2 bg-white text-blue-700 rounded-xl font-bold text-sm border border-blue-200 shadow-sm">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {activeQnA.code && (
                             <div className="mb-6">
                                <h4 className="font-semibold text-gray-700 mb-2 text-xl">Your Code</h4>
                                <div className="bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 rounded-lg overflow-x-auto text-sm border border-gray-700 shadow-inner">
                                    <pre>{activeQnA.code}</pre>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-200 pt-4">
                            <h4 className="font-semibold text-gray-700 mb-2 text-xl">Your Response</h4>
                            <p className="text-gray-600 bg-gray-100 p-4 rounded-lg text-lg italic">"{activeQnA.answer}"</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4 pt-4">
                <button onClick={resetInterview} className="flex items-center justify-center gap-3 px-8 py-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 text-xl">
                    <RefreshIcon />
                    Practice Again
                </button>
                <button onClick={handleSaveResults} disabled={isSaving || isSaved} className="px-8 py-4 font-bold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-xl disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed">
                    {isSaving ? 'Saving...' : isSaved ? '✓ Saved!' : 'Save Interview'}
                </button>
                {isSaved ? (
                    <button onClick={() => navigate('/history')} className="px-8 py-4 font-bold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-xl">
                        View History
                    </button>
                ) : (
                    <button onClick={() => navigate('/')} className="px-8 py-4 font-bold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-xl">
                        Back to Home
                    </button>
                )}
            </div>
        </div>
    )
};

export default ResultsPage;
