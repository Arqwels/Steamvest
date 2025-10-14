import {
  createEntityAdapter,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Investment } from '../../types';
import { RootState } from '../store';

const investmentsAdapter = createEntityAdapter<Investment>({
  sortComparer: (a, b) => b.id - a.id,
});

type Meta = {
  lastId: number | null;
  hasMore: boolean;
  limit: number;
};

type SliceState = ReturnType<typeof investmentsAdapter.getInitialState> & {
  metaByPortfolio: Record<number, Meta | undefined>;
};

const initialState: SliceState = {
  ...investmentsAdapter.getInitialState(),
  metaByPortfolio: {},
};

const investmentsSlice = createSlice({
  name: 'investments',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<Investment[]>) {
      investmentsAdapter.upsertMany(state, action.payload);
    },

    upsertOne(state, action: PayloadAction<Investment>) {
      investmentsAdapter.upsertOne(state, action.payload);
    },

    removeOne(state, action: PayloadAction<number>) {
      investmentsAdapter.removeOne(state, action.payload);
    },

    clearPortfolio(state, action: PayloadAction<number>) {
      const pid = action.payload;
      const all = investmentsAdapter.getSelectors().selectAll(state);
      const idsToRemove = all
        .filter((i) => i.portfolioId === pid)
        .map((i) => i.id);
      investmentsAdapter.removeMany(state, idsToRemove);
      delete state.metaByPortfolio[pid];
    },

    clearAllInvestments(state) {
      Object.assign(state, initialState);
    },

    setMeta(state, action: PayloadAction<{ portfolioId: number; meta: Meta }>) {
      state.metaByPortfolio[action.payload.portfolioId] = action.payload.meta;
    },
  },
});

export const { upsertMany, upsertOne, removeOne, clearPortfolio, clearAllInvestments, setMeta } =
  investmentsSlice.actions;
export default investmentsSlice.reducer;

const baseSelectors = investmentsAdapter.getSelectors<RootState>(
  (s) => s.investments,
);

export const selectAllInvestments = baseSelectors.selectAll;

export const selectInvestmentsByPortfolio = createSelector(
  [selectAllInvestments, (_: RootState, portfolioId: number) => portfolioId],
  (all, portfolioId) => all.filter((i) => i.portfolioId === portfolioId),
);

export const selectMetaByPortfolio = (state: RootState, portfolioId: number) =>
  state.investments.metaByPortfolio[portfolioId];
