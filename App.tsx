
import React, { useState, useEffect } from 'react';
import type { User } from '@firebase/auth';
import { onAuthChange } from './services/firebase';
import { SparkIcon } from './components/icons';
import { AppHeader } from './components/AppHeader';

import HomePage from './pages/HomePage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import PreInterviewPage from './pages/PreInterviewPage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';

// Simple client-side navigation
export const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
};

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const handleLocationChange = () => setPath(window.location.pathname);
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                 <SparkIcon className="w-20 h-20 text-indigo-600 animate-pulse" />
            </div>
        );
    }

    const renderPage = () => {
        // Shared logic: All users see the Landing Hub at "/"
        if (path === '/' || path === '/dashboard') {
            return <HomePage user={user} navigate={navigate} />;
        }

        // Protected Routes: Redirect guests to home if they try to access internal pages directly
        if (!user) {
            return <HomePage user={null} navigate={navigate} />;
        }

        switch (path) {
            case '/resume-analyzer':
                return <ResumeAnalyzerPage user={user} navigate={navigate} />;
            case '/pre-interview':
                return <PreInterviewPage user={user} navigate={navigate} />;
            case '/interview':
                return <InterviewPage user={user} navigate={navigate} />;
            case '/results':
                return <ResultsPage user={user} navigate={navigate} />;
            case '/history':
                return <HistoryPage user={user} navigate={navigate} />;
            default:
                return <HomePage user={user} navigate={navigate} />;
        }
    };
    
    // Header is always shown now to provide the Sign In button
    const showHeader = path !== '/interview';

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            <div className="fixed inset-0 bg-grid-gray-200/[0.5] [mask-image:linear-gradient(to_bottom,white_5%,transparent_90%)] pointer-events-none"></div>
            {showHeader && <AppHeader user={user} navigate={navigate} />}
            <main className={`relative z-10 flex items-center justify-center min-h-screen px-4 ${showHeader ? 'pt-24 pb-10' : ''}`}>
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
