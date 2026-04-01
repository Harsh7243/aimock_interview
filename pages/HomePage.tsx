
import React from 'react';
import type { User } from '@firebase/auth';
import { LandingPage } from '../components/LandingPage';

interface HomePageProps {
    user: User | null;
    navigate: (path: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, navigate }) => {
    // Both logged in and guests use the LandingPage component as their tool-selection hub.
    return <LandingPage user={user} navigate={navigate} />;
};

export default HomePage;
