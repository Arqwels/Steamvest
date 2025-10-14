import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../utils/config';
import type { RootState } from '../stores/store';
import { logout, setCredentials } from '../stores/reducers/authSlice';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    email: string;
    id: number;
    isActivated: boolean;
  };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'GET' },
      api,
      extra,
    );

    if (refreshResult.data) {
      const { accessToken, refreshToken, user } =
        refreshResult.data as AuthResponse;
      api.dispatch(setCredentials({ accessToken, refreshToken, user }));
      result = await rawBaseQuery(args, api, extra);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Investments', 'Skins', 'Portfolio', 'Auth', 'Sales'],
  endpoints: () => ({}),
});
