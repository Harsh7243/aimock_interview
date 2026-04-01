
import React, { useState, useCallback } from 'react';
import type { User } from '@firebase/auth';
import type { InterviewConfig, InterviewType } from '../types';
import { DocumentIcon, TrashIcon } from '../components/icons';

interface PreInterviewPageProps {
    user: User;
    navigate: (path: string) => void;
}

const PreInterviewPage: React.FC<PreInterviewPageProps> = ({ navigate }) => {
    const [config, setConfig] = useState<InterviewConfig>({ jobRole: '', interviewType: 'Technical' });
    const [isDragging, setIsDragging] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64String = result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleStart = async () => {
        let resumeData = undefined;
        if (resumeFile) {
            const base64 = await fileToBase64(resumeFile);
            resumeData = {
                base64,
                mimeType: resumeFile.type,
                fileName: resumeFile.name
            };
        }

        const finalConfig = { ...config, resumeData };
        sessionStorage.setItem('interviewConfig', JSON.stringify(finalConfig));
        navigate('/interview');
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setResumeFile(e.dataTransfer.files[0]);
        }
    }, []);

    return (
        <div className="w-full max-w-5xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-2xl shadow-cyan-500/40">
            <h2 className="text-4xl font-bold text-center mb-2 text-gray-900">Start Your Interview</h2>
            <p className="text-center text-gray-600 mb-8 text-lg">Tell us about the position you're preparing for</p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="jobRole" className="block mb-2 text-base font-medium text-gray-700">Job Role</label>
                    <input type="text" id="jobRole" value={config.jobRole} onChange={(e) => setConfig(c => ({ ...c, jobRole: e.target.value }))} placeholder="e.g., Software Engineer, Data Analyst, Product Manager" className="bg-white border border-black text-black placeholder-gray-500 text-base rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-4" />
                </div>
                
                <div>
                    <label className="block mb-2 text-base font-medium text-gray-700">Optional: Upload Resume (to verify claims)</label>
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={`relative group h-32 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center p-4 text-center
                            ${isDragging ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-gray-200 hover:border-indigo-400 bg-white shadow-sm'}
                        `}
                    >
                        {resumeFile ? (
                            <div className="flex items-center gap-4">
                                <DocumentIcon className="w-8 h-8 text-indigo-600" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">{resumeFile.name}</p>
                                    <p className="text-xs text-gray-400">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button onClick={() => setResumeFile(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <input 
                                    type="file" 
                                    accept=".pdf,image/*" 
                                    onChange={onFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="p-3 bg-gray-50 text-gray-400 rounded-xl mb-1">
                                    <DocumentIcon className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Drop resume here or <span className="text-indigo-600 font-bold underline">browse</span></p>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Enables claim verification mode</p>
                            </>
                        )}
                    </div>
                </div>

                <div>
                     <label className="block mb-2 text-base font-medium text-gray-700">Interview Type</label>
                     <div className="grid grid-cols-2 gap-4">
                        {(['Technical', 'HR/Behavioral'] as const).map((type) => (
                            <div key={type}>
                                <input 
                                    type="radio" 
                                    id={type} 
                                    name="interviewType" 
                                    value={type === 'HR/Behavioral' ? 'HR' : type}
                                    checked={(config.interviewType === 'Technical' && type === 'Technical') || (config.interviewType === 'HR' && type === 'HR/Behavioral')}
                                    onChange={(e) => setConfig(c => ({ ...c, interviewType: e.target.value as InterviewType }))} 
                                    className="hidden peer"
                                />
                                <label htmlFor={type} className="block p-4 text-center rounded-lg border border-gray-300 bg-white cursor-pointer peer-checked:border-cyan-500 peer-checked:ring-2 peer-checked:ring-cyan-500 text-gray-800">
                                    <div className="text-lg font-semibold">{type} Interview</div>
                                    <div className="text-base text-gray-500 mt-1">{type === 'Technical' ? 'Focus on problem-solving, algorithms, and technical skills' : 'Focus on soft skills, experience, and cultural fit'}</div>
                                </label>
                            </div>
                        ))}
                     </div>
                </div>
                <button onClick={handleStart} disabled={!config.jobRole} className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-xl px-5 py-4 text-center disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-300">
                   Start Interview &rarr;
                </button>
            </div>
        </div>
    );
};

export default PreInterviewPage;
