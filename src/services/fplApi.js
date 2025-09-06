// src/services/fplApi.js

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
// Alternative CORS proxies if one doesn't work:
// const CORS_PROXY = 'https://corsproxy.io/?';
// const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';
const LOGIN_URL = 'https://users.premierleague.com/accounts/login/';

class FPLApiService {
  constructor() {
    this.cookies = '';
    this.isAuthenticated = false;
    this.leagueId = '1858389'; // Your league ID
  }

  // Authenticate with FPL
  async authenticate(email, password) {
    try {
      const loginData = new URLSearchParams({
        login: email,
        password: password,
        app: 'plfpl-web',
        redirect_uri: 'https://fantasy.premierleague.com/'
      });

      const response = await fetch(`${CORS_PROXY}${LOGIN_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: loginData
      });

      // Extract cookies from response headers
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        this.cookies = setCookieHeader;
        this.isAuthenticated = true;
        console.log('✅ FPL Authentication successful');
        return { success: true, message: 'Authentication successful' };
      } else {
        console.log('❌ FPL Authentication failed - no cookies received');
        return { success: false, message: 'Authentication failed' };
      }
    } catch (error) {
      console.error('❌ FPL Authentication error:', error);
      return { success: false, message: 'Network error during authentication' };
    }
  }

  // Get current gameweek and general data
  async getBootstrapData() {
    try {
      const response = await fetch(`${CORS_PROXY}${FPL_BASE_URL}/bootstrap-static/`);
      const data = await response.json();
      
      return {
        currentGameweek: data.events?.find(event => event.is_current)?.id || null,
        totalGameweeks: data.events?.length || 38,
        gameweeks: data.events || [],
        teams: data.teams || [],
        players: data.elements || []
      };
    } catch (error) {
      console.error('❌ Error fetching bootstrap data:', error);
      return null;
    }
  }

  // Get league standings (requires authentication for private leagues)
  async getLeagueStandings(page = 1) {
    try {
      let url = `${FPL_BASE_URL}/leagues-classic/${this.leagueId}/standings/`;
      if (page > 1) {
        url += `?page_standings=${page}`;
      }

      const response = await fetch(`${CORS_PROXY}${url}`, {
        headers: {
          'Cookie': this.cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        league: data.league,
        standings: data.standings?.results || [],
        hasNext: data.standings?.has_next || false,
        page: page
      };
    } catch (error) {
      console.error('❌ Error fetching league standings:', error);
      
      // Return mock data if API fails
      return this.getMockStandings();
    }
  }

  // Get manager details
  async getManagerDetails(managerId) {
    try {
      const response = await fetch(`${CORS_PROXY}${FPL_BASE_URL}/entry/${managerId}/`, {
        headers: {
          'Cookie': this.cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error fetching manager ${managerId} details:`, error);
      return null;
    }
  }

