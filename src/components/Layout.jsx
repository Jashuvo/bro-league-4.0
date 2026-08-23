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
    bootstrap,
    leagueStats
}) => {
    return (
        <div className="min-h-screen bg-base-100 text-base-content transition-colors duration-300 flex flex-col">
            <StickyHeader
                authStatus={authStatus}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                performanceInfo={performanceInfo}
                lastUpdated={lastUpdated}
            />

            {/* This element's animated `y` leaves a CSS transform in its
                inline style even at rest, which makes it the containing
                block for any `position: fixed` descendant instead of the
                viewport — a `fixed inset-0` modal rendered anywhere inside
                `children` won't actually cover the screen. Any full-screen
                overlay/modal (see TeamView.jsx, PrizeBreakdown.jsx) needs to
                render via ReactDOM.createPortal(..., document.body) to
                escape this and behave like a real fixed overlay. */}
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
                leagueStats={leagueStats}
            />
        </div>
    );
};

export default Layout;
