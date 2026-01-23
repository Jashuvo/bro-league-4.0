import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Clock, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import Badge from './ui/Badge';

const StickyHeader = ({
  authStatus,
  isRefreshing,
  onRefresh,
  performanceInfo,
  lastUpdated
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
          ? 'bg-base-100/80 backdrop-blur-xl border-b border-base-content/10 py-3 shadow-lg'
          : 'bg-transparent py-5'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-bro-primary to-bro-secondary rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                <div className="relative w-10 h-10 bg-base-200 rounded-xl flex items-center justify-center border border-base-content/10">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-bro-secondary to-bro-primary font-bold text-sm">BR</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display font-bold text-xl tracking-tight text-base-content">
                  BRO League <span className="text-bro-secondary">4.0</span>
                </h1>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Badge variant={authStatus?.authenticated ? 'success' : 'warning'} className="animate-pulse-slow">
                {authStatus?.authenticated ? 'Live Data' : 'Offline Mode'}
              </Badge>

              {lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs text-bro-muted">
                  <Clock size={12} />
                  <span>{lastUpdated.toLocaleTimeString('en-US', { timeStyle: 'short' })}</span>
                </div>
              )}

              <div className="h-6 w-px bg-base-content/10 mx-2"></div>

              <button
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="p-2 rounded-lg text-bro-muted hover:text-base-content hover:bg-base-content/5 transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={onRefresh}
                isLoading={isRefreshing}
                className="btn-primary-glow"
              >
                {!isRefreshing && <RefreshCw size={16} className="mr-2" />}
                {isRefreshing ? 'Syncing...' : 'Refresh Data'}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-bro-muted hover:text-base-content hover:bg-base-content/5 transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                className="p-2 text-base-content"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="fixed inset-0 z-40 bg-base-100/95 backdrop-blur-xl pt-24 px-4 md:hidden"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between p-4 bg-base-content/5 rounded-xl border border-base-content/10">
                <span className="text-bro-muted">Status</span>
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
                <div className="text-center text-sm text-bro-muted">
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