# Impact Bot User Stories
*Foundation-First Conversational Interface*

## Epic 1: Welcome & Mode Selection

### Story 1.1: First-Time User Welcome
**As a** first-time user  
**I want** to understand my options for getting started  
**So that** I can choose the approach that best fits my experience and time constraints

**Acceptance Criteria:**
- [ ] Welcome screen displays three clear mode options
- [ ] Each mode shows time estimates and "best for" descriptions
- [ ] User can click "Learn More" for additional details
- [ ] Mode selection persists in user preferences
- [ ] Clear visual hierarchy guides user attention

**Definition of Done:**
- [ ] Welcome screen renders on first visit
- [ ] Mode selection updates user profile
- [ ] Analytics tracking for mode selection
- [ ] Mobile responsive design
- [ ] Accessibility compliance (WCAG 2.1 AA)

### Story 1.2: Mode Switching Safety Net
**As a** user who chose the wrong mode initially  
**I want** to switch to a different interaction style  
**So that** I don't lose my progress and can find an approach that works better for me

**Acceptance Criteria:**
- [ ] "Switch Mode" button available in all interfaces
- [ ] Progress is automatically saved before switching
- [ ] Clear confirmation message shows progress is preserved
- [ ] User can switch between any modes without data loss
- [ ] Mode switching is tracked for UX optimization

**Definition of Done:**
- [ ] Auto-save functionality implemented
- [ ] Mode switching doesn't cause data loss
- [ ] User feedback confirms successful switch
- [ ] State restoration works correctly
- [ ] Error handling for failed switches

## Epic 2: Chat-First Experience

### Story 2.1: AI Personality Selection
**As a** user choosing Chat-First mode  
**I want** to select an AI personality that matches my communication style  
**So that** the conversation feels natural and appropriate for my context

**Acceptance Criteria:**
- [ ] Three distinct personalities with clear descriptions
- [ ] Example messages show personality differences
- [ ] "Best for" guidance helps users choose appropriately
- [ ] Personality can be changed later in settings
- [ ] Selected personality affects all subsequent interactions

**Definition of Done:**
- [ ] Personality selection screen implemented
- [ ] Different language patterns for each personality
- [ ] Settings page allows personality changes
- [ ] Conversation history maintains personality consistency
- [ ] User testing validates personality differences

### Story 2.2: Foundation-First Chat Flow
**As a** user in Chat mode  
**I want** the AI to guide me through foundation building in a conversational way  
**So that** I understand why each step is important and complete my theory of change effectively

**Acceptance Criteria:**
- [ ] Chat starts with theory of change conversation
- [ ] AI explains foundation-first methodology clearly
- [ ] Progress towards foundation completion is visible
- [ ] User can ask clarifying questions at any point
- [ ] Pitfall warnings appear contextually during conversation

**Definition of Done:**
- [ ] Foundation score updates in real-time
- [ ] Chat maintains conversation context
- [ ] Theory of change data saves to backend
- [ ] Progress indicators work correctly
- [ ] Pitfall prevention system integrates

### Story 2.3: Contextual Recommendations
**As a** user chatting about my impact goals  
**I want** to receive relevant IRIS+ indicator suggestions  
**So that** I can discover proven measurement approaches for my specific context

**Acceptance Criteria:**
- [ ] AI suggests indicators based on conversation context
- [ ] Recommendations include methodology explanations
- [ ] User can bookmark indicators for later review
- [ ] Suggestions improve as more context is provided
- [ ] [ℹ️ Why this?] buttons explain recommendation logic

**Definition of Done:**
- [ ] IRIS+ integration provides contextual suggestions
- [ ] Bookmark functionality saves indicators
- [ ] Methodology tooltips implemented
- [ ] Recommendation quality improves over time
- [ ] User feedback on suggestions tracked

### Story 2.4: Pin Key Insights
**As a** user having productive conversations with the AI  
**I want** to bookmark important moments and insights  
**So that** I can easily find and reference key decisions later

**Acceptance Criteria:**
- [ ] "Pin This" button appears on relevant messages
- [ ] Pinned insights are saved to user profile
- [ ] Pinned content is searchable and organized
- [ ] AI can reference previously pinned insights
- [ ] Pins can be organized into categories

**Definition of Done:**
- [ ] Pin functionality works across all chat interfaces
- [ ] Pinned content persists across sessions
- [ ] Search functionality finds pinned insights
- [ ] AI context includes pinned information
- [ ] Pin management interface implemented

## Epic 3: Visual Dashboard Mode

### Story 3.1: Multi-Program Management
**As an** M&E professional managing multiple programs  
**I want** to switch between different program contexts easily  
**So that** I can maintain separate theories of change and indicator sets

**Acceptance Criteria:**
- [ ] Program selector shows all user's programs
- [ ] Each program maintains separate foundation data
- [ ] Quick actions available for each program context
- [ ] Program creation and management functionality
- [ ] Context switching preserves unsaved work

