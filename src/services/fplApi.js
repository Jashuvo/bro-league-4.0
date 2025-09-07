// src/services/fplApi.js - Updated to use Vercel API Routes

class FPLApiService {
  constructor() {
    this.isAuthenticated = false;
    this.leagueId = import.meta.env.VITE_FPL_LEAGUE_ID || '1858389';
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  // Cache management
  isCacheValid(key) {
    const expiry = this.cacheExpiry.get(key);
    return expiry && Date.now() < expiry;
  }

  setCache(key, data, ttlMinutes = 5) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + (ttlMinutes * 60 * 1000));
  }

  getCache(key) {
    if (this.isCacheValid(key)) {
      return this.cache.get(key);
    }
    // Clean expired cache
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  // Get bootstrap data from Vercel API
  async getBootstrapData() {
    const cacheKey = 'bootstrap';
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('📋 Using cached bootstrap data');
      return cached;
    }

    try {
      console.log('📊 Fetching bootstrap data from API...');
      const response = await fetch(`${this.apiBaseUrl}/bootstrap`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Bootstrap API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Bootstrap API returned error');
      }

      console.log('✅ Bootstrap data loaded successfully');
      this.setCache(cacheKey, result.data, 5); // Cache for 5 minutes
      return result.data;

    } catch (error) {
      console.error('❌ Error fetching bootstrap data:', error);
      // Return fallback data
      return {
        currentGameweek: 3,
        totalGameweeks: 38,
        gameweeks: [],
        teams: [],
        totalPlayers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Get league data from Vercel API
  async getLeagueData() {
    const cacheKey = `league_${this.leagueId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('🏆 Using cached league data');
      return cached;
    }

    try {
      console.log(`📋 Fetching league ${this.leagueId} data from API...`);
      const response = await fetch(`${this.apiBaseUrl}/league?leagueId=${this.leagueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`League API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'League API returned error');
      }

      console.log(`✅ League data loaded successfully - ${result.data.standings.length} managers`);
      this.setCache(cacheKey, result.data, 2); // Cache for 2 minutes
      return result.data;

    } catch (error) {
      console.error('❌ Error fetching league data:', error);
      // Return fallback data
      return {
        league: { name: 'BRO League 4.0' },
        standings: [],
        leagueStats: {},
        hasNext: false
      };
    }
  }

  // Get complete league data (optimized single call)
  async getCompleteLeagueData() {
    const cacheKey = `complete_league_${this.leagueId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('🚀 Using cached complete league data');
      return cached;
    }

    try {
      console.log(`🚀 Fetching complete league ${this.leagueId} data from API...`);
      const startTime = performance.now();
      
      const response = await fetch(`${this.apiBaseUrl}/league-complete?leagueId=${this.leagueId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Complete League API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Complete League API returned error');
      }

      const endTime = performance.now();
      console.log(`✅ Complete league data loaded in ${Math.round(endTime - startTime)}ms`);
      console.log(`📊 Performance: ${result.performance?.processingTime} server + ${Math.round(endTime - startTime)}ms client`);
      
      this.setCache(cacheKey, result.data, 2); // Cache for 2 minutes
      return result.data;

    } catch (error) {
      console.error('❌ Error fetching complete league data:', error);
      // Return fallback data
      return {
        authenticated: false,
        bootstrap: {
          currentGameweek: 3,
          totalGameweeks: 38,
          gameweeks: []
        },
        league: { name: 'BRO League 4.0' },
        standings: [],
        gameweekTable: [],
        leagueStats: {}
      };
    }
  }

  // Get manager history
  async getManagerHistory(managerId) {
    const cacheKey = `history_${managerId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log(`📈 Using cached history for manager ${managerId}`);
      return cached;
    }

    try {
      console.log(`📈 Fetching history for manager ${managerId} from API...`);
      const response = await fetch(`${this.apiBaseUrl}/manager-history?managerId=${managerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Manager History API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Manager History API returned error');
      }

      console.log(`✅ Manager history loaded - ${result.data.gameweeks.length} gameweeks`);
      this.setCache(cacheKey, result.data, 5); // Cache for 5 minutes
      return result.data;

    } catch (error) {
      console.error(`❌ Error fetching manager history for ${managerId}:`, error);
      // Return fallback data
      return {
        managerId: parseInt(managerId),
        gameweeks: [],
        chips: [],
        seasonHistory: []
      };
    }
  }

  // Main initialization method (updated to use complete API)
  async initializeWithAuth() {
    console.log('🔐 Initializing FPL API with server-side data...');
    
    try {
      const completeData = await this.getCompleteLeagueData();
      
      if (completeData.authenticated) {
        console.log('✅ Server-side authentication successful');
        this.isAuthenticated = true;
      } else {
        console.log('⚠️ Using fallback data');
        this.isAuthenticated = false;
      }

      return {
        ...completeData,
        authenticated: this.isAuthenticated
      };

    } catch (error) {
      console.error('❌ Error initializing FPL API:', error);
      this.isAuthenticated = false;
      
      return {
        authenticated: false,
        bootstrap: {
          currentGameweek: 3,
          totalGameweeks: 38,
          gameweeks: []
        },
        league: { name: 'BRO League 4.0' },
        standings: [],
        gameweekTable: [],
        leagueStats: {}
      };
    }
  }

  // Legacy method for backwards compatibility
  async authenticate() {
    console.log('🔐 Authentication handled by server-side API');
    return { success: true, message: 'Server-side authentication' };
  }

  // Clear cache (useful for refresh functionality)
  clearCache() {
    console.log('🗑️ Clearing API cache');
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Force refresh (clears cache and fetches new data)
  async forceRefresh() {
    console.log('🔄 Force refreshing FPL data...');
    this.clearCache();
    return await this.initializeWithAuth();
  }
}

export default new FPLApiService();