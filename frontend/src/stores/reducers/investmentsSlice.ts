import {
  createEntityAdapter,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';
import { Investment } from '../../types';
import { RootState } from '../store';

const investmentsAdapter = createEntityAdapter<Investment>();

type Meta = {
  lastId: number | null;
  hasMore: boolean;
  limit: number;
};

type SliceState = ReturnType<typeof investmentsAdapter.getInitialState> & {
  metaByPortfolio: Record<number, Meta | undefined>;
  orderedIds: number[];
};

const initialState: SliceState = {
  ...investmentsAdapter.getInitialState(),
  metaByPortfolio: {},
  orderedIds: [],
};

const investmentsSlice = createSlice({
  name: 'investments',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<Investment[]>) {
      investmentsAdapter.upsertMany(state, action.payload);
      action.payload.forEach((item) => {
        if (!state.orderedIds.includes(item.id)) {
          state.orderedIds.push(item.id);
        }
      });
    },

    upsertOne(state, action: PayloadAction<Investment>) {
      investmentsAdapter.upsertOne(state, action.payload);
      if (!state.orderedIds.includes(action.payload.id)) {
        state.orderedIds.push(action.payload.id);
      }
    },

    removeOne(state, action: PayloadAction<number>) {
      investmentsAdapter.removeOne(state, action.payload);
      state.orderedIds = state.orderedIds.filter((id) => id !== action.payload);
    },

    clearPortfolio(state, action: PayloadAction<number>) {
      const pid = action.payload;
      const all = investmentsAdapter.getSelectors().selectAll(state);
      const idsToRemove = all
        .filter((i) => i.portfolioId === pid)
        .map((i) => i.id);
      
      investmentsAdapter.removeMany(state, idsToRemove);
      state.orderedIds = state.orderedIds.filter((id) => !idsToRemove.includes(id));
      delete state.metaByPortfolio[pid];
    },

    clearAllInvestments(state) {
      Object.assign(state, {
        ...investmentsAdapter.getInitialState(),
        metaByPortfolio: {},
        orderedIds: [],
      });
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
  [
    (state: RootState) => state.investments.orderedIds,
    (state: RootState) => state.investments.entities,
    (_: RootState, portfolioId: number) => portfolioId,
  ],
  (orderedIds, entities, portfolioId) => {
    return orderedIds
      .map((id) => entities[id])
      .filter((inv): inv is Investment => inv !== undefined && inv.portfolioId === portfolioId);
  }
);

export const selectMetaByPortfolio = (state: RootState, portfolioId: number) =>
  state.investments.metaByPortfolio[portfolioId];
