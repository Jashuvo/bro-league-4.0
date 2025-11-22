import React from 'react';
import StickyHeader from './StickyHeader';
import Footer from './Footer';
import { motion } from 'framer-motion';

const Layout = ({
    children,
    authStatus,
    isRefreshing,
    onRefresh,
    performanceInfo,
    lastUpdated,
    gameweekInfo,
    standings,
    bootstrap
}) => {
    return (
        <div className="min-h-screen bg-bro-dark text-bro-text transition-colors duration-300 flex flex-col">
            <StickyHeader
                authStatus={authStatus}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                performanceInfo={performanceInfo}
                lastUpdated={lastUpdated}
            />

            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-grow pt-20" // Add padding top to account for fixed header
            >
                {children}
            </motion.main>

            <Footer
                gameweekInfo={gameweekInfo}
                standings={standings}
                authStatus={authStatus}
                bootstrap={bootstrap}
            />
        </div>
    );
};

export default Layout;
