// src/components/Hero.jsx
import { Trophy, Users, Calendar, Target } from 'lucide-react'

const Hero = ({ leagueConfig, gameweekInfo }) => {
  const gameweeksLeft = gameweekInfo.total - gameweekInfo.current

  return (
    <div className="hero min-h-[50vh] bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 animate-bounce">⚽</div>
        <div className="absolute top-20 right-20 animate-pulse">🏆</div>
        <div className="absolute bottom-20 left-20 animate-ping">⭐</div>
        <div className="absolute bottom-10 right-10 animate-bounce delay-1000">🔥</div>
      </div>
      
      <div className="hero-content text-center text-white relative z-10">
        <div className="max-w-4xl">
          <h1 className="mb-6 text-4xl md:text-6xl font-bold animate-fade-in">
            <Trophy className="inline mr-4 text-yellow-400" size={60} />
            {leagueConfig.name}
          </h1>
          
          <p className="mb-8 text-lg md:text-xl opacity-90">
            Season {leagueConfig.season} • 15 Bros Competing
          </p>
          
          <div className="mb-8">
            <div className="badge badge-accent badge-lg text-lg p-4 mb-4">
              Gameweek {gameweekInfo.current} of {gameweekInfo.total}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="stat bg-white/10 backdrop-blur rounded-lg">
              <div className="stat-figure text-yellow-400">
                <Trophy size={32} />
              </div>
              <div className="stat-title text-white/80">Prize Pool</div>
              <div className="stat-value text-yellow-400 text-2xl">
                {leagueConfig.currency}{leagueConfig.totalPrizePool.toLocaleString()}
              </div>
            </div>
            
            <div className="stat bg-white/10 backdrop-blur rounded-lg">
              <div className="stat-figure text-bro-secondary">
                <Users size={32} />
              </div>
              <div className="stat-title text-white/80">Participants</div>
              <div className="stat-value text-bro-secondary text-2xl">
                {leagueConfig.totalParticipants}
              </div>
            </div>
            
            <div className="stat bg-white/10 backdrop-blur rounded-lg">
              <div className="stat-figure text-blue-300">
                <Calendar size={32} />
              </div>
              <div className="stat-title text-white/80">GWs Left</div>
              <div className="stat-value text-blue-300 text-2xl">
                {gameweeksLeft}
              </div>
            </div>
            
            <div className="stat bg-white/10 backdrop-blur rounded-lg">
              <div className="stat-figure text-pink-300">
                <Target size={32} />
              </div>
              <div className="stat-title text-white/80">Entry Fee</div>
              <div className="stat-value text-pink-300 text-2xl">
                {leagueConfig.currency}{leagueConfig.entryFee}
              </div>
            </div>
          </div>

          {/* Islamic greeting */}
          <div className="mt-8 text-sm opacity-80">
            "Assalamualaikum Everyone! 🤝 May the best manager win! 🏆"
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero