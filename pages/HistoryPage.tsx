import React, { useState, useEffect } from 'react';
import type { User } from '@firebase/auth';
import { getInterviewSessions, deleteInterviewSession } from '../services/firebase';
import type { InterviewSession } from '../types';
import { SparkIcon, AwardIcon, TargetIcon, PerformanceIcon, ClockIcon, CheckIcon, TrendingDownIcon, TrashIcon, RefreshIcon } from '../components/icons';
import { DocumentData, QueryDocumentSnapshot } from '@firebase/firestore';

const HistoryDetailsView = ({ session }: { session: InterviewSession }) => {
    const [activeTab, setActiveTab] = useState(0);

    const answeredQuestions = session.questionsAndAnswers.filter(qna => qna.feedback);
    const overallScore100 = Math.round(session.overallScore * 10);
    
    const [performanceData, setPerformanceData] = useState({ title: '', description: '', colorClass: 'text-blue-600', icon: <PerformanceIcon className="w-8 h-8 text-blue-600" /> });
    const [skillScores, setSkillScores] = useState({ technicalKnowledge: 0, problemSolving: 0, communication: 0, clarity: 0, });

    useEffect(() => {
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
        
        const answered = session.questionsAndAnswers.filter(qna => qna.feedback);
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
    }, [overallScore100, session.questionsAndAnswers]);
    
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (overallScore100 / 100) * circumference;
    const activeQnA = session.questionsAndAnswers[activeTab];
    const strengthsList = activeQnA?.feedback?.strengths.split(/[.\n]/).filter(s => s.trim().length > 0) || [];
    const weaknessesList = activeQnA?.feedback?.weaknesses.split(/[.\n]/).filter(s => s.trim().length > 0) || [];
    const brushUpTopics = activeQnA?.feedback?.brushUpTopics || [];

    const getPerformanceTag = (score) => {
        if (score >= 90) return <span className="text-base font-medium px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">Exceptional Clarity</span>;
        if (score >= 75) return <span className="text-base font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Strong Communicator</span>;
        if (score >= 60) return <span className="text-base font-medium px-3 py-1 bg-green-100 text-green-800 rounded-full">Solid Foundation</span>;
        return <span className="text-base font-medium px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">Needs Practice</span>;
    }
    const SkillBar = ({ name, score }: {name: string, score: number}) => (
        <div>
            <div className="flex justify-between mb-1.5"><span className="text-xl font-medium text-gray-700">{name}</span><span className="text-xl font-bold text-blue-600">{score}%</span></div>
            <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${score}%` }}></div></div>
        </div>
    );

    const formatTime = (s?: number) => {
        if (!s) return 'N/A';
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg flex items-center space-x-8">
                <div className="relative w-40 h-40 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                        <circle className={`${performanceData.colorClass} transition-all duration-1000`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className={`text-6xl font-bold ${performanceData.colorClass}`}>{overallScore100}</span><span className="text-lg font-medium text-gray-500">/ 100</span></div>
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">{performanceData.icon}<h2 className="text-4xl font-bold text-gray-800">{performanceData.title}</h2></div>
                    <p className="text-xl text-gray-600 mb-4">{performanceData.description}</p>
                    <div className="flex items-center space-x-4">{getPerformanceTag(overallScore100)}<span className="text-base font-medium px-3 py-1 bg-gray-100 text-gray-800 rounded-full">{session.config.interviewType}</span><span className="text-base font-medium px-3 py-1 bg-gray-100 text-gray-800 rounded-full">{answeredQuestions.length} Questions</span></div>
                </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-6"><AwardIcon className="w-7 h-7 text-blue-600" /><h3 className="text-3xl font-bold text-gray-800">Skills Assessment</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"><SkillBar name="Technical Knowledge" score={skillScores.technicalKnowledge} /><SkillBar name="Communication" score={skillScores.communication} /><SkillBar name="Problem Solving" score={skillScores.problemSolving} /><SkillBar name="Clarity" score={skillScores.clarity} /></div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-4"><TargetIcon className="w-7 h-7 text-blue-600" /><h3 className="text-3xl font-bold text-gray-800">Question-by-Question Breakdown</h3></div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">{session.questionsAndAnswers.map((_, index) => (<button key={index} onClick={() => setActiveTab(index)} className={`${activeTab === index ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-2 border-b-2 font-semibold text-xl`}>Q{index + 1}</button>))}</nav>
                </div>
                {activeQnA && (
                    <div className="pt-6">
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-base mb-1">
                                    <ClockIcon className="w-5 h-5"/>
                                    <span>Question {activeTab + 1}</span> 
                                    <span className="text-gray-300">|</span> 
                                    <span className="text-gray-600 font-medium">Time taken: {formatTime(activeQnA.duration)}</span>
                                    {activeQnA.status === 'skipped' && <span className="ml-2 text-red-500 font-black uppercase text-xs">Skipped</span>}
                                </div>
                                <p className="text-2xl font-semibold text-gray-800">{activeQnA.question}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4"><span className="text-5xl font-bold text-blue-600">{activeQnA.feedback?.score || 0}/10</span><p className="text-lg text-gray-500">Score</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                            <div><h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2 text-xl"><CheckIcon /> Strengths</h4><ul className="space-y-1.5 text-lg text-gray-600 list-disc list-inside">{strengthsList.length > 0 ? strengthsList.map((item, i) => <li key={i}>{item}</li>) : <li className="italic text-gray-400">None identified</li>}</ul></div>
                            <div><h4 className="font-semibold text-red-700 flex items-center gap-2 mb-2 text-xl"><TrendingDownIcon /> Areas to Improve</h4><ul className="space-y-1.5 text-lg text-gray-600 list-disc list-inside">{weaknessesList.length > 0 ? weaknessesList.map((item, i) => <li key={i}>{item}</li>) : <li className="italic text-gray-400">None identified</li>}</ul></div>
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

                        <div className="border-t border-gray-200 pt-4"><h4 className="font-semibold text-gray-700 mb-2 text-xl">Your Response</h4><p className="text-gray-600 bg-gray-100 p-4 rounded-lg text-lg italic">"{activeQnA.answer}"</p></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoryPage = ({ user, navigate }: { user: User; navigate: (path: string) => void }) => {
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);

    const fetchSessions = async (isInitial = false) => {
        if (user) {
            try {
                if (isInitial) setLoading(true);
                else setFetchingMore(true);

                const { sessions: newSessions, lastVisible } = await getInterviewSessions(user.uid, isInitial ? null : lastDoc, 10);
                
                if (isInitial) {
                    setSessions(newSessions);
                } else {
                    setSessions(prev => [...prev, ...newSessions]);
                }

                setLastDoc(lastVisible);
                setHasMore(newSessions.length === 10);
            } catch (error) {
                console.error("Error fetching sessions", error);
            } finally {
                setLoading(false);
                setFetchingMore(false);
            }
        }
    };

    useEffect(() => {
        fetchSessions(true);
    }, [user]);

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this interview session?")) {
            try {
                await deleteInterviewSession(user.uid, sessionId);
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (selectedSession?.id === sessionId) {
                    setSelectedSession(null);
                }
            } catch (error) {
                console.error("Error deleting session", error);
            }
        }
    };

    if (loading) {
        return (
             <div className="flex items-center justify-center min-h-[50vh]">
                <SparkIcon className="w-10 h-10 text-cyan-500 animate-pulse" />
            </div>
        );
    }

    if (selectedSession) {
        return (
            <div className="max-w-7xl mx-auto">
                <button onClick={() => setSelectedSession(null)} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <span>&larr; Back to History</span>
                </button>
                <HistoryDetailsView session={selectedSession} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Interview History</h1>
            {sessions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-xl text-gray-600 mb-4">No interview history found.</p>
                    <button onClick={() => navigate('/pre-interview')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                        Start your first interview
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4">
                        {sessions.map((session) => (
                            <div 
                                key={session.id} 
                                onClick={() => setSelectedSession(session)}
                                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                            >
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">{session.config.jobRole}</h3>
                                    <p className="text-gray-500">{session.config.interviewType} • {session.completedAt.toLocaleDateString()} {session.completedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <span className={`text-2xl font-bold ${session.overallScore >= 7 ? 'text-green-600' : session.overallScore >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {Math.round(session.overallScore * 10)}/100
                                        </span>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Score</p>
                                    </div>
                                    <button 
                                        onClick={(e) => handleDelete(e, session.id!)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Session"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {hasMore && (
                        <div className="flex justify-center mt-8">
                            <button 
                                onClick={() => fetchSessions(false)} 
                                disabled={fetchingMore}
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                            >
                                {fetchingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
