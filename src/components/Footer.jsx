import React from 'react';
import { Heart, Trophy, Users, Github, Twitter, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';

const Footer = ({ gameweekInfo, standings, authStatus, bootstrap }) => {
  // Get environment variables
  const totalParticipants = import.meta.env.VITE_TOTAL_PARTICIPANTS || 15;
  const entryFee = import.meta.env.VITE_ENTRY_FEE || 800;
  const totalPrizePool = import.meta.env.VITE_TOTAL_PRIZE_POOL || 12000;
  const leagueName = import.meta.env.VITE_LEAGUE_NAME || "BRO League 4.0";

  // Calculate actual participants from API data
  const actualParticipants = standings?.length || totalParticipants;

  // Get current gameweek from API or fallback to environment/default
  const currentGameweek = gameweekInfo?.current || 3;
  const totalGameweeks = gameweekInfo?.total || 38;

  // Get current season year from bootstrap data or calculate from current date
  const currentYear = new Date().getFullYear();
  const seasonYear = bootstrap?.gameweeks?.[0]?.deadline_time
    ? new Date(bootstrap.gameweeks[0].deadline_time).getFullYear()
    : currentYear;

  return (
    <footer className="relative mt-20 border-t border-base-content/10 bg-base-200 pt-16 pb-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-bro-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-bro-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-bro-primary to-bro-secondary rounded-xl flex items-center justify-center shadow-lg shadow-bro-primary/20">
                <Trophy className="text-white" size={20} />
              </div>
              <h3 className="text-2xl font-display font-bold text-white">
                {leagueName}
              </h3>
            </div>
            <p className="text-bro-muted leading-relaxed">
              The ultimate Fantasy Premier League competition among friends.
              <span className="text-white font-medium"> {actualParticipants} bros</span>, one champion, endless memories.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink icon={Github} href="#" />
              <SocialLink icon={Twitter} href="#" />
              <SocialLink icon={Instagram} href="#" />
            </div>
          </div>

          {/* Stats Column */}
          <div className="md:col-span-4 md:col-start-6 space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">League Stats</h4>
            <ul className="space-y-4">
              <StatRow label="Total Prize Pool" value={`৳${totalPrizePool.toLocaleString()}`} valueColor="text-bro-secondary" />
              <StatRow label="Entry Fee" value={`৳${entryFee}`} />
              <StatRow label="Current Gameweek" value={`${currentGameweek}/${totalGameweeks}`} />
              <StatRow
                label="API Status"
                value={
                  <Badge variant={authStatus?.authenticated ? 'success' : 'warning'}>
                    {authStatus?.authenticated ? 'Live' : 'Offline'}
                  </Badge>
                }
              />
            </ul>
          </div>

          {/* Quick Links / Info */}
          <div className="md:col-span-3 space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Season Info</h4>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-bro-primary" size={18} />
                <span className="font-medium text-white">{actualParticipants} Participants</span>
              </div>
              <div className="text-sm text-bro-muted">
                Season {seasonYear}/{seasonYear + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-bro-muted">
          <div>
            © {currentYear} {leagueName}. Built with React + Vite
          </div>
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
            <span>for the bros</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ icon: Icon, href }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-bro-muted hover:bg-bro-primary hover:text-white transition-all duration-300"
  >
    <Icon size={18} />
  </a>
);

const StatRow = ({ label, value, valueColor = "text-white" }) => (
  <li className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
    <span className="text-bro-muted">{label}</span>
    <span className={`font-medium ${valueColor}`}>{value}</span>
  </li>
);

export default Footer;