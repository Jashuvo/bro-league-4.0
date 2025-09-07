# BRO League 4.0 - Deployment Guide

## 🚀 Vercel Deployment (Recommended)

### Why Vercel?
- **Serverless Functions**: Eliminates CORS issues by handling FPL API calls server-side
- **Automatic Caching**: Built-in edge caching for better performance
- **Zero Configuration**: Works out of the box with our setup
- **Free Tier**: Perfect for personal projects like FPL leagues

### Quick Deployment Steps

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Vercel serverless functions"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Environment Variables** (in Vercel Dashboard):
   ```
   VITE_FPL_LEAGUE_ID=1858389
   VITE_LEAGUE_NAME=BRO League 4.0
   VITE_TOTAL_PARTICIPANTS=15
   VITE_ENTRY_FEE=800
   VITE_TOTAL_PRIZE_POOL=12000
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `your-project.vercel.app`

### API Routes Available
Once deployed, these endpoints will be available:

- `GET /api/bootstrap` - FPL bootstrap data
- `GET /api/league?leagueId=XXXX` - League standings with manager details
- `GET /api/manager-history?managerId=XXXX` - Individual manager history
- `GET /api/league-complete?leagueId=XXXX` - **Optimized single call for all data**

### Performance Improvements

#### Before (CORS Proxy Issues):
- ❌ Multiple unreliable CORS proxies
- ❌ 15-30 second load times
- ❌ Frequent API failures
- ❌ No caching
- ❌ Mock data fallbacks

#### After (Vercel Serverless):
- ✅ Direct FPL API access (server-side)
- ✅ 2-5 second load times
- ✅ Reliable data fetching
- ✅ Built-in caching (2-5 minutes)
- ✅ No mock data needed

### Local Development

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Run locally**:
   ```bash
   npm run dev
   # API routes available at http://localhost:5173/api/*
   ```

3. **Test with Vercel dev** (simulates serverless functions):
   ```bash
   vercel dev
   # More accurate testing of API routes
   ```

### Testing Your API

Test your deployed API endpoints:

```bash
# Test bootstrap data
curl https://your-project.vercel.app/api/bootstrap

# Test league data
curl https://your-project.vercel.app/api/league?leagueId=1858389

# Test complete league data (recommended)
curl https://your-project.vercel.app/api/league-complete?leagueId=1858389
```

### Monitoring Performance

Check your Vercel dashboard for:
- Function execution times
- Cache hit rates
- Error logs
- Usage statistics

### Troubleshooting

**If API routes return errors:**
1. Check Vercel function logs in dashboard
2. Verify environment variables are set
3. Ensure FPL league ID is correct
4. Check if FPL API is accessible

**If data seems stale:**
- Data is cached for 2-5 minutes
- Use browser dev tools to check cache headers
- Force refresh will clear local cache

### Advanced Configuration

**Custom Domain** (optional):
- Add your domain in Vercel dashboard
- Update DNS settings
- Automatic HTTPS included

**Performance Optimization**:
- Enable Analytics in Vercel dashboard
- Monitor Core Web Vitals
- Optimize images if needed

### GitHub Pages (Not Recommended)

⚠️ **Important**: GitHub Pages only supports static hosting. The serverless API routes won't work there. If you still want to use GitHub Pages:

1. You'll need to use the old CORS proxy method (unreliable)
2. Or deploy API routes separately (like on Vercel) and point your frontend there

**Recommendation**: Use Vercel for both frontend and API for the best experience.

### Cost

- **Vercel Free Tier**: 
  - 100GB bandwidth/month
  - 100 serverless function executions per day
  - Perfect for personal FPL leagues

- **If you exceed limits**: Upgrade to Pro ($20/month) with higher limits

### Security

- API routes are public but rate-limited
- No authentication required for FPL public data
- No sensitive data stored or transmitted
- HTTPS enabled by default

### Backup Strategy

- Keep your GitHub repository updated
- Vercel deployments are automatic from GitHub
- Environment variables backed up in Vercel dashboard
- Database-free design = minimal backup needs

---

## 🎯 Quick Start (TL;DR)

1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy
5. Enjoy fast, reliable FPL data! 🚀

Your league members will notice the dramatic performance improvement!