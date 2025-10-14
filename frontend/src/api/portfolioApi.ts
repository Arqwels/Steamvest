import { baseApi } from './baseApi';
import { Portfolio } from '../types';
import { investmentApi } from './investmentApi';

export const portfolioApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPortfolio: builder.query<Portfolio[], void>({
      query: () => '/portfolio',
      providesTags: () => [{ type: 'Portfolio' }],
    }),

    activatePortfolio: builder.mutation<void, number|null>({
      query: (portfolioId) => ({
        url: `/portfolio/${portfolioId}/activate`,
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Portfolio' }],
    }),

    createPortfolio: builder.mutation<Portfolio, { portfolioId: number; namePortfolio: string }> ({
      query: (body) => ({
        url: '/portfolio',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            investmentApi.endpoints.getInvestments.initiate({ portfolioId: data.id })
          );
        } catch (error) {
          console.error('Ошибка при создании портфеля', error);
        }
      },
      invalidatesTags: [{ type: 'Portfolio' }],
    }),

    renamePortfolio: builder.mutation<Portfolio, { portfolioId: number; namePortfolio: string }>({
      query: ({ portfolioId, namePortfolio }) => ({
        url: `/portfolio/${portfolioId}`,
        method: 'PATCH',
        body: { namePortfolio },
      }),
      invalidatesTags: [{ type: 'Portfolio' }],
    }),

    // Возможно сделать получение статуса (message) и выводить его на клиенте в уведомление
    deletePortfolio: builder.mutation<void, number>({
      query: (portfolioId) => ({
        url: `/portfolio/${portfolioId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Portfolio' }],
    }),
  }),
});

export const {
  useGetAllPortfolioQuery,
  useActivatePortfolioMutation,
  useCreatePortfolioMutation,
  useRenamePortfolioMutation,
  useDeletePortfolioMutation
} = portfolioApi;
