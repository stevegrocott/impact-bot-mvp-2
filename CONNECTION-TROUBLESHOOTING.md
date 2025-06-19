# Connection Troubleshooting Guide

## 🚨 If you're getting "localhost refused to connect"

### Quick Fix Commands:
```bash
# 1. Kill any stuck processes
pkill -f "react-scripts"
pkill -f "tsx watch"

# 2. Restart frontend
cd frontend && npm start

# 3. Restart backend (in new terminal)
cd backend && npm run dev

# 4. Test connections
curl http://localhost:3000
curl http://localhost:3003/health
```

### ✅ Current Working URLs:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **Organization Dashboard**: http://localhost:3000/organization
- **Login Page**: http://localhost:3000/login
- **Foundation Dashboard**: http://localhost:3000/foundation

### ❌ URLs that won't work in development:
- **http://localhost:3001** (This is for Docker/production only)

### 🔧 Environment Check:
```bash
# Run this to verify everything is working:
cd /Users/shinytrap/projects/impact-bot-mvp-2
node test-enhanced-navigation.js
```

### 🔍 Common Issues:

1. **Frontend won't start**:
   - Check if port 3000 is already in use: `lsof -i :3000`
   - Clear React cache: `cd frontend && rm -rf node_modules/.cache`

2. **Backend won't start**:
   - Check if port 3003 is already in use: `lsof -i :3003`
   - Verify database is running: `curl http://localhost:3003/health`

3. **Browser shows old content**:
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Clear browser cache
   - Try incognito/private mode

4. **API calls fail**:
   - Check frontend environment: `cat frontend/.env.development`
   - Should show: `REACT_APP_API_BASE_URL=http://localhost:3003`

### 📋 Pre-Testing Verification:
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend healthy at http://localhost:3003/health
- [ ] Organization route works: http://localhost:3000/organization
- [ ] Login page loads: http://localhost:3000/login
- [ ] No console errors in browser dev tools

### 🆘 If nothing works:
1. Restart your computer
2. Run: `cd /Users/shinytrap/projects/impact-bot-mvp-2`
3. Run: `cd frontend && npm install && npm start`
4. In new terminal: `cd backend && npm install && npm run dev`
5. Test: http://localhost:3000

### 📞 Status Check Command:
```bash
echo "Frontend:" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
echo "Backend:" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3003/health
echo "Organization:" && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/organization
```
Expected output: All should show `200`