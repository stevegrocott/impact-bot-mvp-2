# Impact Bot Technical Interface Specification
*Implementation Guide for Foundation-First UX*

## Architecture Overview

### State Management
```typescript
// User Interface State
interface UIState {
  userMode: 'chat' | 'visual' | 'quickstart';
  aiPersonality: 'coach' | 'advisor' | 'analyst';
  foundationScore: number;
  currentProject: string;
  accessLevels: {
    basic: boolean;
    intermediate: boolean;
    advanced: boolean;
  };
}

// User Preferences
interface UserPreferences {
  defaultMode: 'chat' | 'visual' | 'quickstart';
  personality: 'coach' | 'advisor' | 'analyst';
  notifications: boolean;
  darkMode: boolean;
  autoSave: boolean;
}
```

### Component Architecture

#### Welcome Flow Components
```typescript
// Welcome Screen Component
interface WelcomeScreenProps {
  onModeSelect: (mode: UserMode) => void;
  onLearnMore: () => void;
}

// Mode Selection Card
interface ModeCardProps {
  mode: {
    id: string;
    icon: string;
    title: string;
    description: string;
    bestFor: string[];
    timeEstimate: string;
  };
  onSelect: (modeId: string) => void;
  isSelected: boolean;
}

// Personality Selection
interface PersonalitySelectionProps {
  personalities: PersonalityOption[];
  selectedPersonality: string;
  onPersonalityChange: (personality: string) => void;
}
```

#### Chat Interface Components
```typescript
// Enhanced Chat Interface
interface ChatInterfaceProps {
  conversationId: string;
  personality: 'coach' | 'advisor' | 'analyst';
  contextualHelp: boolean;
  showRecommendations: boolean;
  onModeSwitch: (mode: string) => void;
}

// Message with Personality
interface PersonalityMessageProps {
  message: ConversationMessage;
  personality: PersonalityConfig;
  showMethodology: boolean;
  onPin: (messageId: string) => void;
}

// Suggestion System
interface SuggestionSystemProps {
  context: UserContext;
  personality: PersonalityConfig;
  onSuggestionClick: (suggestion: string) => void;
  maxSuggestions: number;
}
```

#### Visual Dashboard Components
```typescript
// Program Selector
interface ProgramSelectorProps {
  programs: Program[];
  activeProgram: string;
  onProgramChange: (programId: string) => void;
  onCreateProgram: () => void;
}

// Theory of Change Builder
interface TheoryBuilderProps {
  theory: TheoryOfChange;
  onTheoryUpdate: (updates: Partial<TheoryOfChange>) => void;
  readOnly: boolean;
  showAIAssistance: boolean;
}

// Indicator Library
interface IndicatorLibraryProps {
  searchQuery: string;
  selectedIndicators: string[];
  onIndicatorToggle: (indicatorId: string) => void;
  onBulkImport: (file: File) => void;
  filters: IndicatorFilters;
}
```

## API Integration Layer

### Service Layer Structure
```typescript
// Interface Service
class InterfaceService {
  // Mode Management
  async saveUserMode(userId: string, mode: UserMode): Promise<void>;
  async getUserPreferences(userId: string): Promise<UserPreferences>;
  async updatePersonality(userId: string, personality: PersonalityType): Promise<void>;

  // Foundation Integration
  async getFoundationStatus(organizationId: string): Promise<FoundationStatus>;
  async updateFoundationScore(organizationId: string): Promise<FoundationReadiness>;
  
  // Progress Tracking
  async trackUserAction(action: UserAction): Promise<void>;
  async getBehavioralTriggers(userId: string): Promise<BehavioralTrigger[]>;
}

// Chat Service Extension
class ChatService extends BaseConversationService {
  async sendPersonalizedMessage(
    conversationId: string,
    message: string,
    personality: PersonalityType,
    context: UserContext
  ): Promise<ConversationResponse>;

  async getContextualSuggestions(
    input: string,
    personality: PersonalityType,
    userContext: UserContext
  ): Promise<string[]>;

  async pinMessage(messageId: string, userId: string): Promise<void>;
  async getPinnedInsights(userId: string): Promise<PinnedMessage[]>;
}

// Visual Mode Service
class VisualModeService {
  async bulkImportIndicators(file: File, mapping: FieldMapping): Promise<ImportResult>;
  async exportFoundationData(format: 'pdf' | 'excel' | 'json'): Promise<Blob>;
  async saveInlineEdit(fieldPath: string, value: any): Promise<void>;
  async getTemplateLibrary(): Promise<Template[]>;
}
```

