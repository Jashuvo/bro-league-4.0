// src/services/fplApi.js - Optimized FPL API Service with Enhanced Error Handling
import { leagueConfig } from '../data/leagueData';

class FPLApiService {
  constructor() {
    this.isAuthenticated = false;
    // No fallback league ID on purpose: silently defaulting to an old
    // season's league here is exactly how this app used to keep showing
    // last year's standings after a rollover nobody noticed.
    this.leagueId = import.meta.env.VITE_FPL_LEAGUE_ID || null;
    if (!this.leagueId) {
      console.error(
        '❌ VITE_FPL_LEAGUE_ID is not set. Set it in .env.local (and in ' +
        "your Vercel project's environment variables) to this season's " +
        'FPL classic league ID — the app has no league to load without it.'
      );
    }
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

  // Everything below also mirrors into localStorage (best-effort — wrapped
  // in try/catch since private browsing, a full quota, or storage being
  // blocked entirely all throw rather than no-op). The in-memory Map is
  // what every read actually goes through; localStorage only exists so a
  // fresh page load can REHYDRATE it instead of starting cold. This is what
  // makes "weekly" data (a gameweek's captain picks, differentials, dream
  // team) actually behave weekly: without it, every reload re-fetched
  // picks for all 15+ managers from scratch even when nothing about that
  // gameweek could possibly have changed since the last visit.
  setCache(key, data, ttlMinutes = 2) {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, data);
    this.cacheExpiry.set(key, expiry);
    console.log(`💾 Cached ${key} for ${ttlMinutes} minutes`);

    try {
      localStorage.setItem(`fplapi:${key}`, JSON.stringify({ data, expiry }));
    } catch (error) {
      // Best-effort only — the in-memory cache above still works for the
      // rest of this session.
    }
  }

