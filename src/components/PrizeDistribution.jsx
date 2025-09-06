// src/components/PrizeDistribution.jsx
import { Trophy, Gift, DollarSign } from 'lucide-react'
import { prizeDistribution, leagueConfig } from '../data/leagueData'

const PrizeDistribution = () => {
  return (
    <div id="prizes" className="space-y-8">
      {/* Prize Pool Overview */}
      <div className="card bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl">
        <div className="card-body text-center">
          <h2 className="card-title text-3xl justify-center mb-4">
            <DollarSign size={36} />
            Total Prize Pool
          </h2>
          <div className="text-5xl font-bold text-yellow-300 mb-4">
            ৳{leagueConfig.totalPrizePool.toLocaleString()}
          </div>
          <div className="text-lg opacity-90">
            Entry Fee: ৳{leagueConfig.entryFee} × {leagueConfig.totalParticipants} participants
          </div>
        </div>
      </div>

      {/* Season Top 3 Prizes */}
      <div className="card bg-white/10 backdrop-blur shadow-2xl">
        <div className="card-body">
          <h3 className="card-title text-2xl text-white mb-6">
            🏆 Season Champion Awards
            <div className="badge badge-accent">৳{prizeDistribution.season.total}</div>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizeDistribution.season.breakdown.map((prize, index) => (
              <div 
                key={prize.position}
                className={`
                  card shadow-xl text-center p-6
                  ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                    'bg-gradient-to-br from-orange-400 to-orange-600 text-black'}
                `}
              >
                <div className="text-6xl mb-4">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <h4 className="text-2xl font-bold">{prize.title}</h4>
                <div className="text-4xl font-bold my-2">
                  ৳{prize.amount}
                </div>
                <div className="badge badge-neutral">
                  {((prize.amount / prizeDistribution.season.total) * 100).toFixed(0)}% of season pool
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prize Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Prizes */}
        <div className="card bg-white/10 backdrop-blur shadow-2xl">
          <div className="card-body">
            <h3 className="card-title text-xl text-white mb-4">
              📅 Monthly Awards
              <div className="badge badge-secondary">৳{prizeDistribution.monthly.total}</div>
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-bold text-green-400 mb-2">Months 1-8 (Regular)</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-yellow-400">1st: ৳350</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-300">2nd: ৳250</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-400">3rd: ৳150</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Each month = 4 gameweeks</div>
              </div>

              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-4 rounded-lg border border-green-400/30">
                <h4 className="font-bold text-green-400 mb-2">Month 9 (Final) - GW 33-38</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-yellow-400">1st: ৳500</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-300">2nd: ৳400</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-400">3rd: ৳250</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Final 6 gameweeks - Higher stakes!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly & Souvenirs */}
        <div className="space-y-6">
          
          {/* Weekly Prizes */}
          <div className="card bg-white/10 backdrop-blur shadow-2xl">
            <div className="card-body">
              <h3 className="card-title text-xl text-white mb-4">
                ⚡ Weekly Awards
                <div className="badge badge-warning">৳{prizeDistribution.weekly.total}</div>
              </h3>
              
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  ৳{prizeDistribution.weekly.perGameweek}
                </div>
                <div className="text-white">Mobile Recharge</div>
                <div className="text-sm text-gray-400">
                  Every gameweek's highest scorer
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {prizeDistribution.weekly.totalGameweeks} gameweeks × ৳{prizeDistribution.weekly.perGameweek}
                </div>
              </div>
            </div>
          </div>

          {/* Souvenirs */}
          <div className="card bg-white/10 backdrop-blur shadow-2xl">
            <div className="card-body">
              <h3 className="card-title text-xl text-white mb-4">
                🎁 Souvenirs
                <div className="badge badge-info">৳{prizeDistribution.souvenirs.total}</div>
              </h3>
              
              <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 p-4 rounded-lg text-center">
                <div className="text-4xl mb-2">👕</div>
                <div className="font-bold text-green-400 mb-2">
                  Official BRO League Jersey
                </div>
                <div className="text-sm text-gray-400">
                  For every participant
                </div>
                <div className="mt-2">
                  <div className="badge badge-success">
                    {leagueConfig.totalParticipants} jerseys
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrizeDistribution