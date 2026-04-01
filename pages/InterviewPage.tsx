
import React, { useState, useEffect, useRef } from 'react';
import type { User } from '@firebase/auth';
import { generateQuestion, evaluateAnswer } from '../services/ollamaService';
import type { InterviewConfig, Difficulty, QuestionAndAnswer, Feedback } from '../types';
import { useSpeech } from '../hooks/useSpeechRecognition';
import { SparkIcon, MicIcon, StopIcon, ClockIcon, TargetIcon, PerformanceIcon, BarChartIcon, RefreshIcon } from '../components/icons';

const LANGUAGES = {
    javascript: {
        name: 'JavaScript',
        comment: '//',
        template: `// Write your solution here\nfunction solution(args) {\n    // Your code...\n    return;\n}`,
        keywords: ['function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'console', 'log', 'async', 'await', 'yield', 'try', 'catch', 'finally']
    },
    python: {
        name: 'Python',
        comment: '#',
        template: `# Write your solution here\ndef solution(args):\n    # Your code...\n    pass`,
        keywords: ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'class', 'import', 'from', 'print', 'try', 'except', 'None', 'True', 'False', 'with', 'as', 'lambda', 'yield', 'async', 'await']
    },
    java: {
        name: 'Java',
        comment: '//',
        template: `// Write your solution here\npublic class Solution {\n    public void solve() {\n        // Your code...\n    }\n}`,
        keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'void', 'int', 'String', 'return', 'if', 'else', 'for', 'while', 'static', 'new', 'System', 'out', 'println', 'try', 'catch', 'finally']
    },
    cpp: {
        name: 'C++',
        comment: '//',
        template: `// Write your solution here\n#include <iostream>\nusing namespace std;\n\nvoid solve() {\n    // Your code...\n}`,
        keywords: ['int', 'void', 'class', 'public', 'private', 'return', 'if', 'else', 'for', 'while', '#include', 'using', 'namespace', 'std', 'cout', 'endl', 'virtual', 'override', 'template', 'typename']
    },
    sql: {
        name: 'SQL',
        comment: '--',
        template: `-- Write your SQL query here\nSELECT * \nFROM table_name\nWHERE condition;`,
        keywords: ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INTO', 'VALUES', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT']
    }
};

type LanguageKey = keyof typeof LANGUAGES;

