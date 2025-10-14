import { Sale, SalesResponse } from '../types';
import { baseApi } from './baseApi';

export const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query<
      SalesResponse,
      { portfolioId: number; limit?: number; lastId?: number }
    >({
      query: ({ portfolioId, limit = 20, lastId }) => {
        let query = `/sale?portfolioId=${portfolioId}&limit=${limit}`;
        if (lastId !== undefined && lastId !== null)
          query += `&lastId=${lastId}`;
        return query;
      },

      serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}-${queryArgs.portfolioId}`,

      merge: (currentCache: SalesResponse, newResponse: SalesResponse) => {
        if (!currentCache || !currentCache.sales) {
          Object.assign(currentCache, newResponse);
          return;
        }

        const exists = new Map<number, Sale>();
        (currentCache.sales ?? []).forEach((s) => exists.set(s.id, s));
        (newResponse.sales ?? []).forEach((s) => exists.set(s.id, s));

        currentCache.sales = Array.from(exists.values()).sort((a, b) => b.id - a.id);
        currentCache.meta = newResponse.meta;
      },

      forceRefetch({ currentArg, previousArg }) {
        return previousArg?.portfolioId !== currentArg?.portfolioId;
      },

      providesTags: (result, _error, { portfolioId }) =>
        result
          ? [
              { type: 'Sales', id: `LIST-${portfolioId}` },
              ...result.sales.map((s) => ({ type: 'Sales' as const, id: s.id })),
            ]
          : [{ type: 'Sales', id: `LIST-${portfolioId}` }],
    }),

    deleteSale: builder.mutation<{ message: string }, { saleId: number; portfolioId: number }>({
      query: ({ saleId, portfolioId }) => ({
        url: `/sale/${saleId}?portfolioId=${portfolioId}`,
        method: 'DELETE',
      }),

      async onQueryStarted({ saleId, portfolioId }, { dispatch, queryFulfilled }) {
        const args = { portfolioId };

        const patch = dispatch(
          (baseApi.util.updateQueryData as any)(
            'getSales',
            args,
            (draft: SalesResponse) => {
              if (!draft?.sales) return;
              draft.sales = draft.sales.filter((s) => s.id !== saleId);
            }
          )
        );

        try {
          await queryFulfilled;
        } catch (err) {
          patch.undo();
          console.error('Не удалось удалить sale на сервере, откатываем кеш', err);
        }
      },

      invalidatesTags: (_result, _error, { saleId, portfolioId }) => [
        { type: 'Sales', id: saleId },
        { type: 'Sales', id: `LIST-${portfolioId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useGetSalesQuery, useLazyGetSalesQuery, useDeleteSaleMutation } = saleApi;