  // Get manager's team for specific gameweek
  async getManagerTeam(managerId, gameweek) {
    try {
      const response = await fetch(`${CORS_PROXY}${FPL_BASE_URL}/entry/${managerId}/event/${gameweek}/picks/`, {
        headers: {
          'Cookie': this.cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error fetching manager ${managerId} team for GW ${gameweek}:`, error);
      return null;
    }
  }

  // Transform FPL API data to our format
  transformLeagueData(apiData) {
    if (!apiData.standings) return [];

    return apiData.standings.map((entry, index) => ({
      id: entry.entry,
      managerName: `${entry.player_first_name} ${entry.player_last_name}`,
      teamName: entry.entry_name,
      totalPoints: entry.total,
      gameweekPoints: entry.event_total || 0,
      rank: entry.rank,
      lastRank: entry.last_rank,
      avatar: entry.player_first_name?.charAt(0) + entry.player_last_name?.charAt(0) || '??'
    }));
  }

  // Fallback mock data if API fails
  getMockStandings() {
    console.log('📋 Using mock data - API authentication may have failed');
    
    return {
      league: {
        name: 'BRO League 4.0',
        created: '2024-08-01T00:00:00Z'
      },
      standings: [
        { 
          entry: 1, 
          player_first_name: 'Jubayes', 
          player_last_name: 'Rahman', 
          entry_name: 'Dhaka Dragons', 
          total: 1847, 
          event_total: 89, 
          rank: 1, 
          last_rank: 2 
        },
        { 
          entry: 2, 
          player_first_name: 'Sakib', 
          player_last_name: 'Hassan', 
          entry_name: 'Chittagong Champions', 
          total: 1823, 
          event_total: 67, 
          rank: 2, 
          last_rank: 1 
        },
        { 
          entry: 3, 
          player_first_name: 'Nasir', 
          player_last_name: 'Ahmed', 
          entry_name: 'Sylhet Stars', 
          total: 1789, 
          event_total: 78, 
          rank: 3, 
          last_rank: 4 
        },
        { 
          entry: 4, 
          player_first_name: 'Fahim', 
          player_last_name: 'Khan', 
          entry_name: 'Khulna Kings', 
          total: 1756, 
          event_total: 82, 
          rank: 4, 
          last_rank: 3 
        },
        { 
          entry: 5, 
          player_first_name: 'Tarik', 
          player_last_name: 'Islam', 
          entry_name: 'Barisal Bulls', 
          total: 1734, 
          event_total: 91, 
          rank: 5, 
          last_rank: 6 
        },
        { 
          entry: 6, 
          player_first_name: 'Rifat', 
          player_last_name: 'Ali', 
          entry_name: 'Comilla Crushers', 
          total: 1712, 
          event_total: 56, 
          rank: 6, 
          last_rank: 5 
        },
        { 
          entry: 7, 
          player_first_name: 'Karim', 
          player_last_name: 'Sheikh', 
          entry_name: 'Rajshahi Riders', 
          total: 1698, 
          event_total: 73, 
          rank: 7, 
          last_rank: 7 
        },
        { 
          entry: 8, 
          player_first_name: 'Monir', 
          player_last_name: 'Hossain', 
          entry_name: 'Rangpur Rangers', 
          total: 1687, 
          event_total: 84, 
          rank: 8, 
          last_rank: 9 
        },
        { 
          entry: 9, 
          player_first_name: 'Ratul', 
          player_last_name: 'Das', 
          entry_name: 'Mymensingh Mavericks', 
          total: 1673, 
          event_total: 62, 
          rank: 9, 
          last_rank: 8 
        },
        { 
          entry: 10, 
          player_first_name: 'Shahin', 
          player_last_name: 'Alam', 
          entry_name: 'Gazipur Giants', 
          total: 1659, 
          event_total: 79, 
          rank: 10, 
          last_rank: 11 
        },
        { 
          entry: 11, 
          player_first_name: 'Mamun', 
          player_last_name: 'Sheikh', 
          entry_name: 'Narayanganj Ninjas', 
          total: 1645, 
          event_total: 68, 
          rank: 11, 
          last_rank: 10 
        },
        { 
          entry: 12, 
          player_first_name: 'Ibrahim', 
          player_last_name: 'Khan', 
          entry_name: 'Tangail Tigers', 
          total: 1634, 
          event_total: 75, 
          rank: 12, 
          last_rank: 12 
        },
        { 
          entry: 13, 
          player_first_name: 'Sabbir', 
          player_last_name: 'Ahmed', 
          entry_name: 'Jamalpur Jaguars', 
          total: 1621, 
          event_total: 58, 
          rank: 13, 
          last_rank: 13 
        },
        { 
          entry: 14, 
          player_first_name: 'Milon', 
          player_last_name: 'Rahman', 
          entry_name: 'Faridpur Falcons', 
          total: 1598, 
          event_total: 71, 
          rank: 14, 
          last_rank: 15 
        },
        { 
          entry: 15, 
          player_first_name: 'Rubel', 
          player_last_name: 'Hasan', 
          entry_name: 'Kishoreganj Kites', 
          total: 1576, 
          event_total: 64, 
          rank: 15, 
          last_rank: 14 
        }
      ],
      hasNext: false,
      page: 1
    };
  }

  // Auto-login and fetch data
  async initializeWithAuth() {
    console.log('🔐 Initializing FPL API with authentication...');
    
    // Try to authenticate
    const authResult = await this.authenticate('Jubayedsr@gmail.com', '00zZ@00321');
    
    if (authResult.success) {
      console.log('✅ Authentication successful, fetching league data...');
      
      // Fetch bootstrap data and league standings
      const [bootstrapData, leagueData] = await Promise.all([
        this.getBootstrapData(),
        this.getLeagueStandings()
      ]);

      return {
        authenticated: true,
        bootstrap: bootstrapData,
        league: leagueData,
        standings: this.transformLeagueData(leagueData)
      };
    } else {
      console.log('❌ Authentication failed, using mock data');
      
      // Still get bootstrap data (public) and use mock league data
      const bootstrapData = await this.getBootstrapData();
      const mockLeagueData = this.getMockStandings();
      
      return {
        authenticated: false,
        bootstrap: bootstrapData,
        league: mockLeagueData,
        standings: this.transformLeagueData(mockLeagueData)
      };
    }
  }
}

export default new FPLApiService();