### Real-time Features
```typescript
// WebSocket Integration for Collaboration
interface CollaborationSocket {
  onUserJoin: (user: User) => void;
  onFieldEdit: (field: string, value: any, user: User) => void;
  onCommentAdd: (comment: Comment) => void;
  onCursorMove: (position: CursorPosition, user: User) => void;
}

// Auto-save Implementation
interface AutoSaveManager {
  saveInterval: number; // ms
  onAutoSave: (data: any) => Promise<void>;
  onRestore: () => Promise<any>;
  conflictResolution: 'user' | 'server' | 'merge';
}
```

## State Management Implementation

### Redux Store Structure
```typescript
// UI Slice
interface UISlice {
  currentMode: UserMode;
  personality: PersonalityType;
  welcomeCompleted: boolean;
  onboardingStep: number;
  sidebarExpanded: boolean;
  darkMode: boolean;
  notifications: Notification[];
}

// Foundation Slice
interface FoundationSlice {
  status: FoundationStatus | null;
  readiness: FoundationReadiness | null;
  theory: TheoryOfChange | null;
  decisions: DecisionMapping[];
  loading: boolean;
  error: string | null;
}

// Conversation Slice (Enhanced)
interface ConversationSlice {
  conversations: { [id: string]: Conversation };
  pinnedMessages: PinnedMessage[];
  personality: PersonalityConfig;
  suggestions: string[];
  isTyping: boolean;
  isLoading: boolean;
}

// Visual Mode Slice
interface VisualModeSlice {
  activeProgram: string;
  programs: Program[];
  indicatorLibrary: IndicatorLibraryState;
  bulkOperations: BulkOperationState[];
  templates: Template[];
  collaborators: ActiveCollaborator[];
}
```

### Action Creators
```typescript
// UI Actions
const uiActions = {
  setUserMode: (mode: UserMode) => ({ type: 'ui/setMode', payload: mode }),
  setPersonality: (personality: PersonalityType) => ({ type: 'ui/setPersonality', payload: personality }),
  completeWelcome: () => ({ type: 'ui/completeWelcome' }),
  showNotification: (notification: Notification) => ({ type: 'ui/showNotification', payload: notification }),
  toggleDarkMode: () => ({ type: 'ui/toggleDarkMode' }),
};

// Enhanced Conversation Actions  
const conversationActions = {
  ...existingActions,
  pinMessage: (messageId: string) => ({ type: 'conversation/pinMessage', payload: messageId }),
  unpinMessage: (messageId: string) => ({ type: 'conversation/unpinMessage', payload: messageId }),
  setPersonalityConfig: (config: PersonalityConfig) => ({ type: 'conversation/setPersonality', payload: config }),
  addSuggestion: (suggestion: string) => ({ type: 'conversation/addSuggestion', payload: suggestion }),
};

// Visual Mode Actions
const visualModeActions = {
  setActiveProgram: (programId: string) => ({ type: 'visual/setActiveProgram', payload: programId }),
  startBulkImport: (file: File) => ({ type: 'visual/startBulkImport', payload: file }),
  updateInlineField: (field: string, value: any) => ({ type: 'visual/updateField', payload: { field, value } }),
  addCollaborator: (user: User) => ({ type: 'visual/addCollaborator', payload: user }),
};
```

