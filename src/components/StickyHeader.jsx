import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Ball } from './ui/Doodles';
import { leagueConfig } from '../data/leagueData';

const StickyHeader = ({
  authStatus,
  isRefreshing,
  onRefresh,
  lastUpdated
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Split "BRO League 5" into "BRO League" + "5" so the trailing
  // number/edition can be styled separately, without hardcoding it here.
  const nameParts = leagueConfig.name.split(' ');
  const leagueEdition = nameParts.pop();
  const leagueBaseName = nameParts.join(' ');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-surface/95 backdrop-blur-md border-b-2 border-ink/85 py-3'
          : 'bg-transparent py-5'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo Area — the ball rolls on hover */}
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer shrink-0">
                <span className="absolute -inset-1 rounded-full bg-sunflower opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex w-10 h-10 items-center justify-center rounded-full bg-surface-alt border-2 border-ink/85 shadow-pop-sm">
                  <Ball size={24} className="transition-transform duration-700 group-hover:rotate-180" />
                </span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl tracking-tight text-ink leading-none">
                  {leagueBaseName}{' '}
                  <span className="inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 rounded-lg bg-coral text-white border-2 border-ink/85 text-base align-middle">
                    {leagueEdition}
                  </span>
                </h1>
                <p className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft mt-0.5">
                  Fantasy Premier League
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Badge variant={authStatus?.authenticated ? 'success' : 'warning'}>
                <span className={`w-2 h-2 rounded-full ${authStatus?.authenticated ? 'bg-pitch animate-pulse' : 'bg-tangerine'}`} />
                {authStatus?.authenticated ? 'Live Data' : 'Offline Mode'}
              </Badge>

              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
                  <Clock size={12} />
                  <span>{lastUpdated.toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
                </div>
              )}

              <div className="h-6 w-0.5 bg-ink/15 mx-1" />

              <button
                onClick={toggleTheme}
                aria-label="Toggle colour theme"
                className="p-2 rounded-xl border-2 border-ink/85 bg-surface-alt text-ink shadow-pop-sm hover:bg-sunflower transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={onRefresh}
                isLoading={isRefreshing}
              >
                {!isRefreshing && <RefreshCw size={16} />}
                {isRefreshing ? 'Syncing...' : 'Refresh'}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle colour theme"
                className="p-2 rounded-xl border-2 border-ink/85 bg-surface-alt text-ink shadow-pop-sm"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
                className="p-2 rounded-xl border-2 border-ink/85 bg-violet text-white shadow-pop-sm"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-surface pt-24 px-4 md:hidden"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between p-4 bg-surface-alt rounded-2xl border-2 border-ink/85 shadow-card">
                <span className="font-bold text-ink-soft">Status</span>
                <Badge variant={authStatus?.authenticated ? 'success' : 'warning'}>
                  {authStatus?.authenticated ? 'Live' : 'Offline'}
                </Badge>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  onRefresh();
                  setIsMobileMenuOpen(false);
                }}
                isLoading={isRefreshing}
                className="w-full justify-center"
              >
                Refresh Data
              </Button>

              {lastUpdated && (
                <div className="text-center text-sm font-bold text-ink-soft">
                  Last updated: {lastUpdated.toLocaleTimeString('en-US', { timeStyle: 'short' })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StickyHeader;
