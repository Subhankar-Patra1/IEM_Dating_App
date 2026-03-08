import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token: string }>
    ) => {
      console.log('[DEBUG REDUX]: setCredentials action called with payload:', action.payload);
      state.user = action.payload.user;
      state.token = action.payload.token;
      
      // If user has completed profile (department and year exist), mark as authenticated
      // This handles returning users logging in.
      if (state.user?.department && state.user?.year) {
        state.isAuthenticated = true;
      }
      console.log('[DEBUG REDUX]: New Auth State - token:', state.token ? 'EXISTS' : 'MISSING', 'isAuthenticated:', state.isAuthenticated);
    },
    updateUser: (state, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload };
    },
    completeOnboarding: (state) => {
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout, updateUser, completeOnboarding } = authSlice.actions;
export default authSlice.reducer;