## Component Implementation Guidelines

### Welcome Screen Implementation
```typescript
// Welcome Screen Component
const WelcomeScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const modes: ModeDefinition[] = [
    {
      id: 'chat',
      icon: '🤖',
      title: 'Guided Chat',
      description: 'Let AI walk you through each step',
      bestFor: ['First-time users', 'Complex programs'],
      timeEstimate: '~15-25 minutes',
      successMetric: 'Foundation score >30%'
    },
    {
      id: 'visual',
      icon: '📊',
      title: 'Visual Dashboards',
      description: 'Jump straight to structured forms and data views',
      bestFor: ['M&E professionals', 'Bulk imports'],
      timeEstimate: '~20+ minutes',
      successMetric: '≥5 indicators selected + theory drafted'
    },
    {
      id: 'quickstart',
      icon: '⚡',
      title: 'Quick Start',
      description: 'Generate a starter plan with smart defaults',
      bestFor: ['Time-pressed founders', 'Initial drafts'],
      timeEstimate: '~10 minutes',
      successMetric: 'Plan generated + exported'
    }
  ];

  const handleModeSelect = (mode: UserMode) => {
    dispatch(uiActions.setUserMode(mode));
    if (mode === 'chat') {
      // Redirect to personality selection
      navigate('/onboarding/personality');
    } else {
      dispatch(uiActions.completeWelcome());
      navigate(`/${mode}`);
    }
  };

  return (
    <div className="welcome-screen">
      <h1>Welcome to Impact Bot</h1>
      <p>How do you want to get started?</p>
      
      <div className="mode-grid">
        {modes.map(mode => (
          <ModeCard
            key={mode.id}
            mode={mode}
            onSelect={handleModeSelect}
            isSelected={selectedMode === mode.id}
          />
        ))}
      </div>
      
      <div className="actions">
        <button onClick={() => setShowDetails(true)}>Learn More About Each</button>
        <button 
          onClick={() => handleModeSelect(selectedMode!)}
          disabled={!selectedMode}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
```

### Personality Selection Implementation
```typescript
// Personality Selection Component
const PersonalitySelection: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityType>('coach');

  const personalities: PersonalityDefinition[] = [
    {
      id: 'coach',
      name: 'Coach Riley',
      icon: '💬',
      description: 'Encouraging, casual',
      example: "That's a solid start! Let's think about what success looks like.",
      bestFor: 'First-time users, entrepreneurs',
      tone: 'supportive'
    },
    {
      id: 'advisor',
      name: 'Advisor Morgan',
      icon: '🧭',
      description: 'Clear, formal',
      example: "Clearly articulate the causal pathway from activities to impact.",
      bestFor: 'Established organizations',
      tone: 'professional'
    },
    {
      id: 'analyst',
      name: 'Analyst Alex',
      icon: '📐',
      description: 'Precise, technical',
      example: "Self-reported outcomes may introduce social desirability bias.",
      bestFor: 'M&E professionals, researchers',
      tone: 'technical'
    }
  ];

  const handlePersonalitySelect = (personality: PersonalityType) => {
    dispatch(uiActions.setPersonality(personality));
    dispatch(conversationActions.setPersonalityConfig(personalities.find(p => p.id === personality)!));
    dispatch(uiActions.completeWelcome());
    navigate('/chat');
  };

  return (
    <div className="personality-selection">
      <h2>Choose Your AI Guide</h2>
      <p>Choose a guide that fits your style:</p>
      
      <div className="personality-grid">
        {personalities.map(personality => (
          <PersonalityCard
            key={personality.id}
            personality={personality}
            onSelect={handlePersonalitySelect}
            isSelected={selectedPersonality === personality.id}
          />
        ))}
      </div>
      
      <p className="note">You can change this anytime in settings</p>
    </div>
  );
};
```

