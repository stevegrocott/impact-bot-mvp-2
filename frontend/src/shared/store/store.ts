import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import conversationSlice from './conversationSlice';
import uiSlice from './uiSlice';
import cacheSlice from './cacheSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    conversation: conversationSlice,
    ui: uiSlice,
    cache: cacheSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;