# Impact Bot v2 - GUI Wireframes
*Foundation-First Pitfall Prevention Interface*

## 🎯 Design Principles

1. **Foundation-First:** Always start with Theory of Change
2. **Progressive Disclosure:** Unlock features as foundation improves  
3. **Real-Time Guidance:** Contextual warnings and suggestions
4. **Clear Navigation:** Obvious next steps at every stage
5. **Conversational Flow:** Make complex concepts approachable

---

## 📱 Page 1: Foundation Dashboard (Landing After Login)
*The central hub that shows foundation readiness and guides next steps*

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Impact Bot] [Foundation] [Indicators] [Chat] [Profile]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👋 Welcome back, Demo User!                               │
│                                                             │
│  ┌─── Foundation Readiness ────────────────────────────┐    │
│  │  📊 Your Foundation Score: 65% (Good)              │    │
│  │  ✅ Theory of Change: Complete                      │    │
│  │  ⚠️  Decision Mapping: Needs attention              │    │
│  │  🔒 Advanced Features: Locked (need 80%+ score)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─── What You Can Do Now ──────────────────────────┐      │
│  │  🎯 [Review Your Theory of Change]               │      │
│  │  📋 [Define Decision Questions] ← Recommended     │      │
│  │  🔍 [Browse Basic Indicators]                    │      │
│  │  💬 [Chat with AI Guide]                         │      │
│  └───────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─── Recent Activity ──────────────────────────────┐      │
│  │  • Theory of change uploaded 2 days ago          │      │
│  │  • 3 indicators bookmarked                       │      │
│  │  • Foundation score improved from 45% to 65%     │      │
│  └───────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Foundation Score:** Clear progress indicator
- **Gated Access:** Shows what's unlocked/locked
- **Next Steps:** Always shows recommended action
- **Recent Activity:** Builds momentum

---

## 📱 Page 2: Theory of Change Builder 
*Simple, guided approach to building foundation*

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Impact Bot] > [Foundation] > Theory of Change          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📝 Build Your Theory of Change                            │
│  Step 2 of 5: Define Your Target Population                │
│                                                             │
│  ┌─── Progress ─────────────────────────────────────┐      │
│  │  [●●○○○] 40% Complete                           │      │
│  │  ✅ Problem   ✅ Population   ○ Activities       │      │
│  │  ○ Outcomes   ○ Review                          │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─── AI Assistant ────────────────────────────────┐      │
│  │  💡 "I see you're working on youth employment.   │      │
│  │      Let's define your target population clearly │      │
│  │      to avoid measurement pitfalls later."       │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  Who exactly are you trying to help?                       │
│  ┌─────────────────────────────────────────────────┐      │
│  │  Young people aged 18-25 in urban areas who     │      │
│  │  have completed secondary education but are      │      │
│  │  unemployed or underemployed...                  │      │
│  │                                               📝 │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  💡 Examples: "Single mothers in rural Kenya aged 20-35"   │
│     "Recent graduates with STEM degrees in major cities"   │
│                                                             │
│  [← Previous]                    [Continue →]              │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Step-by-Step:** One question at a time
- **Progress Indicator:** Clear sense of completion
- **AI Assistant:** Contextual guidance and warnings
- **Examples:** Help users understand what's expected

---

## 📱 Page 3: Indicator Selection with Pitfall Warnings
*Real-time guidance during indicator discovery*

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Impact Bot] > [Indicators] > Browse & Select           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Find Indicators for Youth Employment Program           │
│                                                             │
│  ┌─── Pitfall Alert! ──────────────────────────────┐      │
│  │  ⚠️  You've selected mostly OUTPUT indicators.    │      │
│  │      This is a common pitfall - you're measuring  │      │
│  │      activities, not impact!                      │      │
│  │                                                   │      │
│  │  💡 Suggestion: Add outcome indicators like:      │      │
│  │     • Employment rate of participants             │      │
│  │     • Income improvement over 6 months            │      │
│  │                                                   │      │
│  │  [Show Me Outcomes] [I Understand] [Learn More]  │      │
│  └───────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─── Your Selection ──────────┐ ┌─── Suggestions ──────┐  │
│  │  ✅ Training sessions        │ │  💡 Based on your     │  │
│  │     delivered (OUTPUT)       │ │     theory of change: │  │
│  │                              │ │                       │  │
│  │  ✅ Number of participants   │ │  📊 Employment rate   │  │
│  │     (OUTPUT)                 │ │     (OUTCOME) ⭐      │  │
│  │                              │ │                       │  │
│  │  ➕ Add More Indicators      │ │  📈 Income increase   │  │
│  │                              │ │     (IMPACT) ⭐       │  │
│  └──────────────────────────────┘ └───────────────────────┘  │
│                                                             │
│  Portfolio Balance: ⚠️ Too output-heavy                     │
│  [●●●○○] Outputs  [●○○○○] Outcomes  [○○○○○] Impact         │
│                                                             │
│  [Continue with Current] [Add Recommended] [Start Over]    │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Real-Time Warnings:** Immediate pitfall detection
- **Portfolio Visualization:** Balance of output/outcome/impact
- **Contextual Suggestions:** Based on theory of change
- **Clear Actions:** What to do about warnings

