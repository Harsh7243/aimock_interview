
import React from 'react';
import type { User } from '@firebase/auth';
import { MicIcon, DocumentIcon, SparkIcon, LogoIcon } from '../components/icons';

interface DashboardCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, icon, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 w-full max-w-sm`}
    >
        <div className={`mb-6 p-6 rounded-2xl ${colorClass} text-white transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 text-center leading-relaxed">
            {description}
        </p>
        <div className="mt-8 flex items-center gap-2 font-semibold text-indigo-600 group-hover:gap-4 transition-all">
            Get Started <span>&rarr;</span>
        </div>
    </button>
);

const DashboardPage = ({ user, navigate }: { user: User; navigate: (path: string) => void }) => {
    return (
        <div className="w-full max-w-6xl mx-auto py-12 px-4">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-full">
                    <SparkIcon className="w-4 h-4" />
                    AI-Powered Career Toolkit
                </div>
                <h1 className="text-5xl font-black text-gray-900 mb-4">
                    Welcome back, <span className="text-indigo-600">{user.displayName?.split(' ')[0]}</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    What would you like to focus on today? Prepare for your next big role with our suite of AI tools.
                </p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                <DashboardCard 
                    title="AI Mock Interview"
                    description="Practice technical and HR questions with an interactive AI interviewer. Get real-time feedback."
                    icon={<MicIcon className="w-12 h-12" />}
                    onClick={() => navigate('/interview-home')}
                    colorClass="bg-indigo-600"
                />
                
                <DashboardCard 
                    title="Resume Analyzer"
                    description="Upload your resume to get an instant ATS score, keyword analysis, and actionable improvements."
                    icon={<DocumentIcon className="w-12 h-12" />}
                    onClick={() => navigate('/resume-analyzer')}
                    colorClass="bg-purple-600"
                />
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-100 pt-16">
                <div className="flex flex-col items-center text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">100+</div>
                    <div className="text-gray-500 font-medium uppercase tracking-wider text-xs">Job Roles Supported</div>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">Real-time</div>
                    <div className="text-gray-500 font-medium uppercase tracking-wider text-xs">AI Feedback Engine</div>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">Secure</div>
                    <div className="text-gray-500 font-medium uppercase tracking-wider text-xs">Encrypted Career Data</div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
