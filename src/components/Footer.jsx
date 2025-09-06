// src/components/Footer.jsx
import { Heart, MessageCircle, Trophy, Users } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-bro-primary/80 backdrop-blur text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* League Info */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
              <Trophy className="text-yellow-400" size={24} />
              BRO League 4.0
            </h3>
            <p className="text-gray-300 mb-4">
              The ultimate Fantasy Premier League competition among friends. 
              15 bros, one champion, endless memories.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
              <Users size={16} />
              <span>15 Participants • Season 2024/25</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="text-center">
            <h4 className="text-lg font-bold mb-4 text-bro-secondary">League Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Prize Pool:</span>
                <span className="font-bold text-yellow-400">৳12,000</span>
              </div>
              <div className="flex justify-between">
                <span>Entry Fee:</span>
                <span className="font-bold">৳800</span>
              </div>
              <div className="flex justify-between">
                <span>Season Progress:</span>
                <span className="font-bold text-green-400">39%</span>
              </div>
              <div className="flex justify-between">
                <span>Current Gameweek:</span>
                <span className="font-bold text-blue-400">15/38</span>
              </div>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="text-center md:text-right">
            <h4 className="text-lg font-bold mb-4 text-bro-secondary">Stay Connected</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-end gap-2">
                <MessageCircle size={16} className="text-green-400" />
                <span className="text-sm">WhatsApp Group</span>
              </div>
              <div className="text-sm text-gray-400">
                Updates every Tuesday after gameweek
              </div>
              <div className="text-sm text-gray-400">
                Made with ❤️ for the bros
              </div>
            </div>
          </div>
        </div>

        {/* Prize Breakdown Summary */}
        <div className="border-t border-white/20 pt-8 mb-8">
          <h4 className="text-center text-lg font-bold mb-4 text-bro-secondary">
            Prize Distribution Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-yellow-400 font-bold">৳1,800</div>
              <div className="text-xs text-gray-400">Season Top 3</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-green-400 font-bold">৳7,150</div>
              <div className="text-xs text-gray-400">Monthly Prizes</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-blue-400 font-bold">৳1,140</div>
              <div className="text-xs text-gray-400">Weekly Prizes</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-pink-400 font-bold">৳1,910</div>
              <div className="text-xs text-gray-400">Jerseys</div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              © 2024 BRO League 4.0. Built with React + Vite
            </div>

            {/* Islamic blessing */}
            <div className="text-sm text-center">
              <span className="text-bro-secondary">Assalamualaikum wa rahmatullahi wa barakatuh</span>
            </div>

            {/* Last Updated */}
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Dhaka',
                dateStyle: 'short',
                timeStyle: 'short'
              })} BD
            </div>
          </div>
        </div>

        {/* Fun Footer Message */}
        <div className="text-center mt-6 p-4 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-400/30">
          <div className="text-sm text-gray-300 mb-2">
            "May your captain always return, your differentials always haul, and your rivals always blank!"
          </div>
          <div className="text-xs text-gray-500">
            - Ancient FPL Wisdom 🏆⚽
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer