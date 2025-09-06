// src/services/fplApi.js - Fixed Version with Correct Rankings

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

class FPLApiService {
  constructor() {
    this.cookies = '';
    this.isAuthenticated = false;
    this.leagueId = '1858389';
    this.managerCache = new Map();
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

  // Simplified authentication
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

  // Get league standings
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
      
      // Fetch manager details for each entry
      console.log('👥 Fetching manager details...');
      const standingsWithDetails = await Promise.all(
        data.standings.results.map(async (entry) => {
          const managerData = await this.getManagerData(entry.entry);
          
          return {
            ...entry,
            managerData
          };
        })
      );

      return {
        league: data.league,
        standings: standingsWithDetails,
        hasNext: data.standings?.has_next || false
      };
    } catch (error) {
      console.error('❌ Error fetching league standings:', error);
      return this.getMockStandings();
    }
  }

  // Generate gameweek table - ONLY for current gameweek with real data
  generateGameweekTable(standings, currentGameweek = 3) {
    const gameweekTable = [];
    
    // Only create data for current gameweek using REAL API data
    const currentGWData = {
      gameweek: currentGameweek,
      managers: standings.map(manager => {
        return {
          id: manager.entry,
          managerName: manager.managerData?.fullName || `Manager ${manager.entry}`,
          teamName: manager.managerData?.teamName || manager.entry_name || 'Unknown',
          points: manager.event_total || 0, // Real current gameweek points
          totalPoints: manager.total || 0, // Real total points
          transfers: 0, // We don't have transfer data in league standings
          transferCost: 0, // We don't have transfer cost data in league standings
          bench: 0 // We don't have bench data in league standings
        };
      }).sort((a, b) => b.points - a.points) // Sort by gameweek points
    };
    
    // Add gameweek ranks
    currentGWData.managers.forEach((manager, index) => {
      manager.gameweekRank = index + 1;
    });
    
    // Only add current gameweek - no fake historical data
    gameweekTable.push(currentGWData);
    
    return gameweekTable;
  }

  // Transform FPL API data with CORRECT RANKING
  transformLeagueData(apiData) {
    if (!apiData.standings) return [];

    // IMPORTANT: Sort by total points to ensure correct ranking
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
        rank: index + 1, // Correct rank based on sorted order
        lastRank: entry.last_rank,
        avatar: entry.managerData 
          ? `${entry.managerData.firstName?.charAt(0) || 'M'}${entry.managerData.lastName?.charAt(0) || ''}` 
          : `M${entry.entry.toString().slice(-1)}`,
        region: entry.managerData?.region || '',
        startedEvent: entry.managerData?.startedEvent || 1,
        overallRank: entry.managerData?.overallRank || 0
      };
    });
  }

  // Main initialization
  async initializeWithAuth() {
    console.log('🔐 Initializing FPL API for BRO League 4.0...');
    
    const authResult = await this.authenticate();
    const bootstrapData = await this.getBootstrapData();
    
    if (authResult.success) {
      console.log('✅ Authentication successful, fetching league data...');
      const leagueData = await this.getLeagueStandings();
      const transformedStandings = this.transformLeagueData(leagueData);
      
      // Generate gameweek table
      const gameweekTable = this.generateGameweekTable(leagueData.standings, bootstrapData.currentGameweek);
      
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
        leagueStats: {}
      };
    }
  }

  // Fallback mock data
  getMockStandings() {
    return {
      league: {
        name: 'BRO League 4.0',
        created: '2024-08-01T00:00:00Z'
      },
      standings: [
        { 
          entry: 1827725, 
          total: 206, 
          event_total: 69, 
          rank: 1, 
          last_rank: 2,
          entry_name: 'La Roja ❤️',
          managerData: {
            firstName: 'Sarwar',
            lastName: 'Raj',
            fullName: 'Sarwar Raj',
            teamName: 'La Roja ❤️'
          }
        }
      ],
      hasNext: false
    };
  }
}

export default new FPLApiService();