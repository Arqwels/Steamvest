import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '../store';
import { clearActivePortfolio } from './activePortfolioSlice';
import { clearAllInvestments } from './investmentsSlice';
import { baseApi } from '../../api/baseApi';

interface User {
  email: string;
  id: number;
  isActivated: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  initialized: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.initialized = true;
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.initialized = true;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;

export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectInitialized = (state: RootState) => state.auth.initialized;

// Пользователь считается залогиненным, если есть токен инициализация завершена
export const selectIsLoggedIn = (state: RootState) =>
  Boolean(state.auth.accessToken);

export const logoutAndReset = () => (dispatch: AppDispatch) => {
  // очищаем auth
  dispatch(logout());

  // очищаем пользовательские слайсы
  dispatch(clearActivePortfolio());
  dispatch(clearAllInvestments());

  // сбрасываем кеш RTK Query
  dispatch(baseApi.util.resetApiState());
};
