import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: string;
}

type UserMode = 'chat' | 'visual' | 'quickstart';
type PersonalityType = 'coach' | 'advisor' | 'analyst';

interface UIState {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
  loading: Record<string, boolean>;
  modals: Record<string, boolean>;
  activeModule: string;
  breadcrumbs: Array<{ label: string; path: string }>;
  // Welcome and mode selection state
  currentMode: UserMode | null;
  aiPersonality: PersonalityType | null;
  welcomeCompleted: boolean;
  onboardingStep: number;
  userType: 'founder' | 'me_professional' | 'mixed_team' | null;
}

const initialState: UIState = {
  sidebarOpen: true,
  chatPanelOpen: false,
  theme: 'light',
  notifications: [],
  loading: {},
  modals: {},
  activeModule: 'dashboard',
  breadcrumbs: [],
  // Welcome and mode selection initial state
  currentMode: null,
  aiPersonality: null,
  welcomeCompleted: false,
  onboardingStep: 0,
  userType: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleChatPanel: (state) => {
      state.chatPanelOpen = !state.chatPanelOpen;
    },
    setChatPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.chatPanelOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    setModal: (state, action: PayloadAction<{ modal: string; open: boolean }>) => {
      const { modal, open } = action.payload;
      state.modals[modal] = open;
    },
    setActiveModule: (state, action: PayloadAction<string>) => {
      state.activeModule = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    // Welcome and mode selection actions
    setUserMode: (state, action: PayloadAction<UserMode>) => {
      state.currentMode = action.payload;
    },
    setPersonality: (state, action: PayloadAction<PersonalityType>) => {
      state.aiPersonality = action.payload;
    },
    setUserType: (state, action: PayloadAction<'founder' | 'me_professional' | 'mixed_team'>) => {
      state.userType = action.payload;
    },
    completeWelcome: (state) => {
      state.welcomeCompleted = true;
    },
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboardingStep = action.payload;
    },
    resetOnboarding: (state) => {
      state.currentMode = null;
      state.aiPersonality = null;
      state.welcomeCompleted = false;
      state.onboardingStep = 0;
      state.userType = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleChatPanel,
  setChatPanelOpen,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setModal,
  setActiveModule,
  setBreadcrumbs,
  setUserMode,
  setPersonality,
  setUserType,
  completeWelcome,
  setOnboardingStep,
  resetOnboarding,
} = uiSlice.actions;

// Export actions as a named object for convenience
export const uiActions = uiSlice.actions;

export default uiSlice.reducer;