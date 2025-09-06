// src/services/fplApi.js - Enhanced Version

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
        players: data.elements || [],
        // New: Extract additional useful data
        deadlines: data.events?.map(gw => ({
          gameweek: gw.id,
          deadline: gw.deadline_time,
          averageScore: gw.average_entry_score,
          highestScore: gw.highest_score,
          finished: gw.finished
        })) || [],
        topPlayers: data.elements?.slice(0, 10).map(player => ({
          id: player.id,
          name: `${player.first_name} ${player.second_name}`,
          team: data.teams?.find(team => team.id === player.team)?.short_name || '',
          totalPoints: player.total_points,
          form: player.form,
          price: player.now_cost / 10,
          selectedBy: player.selected_by_percent
        })) || []
      };
    } catch (error) {
      console.error('❌ Error fetching bootstrap data:', error);
      return {
        currentGameweek: 3,
        totalGameweeks: 38,
        gameweeks: [],
        teams: [],
        players: [],
        deadlines: [],
        topPlayers: []
      };
    }
  }

  // Get individual manager's gameweek history
  async getManagerHistory(entryId) {
    try {
      if (this.historyCache.has(entryId)) {
        return this.historyCache.get(entryId);
      }

      console.log(`📈 Fetching history for manager ${entryId}...`);
      const url = `${FPL_BASE_URL}/entry/${entryId}/history/`;
      const response = await fetch(`${CORS_PROXY}${url}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract gameweek-by-gameweek performance
      const gameweekHistory = data.current?.map(gw => ({
        gameweek: gw.event,
        points: gw.points,
        totalPoints: gw.total_points,
        rank: gw.overall_rank,
        gameweekRank: gw.rank,
        transfers: gw.event_transfers,
        transferCost: gw.event_transfers_cost,
        bench: gw.points_on_bench
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

  // Get manager data with enhanced info
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
        // New: Additional manager info
        region: data.player_region_name || '',
        startedEvent: data.started_event || 1,
        favouriteTeam: data.favourite_team || null,
        yearsActive: data.years_active || [],
        summary: {
          overallRank: data.summary_overall_rank || 0,
          overallPoints: data.summary_overall_points || 0,
          gameweekRank: data.summary_event_rank || 0,
          gameweekPoints: data.summary_event_points || 0
        }
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
        favouriteTeam: null,
        yearsActive: [],
        summary: {
          overallRank: 0,
          overallPoints: 0,
          gameweekRank: 0,
          gameweekPoints: 0
        }
      };
    }
  }

  // Get league standings with enhanced data
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
      
      // Fetch manager details and history for each entry
      console.log('👥 Fetching manager details and history...');
      const standingsWithDetails = await Promise.all(
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
        league: {
          ...data.league,
          // Enhanced league info
          created: data.league.created,
          closed: data.league.closed,
          maxEntries: data.league.max_entries,
          leagueType: data.league.league_type,
          scoring: data.league.scoring,
          adminEntry: data.league.admin_entry,
          startEvent: data.league.start_event,
          codePrivacy: data.league.code_privacy
        },
        standings: standingsWithDetails,
        hasNext: data.standings?.has_next || false
      };
    } catch (error) {
      console.error('❌ Error fetching league standings:', error);
      return this.getMockStandings();
    }
  }

  // Create gameweek-by-gameweek points table
  generateGameweekTable(standings, maxGameweek = 3) {
    const gameweekTable = [];
    
    for (let gw = 1; gw <= maxGameweek; gw++) {
      const gameweekData = {
        gameweek: gw,
        managers: standings.map(manager => {
          const gwData = manager.historyData?.gameweeks?.find(h => h.gameweek === gw);
          return {
            id: manager.entry,
            managerName: manager.managerData?.fullName || `Manager ${manager.entry}`,
            teamName: manager.managerData?.teamName || 'Unknown',
            points: gwData?.points || 0,
            totalPoints: gwData?.totalPoints || 0,
            rank: gwData?.rank || 0,
            transfers: gwData?.transfers || 0,
            transferCost: gwData?.transferCost || 0,
            bench: gwData?.bench || 0
          };
        }).sort((a, b) => b.points - a.points) // Sort by gameweek points
      };
      
      // Add gameweek ranks
      gameweekData.managers.forEach((manager, index) => {
        manager.gameweekRank = index + 1;
      });
      
      gameweekTable.push(gameweekData);
    }
    
    return gameweekTable;
  }

  // Transform FPL API data to our enhanced format
  transformLeagueData(apiData) {
    if (!apiData.standings) return [];

    return apiData.standings.map((entry) => {
      const managerName = entry.managerData 
        ? entry.managerData.fullName || `Manager ${entry.entry}`
        : `Manager ${entry.entry}`;

      const teamName = entry.managerData?.teamName || entry.entry_name || 'Unknown Team';

      // Calculate form (last 3 gameweeks average)
      const recentGWs = entry.historyData?.gameweeks?.slice(-3) || [];
      const form = recentGWs.length > 0 
        ? (recentGWs.reduce((sum, gw) => sum + gw.points, 0) / recentGWs.length).toFixed(1)
        : 0;

      return {
        id: entry.entry,
        managerName: managerName,
        teamName: teamName,
        totalPoints: entry.total,
        gameweekPoints: entry.event_total || 0,
        rank: entry.rank,
        lastRank: entry.last_rank,
        avatar: entry.managerData 
          ? `${entry.managerData.firstName?.charAt(0) || 'M'}${entry.managerData.lastName?.charAt(0) || ''}` 
          : `M${entry.entry.toString().slice(-1)}`,
        // Enhanced data
        region: entry.managerData?.region || '',
        form: form,
        overallRank: entry.managerData?.summary?.overallRank || 0,
        yearsActive: entry.managerData?.yearsActive || [],
        startedEvent: entry.managerData?.startedEvent || 1,
        historyData: entry.historyData || { gameweeks: [], seasonHistory: [], chips: [] }
      };
    });
  }

  // Enhanced initialization with gameweek table
  async initializeWithAuth() {
    console.log('🔐 Initializing Enhanced FPL API for BRO League 4.0...');
    
    const authResult = await this.authenticate();
    const bootstrapData = await this.getBootstrapData();
    
    if (authResult.success) {
      console.log('✅ Authentication successful, fetching comprehensive league data...');
      const leagueData = await this.getLeagueStandings();
      const transformedStandings = this.transformLeagueData(leagueData);
      
      // Generate gameweek-by-gameweek table
      const gameweekTable = this.generateGameweekTable(leagueData.standings, bootstrapData.currentGameweek);
      
      return {
        authenticated: true,
        bootstrap: bootstrapData,
        league: leagueData,
        standings: transformedStandings,
        gameweekTable: gameweekTable,
        leagueStats: this.calculateLeagueStats(transformedStandings, bootstrapData)
      };
    } else {
      console.log('❌ Authentication failed, using enhanced mock data');
      const mockLeagueData = this.getMockStandings();
      
      return {
        authenticated: false,
        bootstrap: bootstrapData,
        league: mockLeagueData,
        standings: this.transformLeagueData(mockLeagueData),
        gameweekTable: [],
        leagueStats: {}
      };
    }
  }

  // Calculate comprehensive league statistics
  calculateLeagueStats(standings, bootstrap) {
    const stats = {
      totalManagers: standings.length,
      averageScore: standings.reduce((sum, m) => sum + m.totalPoints, 0) / standings.length,
      highestTotal: Math.max(...standings.map(m => m.totalPoints)),
      lowestTotal: Math.min(...standings.map(m => m.totalPoints)),
      averageGameweek: standings.reduce((sum, m) => sum + m.gameweekPoints, 0) / standings.length,
      highestGameweek: Math.max(...standings.map(m => m.gameweekPoints)),
      topRegions: this.getTopRegions(standings),
      formTable: standings.sort((a, b) => parseFloat(b.form) - parseFloat(a.form)).slice(0, 5),
      veteranManagers: standings.filter(m => m.yearsActive.length > 3).length,
      newManagers: standings.filter(m => m.startedEvent > 1).length
    };

    return stats;
  }

  getTopRegions(standings) {
    const regionCount = standings.reduce((acc, manager) => {
      const region = manager.region || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(regionCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([region, count]) => ({ region, count }));
  }

  // Simplified authenticate method
  async authenticate() {
    return { success: true, message: 'Browser compatibility mode' };
  }

  // Your existing getMockStandings method stays the same
  getMockStandings() {
    return {
      league: { name: 'BRO League 4.0', created: '2024-08-01T00:00:00Z' },
      standings: [],
      hasNext: false
    };
  }
}

export default new FPLApiService();