### Mode Switching Implementation
```typescript
// Mode Switch Hook
const useModeSwitch = () => {
  const dispatch = useDispatch();
  const currentMode = useSelector((state: RootState) => state.ui.currentMode);
  
  const switchMode = useCallback(async (newMode: UserMode) => {
    // Auto-save current state
    await dispatch(autoSaveCurrentState());
    
    // Update mode
    dispatch(uiActions.setUserMode(newMode));
    
    // Show confirmation
    dispatch(uiActions.showNotification({
      type: 'success',
      message: `Switched to ${newMode} mode. Your progress is saved.`,
      duration: 3000
    }));
    
    // Navigate to new mode
    navigate(`/${newMode}`);
  }, [dispatch]);

  return { currentMode, switchMode };
};

// Mode Switch Component
const ModeSwitchButton: React.FC<{ targetMode: UserMode }> = ({ targetMode }) => {
  const { switchMode } = useModeSwitch();
  
  return (
    <button 
      onClick={() => switchMode(targetMode)}
      className="mode-switch-btn"
    >
      Switch to {targetMode === 'chat' ? 'Chat' : targetMode === 'visual' ? 'Visual' : 'Quick Start'}
    </button>
  );
};
```

## Error Handling & Recovery

### Enhanced Error Boundaries
```typescript
// Interface Error Boundary
class InterfaceErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to analytics
    analytics.track('Interface Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userMode: store.getState().ui.currentMode,
      userId: store.getState().auth.user?.id
    });
  }

  handleRecovery = (recoveryAction: 'refresh' | 'chat' | 'support') => {
    switch (recoveryAction) {
      case 'refresh':
        window.location.reload();
        break;
      case 'chat':
        this.setState({ hasError: false });
        navigate('/chat');
        break;
      case 'support':
        window.open('/support', '_blank');
        break;
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorRecoveryUI
          error={this.state.error}
          onRecovery={this.handleRecovery}
        />
      );
    }

    return this.props.children;
  }
}
```

### Network Error Handling
```typescript
// Offline Support
const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      dispatch(uiActions.showNotification({
        type: 'success',
        message: 'Connection restored. Syncing your changes...'
      }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      dispatch(uiActions.showNotification({
        type: 'warning',
        message: 'Working offline. Changes will sync when connection returns.',
        persistent: true
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  return isOnline;
};
```

## Performance Optimization

### Lazy Loading Strategy
```typescript
// Route-based Code Splitting
const ChatMode = lazy(() => import('../pages/ChatMode'));
const VisualMode = lazy(() => import('../pages/VisualMode'));
const QuickStartMode = lazy(() => import('../pages/QuickStartMode'));

// Component-based Splitting
const IndicatorLibrary = lazy(() => import('../components/IndicatorLibrary'));
const ReportBuilder = lazy(() => import('../components/ReportBuilder'));

// Lazy Loading with Error Boundaries
const LazyComponent: React.FC<{ component: React.ComponentType }> = ({ component: Component }) => (
  <Suspense fallback={<LoadingSpinner />}>
    <InterfaceErrorBoundary>
      <Component />
    </InterfaceErrorBoundary>
  </Suspense>
);
```

### State Optimization
```typescript
// Selective State Updates
const useSelectiveState = <T>(selector: (state: RootState) => T) => {
  return useSelector(selector, shallowEqual);
};

// Memoized Selectors
const selectFoundationWithReadiness = createSelector(
  [(state: RootState) => state.foundation.status, (state: RootState) => state.foundation.readiness],
  (status, readiness) => ({ status, readiness })
);

// Virtualized Lists for Large Datasets
const VirtualizedIndicatorList: React.FC<{ indicators: Indicator[] }> = ({ indicators }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={indicators.length}
      itemSize={60}
      itemData={indicators}
    >
      {IndicatorListItem}
    </FixedSizeList>
  );
};
```

---

*This technical specification provides the implementation blueprint for the Interface Design Brief and should be referenced during development to ensure consistency with the UX vision.*