**Definition of Done:**
- [ ] Program switching works without data loss
- [ ] Each program has isolated data storage
- [ ] Program management CRUD operations
- [ ] Auto-save per program context
- [ ] Visual indicators show active program

### Story 3.2: Bulk Indicator Import
**As a** user with existing indicator data  
**I want** to import my indicators from CSV/Excel files  
**So that** I can quickly migrate my existing measurement systems

**Acceptance Criteria:**
- [ ] File upload supports CSV and Excel formats
- [ ] AI assists with column mapping to IRIS+ fields
- [ ] Preview shows mapping before final import
- [ ] Error handling for malformed data
- [ ] Import history and rollback capability

**Definition of Done:**
- [ ] File upload and parsing works correctly
- [ ] Column mapping interface implemented
- [ ] Data validation prevents corruption
- [ ] Import errors are clearly communicated
- [ ] Rollback functionality tested

### Story 3.3: Inline Theory Editing
**As a** user in Visual mode  
**I want** to edit my theory of change elements directly in the dashboard  
**So that** I can quickly make updates without navigating through multiple screens

**Acceptance Criteria:**
- [ ] Theory elements are editable inline
- [ ] Changes save automatically after brief delay
- [ ] AI assistance available for each field
- [ ] Validation prevents incomplete entries
- [ ] Changes update foundation score in real-time

**Definition of Done:**
- [ ] Inline editing works for all theory fields
- [ ] Auto-save prevents data loss
- [ ] AI suggestions appear contextually
- [ ] Validation provides helpful feedback
- [ ] Foundation score updates correctly

### Story 3.4: Collaborative Visual Editing
**As a** team member working on impact measurement  
**I want** to see when others are editing the same theory of change  
**So that** we can avoid conflicts and collaborate effectively

**Acceptance Criteria:**
- [ ] Real-time indicators show who's editing what
- [ ] Conflict resolution for simultaneous edits
- [ ] Comment system for collaborative feedback
- [ ] Version history shows all changes
- [ ] Role-based permissions control access

**Definition of Done:**
- [ ] Real-time collaboration doesn't cause conflicts
- [ ] User presence indicators work correctly
- [ ] Comment system integrates with theory elements
- [ ] Version history is comprehensive
- [ ] Permissions system enforces roles

## Epic 4: Quick Start Mode

### Story 4.1: Rapid Plan Generation
**As a** busy founder needing quick results  
**I want** to generate a starter impact plan in under 10 minutes  
**So that** I have something to build on without extensive upfront investment

**Acceptance Criteria:**
- [ ] Quick questionnaire captures essential context
- [ ] AI generates theory of change from responses
- [ ] Suggested indicators match organization type
- [ ] Plan exports to PDF/Excel immediately
- [ ] User can refine plan later in other modes

**Definition of Done:**
- [ ] Complete flow takes under 10 minutes
- [ ] Generated plans meet quality standards
- [ ] Export functionality works correctly
- [ ] Plan can be enhanced in other modes
- [ ] User satisfaction with quick plans measured

### Story 4.2: Smart Defaults by Organization Type
**As a** user in Quick Start mode  
**I want** the system to suggest appropriate defaults based on my organization type  
**So that** the generated plan is relevant and actionable without extensive customization

**Acceptance Criteria:**
- [ ] Organization type selection affects all defaults
- [ ] Industry-specific templates available
- [ ] Common indicators pre-selected appropriately
- [ ] Decision questions match typical needs
- [ ] Examples come from similar organizations

**Definition of Done:**
- [ ] Defaults are contextually appropriate
- [ ] Template library covers major sectors
- [ ] Pre-selected indicators are high-quality
- [ ] Decision questions are actionable
- [ ] User testing validates relevance

## Epic 5: Foundation-First Enforcement

### Story 5.1: Progressive Feature Unlocking
**As a** user building my foundation  
**I want** to see clearly what features unlock at each foundation level  
**So that** I'm motivated to complete my foundation and understand why it's required

**Acceptance Criteria:**
- [ ] Foundation score prominently displayed
- [ ] Clear indicators show locked/unlocked features
- [ ] Progress visualization motivates completion
- [ ] Tooltips explain why features are locked
- [ ] Bypass options for testing/demo purposes

**Definition of Done:**
- [ ] Foundation score calculation works correctly
- [ ] Feature locking enforces methodology
- [ ] Progress indicators are motivating
- [ ] User understands reasoning for locks
- [ ] Admin bypass works for demos

### Story 5.2: Real-Time Pitfall Warnings
**As a** user making measurement decisions  
**I want** to receive warnings when I'm about to make common mistakes  
**So that** I can avoid expensive measurement pitfalls

