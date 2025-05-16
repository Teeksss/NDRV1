import { configureStore, Action, ThunkAction } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import rootReducer, { RootState } from './rootReducer';
import { logger } from '@/utils/logger';

// Redux middleware
const middlewares: any[] = [];

// Only add logger in development
if (process.env.NODE_ENV === 'development') {
  const { createLogger } = require('redux-logger');
  middlewares.push(
    createLogger({
      collapsed: true,
      duration: true
    })
  );
}

// Configure store with middleware
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serializable check
        ignoredActions: [
          'auth/loginSuccess',
          'auth/loginFailure',
          'alerts/updateAlertSuccess',
          'ndr/fetchServiceStatus/fulfilled',
          'ndr/fetchThreatIntel/fulfilled'
        ],
        ignoredPaths: ['auth.user', 'ndr.serviceStatus.data']
      }
    }).concat(middlewares),
  devTools: process.env.NODE_ENV !== 'production'
});

// Export types
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Custom hook for dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Handle uncaught errors
store.subscribe(() => {
  const state = store.getState();
  
  // Log errors and show notifications for failures
  if (state.auth.error) {
    logger.error('Auth error:', state.auth.error);
  }
  
  if (state.ndr.serviceStatus.error) {
    logger.error('NDR service status error:', state.ndr.serviceStatus.error);
  }
  
  if (state.alerts.error) {
    logger.error('Alerts error:', state.alerts.error);
  }
});