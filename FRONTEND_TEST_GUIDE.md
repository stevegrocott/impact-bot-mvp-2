# Impact Bot v2 - Frontend Testing Guide

## 🎯 Test Results Summary

### ✅ Successfully Working:
- **Frontend Server**: Running on http://localhost:3000
- **Backend API**: Running on http://localhost:3003
- **Authentication**: Registration and login working
- **Database & Cache**: Both connected and healthy
- **Theme Loading**: Google Fonts and custom styling applied
- **Page Title**: Updated to "Impact Bot - IRIS+ Platform"

### 🧪 Manual Testing Steps

## 1. Authentication Flow
```
✅ Test Account Created:
Email: demo@impactbot.com
Password: DemoPass123!
```

### Navigate to: http://localhost:3000

You should see the login page. Use the test credentials above.

## 2. Welcome Experience (Week 1 Features)

### After login, navigate to: http://localhost:3000/welcome

**What to test:**
- 🎯 **Mode Selection**: Three modes should be visible
  - Quick Start (92% completion rate, ~10 minutes)
  - Guided Conversation (85% completion rate, ~18 minutes)
  - Professional Dashboard (78% completion rate, ~35 minutes)
- 👤 **User Type Detection**: Select your user type (Founder/M&E Professional/Mixed Team)
- ⏱️ **Time Estimates**: Each mode shows accurate time ranges
- 📊 **Success Metrics**: Transparent completion rates displayed

## 3. Quick Start Mode (Week 2 Features)

### Navigate to: http://localhost:3000/quickstart

**What to test:**
- ⏱️ **10-Minute Timer**: Real-time progress tracking
- 📝 **Organization Context Form**: 
  - Organization type dropdown
  - Problem definition
  - Target population
- 🤖 **AI Theory Generation**: (Will show loading state - backend integration needed)
- 📊 **Decision Mapping**: Key decisions your measurement will inform
- 🎯 **Indicator Suggestions**: 3-5 essential metrics
- 📄 **Export Plan**: Download option for impact plan

## 4. Personality Selection

### Navigate to: http://localhost:3000/onboarding/personality

**What to test:**
- 👥 **Three AI Personalities**:
  - Coach Riley (Encouraging, casual)
  - Advisor Morgan (Professional, structured)
  - Analyst Alex (Technical, data-driven)
- 💬 **Preview Conversations**: Click "Preview Conversation" for each
- 📊 **Completion Rates**: Different rates for each personality
- ✅ **Selection Flow**: Choose personality and continue

## 5. Visual Dashboard Entry

### Navigate to: http://localhost:3000/visual

**What to test:**
- 📊 **Professional Features Overview**
- 🚀 **Setup Path Visualization**: 4-step process
- ⏱️ **Time Estimates**: 35-45 minutes for full setup

## 6. Enhanced Foundation Dashboard (Week 3 Features)

### Navigate to: http://localhost:3000/foundation or just http://localhost:3000

**What to test:**
- 📊 **Foundation Readiness Widget** (Left side):
  - Overall score visualization
  - Category breakdown (Theory of Change, Decision Mapping, etc.)
  - Priority actions with time estimates
  - Bottleneck detection
  
- ⚡ **Quick Actions** (Right sidebar):
  - Create/Review Theory of Change
  - Decision Mapping
  - Browse Indicators (may be disabled based on readiness)
  - AI Guide Chat
  
- 📈 **Progress Tracker**:
  - Foundation phase percentage
  - Readiness level description
  
- 👥 **Team Collaboration Section**:
  - Collaborative Foundation Builder component
  - Team member list
  - Activity feed
  - Comment system

## 7. Theme and Styling

**What to verify:**
- 🎨 **Color Scheme**: Blue/Indigo primary colors
- 🔤 **Typography**: Inter font family loaded
- 📱 **Responsive Design**: Test on different screen sizes
- 🌗 **Theme Toggle**: Light/dark mode (if implemented)
- ✨ **Transitions**: Smooth hover states and animations

## 8. Error States

**Test these scenarios:**
- 🔒 **Protected Routes**: Try accessing /foundation without login
- ❌ **API Errors**: Backend returns 500 for some endpoints (expected for now)
- 📡 **Network Issues**: Disable network and check error handling

## 🐛 Known Issues

1. **Backend Routes with 500 errors**:
   - `/api/v1/foundation/status`
   - `/api/v1/theory-of-change`
   - These need data seeding or initialization

2. **Frontend Routing**:
   - Direct URL access shows 404 (normal for SPA)
   - Navigation works through React Router

3. **Data Persistence**:
   - Some features need backend integration
   - Mock data may be used in some components

## 🚀 Next Steps

1. **Complete Backend Integration**:
   - Wire up AI generation endpoints
   - Implement collaboration WebSocket
   - Add data persistence

2. **Add Analytics**:
   - Track mode selection
   - Monitor completion rates
   - User journey analysis

3. **Performance Optimization**:
   - Code splitting for routes
   - Lazy loading for heavy components
   - Cache API responses

## 📝 Testing Checklist

- [ ] Login with test credentials
- [ ] Navigate through welcome flow
- [ ] Test Quick Start mode (all steps)
- [ ] Select AI personality
- [ ] View foundation dashboard
- [ ] Test collaborative features
- [ ] Verify responsive design
- [ ] Check error states
- [ ] Test logout functionality

---

**Test Environment URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3003
- Health Check: http://localhost:3003/health

**Test Credentials:**
- Email: demo@impactbot.com
- Password: DemoPass123!