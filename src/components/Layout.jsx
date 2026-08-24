import React from 'react';
import StickyHeader from './StickyHeader';
import Footer from './Footer';
import AppNav from './AppNav';
import { motion } from 'framer-motion';
import { Blob } from './ui/Doodles';

// ─── APP SHELL ──────────────────────────────────────────────────────────────
//
// Two presentations of one structure:
//
//   desktop (lg+)  fixed 236px sidebar on the left carries brand, the four
//                  destinations, sync status and the theme toggle; the content
//                  column is inset by that width and its CommandBar sticks to
//                  the very top, so there is no second header bar.
//   mobile         a slim 56px top bar keeps the brand and theme, the
//                  CommandBar sticks directly beneath it (hence its `top-14`),
//                  and the same four destinations dock to the bottom edge.
//
// SIDEBAR_INSET is the one place the sidebar's width is spent — AppNav owns
// the width itself (`w-[236px]`), this matches it.
const SIDEBAR_INSET = 'lg:pl-[236px]';

const Layout = ({
    children,
    activeTab,
    onTabChange,
    authStatus,
    lastUpdated,
    gameweekInfo,
    standings,
    bootstrap,
    leagueStats
}) => {
    return (
        <div className="relative min-h-screen bg-surface text-ink transition-colors duration-300">
            {/* Amorphous color fields behind everything. Blobs, never a
                grass/pitch texture — the surface stays flat cream. */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
                <Blob className="w-[38rem] h-[38rem] -left-56 -top-40" tone="fill-violet" opacity={0.1} variant={0} />
                <Blob className="w-[30rem] h-[30rem] -right-40 top-1/3" tone="fill-mint" opacity={0.1} variant={1} />
                <Blob className="w-[26rem] h-[26rem] left-1/4 bottom-10" tone="fill-sunflower" opacity={0.09} variant={2} />
            </div>

            {/* Primary navigation, desktop presentation. Fixed, so it stays put
                while the content column scrolls independently. */}
            <AppNav
                variant="sidebar"
                activeTab={activeTab}
                onTabChange={onTabChange}
                authStatus={authStatus}
                lastUpdated={lastUpdated}
            />

            <div className={`relative z-10 flex min-h-screen flex-col ${SIDEBAR_INSET}`}>
                {/* Mobile-only chrome: the desktop sidebar covers all of this. */}
                <StickyHeader authStatus={authStatus} lastUpdated={lastUpdated} />

                {/* This element's animated `y` leaves a CSS transform in its
                    inline style even at rest, which makes it the containing
                    block for any `position: fixed` descendant instead of the
                    viewport — a `fixed inset-0` modal rendered anywhere inside
                    `children` won't actually cover the screen. Any full-screen
                    overlay/modal (see TeamView.jsx, PrizeBreakdown.jsx) needs to
                    render via ReactDOM.createPortal(..., document.body) to
                    escape this and behave like a real fixed overlay.

                    `pt-14` clears the fixed mobile header; on desktop there is
                    no header to clear, so the CommandBar goes flush to the top. */}
                <motion.main
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex-grow pt-14 lg:pt-0"
                >
                    {children}
                </motion.main>

                {/* Extra bottom room on mobile so the docked nav never sits on
                    top of the last line of the footer. */}
                <div className="pb-16 lg:pb-0">
                    <Footer
                        gameweekInfo={gameweekInfo}
                        standings={standings}
                        authStatus={authStatus}
                        bootstrap={bootstrap}
                        leagueStats={leagueStats}
                    />
                </div>
            </div>

            {/* Primary navigation, mobile presentation — same destinations, same
                active state, docked to the bottom edge. */}
            <AppNav
                variant="bottom"
                activeTab={activeTab}
                onTabChange={onTabChange}
            />
        </div>
    );
};

export default Layout;
