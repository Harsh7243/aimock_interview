
import React from 'react';
import type { User } from '@firebase/auth';
import { signInWithGoogle } from '../services/firebase';
import { MicIcon, DocumentIcon, SparkIcon, LogoIcon, CheckIcon, AwardIcon, TargetIcon, PerformanceIcon } from './icons';

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 w-full max-sm`}
    >
        <div className={`mb-6 p-6 rounded-2xl ${colorClass} text-white transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 text-center leading-relaxed">
            {description}
        </p>
        <div className="mt-8 flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-4 transition-all">
            Open Tool <span>&rarr;</span>
        </div>
    </button>
);

export const LandingPage = ({ user, navigate }: { user: User | null; navigate: (path: string) => void; }) => {
    
    const handleToolClick = async (path: string) => {
        if (!user) {
            try {
                const loggedInUser = await signInWithGoogle();
                if (loggedInUser) navigate(path);
            } catch (error) {
                console.error("Sign in failed", error);
            }
        } else {
            navigate(path);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto py-12 px-4">
            <div className="text-center mb-16">
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
                    Your Personal <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Career Accelerator</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Master your next interview or perfect your resume with the world's most advanced career toolkit, powered by OpenRouter AI.
                </p>
            </div>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-10">
                <ToolCard 
                    title="AI Mock Interview"
                    description="Practice technical and behavioral questions with an interactive AI interviewer. Get voice-to-voice feedback."
                    icon={<MicIcon className="w-12 h-12" />}
                    onClick={() => handleToolClick('/pre-interview')}
                    colorClass="bg-indigo-600"
                />
                
                <ToolCard 
                    title="Resume Analyzer"
                    description="Upload your resume to get an instant ATS score, readability check, and targeted keyword improvements."
                    icon={<DocumentIcon className="w-12 h-12" />}
                    onClick={() => handleToolClick('/resume-analyzer')}
                    colorClass="bg-purple-600"
                />
            </div>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-100 pt-16">
                <div className="flex flex-col items-center text-center group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 group-hover:scale-105 transition-all">
                        <AwardIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Expert Feedback</h4>
                    <p className="text-gray-500">Get granular scores on communication, knowledge, and presentation.</p>
                </div>
                <div className="flex flex-col items-center text-center group">
                    <div className="p-4 bg-purple-50 rounded-2xl mb-4 group-hover:scale-105 transition-all overflow-hidden flex items-center justify-center">
                        <TargetIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">ATS Optimization</h4>
                    <p className="text-gray-500">Ensure your resume passes automated filters and lands in human hands.</p>
                </div>
                <div className="flex flex-col items-center text-center group">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl mb-4 group-hover:scale-105 transition-all">
                        <PerformanceIcon className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Track Progress</h4>
                    <p className="text-gray-500">Save your sessions and watch your scores climb as you practice.</p>
                </div>
            </div>
        </div>
    );
};
