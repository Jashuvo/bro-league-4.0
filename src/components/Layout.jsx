import React from 'react';
import StickyHeader from './StickyHeader';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { Blob } from './ui/Doodles';

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
        <div className="relative min-h-screen bg-surface text-ink transition-colors duration-300 flex flex-col">
            {/* Amorphous color fields behind everything. Blobs, never a
                grass/pitch texture — the surface stays flat cream. */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
                <Blob className="w-[38rem] h-[38rem] -left-56 -top-40" tone="fill-violet" opacity={0.1} variant={0} />
                <Blob className="w-[30rem] h-[30rem] -right-40 top-1/3" tone="fill-mint" opacity={0.1} variant={1} />
                <Blob className="w-[26rem] h-[26rem] left-1/4 bottom-10" tone="fill-sunflower" opacity={0.09} variant={2} />
            </div>

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
                className="relative z-10 flex-grow pt-20" // Add padding top to account for fixed header
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
