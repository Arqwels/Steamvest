import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActivePortfolioState {
  portfolioId: number | null;
  activeView: 'investments' | 'sales';
  profitMode: 'value' | 'percent';
  sortBy: string | undefined;
  sortOrder: 'ASC' | 'DESC';
}

const initialState: ActivePortfolioState = {
  portfolioId: null,
  activeView: 'investments',
  profitMode: 'value',
  sortBy: undefined,
  sortOrder: 'DESC',
};

const activePortfolioSlice = createSlice({
  name: 'activePortfolio',
  initialState,
  reducers: {
    setActivePortfolio(state, action: PayloadAction<number>) {
      state.portfolioId = action.payload;
      state.sortBy = initialState.sortBy;
      state.sortOrder = initialState.sortOrder;
    },
    setActiveView(state, action: PayloadAction<ActivePortfolioState['activeView']>) {
      state.activeView = action.payload;
    },
    clearActivePortfolio(state) {
      state.portfolioId = null;
      state.activeView = initialState.activeView;
      state.sortBy = initialState.sortBy;
      state.sortOrder = initialState.sortOrder;
    },
    setProfitMode(state, action: PayloadAction<'value' | 'percent'>) {
      state.profitMode = action.payload;
    },
    setSort(state, action: PayloadAction<{ sortBy: string; sortOrder: 'ASC' | 'DESC' }>) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
  },
});

export const { setActivePortfolio, setActiveView, clearActivePortfolio, setProfitMode, setSort  } = activePortfolioSlice.actions;
export default activePortfolioSlice.reducer;
