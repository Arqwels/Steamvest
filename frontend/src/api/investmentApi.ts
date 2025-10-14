import { baseApi } from './baseApi';
import {
  CreateInvestmentRequest,
  Investment,
  InvestmentsResponse,
  SaleInvestmentRequest,
  SaleInvestmentResponse,
  SummaryInvestments,
  UpdateInvestmentRequest,
} from '../types';
import {
  removeOne,
  setMeta,
  upsertMany,
  upsertOne,
} from '../stores/reducers/investmentsSlice';
import { handleQueryError } from '../utils/handleQueryError';

export const investmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvestments: builder.query<
      InvestmentsResponse,
      { portfolioId: number; limit?: number; lastId?: number }
    >({
      query: ({ portfolioId, limit = 20, lastId }) => {
        let query = `/investment?portfolioId=${portfolioId}&limit=${limit}`;
        if (lastId !== undefined && lastId !== null)
          query += `&lastId=${lastId}`;
        return query;
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.investments?.length) {
            dispatch(upsertMany(data.investments));
            dispatch(
              setMeta({ portfolioId: arg.portfolioId, meta: data.meta }),
            );
          } else {
            dispatch(
              setMeta({
                portfolioId: arg.portfolioId,
                meta: data?.meta ?? {
                  lastId: null,
                  hasMore: false,
                  limit: arg.limit ?? 20,
                },
              }),
            );
          }
        } catch (error) {
          handleQueryError('getInvestments', error, { arg });
        }
      },
      providesTags: (result, _error, { portfolioId }) =>
        result
          ? [
              { type: 'Investments', id: `LIST-${portfolioId}` },
              ...result.investments.map((inv) => ({
                type: 'Investments' as const,
                id: inv.id,
              })),
            ]
          : [{ type: 'Investments', id: `LIST-${portfolioId}` }],
    }),

    createInvestment: builder.mutation<
      { message: string; investment: Investment },
      CreateInvestmentRequest
    >({
      query: (newInvestment) => ({
        url: '/investment',
        method: 'POST',
        body: newInvestment,
      }),
      async onQueryStarted(newInvestment, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.investment) {
            dispatch(upsertOne(data.investment));
          }
        } catch (error) {
          handleQueryError('createInvestment', error, { newInvestment });
        }
      },
      invalidatesTags: (_result, _error, { portfolioId }) => [
        { type: 'Investments', id: `LIST-${portfolioId}` }
      ],
    }),

    updateInvestment: builder.mutation<
      { message?: string; investment?: Investment } | Investment,
      UpdateInvestmentRequest
    >({
      query: ({ id, ...rest }) => ({
        url: `/investment/${id}`,
        method: 'PUT',
        body: rest,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const returned = data as any;
          const investment =
            returned?.investment ?? (returned?.id ? returned : undefined);

          if (investment) {
            dispatch(upsertOne(investment));
          }
        } catch (error) {
          handleQueryError('updateInvestment', error, { arg });
        }
      },
      invalidatesTags: [{ type: 'Investments' }],
    }),

    deleteInvestment: builder.mutation<
      { message?: string } | void,
      { id: number; portfolioId: number }
    >({
      query: ({ id }) => ({
        url: `/investment/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ id, portfolioId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(removeOne(id));
        } catch (error) {
          handleQueryError('deleteInvestment', error, { id, portfolioId });
        }
      },
      invalidatesTags: [{ type: 'Investments' }],
    }),

    summaryInvestments: builder.query<SummaryInvestments, number>({
      query: (portfolioId) => `/investment/${portfolioId}/summary`,
      providesTags: [{ type: 'Investments', id: 'SUMMARY' }],
    }),

    saleInvestment: builder.mutation<SaleInvestmentResponse, SaleInvestmentRequest>({
      query: (body) => ({
        url: '/investment/sale',
        method: 'POST',
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if ('investment' in data) {
            dispatch(upsertOne(data.investment));
          } else if ('removedId' in data) {
            dispatch(removeOne(data.removedId));
          }
        } catch (error) {
          handleQueryError('saleInvestment', error, { arg });
        }
      },
      invalidatesTags: (_result, _error, { portfolioId }) => [
        { type: 'Investments', id: `LIST-${portfolioId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInvestmentsQuery,
  useLazyGetInvestmentsQuery,
  useCreateInvestmentMutation,
  useUpdateInvestmentMutation,
  useDeleteInvestmentMutation,
  useSummaryInvestmentsQuery,
  useSaleInvestmentMutation,
} = investmentApi;
