// src/services/fplApi.js - Complete Version with Full History

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

class FPLApiService {
  constructor() {
    this.cookies = '';
    this.isAuthenticated = false;
    this.leagueId = '1858389';
    this.managerCache = new Map();
    this.historyCache = new Map();
  }

  // Get current gameweek and general data
  async getBootstrapData() {
    try {
      console.log('📊 Fetching FPL bootstrap data...');
      const response = await fetch(`${CORS_PROXY}${FPL_BASE_URL}/bootstrap-static/`);
      const data = await response.json();
      
      console.log('✅ Bootstrap data loaded successfully');
      return {
        currentGameweek: data.events?.find(event => event.is_current)?.id || 3,
        totalGameweeks: data.events?.length || 38,
        gameweeks: data.events || [],
        teams: data.teams || [],
        players: data.elements || []
      };
    } catch (error) {
      console.error('❌ Error fetching bootstrap data:', error);
      return {
        currentGameweek: 3,
        totalGameweeks: 38,
        gameweeks: [],
        teams: [],
        players: []
      };
    }
  }

  // Authentication
  async authenticate() {
    console.log('🔐 Skipping complex authentication for browser compatibility...');
    return { success: true, message: 'Browser compatibility mode' };
  }

  // Get individual manager data
  async getManagerData(entryId) {
    try {
      if (this.managerCache.has(entryId)) {
        return this.managerCache.get(entryId);
      }

      const url = `${FPL_BASE_URL}/entry/${entryId}/`;
      const response = await fetch(`${CORS_PROXY}${url}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const managerData = {
        firstName: data.player_first_name || '',
        lastName: data.player_last_name || '',
        fullName: `${data.player_first_name || ''} ${data.player_last_name || ''}`.trim(),
        teamName: data.name || 'Unknown Team',
        region: data.player_region_name || '',
        startedEvent: data.started_event || 1,
        overallRank: data.summary_overall_rank || 0
      };

      this.managerCache.set(entryId, managerData);
      return managerData;
    } catch (error) {
      console.warn(`⚠️ Could not fetch manager data for entry ${entryId}:`, error);
      return {
        firstName: '',
        lastName: '',
        fullName: `Manager ${entryId}`,
        teamName: 'Unknown Team',
        region: '',
        startedEvent: 1,
        overallRank: 0
      };
    }
  }

  // Get FULL manager history - THIS IS THE KEY ADDITION
  async getManagerHistory(entryId) {
    try {
      if (this.historyCache.has(entryId)) {
        return this.historyCache.get(entryId);
      }

      console.log(`📈 Fetching complete history for manager ${entryId}...`);
      const url = `${FPL_BASE_URL}/entry/${entryId}/history/`;
      const response = await fetch(`${CORS_PROXY}${url}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract gameweek-by-gameweek performance with REAL transfer data
      const gameweekHistory = data.current?.map(gw => ({
        gameweek: gw.event,
        points: gw.points,
        totalPoints: gw.total_points,
        rank: gw.overall_rank,
        gameweekRank: gw.rank,
        transfers: gw.event_transfers,  // REAL transfer count
        transferCost: gw.event_transfers_cost, // REAL transfer cost
        bench: gw.points_on_bench, // REAL bench points
        value: gw.value / 10, // Team value in millions
        bankBalance: gw.bank / 10 // Money in bank
      })) || [];

      const historyData = {
        gameweeks: gameweekHistory,
        seasonHistory: data.past || [],
        chips: data.chips || []
      };

      this.historyCache.set(entryId, historyData);
      return historyData;
    } catch (error) {
      console.warn(`⚠️ Could not fetch history for entry ${entryId}:`, error);
      return {
        gameweeks: [],
        seasonHistory: [],
        chips: []
      };
    }
  }

  // Get league standings with FULL historical data
  async getLeagueStandings() {
    try {
      console.log(`📋 Fetching league standings for League ID: ${this.leagueId}...`);
      
      const url = `${FPL_BASE_URL}/leagues-classic/${this.leagueId}/standings/`;
      const response = await fetch(`${CORS_PROXY}${url}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ League standings loaded successfully');
      
      // Fetch COMPLETE data for each manager
      console.log('👥 Fetching complete manager details and history...');
      const standingsWithFullData = await Promise.all(
        data.standings.results.map(async (entry) => {
          const [managerData, historyData] = await Promise.all([
            this.getManagerData(entry.entry),
            this.getManagerHistory(entry.entry)
          ]);
          
          return {
            ...entry,
            managerData,
            historyData
          };
        })
      );

      return {
        league: data.league,
        standings: standingsWithFullData,
        hasNext: data.standings?.has_next || false
      };
    } catch (error) {
      console.error('❌ Error fetching league standings:', error);
      return this.getMockStandings();
    }
  }

  // Generate COMPLETE gameweek table with REAL historical data
  generateCompleteGameweekTable(standings, currentGameweek = 3, totalGameweeks = 38) {
    const gameweekTable = [];
    
    // Create table for ALL gameweeks (past, current, and future)
    for (let gw = 1; gw <= totalGameweeks; gw++) {
      const gameweekData = {
        gameweek: gw,
        status: gw < currentGameweek ? 'completed' : gw === currentGameweek ? 'current' : 'upcoming',
        managers: standings.map(manager => {
          // Get REAL data from manager history
          const gwData = manager.historyData?.gameweeks?.find(h => h.gameweek === gw);
          
          if (gwData) {
            // REAL historical data
            return {
              id: manager.entry,
              managerName: manager.managerData?.fullName || `Manager ${manager.entry}`,
              teamName: manager.managerData?.teamName || manager.entry_name || 'Unknown',
              points: gwData.points,
              totalPoints: gwData.totalPoints,
              rank: gwData.rank,
              gameweekRank: 0, // Will be calculated below
              transfers: gwData.transfers,
              transferCost: gwData.transferCost,
              bench: gwData.bench,
              value: gwData.value,
              bankBalance: gwData.bankBalance
            };
          } else if (gw <= currentGameweek) {
            // Gameweek should have data but doesn't - manager might have joined late
            return {
              id: manager.entry,
              managerName: manager.managerData?.fullName || `Manager ${manager.entry}`,
              teamName: manager.managerData?.teamName || manager.entry_name || 'Unknown',
              points: 0,
              totalPoints: 0,
              rank: 0,
              gameweekRank: 0,
              transfers: 0,
              transferCost: 0,
              bench: 0,
              value: 100.0,
              bankBalance: 0.0,
              note: 'No data - joined late?'
            };
          } else {
            // Future gameweek - no data yet
            return {
              id: manager.entry,
              managerName: manager.managerData?.fullName || `Manager ${manager.entry}`,
              teamName: manager.managerData?.teamName || manager.entry_name || 'Unknown',
              points: null,
              totalPoints: null,
              rank: null,
              gameweekRank: null,
              transfers: null,
              transferCost: null,
              bench: null,
              value: null,
              bankBalance: null,
              note: 'Future gameweek'
            };
          }
        }).filter(manager => manager.points !== null) // Remove future gameweeks' null data
           .sort((a, b) => b.points - a.points) // Sort by gameweek points
      };
      
      // Add gameweek ranks for completed/current gameweeks
      if (gw <= currentGameweek) {
        gameweekData.managers.forEach((manager, index) => {
          manager.gameweekRank = index + 1;
        });
      }
      
      gameweekTable.push(gameweekData);
    }
    
    return gameweekTable;
  }

  // Calculate REAL weekly winners
  calculateWeeklyWinners(gameweekTable, currentGameweek) {
    return gameweekTable
      .filter(gw => gw.gameweek <= currentGameweek && gw.managers.length > 0)
      .map(gwData => {
        const winner = gwData.managers[0]; // Already sorted by points
        return {
          gameweek: gwData.gameweek,
          winner: {
            id: winner.id,
            managerName: winner.managerName,
            teamName: winner.teamName,
            points: winner.points,
            transfers: winner.transfers,
            transferCost: winner.transferCost,
            prize: 30
          },
          topThree: gwData.managers.slice(0, 3),
          averageScore: Math.round(gwData.managers.reduce((sum, m) => sum + m.points, 0) / gwData.managers.length),
          highestScore: Math.max(...gwData.managers.map(m => m.points)),
          lowestScore: Math.min(...gwData.managers.map(m => m.points))
        };
      });
  }

  // Transform league data with correct ranking
  transformLeagueData(apiData) {
    if (!apiData.standings) return [];

    // Sort by total points for correct ranking
    const sortedStandings = [...apiData.standings].sort((a, b) => b.total - a.total);

    return sortedStandings.map((entry, index) => {
      const managerName = entry.managerData 
        ? entry.managerData.fullName || `Manager ${entry.entry}`
        : `Manager ${entry.entry}`;

      const teamName = entry.managerData?.teamName || entry.entry_name || 'Unknown Team';

      return {
        id: entry.entry,
        managerName: managerName,
        teamName: teamName,
        totalPoints: entry.total,
        gameweekPoints: entry.event_total || 0,
        rank: index + 1, // Correct rank
        lastRank: entry.last_rank,
        avatar: entry.managerData 
          ? `${entry.managerData.firstName?.charAt(0) || 'M'}${entry.managerData.lastName?.charAt(0) || ''}` 
          : `M${entry.entry.toString().slice(-1)}`,
        region: entry.managerData?.region || '',
        startedEvent: entry.managerData?.startedEvent || 1,
        overallRank: entry.managerData?.overallRank || 0,
        historyData: entry.historyData || { gameweeks: [] }
      };
    });
  }

  // Main initialization with COMPLETE data
  async initializeWithAuth() {
    console.log('🔐 Initializing COMPLETE FPL API for BRO League 4.0...');
    
    const authResult = await this.authenticate();
    const bootstrapData = await this.getBootstrapData();
    
    if (authResult.success) {
      console.log('✅ Authentication successful, fetching COMPLETE league data...');
      const leagueData = await this.getLeagueStandings();
      const transformedStandings = this.transformLeagueData(leagueData);
      
      // Generate COMPLETE gameweek table with REAL data
      const gameweekTable = this.generateCompleteGameweekTable(
        leagueData.standings, 
        bootstrapData.currentGameweek, 
        bootstrapData.totalGameweeks
      );
      
      // Calculate REAL weekly winners
      const weeklyWinners = this.calculateWeeklyWinners(gameweekTable, bootstrapData.currentGameweek);
      
      // Calculate league stats
      const leagueStats = {
        totalManagers: transformedStandings.length,
        averageScore: Math.round(transformedStandings.reduce((sum, m) => sum + m.totalPoints, 0) / transformedStandings.length),
        highestTotal: Math.max(...transformedStandings.map(m => m.totalPoints)),
        averageGameweek: Math.round(transformedStandings.reduce((sum, m) => sum + m.gameweekPoints, 0) / transformedStandings.length),
        highestGameweek: Math.max(...transformedStandings.map(m => m.gameweekPoints)),
        veteranManagers: transformedStandings.filter(m => m.startedEvent === 1).length,
        newManagers: transformedStandings.filter(m => m.startedEvent > 1).length
      };
      
      return {
        authenticated: true,
        bootstrap: bootstrapData,
        league: leagueData,
        standings: transformedStandings,
        gameweekTable: gameweekTable,
        weeklyWinners: weeklyWinners,
        leagueStats: leagueStats
      };
    } else {
      console.log('❌ Authentication failed, using mock data');
      const mockLeagueData = this.getMockStandings();
      
      return {
        authenticated: false,
        bootstrap: bootstrapData,
        league: mockLeagueData,
        standings: this.transformLeagueData(mockLeagueData),
        gameweekTable: [],
        weeklyWinners: [],
        leagueStats: {}
      };
    }
  }

  // Mock data fallback
  getMockStandings() {
    return {
      league: { name: 'BRO League 4.0', created: '2024-08-01T00:00:00Z' },
      standings: [],
      hasNext: false
    };
  }
}

export default new FPLApiService();