---

## 📱 Page 4: Conversational AI Guide
*Natural language interface for complex questions*

```
┌─────────────────────────────────────────────────────────────┐
│ [🏠 Impact Bot] > [Chat] > AI Measurement Guide            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💬 Chat with Your Measurement Expert                      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │  🤖 Hi! I'm here to help you avoid measurement   │      │
│  │      pitfalls. What would you like to work on?   │      │
│  │                                                   │      │
│  │  Here are some things I can help with:           │      │
│  │  • Review your indicator selection                │      │
│  │  • Find IRIS+ indicators for your sector         │      │
│  │  • Explain theory of change concepts             │      │
│  │  • Assess data collection feasibility            │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │  👤 I'm struggling to measure the impact of our   │      │
│  │      mentorship program. We can count mentoring   │      │
│  │      sessions but that doesn't feel like enough.  │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │  🤖 Great question! You're right to be concerned  │      │
│  │      - counting sessions is an OUTPUT (activity   │      │
│  │      measurement), not impact. Let me help you    │      │
│  │      think about OUTCOMES instead:                │      │
│  │                                                   │      │
│  │  📊 For mentorship programs, consider measuring:  │      │
│  │      • Mentee confidence/self-efficacy scores     │      │
│  │      • Goal achievement rates                     │      │
│  │      • Behavior changes (specific to your goals)  │      │
│  │                                                   │      │
│  │  Would you like me to show you specific IRIS+     │      │
│  │  indicators for these outcome areas?              │      │
│  │                                                   │      │
│  │  [Show IRIS+ Options] [Learn More About Outcomes] │      │
│  └─────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │  Type your question...                          │ [Send] │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Educational Conversation:** Explains concepts clearly
- **Pitfall Prevention Focus:** Always guides toward better measurement
- **Actionable Suggestions:** Specific next steps
- **Context Aware:** Remembers user's program and progress

---

## 🎨 Design System Elements

### Colors & Status
- **Foundation Score:** Green (80%+), Yellow (60-79%), Red (<60%)
- **Indicators:** Blue (Output), Orange (Outcome), Purple (Impact) 
- **Warnings:** Red alerts, Yellow cautions, Blue suggestions
- **Progress:** Green completion, Gray pending

### Components
- **Foundation Score Card:** Always visible in header
- **Pitfall Alert Modal:** Immediate intervention when needed
- **Progress Stepper:** Clear navigation through complex flows
- **AI Chat Bubble:** Contextual guidance throughout

### Interaction Patterns
- **Progressive Disclosure:** Start simple, reveal complexity gradually
- **Contextual Help:** AI assistant available on every page
- **Gated Progression:** Can't access advanced features without foundation
- **Real-Time Feedback:** Immediate warnings and suggestions

---

## 🚀 Implementation Priority

**Phase 1: Foundation First (Week 1)**
1. Foundation Dashboard with readiness scoring
2. Simple Theory of Change builder (5 steps max)
3. Basic gating mechanism

**Phase 2: Pitfall Prevention (Week 2)**  
1. Real-time warnings in indicator selection
2. Portfolio balance visualization
3. Contextual IRIS+ suggestions

**Phase 3: AI Integration (Week 3)**
1. Conversational interface
2. Contextual guidance throughout app
3. Learning from user behavior

This approach prioritizes user experience and ensures the powerful backend serves a clear, usable purpose.