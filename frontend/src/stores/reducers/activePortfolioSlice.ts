import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActivePortfolioState {
  portfolioId: number | null;
  activeView: 'investments' | 'sales';
}

const initialState: ActivePortfolioState = {
  portfolioId: null,
  activeView: 'investments',
};

const activePortfolioSlice = createSlice({
  name: 'activePortfolio',
  initialState,
  reducers: {
    setActivePortfolio(state, action: PayloadAction<number>) {
      state.portfolioId = action.payload;
    },
    setActiveView(state, action: PayloadAction<ActivePortfolioState['activeView']>) {
      state.activeView = action.payload;
    },
    clearActivePortfolio(state) {
      state.portfolioId = null;
      state.activeView = initialState.activeView;
    },
  },
});

export const { setActivePortfolio, setActiveView, clearActivePortfolio } = activePortfolioSlice.actions;
export default activePortfolioSlice.reducer;