  getCache(key) {
    if (this.isCacheValid(key)) {
      console.log(`✅ Cache hit for ${key}`);
      return this.cache.get(key);
    }

    // Clean expired in-memory cache
    this.cache.delete(key);
    this.cacheExpiry.delete(key);

    // Not in memory — e.g. this is a fresh page load — so check whether a
    // still-valid copy survived from a previous visit before treating this
    // as a real miss.
    try {
      const raw = localStorage.getItem(`fplapi:${key}`);
      if (raw) {
        const { data, expiry } = JSON.parse(raw);
        if (expiry && Date.now() < expiry) {
          this.cache.set(key, data);
          this.cacheExpiry.set(key, expiry);
          console.log(`✅ Cache hit for ${key} (restored from localStorage)`);
          return data;
        }
        localStorage.removeItem(`fplapi:${key}`);
      }
    } catch (error) {
      // Corrupt entry or storage unavailable — treat as a genuine miss.
    }

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
    if (!this.leagueId) {
      return this.getFallbackData('VITE_FPL_LEAGUE_ID is not configured — nothing to load.');
    }

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

  // `options.ttlMinutes` lets a caller who knows more about freshness than
  // this method does override the default. TeamView (watching a possibly
  // still-live gameweek) doesn't pass one and gets the safe 5-minute
  // default; useLeaguePicks (backing Captain Watch / the live ticker /
  // differentials) passes a much longer TTL once the gameweek is finished,
  // since a finished gameweek's picks cannot change again.
  async getTeamPicks(managerId, eventId, options = {}) {
    const cacheKey = `picks_${managerId}_${eventId}`
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    const ttlMinutes = options.ttlMinutes ?? 5

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
        this.setCache(cacheKey, result.data, ttlMinutes)
        return result.data

      } catch (error) {
        console.error(`❌ Error fetching team picks:`, error)
        return null
      }
    })
  }

  // Player price movement (risers/fallers) — season-wide, not tied to a
  // gameweek. FPL only moves prices once a day (~1:30am UK) and the server
  // route itself is cached for 30 minutes, so there's nothing to gain from
  // asking again inside that window — an hour client-side keeps this from
  // ever being the reason a page load hits the network.
  async getPriceWatch() {
    const cacheKey = 'price_watch';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.queueRequest(async () => {
      try {
        console.log('💰 Fetching price watch...');
        const response = await this.fetchWithRetry(`${this.apiBaseUrl}/price-watch`, { timeout: 15000 });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Price watch API error');
        }

        this.setCache(cacheKey, result.data, 60);
        return result.data;
      } catch (error) {
        console.error('❌ Error fetching price watch:', error);
        return { risers: [], fallers: [], transfersIn: [], transfersOut: [], asOf: null };
      }
    });
  }

  // Most-transferred-in/out players for ONE gameweek, scoped to just this
  // league's managers (api/league-transfers.js — entry/{id}/transfers/,
  // not bootstrap-static's FPL-wide transfers_in_event/transfers_out_event).
  // Transfers land continuously through the week, so a shorter TTL than
  // price watch's (that one only changes once a day).
  async getLeagueTransfers(gameweek) {
    const cacheKey = `league_transfers_${this.leagueId}_${gameweek}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.queueRequest(async () => {
      try {
        console.log(`🔁 Fetching league transfers for GW${gameweek}...`);
        const response = await this.fetchWithRetry(
          `${this.apiBaseUrl}/league-transfers?leagueId=${this.leagueId}&gameweek=${gameweek}`,
          { timeout: 20000 }
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'League transfers API error');
        }

        this.setCache(cacheKey, result.data, 15);
        return result.data;
      } catch (error) {
        console.error('❌ Error fetching league transfers:', error);
        return { gameweek, transfersIn: [], transfersOut: [] };
      }
    });
  }

  // Blank/double gameweek alerts — a season-wide fixture scan. Fixtures do
  // get rescheduled occasionally, but never on a timescale that needs
  // checking more than a few times a day.
  async getFixtureAlerts() {
    const cacheKey = 'fixture_alerts';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.queueRequest(async () => {
      try {
        console.log('📅 Fetching fixture alerts...');
        const response = await this.fetchWithRetry(`${this.apiBaseUrl}/fixture-alerts`, { timeout: 15000 });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Fixture alerts API error');
        }

        this.setCache(cacheKey, result.data, 240);
        return result.data;
      } catch (error) {
        console.error('❌ Error fetching fixture alerts:', error);
        return { currentEvent: null, alerts: [] };
      }
    });
  }

  // Goal/assist/bonus feed for one gameweek. `options.ttlMinutes` works the
  // same way as getTeamPicks above: short by default (this is live data
  // while a gameweek is in progress), but the caller can pass a long TTL
  // once that gameweek is finished — the match events that already
  // happened aren't going to un-happen.
  async getGameweekEvents(gameweek, options = {}) {
    const cacheKey = `gw_events_${gameweek}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const ttlMinutes = options.ttlMinutes ?? 1;

    return this.queueRequest(async () => {
      try {
        console.log(`⚽ Fetching gameweek events for GW${gameweek}...`);
        const response = await this.fetchWithRetry(
          `${this.apiBaseUrl}/gameweek-events?gameweek=${gameweek}`,
          { timeout: 15000 }
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Gameweek events API error');
        }

        this.setCache(cacheKey, result.data, ttlMinutes);
        return result.data;
      } catch (error) {
        console.error('❌ Error fetching gameweek events:', error);
        return { gameweek, events: [] };
      }
    });
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

    // The explicit "Refresh" button is the one place that should always
    // force a real re-fetch, even of the long-lived weekly stuff below —
    // so it has to reach into localStorage too, not just the in-memory Map.
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('fplapi:'))
        .forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      // Storage unavailable — nothing to clear there.
    }
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
  getFallbackData(errorMessage = 'Using fallback data due to connection issues') {
    return {
      authenticated: false,
      bootstrap: this.getFallbackBootstrap(),
      league: { name: leagueConfig.name },
      standings: [],
      gameweekTable: [],
      leagueStats: {},
      error: errorMessage
    };
  }

  getFallbackBootstrap() {
    return {
      currentGameweek: 1,
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