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
    months: [
      {
        id: 1,
        name: "Month 1",
        gameweeks: "GW 1-4",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 2,
        name: "Month 2", 
        gameweeks: "GW 5-8",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 3,
        name: "Month 3",
        gameweeks: "GW 9-12", 
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 4,
        name: "Month 4",
        gameweeks: "GW 13-16",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 5,
        name: "Month 5",
        gameweeks: "GW 17-20",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 6,
        name: "Month 6",
        gameweeks: "GW 21-24",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 7,
        name: "Month 7",
        gameweeks: "GW 25-28",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 8,
        name: "Month 8",
        gameweeks: "GW 29-32",
        prizes: [
          { position: 1, amount: 350 },
          { position: 2, amount: 250 },
          { position: 3, amount: 150 }
        ]
      },
      {
        id: 9,
        name: "Month 9 (Final)",
        gameweeks: "GW 33-38",
        prizes: [
          { position: 1, amount: 500 },
          { position: 2, amount: 400 },
          { position: 3, amount: 250 }
        ]
      }
    ]
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

// Mock league standings (replace with real data)
export const mockStandings = [
  { 
    id: 1,
    managerName: "Arif Rahman",
    teamName: "Dhaka Dragons",
    totalPoints: 1847,
    gameweekPoints: 89,
    rank: 1,
    lastRank: 2
  },
  {
    id: 2, 
    managerName: "Sakib Hassan",
    teamName: "Chittagong Champions",
    totalPoints: 1823,
    gameweekPoints: 67,
    rank: 2,
    lastRank: 1
  },
  {
    id: 3,
    managerName: "Nasir Ahmed",
    teamName: "Sylhet Stars",
    totalPoints: 1789,
    gameweekPoints: 78,
    rank: 3,
    lastRank: 4
  },
  {
    id: 4,
    managerName: "Fahim Khan",
    teamName: "Khulna Kings",
    totalPoints: 1756,
    gameweekPoints: 82,
    rank: 4,
    lastRank: 3
  },
  {
    id: 5,
    managerName: "Tarik Islam",
    teamName: "Barisal Bulls", 
    totalPoints: 1734,
    gameweekPoints: 91,
    rank: 5,
    lastRank: 6
  },
  {
    id: 6,
    managerName: "Rifat Ali",
    teamName: "Comilla Crushers",
    totalPoints: 1712,
    gameweekPoints: 56,
    rank: 6,
    lastRank: 5
  },
  {
    id: 7,
    managerName: "Karim Sheikh",
    teamName: "Rajshahi Riders",
    totalPoints: 1698,
    gameweekPoints: 73,
    rank: 7,
    lastRank: 7
  },
  {
    id: 8,
    managerName: "Monir Hossain", 
    teamName: "Rangpur Rangers",
    totalPoints: 1687,
    gameweekPoints: 84,
    rank: 8,
    lastRank: 9
  },
  {
    id: 9,
    managerName: "Ratul Das",
    teamName: "Mymensingh Mavericks",
    totalPoints: 1673,
    gameweekPoints: 62,
    rank: 9,
    lastRank: 8
  },
  {
    id: 10,
    managerName: "Shahin Alam",
    teamName: "Gazipur Giants", 
    totalPoints: 1659,
    gameweekPoints: 79,
    rank: 10,
    lastRank: 11
  },
  {
    id: 11,
    managerName: "Mamun Sheikh",
    teamName: "Narayanganj Ninjas",
    totalPoints: 1645,
    gameweekPoints: 68,
    rank: 11,
    lastRank: 10
  },
  {
    id: 12,
    managerName: "Ibrahim Khan",
    teamName: "Tangail Tigers",
    totalPoints: 1634,
    gameweekPoints: 75,
    rank: 12,
    lastRank: 12
  },
  {
    id: 13,
    managerName: "Sabbir Ahmed",
    teamName: "Jamalpur Jaguars",
    totalPoints: 1621,
    gameweekPoints: 58,
    rank: 13,
    lastRank: 13
  },
  {
    id: 14,
    managerName: "Milon Rahman",
    teamName: "Faridpur Falcons",
    totalPoints: 1598,
    gameweekPoints: 71,
    rank: 14,
    lastRank: 15
  },
  {
    id: 15,
    managerName: "Rubel Hasan", 
    teamName: "Kishoreganj Kites",
    totalPoints: 1576,
    gameweekPoints: 64,
    rank: 15,
    lastRank: 14
  }
];

export const gameweekInfo = {
  current: 15,
  total: 38,
  deadline: "Oct 28, 2024 11:30 AM",
  status: "active"
};

export const monthlyStandings = {
  currentMonth: 4,
  month4: [
    { rank: 1, manager: "Tarik Islam", points: 347 },
    { rank: 2, manager: "Fahim Khan", points: 332 },
    { rank: 3, manager: "Arif Rahman", points: 329 }
  ]
};

export const weeklyHighest = {
  currentGW: 15,
  winner: "Tarik Islam",
  points: 91,
  team: "Barisal Bulls"
};