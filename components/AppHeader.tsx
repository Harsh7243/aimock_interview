
import React, { useState } from 'react';
import type { User } from '@firebase/auth';
import { logout, signInWithGoogle } from '../services/firebase';
import { SparkIcon, HistoryIcon, LogoutIcon, GoogleIcon } from './icons';

interface AppHeaderProps {
    user: User | null;
    navigate: (path: string) => void;
}

export const AppHeader = ({ user, navigate }: AppHeaderProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleHistoryClick = () => {
        setDropdownOpen(false);
        navigate('/history');
    };
    
    const handleLogoClick = () => {
        navigate('/');
    }

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 p-4 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="container mx-auto flex justify-between items-center px-4">
                <button onClick={handleLogoClick} className="flex items-center gap-2 group">
                     <SparkIcon className="h-8 w-8 transform group-hover:rotate-12 transition-transform" />
                     <span className="text-2xl font-black text-gray-900 tracking-tight">CareerAI</span>
                </button>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="relative">
                            <button onClick={() => setDropdownOpen(prev => !prev)} className="flex items-center gap-4 focus:outline-none">
                               <div className="text-right hidden sm:block">
                                   <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                               </div>
                               <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border-2 border-indigo-100 hover:border-indigo-500 transition-colors" />
                            </button>
                            {dropdownOpen && (
                                 <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl py-2 border border-gray-100 z-50 overflow-hidden">
                                     <button
                                         onClick={handleHistoryClick}
                                         className="w-full text-left flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-indigo-50 transition-colors"
                                     >
                                         <HistoryIcon className="w-5 h-5 text-gray-400" />
                                         Interview History
                                     </button>
                                     <div className="border-t border-gray-100 my-1"></div>
                                     <button
                                         onClick={logout}
                                         className="w-full text-left flex items-center gap-3 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                     >
                                          <LogoutIcon className="w-5 h-5" />
                                          Logout
                                     </button>
                                 </div>
                            )}
                        </div>
                    ) : (
                        <button 
                            onClick={handleLogin}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <GoogleIcon className="w-4 h-4" />
                            Sign in with Google
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
