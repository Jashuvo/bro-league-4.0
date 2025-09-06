// src/data/leagueData.js

export const leagueConfig = {
  name: "BRO League 4.0",
  season: "2024/25",
  totalParticipants: 15,
  entryFee: 800,
  totalPrizePool: 12000,
  currency: "৳"
};

export const prizeDistribution = {
  season: {
    total: 1800,
    breakdown: [
      { position: 1, amount: 800, title: "Champion" },
      { position: 2, amount: 600, title: "Runner-up" },
      { position: 3, amount: 400, title: "Third Place" }
    ]
  },
  monthly: {
    total: 7150,
    regularMonthPrize: { first: 350, second: 250, third: 150 },
    finalMonthPrize: { first: 500, second: 400, third: 250 }
  },
  weekly: {
    total: 1140,
    perGameweek: 30,
    totalGameweeks: 38,
    description: "Mobile recharge for highest point scorer"
  },
  souvenirs: {
    total: 1910,
    description: "Official BRO League Jersey for every participant"
  }
};