const CodeEditor = ({ code, setCode, language, setLanguage }: { code: string, setCode: (s: string) => void, language: LanguageKey, setLanguage: (l: LanguageKey) => void }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const insertText = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        document.execCommand('insertText', false, text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const { selectionStart, selectionEnd, value } = e.currentTarget;
        const isSelected = selectionStart !== selectionEnd;

        // Commenting (Ctrl + /)
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const prefix = LANGUAGES[language].comment + ' ';
            const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const lineEnd = value.indexOf('\n', selectionStart);
            const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
            const lineText = value.substring(lineStart, actualLineEnd);

            let newValue;
            if (lineText.trimStart().startsWith(LANGUAGES[language].comment)) {
                newValue = value.substring(0, lineStart) + lineText.replace(new RegExp(`^(\\s*)${LANGUAGES[language].comment}\\s?`), '$1') + value.substring(actualLineEnd);
            } else {
                newValue = value.substring(0, lineStart) + prefix + lineText + value.substring(actualLineEnd);
            }
            setCode(newValue);
            return;
        }

        // Smart Backspace (4 spaces)
        if (e.key === 'Backspace' && !isSelected) {
            const before = value.substring(0, selectionStart);
            if (before.endsWith('    ')) {
                e.preventDefault();
                for(let i=0; i<4; i++) document.execCommand('delete');
                return;
            }
        }

        const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };

        // Selection Wrapping
        if (pairs[e.key] && isSelected) {
            e.preventDefault();
            const selectedText = value.substring(selectionStart, selectionEnd);
            const replacement = e.key + selectedText + pairs[e.key];
            insertText(replacement);
            requestAnimationFrame(() => {
                if (textareaRef.current) textareaRef.current.setSelectionRange(selectionStart + 1, selectionEnd + 1);
            });
            return;
        }

        // Auto-close Brackets
        if (pairs[e.key] && !isSelected) {
            e.preventDefault();
            insertText(e.key + pairs[e.key]);
            requestAnimationFrame(() => {
                if (textareaRef.current) textareaRef.current.setSelectionRange(selectionStart + 1, selectionStart + 1);
            });
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            insertText('    ');
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
            const currentLine = value.substring(currentLineStart, selectionStart);
            const indentMatch = currentLine.match(/^\s*/);
            const currentIndent = indentMatch ? indentMatch[0] : '';
            const lastChar = currentLine.trimEnd().slice(-1);
            let extraIndent = (lastChar === '{' || lastChar === '[' || lastChar === '(' || (language === 'python' && lastChar === ':')) ? '    ' : '';
            insertText('\n' + currentIndent + extraIndent);
            return;
        }
    };

    const highlightCode = (code: string) => {
        if (!code) return '';
        let escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const tokens: string[] = [];
        const pushToken = (content: string, css: string) => {
            tokens.push(`<span class="${css}">${content}</span>`);
            return `__TOKEN_${tokens.length - 1}__`;
        };
        let commentRegex = language === 'python' ? /#.*/g : language === 'sql' ? /--.*/g : /\/\/.*|\/\*[\s\S]*?\*\//g;
        let stringRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
        escaped = escaped.replace(commentRegex, (m) => pushToken(m, 'text-green-500 italic opacity-70'));
        escaped = escaped.replace(stringRegex, (m) => pushToken(m, 'text-amber-300'));
        const keywords = LANGUAGES[language].keywords;
        const pattern = `\\b(${keywords.join('|')})\\b`;
        const kRegex = new RegExp(pattern, language === 'sql' ? 'gi' : 'g');
        escaped = escaped.replace(kRegex, (match) => pushToken(match, 'text-sky-400 font-bold'));
        escaped = escaped.replace(/\b(\d+)\b/g, (match) => pushToken(match, 'text-orange-400'));
        return escaped.replace(/__TOKEN_(\d+)__/g, (_, id) => tokens[parseInt(id)]);
    };

    const editorStyle: React.CSSProperties = {
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        padding: '1.5rem',
        tabSize: 4,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            <div className="flex justify-between items-center bg-[#161b22] px-6 py-3 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 mr-4">
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{LANGUAGES[language].name} Workspace</span>
                </div>
                <select value={language} onChange={(e) => setLanguage(e.target.value as LanguageKey)} className="bg-[#21262d] text-gray-200 text-xs font-bold rounded-xl px-4 py-2 border border-gray-700 outline-none cursor-pointer">
                    {Object.entries(LANGUAGES).map(([key, lang]) => <option key={key} value={key}>{lang.name}</option>)}
                </select>
            </div>
            <div className="relative flex-grow overflow-hidden bg-[#0d1117]">
                <pre ref={preRef} className="absolute inset-0 pointer-events-none m-0 text-gray-300 bg-transparent overflow-hidden" aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlightCode(code) + '<br>' }} style={{ ...editorStyle, zIndex: 0 }} />
                <textarea ref={textareaRef} value={code} onChange={(e) => setCode(e.target.value)} onScroll={handleScroll} onKeyDown={handleKeyDown} className="absolute inset-0 w-full h-full m-0 bg-transparent text-transparent caret-white resize-none border-none focus:ring-0 outline-none overflow-auto selection:bg-indigo-500/30" spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" style={{ ...editorStyle, zIndex: 1 }} />
            </div>
        </div>
    );
};