**Acceptance Criteria:**
- [ ] AI detects potential pitfalls in real-time
- [ ] Warnings appear before user commits to poor choices
- [ ] Explanations help user understand the issue
- [ ] Alternative approaches are suggested
- [ ] Users can override warnings if needed

**Definition of Done:**
- [ ] Pitfall detection accuracy is high
- [ ] Warnings appear at the right time
- [ ] Explanations are educational
- [ ] Alternative suggestions are helpful
- [ ] Override mechanism works when appropriate

### Story 5.3: Decision Mapping Integration
**As a** user completing my foundation  
**I want** to define what decisions my measurement will inform  
**So that** my indicator selection is purposeful and actionable

**Acceptance Criteria:**
- [ ] Decision mapping integrates with theory of change
- [ ] Common decision types have templates
- [ ] Decision context affects indicator recommendations
- [ ] Decision quality can be tracked over time
- [ ] Integration with reporting shows decision outcomes

**Definition of Done:**
- [ ] Decision mapping affects recommendations
- [ ] Templates speed decision definition
- [ ] Decision tracking works correctly
- [ ] Reports show decision outcomes
- [ ] User understands decision-measurement connection

## Epic 6: Cross-Mode Features

### Story 6.1: Consistent AI Assistance
**As a** user in any mode  
**I want** access to AI guidance appropriate to my current context  
**So that** I can get help without switching modes or losing progress

**Acceptance Criteria:**
- [ ] AI assistant available in all modes
- [ ] Assistance adapts to current mode and context
- [ ] Help system provides relevant guidance
- [ ] AI can explain methodology behind recommendations
- [ ] Users can escalate to human support when needed

**Definition of Done:**
- [ ] AI assistance works in all interfaces
- [ ] Context-aware help is relevant
- [ ] Methodology explanations are clear
- [ ] Support escalation path works
- [ ] User satisfaction with help is high

### Story 6.2: Universal Search & Discovery
**As a** user looking for specific indicators or concepts  
**I want** to search across all content and get relevant results  
**So that** I can quickly find what I need regardless of my current location

**Acceptance Criteria:**
- [ ] Search works across indicators, theory elements, and conversations
- [ ] Results are ranked by relevance to user context
- [ ] Search suggestions help users find related concepts
- [ ] Search history helps users retrace their steps
- [ ] Search integrates with bookmarking system

**Definition of Done:**
- [ ] Search covers all relevant content
- [ ] Results ranking is helpful
- [ ] Search suggestions improve discovery
- [ ] History helps user workflow
- [ ] Bookmarking integrates smoothly

### Story 6.3: Seamless Data Export
**As a** user needing to share my measurement plan  
**I want** to export my work in multiple formats  
**So that** I can meet different stakeholder requirements and workflows

**Acceptance Criteria:**
- [ ] Export supports PDF, Excel, and JSON formats
- [ ] Templates match common funder requirements
- [ ] Exports include methodology explanations
- [ ] Custom export options available
- [ ] Export history tracks what was shared when

**Definition of Done:**
- [ ] All export formats work correctly
- [ ] Templates are professionally formatted
- [ ] Methodology sections are comprehensive
- [ ] Customization options meet user needs
- [ ] Export tracking helps user workflow

## Success Metrics Per Epic

### Epic 1: Welcome & Mode Selection
- [ ] **Mode Selection Rate**: >90% of users complete mode selection
- [ ] **Mode Switching**: 20-30% of users try multiple modes (indicates flexibility)
- [ ] **Time to First Value**: <15 minutes across all modes

### Epic 2: Chat-First Experience
- [ ] **Conversation Completion**: >80% complete foundation conversation
- [ ] **Foundation Score**: >70% reach minimum threshold for unlocking features
- [ ] **Recommendation Engagement**: >60% bookmark at least one suggestion

### Epic 3: Visual Dashboard Mode
- [ ] **Bulk Import Success**: >90% of imports complete without errors
- [ ] **Multi-Program Usage**: Power users manage average of 3+ programs
- [ ] **Inline Edit Adoption**: >80% of Visual users use inline editing

### Epic 4: Quick Start Mode
- [ ] **Time to Complete**: >90% finish in under 10 minutes
- [ ] **Plan Quality**: Generated plans score >50% foundation readiness
- [ ] **Refinement Rate**: >40% enhance Quick Start plans in other modes

### Epic 5: Foundation-First Enforcement
- [ ] **Foundation Completion**: >80% reach intermediate access level
- [ ] **Pitfall Prevention**: Warnings reduce poor indicator selection by >60%
- [ ] **Decision Mapping**: >70% complete at least one decision mapping

### Epic 6: Cross-Mode Features
- [ ] **AI Assistance Usage**: >60% users engage with AI help across modes
- [ ] **Search Success**: >80% of searches result in useful actions
- [ ] **Export Adoption**: >50% of completed foundations are exported

---

*These user stories provide the bridge between UX vision and development implementation, ensuring that technical work directly supports the intended user experience.*