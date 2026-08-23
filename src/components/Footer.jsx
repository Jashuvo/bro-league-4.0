import React from 'react';
import { Heart, Github, Twitter, Instagram } from 'lucide-react';
import Badge from './ui/Badge';
import { TrophyCup, Jersey, Confetti } from './ui/Doodles';
import { leagueConfig } from '../data/leagueData';

const Footer = ({ gameweekInfo, standings, authStatus, bootstrap, leagueStats }) => {
  const { entryFee, totalPrizePool, name: leagueName } = leagueConfig;

  // Live headcount — leagueStats.totalManagers is FPL's real count (covers
  // the whole league even if standings itself is capped for performance);
  // standings.length is the next best thing. No hardcoded number: while
  // nothing has loaded yet this is null and the UI shows a placeholder
  // instead of a guessed participant count.
  const actualParticipants = leagueStats?.totalManagers ?? standings?.length ?? null;

  // Get current gameweek from API or fallback to environment/default
  const currentGameweek = gameweekInfo?.current || 1;
  const totalGameweeks = gameweekInfo?.total || 38;

  // Get current season year from bootstrap data or calculate from current date
  const currentYear = new Date().getFullYear();
  const seasonYear = bootstrap?.gameweeks?.[0]?.deadline_time
    ? new Date(bootstrap.gameweeks[0].deadline_time).getFullYear()
    : currentYear;

  return (
    <footer className="relative z-10 mt-20 border-t-2 border-ink/85 bg-surface-alt pt-14 pb-8 overflow-hidden">
      <Confetti className="absolute inset-x-0 top-0 h-16 opacity-80 pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 shrink-0 rounded-2xl bg-sunflower border-2 border-ink/85 shadow-pop-sm flex items-center justify-center">
                <TrophyCup size={26} tone="fill-surface-alt" />
              </span>
              <h3 className="text-2xl font-display font-bold text-ink">
                {leagueName}
              </h3>
            </div>
            <p className="text-ink-soft leading-relaxed font-medium">
              The ultimate Fantasy Premier League competition among friends.
              <span className="text-ink font-bold"> {actualParticipants ?? '–'} bros</span>, one champion, endless memories.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink icon={Github} href="#" label="GitHub" />
              <SocialLink icon={Twitter} href="#" label="Twitter" />
              <SocialLink icon={Instagram} href="#" label="Instagram" />
            </div>
          </div>

          {/* Stats Column */}
          <div className="md:col-span-4 md:col-start-6 space-y-4">
            <h4 className="text-xs font-display font-bold text-ink uppercase tracking-[0.18em]">League Stats</h4>
            <ul className="space-y-3">
              <StatRow label="Total Prize Pool" value={`৳${totalPrizePool.toLocaleString()}`} valueColor="text-pitch" />
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
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-display font-bold text-ink uppercase tracking-[0.18em]">Season Info</h4>
            <div className="p-4 rounded-2xl bg-mint/20 border-2 border-ink/85 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <Jersey size={26} tone="fill-mint" />
                <span className="font-bold text-ink">{actualParticipants ?? '–'} Participants</span>
              </div>
              <div className="text-sm text-ink-soft font-semibold">
                Season {seasonYear}/{String(seasonYear + 1).slice(-2)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="rule-confetti mb-6 opacity-80" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm font-semibold text-ink-soft">
          <div>
            © {currentYear} {leagueName}. Built with React + Vite
          </div>
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Heart size={14} className="text-coral fill-coral animate-pulse" />
            <span>for the bros</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({ icon: Icon, href, label }) => (
  <a
    href={href}
    aria-label={label}
    className="w-10 h-10 rounded-full bg-surface border-2 border-ink/85 flex items-center justify-center text-ink hover:bg-violet hover:text-white transition-colors"
  >
    <Icon size={18} />
  </a>
);

const StatRow = ({ label, value, valueColor = "text-ink" }) => (
  <li className="flex items-center justify-between gap-3 border-b-2 border-dashed border-ink/12 pb-2 last:border-0">
    <span className="text-ink-soft font-semibold">{label}</span>
    <span className={`font-display font-bold ${valueColor}`}>{value}</span>
  </li>
);

export default Footer;