const InterviewAvatar = ({ isSpeaking, isListening }: { isSpeaking: boolean, isListening: boolean }) => (
    <div className="relative flex flex-col items-center justify-center w-full">
        <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${isListening ? 'bg-indigo-500/10 ring-[12px] ring-indigo-500/5' : 'bg-gray-100'}`}>
            {isListening && <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping"></div>}
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-indigo-600 shadow-[0_0_40px_rgba(79,70,229,0.4)]' : 'bg-gray-200'}`}>
                <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                    <div className="flex gap-6">
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${isSpeaking ? 'animate-bounce' : ''}`}></div>
                        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${isSpeaking ? 'animate-bounce delay-75' : ''}`}></div>
                    </div>
                    {isSpeaking && (
                        <div className="absolute bottom-6 flex gap-1">
                            <div className="w-1.5 h-3 bg-white/80 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-6 bg-white/80 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1.5 h-4 bg-white/80 rounded-full animate-pulse delay-150"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="mt-8 text-center">
            <h4 className="text-xl font-black text-gray-900 tracking-tight">AI Interviewer</h4>
            <p className={`text-sm font-bold uppercase tracking-[0.2em] mt-2 transition-colors duration-300 ${isSpeaking ? 'text-indigo-600' : isListening ? 'text-green-600' : 'text-gray-400'}`}>
                {isSpeaking ? 'Analysing Response...' : isListening ? 'Listening Locally...' : 'Ready for Input'}
            </p>
        </div>
    </div>
);

const InterviewVitals = ({ current, total }: { current: number, total: number }) => (
    <div className="w-full">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {current} of {total}</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${(current / total) * 100}%` }}></div>
            </div>
        </div>
    </div>
);

const Timer = ({ seconds }: { seconds: number }) => {
    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return (
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full border border-indigo-100">
            <ClockIcon className="w-4 h-4" />
            <span className="font-mono font-black text-sm">{formatTime(seconds)}</span>
        </div>
    );
};

const getDefaultLanguage = (role: string): LanguageKey => {
    const r = role.toLowerCase();
    if (r.includes('sql') || r.includes('database')) return 'sql';
    if (r.includes('python') || r.includes('data') || r.includes('ai') || r.includes('ml')) return 'python';
    if (r.includes('java') && !r.includes('script')) return 'java';
    if (r.includes('c++') || r.includes('cpp') || r.includes('game') || r.includes('system') || r.includes('embedded')) return 'cpp';
    return 'javascript';
};

const InterviewPage: React.FC<{ user: User, navigate: (path: string) => void }> = ({ navigate }) => {
    const [config, setConfig] = useState<InterviewConfig | null>(null);
    const [sessionData, setSessionData] = useState<QuestionAndAnswer[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [language, setLanguage] = useState<LanguageKey>('javascript');
    const [requiresCode, setRequiresCode] = useState(false);
    
    const [codeBuffers, setCodeBuffers] = useState<Record<LanguageKey, string>>({
        javascript: LANGUAGES.javascript.template,
        python: LANGUAGES.python.template,
        java: LANGUAGES.java.template,
        cpp: LANGUAGES.cpp.template,
        sql: LANGUAGES.sql.template
    });
    
    const { isListening, transcript, startListening, stopListening, speak, isApiSupported, setTranscript } = useSpeech();
    const timerRef = useRef<number | null>(null);

    const totalQuestions = config?.interviewType === 'HR' ? 10 : 7;

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = window.setInterval(() => setTimer(prev => prev + 1), 1000);
        } else if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }, [isTimerRunning]);

    const handleNextTurn = async (feedback?: Feedback, isSkipped = false) => {
        if (!config) return;
        
        const currentQnA = sessionData[currentQuestionIndex];
        const finalAnswer = isSkipped ? "Skipped by user." : (transcript.trim() || "No verbal answer provided.");
        const finalCode = (requiresCode && !isSkipped) ? codeBuffers[language] : undefined;
        
        const updatedQnA: QuestionAndAnswer = { 
            ...currentQnA, 
            answer: finalAnswer, 
            code: finalCode,
            requiresCode: requiresCode,
            duration: timer,
            status: isSkipped ? 'skipped' : 'answered',
            feedback: feedback
        };

        const updatedSessionData = [...sessionData];
        updatedSessionData[currentQuestionIndex] = updatedQnA;
        setSessionData(updatedSessionData);
        setTranscript('');
        setTimer(0);
        setIsTimerRunning(false);

        if (currentQuestionIndex + 1 >= totalQuestions) {
            // Wait for state to settle or use local variable to ensure latest data is saved
            sessionStorage.setItem('interviewResults', JSON.stringify(updatedSessionData));
            navigate('/results');
            return;
        }

        setCodeBuffers({
            javascript: LANGUAGES.javascript.template,
            python: LANGUAGES.python.template,
            java: LANGUAGES.java.template,
            cpp: LANGUAGES.cpp.template,
            sql: LANGUAGES.sql.template
        });

        const nextDifficulty = feedback?.difficultyNext || currentDifficulty;
        const result = await generateQuestion(config.jobRole, config.interviewType, nextDifficulty, currentQuestionIndex + 2, updatedSessionData.map(q => q.question), config.resumeData);
        
        const nextSessionData = [...updatedSessionData, { question: result.question, answer: '', requiresCode: result.requiresCode }];
        setSessionData(nextSessionData);
        setCurrentDifficulty(result.difficulty);
        setRequiresCode(result.requiresCode);
        setCurrentQuestionIndex(nextSessionData.length - 1);

        setIsEvaluating(false); // New question becomes visible
        setIsAiSpeaking(true);
        
        // Wait for question to be rendered, then speak
        setTimeout(() => {
            speak(result.question, () => {
                setIsAiSpeaking(false);
                setIsTimerRunning(true); // Timer starts ONLY AFTER speech finished
            });
        }, 300);
    }

    const handleNextQuestion = async () => {
        setIsTimerRunning(false);
        stopListening();
        window.speechSynthesis.cancel();
        setIsEvaluating(true);
        const feedback = await evaluateAnswer(sessionData[currentQuestionIndex].question, transcript.trim() || "No verbal answer provided.", currentDifficulty, requiresCode ? codeBuffers[language] : undefined, timer);
        await handleNextTurn(feedback, false);
    };

    const handleSkipQuestion = async () => {
        setIsTimerRunning(false);
        stopListening();
        window.speechSynthesis.cancel();
        setIsEvaluating(true);
        const feedback = await evaluateAnswer(sessionData[currentQuestionIndex].question, "Skipped by user.", currentDifficulty, undefined, timer);
        await handleNextTurn(feedback, true);
    };

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            // User manually starts recording - interrupt AI and start timer
            window.speechSynthesis.cancel();
            setIsAiSpeaking(false);
            startListening();
            setIsTimerRunning(true);
        }
    };

    const handleEndInterview = async () => {
        if (isEnding) return;
        setIsEnding(true);
        setIsTimerRunning(false);
        stopListening();
        window.speechSynthesis.cancel();
        
        try {
            let finalSessionData = [...sessionData];
            const currentQnA = sessionData[currentQuestionIndex];
            
            if (currentQnA && !currentQnA.feedback) {
                setIsEvaluating(true);
                const finalAnswer = transcript.trim() || (requiresCode && codeBuffers[language].trim() ? "Code provided but no verbal answer." : "Skipped/Ended abruptly.");
                const feedback = await evaluateAnswer(currentQnA.question, finalAnswer, currentDifficulty, requiresCode ? codeBuffers[language] : undefined, timer);
                finalSessionData[currentQuestionIndex] = { ...currentQnA, answer: finalAnswer, code: requiresCode ? codeBuffers[language] : undefined, requiresCode, duration: timer, status: (transcript.trim() || (requiresCode && codeBuffers[language].trim())) ? 'answered' : 'skipped', feedback };
                setIsEvaluating(false);
            }
            
            sessionStorage.setItem('interviewResults', JSON.stringify(finalSessionData));
            navigate('/results');
        } catch (error) {
            console.error("Error ending interview:", error);
            // Even if evaluation fails, try to navigate with what we have
            sessionStorage.setItem('interviewResults', JSON.stringify(sessionData));
            navigate('/results');
        } finally {
            setIsEnding(false);
        }
    };
    
    useEffect(() => {
        const storedConfig = sessionStorage.getItem('interviewConfig');
        if (!storedConfig) { navigate('/pre-interview'); return; }
        const parsed = JSON.parse(storedConfig);
        setConfig(parsed);
        const initialLang = getDefaultLanguage(parsed.jobRole);
        setLanguage(initialLang);
        (async () => {
            setIsEvaluating(true);
            const result = await generateQuestion(parsed.jobRole, parsed.interviewType, 'medium', 1, [], parsed.resumeData);
            setSessionData([{ question: result.question, answer: '', requiresCode: result.requiresCode }]);
            setCurrentDifficulty(result.difficulty);
            setRequiresCode(result.requiresCode);
            setIsEvaluating(false);
            setIsAiSpeaking(true);
            setTimeout(() => {
                speak(result.question, () => { 
                    setIsAiSpeaking(false); 
                    setIsTimerRunning(true); 
                });
            }, 300);
        })();
    }, []);

    if (!config) return <div className="flex flex-col items-center justify-center p-8 h-screen bg-white"><SparkIcon className="w-20 h-20 animate-pulse mb-6" /><h2 className="text-2xl font-black text-gray-900 tracking-tight text-center">Initializing Adaptive Interview Session...</h2></div>;

    const currentQnA = sessionData[currentQuestionIndex];
    const getIndicatorColor = (index: number) => index === currentQuestionIndex ? 'bg-indigo-600 scale-125' : sessionData[index]?.status === 'answered' ? 'bg-green-500' : sessionData[index]?.status === 'skipped' ? 'bg-red-500' : 'bg-gray-100';

    return (
        <div className="w-full h-screen bg-white flex flex-col overflow-hidden">
            <header className="flex justify-between items-center bg-white px-8 py-4 border-b border-gray-100 shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><SparkIcon className="w-7 h-7" /><span className="text-xl font-black text-gray-900 tracking-tighter uppercase">INTERVIEW</span></div>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex items-center gap-3"><span className="text-xs font-black text-gray-400 uppercase tracking-widest">Questions</span><div className="flex gap-1.5">{Array.from({ length: totalQuestions }).map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${getIndicatorColor(i)}`}></div>)}</div></div>
                </div>
                <div className="flex items-center gap-6"><Timer seconds={timer} /><button onClick={handleEndInterview} disabled={isEnding} className={`text-xs font-black uppercase tracking-widest transition-colors ${isEnding ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}`}>{isEnding ? 'Processing...' : 'End Session'}</button></div>
            </header>
            <main className="flex-grow flex flex-row overflow-hidden p-6 gap-6">
                <aside className="flex flex-col w-[30%] gap-6 shrink-0"><InterviewVitals current={currentQuestionIndex + 1} total={totalQuestions} /><div className="flex-grow bg-white rounded-[2.5rem] border border-gray-200 shadow-xl flex flex-col items-center justify-center p-8 relative"><InterviewAvatar isSpeaking={isAiSpeaking} isListening={isListening} /></div></aside>
                <section className="flex flex-col flex-grow gap-6 overflow-hidden h-full">
                    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-lg p-10 shrink-0">{isEvaluating && !currentQnA ? <div className="flex flex-col items-center py-4"><RefreshIcon className="w-8 h-8 animate-spin mb-3" /><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Generating Analysis...</p></div> : <div className="flex gap-6"><div className="p-4 bg-indigo-600 text-white rounded-2xl h-fit shrink-0"><BarChartIcon className="w-6 h-6" /></div><h2 className="text-2xl font-bold text-gray-900 leading-tight">{currentQnA?.question || "Awaiting AI prompt..."}</h2></div>}</div>
                    <div className="flex-grow flex flex-col overflow-hidden">
                        {requiresCode ? (
                            <div className="flex-grow bg-white rounded-[2.5rem] border border-gray-200 p-2 flex flex-col overflow-hidden">
                                <CodeEditor 
                                    code={codeBuffers[language]} 
                                    setCode={(newCode) => setCodeBuffers(prev => ({ ...prev, [language]: newCode }))} 
                                    language={language} 
                                    setLanguage={setLanguage} 
                                />
                                <div className="p-4 flex justify-between items-center shrink-0">
                                    <div className="flex gap-3">
                                        <button onClick={handleToggleListening} className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isListening ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent'}`}>
                                            {isListening ? <><StopIcon className="w-4 h-4"/> Stop Voice</> : <><MicIcon className="w-4 h-4"/> Voice Assist</>}
                                        </button>
                                        <button onClick={handleSkipQuestion} disabled={isEvaluating} className="px-6 py-2.5 bg-white text-gray-400 hover:text-red-500 font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50">{isEvaluating ? 'Syncing...' : 'Skip Question'}</button>
                                    </div>
                                    <button onClick={handleNextQuestion} disabled={isEvaluating} className="px-10 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl disabled:bg-gray-300 transition-all text-xs">{isEvaluating ? 'Analyzing...' : 'Submit implementation'}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow bg-white rounded-[2.5rem] border border-gray-200 p-10 flex flex-col overflow-hidden">
                                <div className="flex justify-between items-center mb-6 shrink-0"><div className="flex items-center gap-3"><div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><MicIcon className="w-5 h-5"/></div><h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Response Transcript</h3></div><button onClick={handleToggleListening} className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isListening ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95'}`}>{isListening ? <><StopIcon className="w-4 h-4"/> Stop Transmitting</> : <><MicIcon className="w-4 h-4"/> Start Recording</>}</button></div>
                                <div className="bg-gray-50 rounded-[2rem] p-10 flex-grow border border-gray-100 overflow-y-auto shadow-inner group">{transcript ? <p className="text-gray-800 text-xl font-medium leading-relaxed italic">"{transcript}"</p> : <div className="h-full flex flex-col items-center justify-center text-gray-400"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm"><MicIcon className="w-10 h-10 opacity-30" /></div><p className="text-sm font-bold uppercase tracking-widest opacity-40">Share your professional experience</p></div>}</div>
                                <div className="mt-8 flex justify-between items-center shrink-0"><button onClick={handleSkipQuestion} disabled={isEvaluating} className="px-8 py-3 bg-white text-gray-400 hover:text-red-500 font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50">{isEvaluating ? 'Evaluating...' : 'Skip this question'}</button><button onClick={handleNextQuestion} disabled={isEvaluating || !transcript} className="px-12 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-2xl disabled:bg-gray-300 transition-all text-xs">{isEvaluating ? 'Calibrating...' : 'Next Question'}</button></div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
             {!isApiSupported && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest bg-red-600 px-6 py-2 rounded-full shadow-2xl z-50">Speech Recognition Offline</div>}
        </div>
    );
};

export default InterviewPage;
