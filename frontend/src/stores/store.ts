import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import activePortfolioReducer from './reducers/activePortfolioSlice';
import authReducer from './reducers/authSlice';
import investmentsReducer from './reducers/investmentsSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    activePortfolio: activePortfolioReducer,
    auth: authReducer,
    investments: investmentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
