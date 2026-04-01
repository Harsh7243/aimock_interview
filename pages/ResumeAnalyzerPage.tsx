import React, { useState, useCallback } from 'react';
import type { User } from '@firebase/auth';
import { analyzeResume } from '../services/ollamaService';
import type { ResumeAnalysis } from '../types';
import { SparkIcon, DocumentIcon, SearchIcon, CheckIcon, TrendingDownIcon, AwardIcon, TrashIcon, RefreshIcon, TargetIcon, ClockIcon, BarChartIcon } from '../components/icons';

const ResumeAnalyzerPage = ({ user, navigate }: { user: User; navigate: (path: string) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File is too large. Please upload a file smaller than 5MB.");
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (validTypes.includes(droppedFile.type)) {
                if (droppedFile.size > 5 * 1024 * 1024) {
                    setError("File is too large. Please upload a file smaller than 5MB.");
                    return;
                }
                setFile(droppedFile);
                setError(null);
            } else {
                setError("Please upload a PDF or Image (JPG/PNG) file.");
            }
        }
    }, []);

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

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const base64 = await fileToBase64(file);
            const result = await analyzeResume(base64, file.type, jobDescription);
            setAnalysis(result);
        } catch (err: any) {
            console.error("Analysis error:", err);
            setError(err.message || "Failed to analyze resume. Please ensure the file is valid.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle?: string }) => (
        <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
            </div>
        </div>
    );

    const ListGroup = ({ items, icon: Icon = CheckIcon, colorClass = "text-green-600", bgClass = "bg-green-50" }: { items: string[], icon?: any, colorClass?: string, bgClass?: string }) => (
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className={`flex items-start gap-3 p-3 ${bgClass} rounded-xl border border-black/5`}>
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${colorClass}`} />
                    <span className="text-sm font-medium text-gray-800">{item}</span>
                </li>
            ))}
        </ul>
    );

    if (analysis) {
        const radius = 42;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (analysis.jobTargetAlignment.semanticScore / 100) * circumference;

        return (
            <div className="w-full max-w-7xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-10">
                    <button onClick={() => setAnalysis(null)} className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                        &larr; Analyze Another Resume
                    </button>
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-full font-black text-sm uppercase tracking-widest ${
                            analysis.riskLevel === 'Low' ? 'bg-green-100 text-green-700' : 
                            analysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                            ATS Risk: {analysis.riskLevel}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Scores & Priority Actions */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-xl text-center">
                            <h2 className="text-2xl font-black text-gray-900 mb-6">Alignment Score</h2>
                            <div className="relative w-48 h-48 mx-auto mb-6">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle className="text-gray-100" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                                    <circle className="text-indigo-600 transition-all duration-1000" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="50" cy="50" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-gray-900">{analysis.jobTargetAlignment.semanticScore}</span>
                                    <span className="text-sm font-bold text-gray-400">/ 100</span>
                                </div>
                            </div>
                            <p className="text-gray-600 font-semibold leading-relaxed px-4">
                                {analysis.jobTargetAlignment.summary}
                            </p>
                        </div>

                        <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <TargetIcon className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Priority Action Steps</h3>
                            </div>
                            <ul className="space-y-4">
                                {analysis.priorityActionSteps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                                        <span className="text-sm font-bold leading-relaxed">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Detailed Analysis */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Semantic Alignment Detail */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                            <SectionHeader icon={SparkIcon} title="Alignment Deep Dive" subtitle="How your profile matches market demand" />
                            <p className="text-gray-700 leading-relaxed font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100 italic">
                                "{analysis.jobTargetAlignment.explanation}"
                            </p>
                        </div>

                        {/* Impact & Quantification */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                            <SectionHeader icon={BarChartIcon} title="Impact & Quantification" subtitle="Results vs Responsibilities" />
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Gaps Identified</h4>
                                    <ListGroup items={analysis.impactAnalysis.gaps} icon={TrendingDownIcon} colorClass="text-red-500" bgClass="bg-red-50" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Low Impact Bullets</h4>
                                    <ul className="space-y-3">
                                        {analysis.impactAnalysis.lowImpactBullets.map((bullet, i) => (
                                            <li key={i} className="p-3 text-sm font-medium text-gray-500 border border-dashed border-gray-200 rounded-xl">
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Skill Gap Analysis */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                            <SectionHeader icon={TargetIcon} title="Skill Gap & Depth Analysis" subtitle="Competitive edge assessment" />
                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Missing Critical Skills</h4>
                                    <ListGroup items={analysis.skillGapAnalysis.missingCritical} icon={TrendingDownIcon} colorClass="text-red-600" bgClass="bg-red-50" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Unsupported Claims</h4>
                                    <ListGroup items={analysis.skillGapAnalysis.unsupportedClaims} icon={RefreshIcon} colorClass="text-blue-600" bgClass="bg-blue-50" />
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-8">
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Skill Classification</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <p className="text-xs font-black text-indigo-600 uppercase mb-2">Core</p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.skillGapAnalysis.skillClassification.core.map((s, i) => <span key={i} className="text-xs font-bold text-indigo-800">{s}</span>)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                        <p className="text-xs font-black text-purple-600 uppercase mb-2">Supporting</p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.skillGapAnalysis.skillClassification.supporting.map((s, i) => <span key={i} className="text-xs font-bold text-purple-800">{s}</span>)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-black text-gray-500 uppercase mb-2">Optional</p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.skillGapAnalysis.skillClassification.optional.map((s, i) => <span key={i} className="text-xs font-bold text-gray-700">{s}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Structure & Interview Prep */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                                <SectionHeader icon={DocumentIcon} title="Structure & Scan" />
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-2">Density Evaluation</p>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{analysis.structureAndScan.densityEvaluation}</p>
                                    </div>
                                    <ListGroup items={analysis.structureAndScan.findings} />
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
                                <SectionHeader icon={AwardIcon} title="Interview Readiness" />
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-2">Predicted Questions</p>
                                        <ul className="space-y-2">
                                            {analysis.interviewBridging.likelyQuestions.map((q, i) => (
                                                <li key={i} className="text-sm font-medium text-gray-600 flex gap-2">
                                                    <span className="text-indigo-400 font-black">?</span> {q}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-sm font-bold text-gray-900 mb-2">Challenge Points</p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.interviewBridging.challengePoints.map((cp, i) => <span key={i} className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-md">{cp}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold text-purple-700 bg-purple-50 rounded-full">
                    <DocumentIcon className="w-4 h-4" />
                    Advanced Professional Analysis
                </div>
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Resume Intelligence Analyzer</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                    Upload your resume for a deterministic, Recruiter-level scan. Get granular alignment scores and actionable quantification gaps.
                </p>
            </div>

            <div className="space-y-8">
                <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Your Resume (PDF/JPG/PNG)</label>
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={`relative group h-64 border-2 border-dashed rounded-[2.5rem] transition-all duration-300 flex flex-col items-center justify-center p-6 text-center
                            ${isDragging ? 'border-purple-600 bg-purple-50 shadow-inner' : 'border-gray-200 hover:border-purple-400 bg-white shadow-sm'}
                        `}
                    >
                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="p-4 bg-purple-100 text-purple-600 rounded-3xl mb-4 group-hover:scale-110 transition-transform">
                                    <DocumentIcon className="w-12 h-12" />
                                </div>
                                <p className="text-lg font-black text-gray-900 mb-1">{file.name}</p>
                                <p className="text-xs font-bold text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button 
                                    onClick={() => setFile(null)}
                                    className="mt-6 px-4 py-2 flex items-center gap-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-xs"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Remove File
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
                                <div className="p-5 bg-gray-50 text-gray-400 rounded-3xl mb-4 group-hover:bg-purple-50 group-hover:text-purple-500 transition-all">
                                    <DocumentIcon className="w-12 h-12" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Drop your resume here</h3>
                                <p className="text-gray-500 font-medium">or <span className="text-purple-600 font-bold underline">browse files</span></p>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Target Job Context (Highly Recommended)</label>
                    <textarea 
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the Job Target description here to enable semantic alignment scoring..."
                        className="w-full h-48 p-8 bg-white border border-gray-200 rounded-[2.5rem] shadow-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none resize-none font-medium text-gray-700"
                    />
                </div>
            </div>

            {error && (
                <div className="mt-8 p-6 bg-red-50 border border-red-100 text-red-600 rounded-3xl text-center font-bold">
                    {error}
                </div>
            )}

            <div className="mt-12 flex flex-col items-center">
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !file}
                    className="group relative px-16 py-6 bg-indigo-600 text-white font-black text-xl rounded-3xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all disabled:bg-gray-300 disabled:shadow-none"
                >
                    {isAnalyzing ? (
                        <div className="flex items-center gap-4">
                            <RefreshIcon className="w-6 h-6 animate-spin" />
                            Analyzing Signals...
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <BarChartIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            Run Intelligence Analysis
                        </div>
                    )}
                </button>
                <p className="mt-8 text-center text-gray-400 text-xs font-bold tracking-widest uppercase">
                    Privacy First • Deterministic Results • Zero Data Retention
                </p>
            </div>
        </div>
    );
};

export default ResumeAnalyzerPage;
