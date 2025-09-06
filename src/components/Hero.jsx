// src/components/Hero.jsx
import { Trophy, Users, Calendar, Target } from 'lucide-react'

const Hero = ({ leagueConfig, gameweekInfo }) => {
  const gameweeksLeft = gameweekInfo.total - gameweekInfo.current

  return (
    <div className="hero min-h-[50vh] bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 relative">
      <div className="hero-content text-center text-white">
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
            <div className="stat bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-center">
                <Trophy className="mx-auto text-yellow-400 mb-2" size={32} />
                <div className="text-sm text-white/80">Prize Pool</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {leagueConfig.currency}{leagueConfig.totalPrizePool.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="stat bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-center">
                <Users className="mx-auto text-green-400 mb-2" size={32} />
                <div className="text-sm text-white/80">Participants</div>
                <div className="text-2xl font-bold text-green-400">
                  {leagueConfig.totalParticipants}
                </div>
              </div>
            </div>
            
            <div className="stat bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-center">
                <Calendar className="mx-auto text-blue-300 mb-2" size={32} />
                <div className="text-sm text-white/80">GWs Left</div>
                <div className="text-2xl font-bold text-blue-300">
                  {gameweeksLeft}
                </div>
              </div>
            </div>
            
            <div className="stat bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-center">
                <Target className="mx-auto text-pink-300 mb-2" size={32} />
                <div className="text-sm text-white/80">Entry Fee</div>
                <div className="text-2xl font-bold text-pink-300">
                  {leagueConfig.currency}{leagueConfig.entryFee}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-sm opacity-80">
            "Assalamualaikum Everyone! 🤝 May the best manager win! 🏆"
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero