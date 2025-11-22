// src/services/fplApi.js - Optimized FPL API Service with Enhanced Error Handling

class FPLApiService {
  constructor() {
    this.isAuthenticated = false;
    this.leagueId = import.meta.env.VITE_FPL_LEAGUE_ID || '1858389';
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.requestQueue = [];
    this.activeRequests = 0;
    this.maxConcurrentRequests = 3;
    this.performanceMetrics = [];
  }

  // Performance tracking
  trackPerformance(operation, duration, success = true) {
    this.performanceMetrics.push({
      operation,
      duration,
      success,
      timestamp: Date.now()
    });

    // Keep only last 50 metrics
    if (this.performanceMetrics.length > 50) {
      this.performanceMetrics.shift();
    }
  }

  getAveragePerformance() {
    if (this.performanceMetrics.length === 0) return null;

    const recentMetrics = this.performanceMetrics.slice(-10);
    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;

    return {
      averageDuration: Math.round(avgDuration),
      successRate: Math.round(successRate * 100),
      totalRequests: this.performanceMetrics.length
    };
  }

  // Enhanced cache management
  isCacheValid(key) {
    const expiry = this.cacheExpiry.get(key);
    return expiry && Date.now() < expiry;
  }

  setCache(key, data, ttlMinutes = 2) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + (ttlMinutes * 60 * 1000));

    // Log cache status
    console.log(`💾 Cached ${key} for ${ttlMinutes} minutes`);
  }

  getCache(key) {
    if (this.isCacheValid(key)) {
      console.log(`✅ Cache hit for ${key}`);
      return this.cache.get(key);
    }

    // Clean expired cache
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  // Request queue management for rate limiting
  async queueRequest(fn) {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        if (this.activeRequests >= this.maxConcurrentRequests) {
          this.requestQueue.push(execute);
          return;
        }

        this.activeRequests++;
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          const next = this.requestQueue.shift();
          if (next) next();
        }
      };

      execute();
    });
  }

  // Fetch with timeout and retry
  async fetchWithRetry(url, options = {}, retries = 2) {
    const timeout = options.timeout || 30000;
    const startTime = performance.now();

    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        const duration = performance.now() - startTime;

        if (!response.ok) {
          if (i < retries) {
            console.log(`⚠️ Retry ${i + 1}/${retries} for ${url}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.trackPerformance(url, duration, true);
        return response;

      } catch (error) {
        const duration = performance.now() - startTime;

        if (error.name === 'AbortError') {
          console.error(`⏱️ Request timeout after ${timeout}ms`);
        }

        if (i === retries) {
          this.trackPerformance(url, duration, false);
          throw error;
        }

        console.log(`⚠️ Retry ${i + 1}/${retries} after error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }

  // Get complete league data (primary method)
  async getCompleteLeagueData(forceRefresh = false) {
    const cacheKey = `complete_league_${this.leagueId}`;

    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    return this.queueRequest(async () => {
      try {
        console.log(`🚀 Fetching complete league ${this.leagueId} data...`);
        const startTime = performance.now();

        const url = `${this.apiBaseUrl}/league-complete?leagueId=${this.leagueId}${forceRefresh ? '&force=true' : ''}`;
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          timeout: 30000
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'API returned error');
        }

        const endTime = performance.now();
        const loadTime = Math.round(endTime - startTime);

        console.log(`✅ Complete data loaded in ${loadTime}ms`);

        // Log cache status
        if (result.data.fromCache) {
          console.log(`📦 Data served from server cache (age: ${Math.round(result.data.cacheAge / 1000)}s)`);
        } else {
          console.log(`🌐 Fresh data fetched from FPL API`);
        }

        // Add client-side performance metrics
        result.data.clientMetrics = {
          loadTime,
          performanceStats: this.getAveragePerformance()
        };

        // Cache for 2 minutes (matching server cache)
        this.setCache(cacheKey, result.data, 2);

        return result.data;

      } catch (error) {
        console.error('❌ Error fetching complete league data:', error);

        // Try to return stale cache if available
        const staleCache = this.cache.get(cacheKey);
        if (staleCache) {
          console.log('⚠️ Returning stale cache due to error');
          staleCache.isStale = true;
          staleCache.error = error.message;
          return staleCache;
        }

        // Return fallback data
        return this.getFallbackData();
      }
    });
  }

  // Get bootstrap data
  async getBootstrapData() {
    const cacheKey = 'bootstrap';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('📊 Fetching bootstrap data...');
      const response = await this.fetchWithRetry(`${this.apiBaseUrl}/bootstrap`, {
        timeout: 15000
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Bootstrap API error');
      }

      console.log('✅ Bootstrap data loaded');
      this.setCache(cacheKey, result.data, 5);
      return result.data;

    } catch (error) {
      console.error('❌ Error fetching bootstrap:', error);
      return this.getFallbackBootstrap();
    }
  }

  // Get manager history
  async getManagerHistory(managerId) {
    const cacheKey = `history_${managerId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.queueRequest(async () => {
      try {
        console.log(`📈 Fetching history for manager ${managerId}...`);
        const response = await this.fetchWithRetry(
          `${this.apiBaseUrl}/manager-history?managerId=${managerId}`,
          { timeout: 10000 }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'History API error');
        }

        console.log(`✅ Manager history loaded`);
        this.setCache(cacheKey, result.data, 5);
        return result.data;

      } catch (error) {
        console.error(`❌ Error fetching manager history:`, error);
        return {
          managerId: parseInt(managerId),
          gameweeks: [],
          chips: [],
          seasonHistory: []
        };
      }
    });
  }

  async getTeamPicks(managerId, eventId) {
    const cacheKey = `picks_${managerId}_${eventId}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    return this.queueRequest(async () => {
      try {
        console.log(`⚽ Fetching team picks for manager ${managerId}, GW${eventId}...`)

        const response = await this.fetchWithRetry(
          `${this.apiBaseUrl}/team-picks?managerId=${managerId}&eventId=${eventId}`,
          { timeout: 10000 }
        )

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Team picks API error')
        }

        console.log(`✅ Team picks loaded for manager ${managerId}, GW${eventId}`)
        this.setCache(cacheKey, result.data, 5) // Cache for 5 minutes
        return result.data

      } catch (error) {
        console.error(`❌ Error fetching team picks:`, error)
        return null
      }
    })
  }

  // Get live league stats
  async getLiveLeagueStats(gameweekId) {
    const cacheKey = `live_stats_${this.leagueId}_${gameweekId}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.queueRequest(async () => {
      try {
        console.log(`🔴 Fetching live stats for GW${gameweekId}...`);
        const response = await this.fetchWithRetry(
          `${this.apiBaseUrl}/live-stats?leagueId=${this.leagueId}&gameweek=${gameweekId}`,
          { timeout: 20000 }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Live stats API error');
        }

        console.log(`✅ Live stats loaded for GW${gameweekId}`);
        // Cache for 1 minute only as it's live data
        this.setCache(cacheKey, result, 1);
        return result;

      } catch (error) {
        console.error('❌ Error fetching live stats:', error);
        return null;
      }
    });
  }

  // Main initialization method
  async initializeWithAuth() {
    console.log('🔐 Initializing FPL API...');

    try {
      const completeData = await this.getCompleteLeagueData();

      if (completeData.authenticated) {
        console.log('✅ Authentication successful');
        this.isAuthenticated = true;
      } else {
        console.log('⚠️ Using unauthenticated data');
        this.isAuthenticated = false;
      }

      return {
        ...completeData,
        authenticated: this.isAuthenticated
      };

    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.isAuthenticated = false;
      return this.getFallbackData();
    }
  }

  // Force refresh
  async forceRefresh() {
    console.log('🔄 Force refreshing all data...');
    this.clearCache();
    return await this.getCompleteLeagueData(true);
  }

  // Clear cache
  clearCache() {
    console.log('🗑️ Clearing local cache');
    this.cache.clear();
    this.cacheExpiry.clear();
    this.performanceMetrics = [];
  }

  // Get cache status
  getCacheStatus() {
    const validCaches = [];
    const expiredCaches = [];

    this.cacheExpiry.forEach((expiry, key) => {
      if (Date.now() < expiry) {
        validCaches.push({
          key,
          expiresIn: Math.round((expiry - Date.now()) / 1000)
        });
      } else {
        expiredCaches.push(key);
      }
    });

    return {
      validCaches,
      expiredCaches,
      totalSize: this.cache.size,
      performance: this.getAveragePerformance()
    };
  }

  // Fallback data
  getFallbackData() {
    return {
      authenticated: false,
      bootstrap: this.getFallbackBootstrap(),
      league: { name: 'BRO League 4.0' },
      standings: [],
      gameweekTable: [],
      leagueStats: {},
      error: 'Using fallback data due to connection issues'
    };
  }

  getFallbackBootstrap() {
    return {
      currentGameweek: 3,
      totalGameweeks: 38,
      gameweeks: [],
      teams: [],
      totalPlayers: 0
    };
  }
}

// Export singleton instance
const fplApi = new FPLApiService();

// Add performance monitoring to window for debugging
if (import.meta.env.VITE_DEV_MODE === 'true') {
  window.fplApi = fplApi;
  window.fplCacheStatus = () => fplApi.getCacheStatus();
  window.fplPerformance = () => fplApi.getAveragePerformance();
}

export default fplApi;