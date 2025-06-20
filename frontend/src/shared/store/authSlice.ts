import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  preferences: Record<string, any>;
  organizationId?: string;
  currentOrganization?: {
    id: string;
    name: string;
    role?: {
      name: string;
    };
  };
}

interface Organization {
  id: string;
  name: string;
  industry?: string;
  sizeCategory?: string;
  country?: string;
  focusAreas: string[];
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  token: null,
  isAuthenticated: false,
  permissions: [],
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{
      user: User;
      organization: Organization;
      token: string;
      permissions: string[];
    }>) => {
      state.user = action.payload?.user;
      state.organization = action.payload?.organization;
      state.token = action.payload?.token;
      state.permissions = action.payload?.permissions || [];
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.organization = null;
      state.token = null;
      state.permissions = [];
      state.isAuthenticated = false;
      state.error = null;
    },
    updateUserPreferences: (state, action: PayloadAction<Record<string, any>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user?.preferences, ...action.payload };
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserPreferences,
} = authSlice.actions;

export default authSlice.reducer;