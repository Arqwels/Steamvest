import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import styles from './Table.module.scss';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { useLazyGetInvestmentsQuery } from '../../api/investmentApi';
import { TableData } from '../../types';
import { mapInvestmentToTableData } from '../../utils/mappers';
import { useEffect, useCallback, useRef, useState } from 'react';
import {
  clearPortfolio,
  selectInvestmentsByPortfolio,
  selectMetaByPortfolio,
} from '../../stores/reducers/investmentsSlice';
import { Loader } from '../Loader/Loader';
import { setSort } from '../../stores/reducers/activePortfolioSlice';

export const Table = () => {
  const dispatch = useAppDispatch();
  const portfolioId = useAppSelector((state) => state.activePortfolio.portfolioId);
  const [fetchPage, { error }] = useLazyGetInvestmentsQuery();

  const items = useAppSelector((state) => selectInvestmentsByPortfolio(state, portfolioId ?? -1));
  const meta = useAppSelector((state) => selectMetaByPortfolio(state, portfolioId ?? -1));

  const sortBy = useAppSelector((state) => state.activePortfolio.sortBy);
  const order = useAppSelector((state) => state.activePortfolio.sortOrder);

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const loadingRef = useRef(false);

  // Загрузка первой страницы или сброс при смене сортировки
  const loadPage = useCallback(
    async (params?: { sortBy?: string; order?: 'ASC' | 'DESC' }) => {
      if (!portfolioId || loadingRef.current) return;
      loadingRef.current = true;

      const field = params?.sortBy ?? sortBy;
      const dir = params?.order ?? order;

      console.log('📡 Fetching investments:', { portfolioId, offset: 0, sortBy: field, order: dir });

      try {
        dispatch(clearPortfolio(portfolioId));
        await fetchPage({ portfolioId, limit: 20, offset: 0, sortBy: field, order: dir });
      } catch (err) {
        console.error('❌ loadPage error', err);
      } finally {
        loadingRef.current = false;
        setIsFirstLoad(false);
      }
    },
    [portfolioId, sortBy, order, dispatch, fetchPage],
  );

  const changeSort = useCallback(
    (field: string) => {
      const nextOrder = sortBy === field ? (order === 'ASC' ? 'DESC' : 'ASC') : 'DESC';
      dispatch(setSort({ sortBy: field, sortOrder: nextOrder }));
      loadPage({ sortBy: field, order: nextOrder });
    },
    [sortBy, order, loadPage, dispatch],
  );

  const loadMore = useCallback(async () => {
    if (!portfolioId || loadingRef.current || !meta?.hasMore) return;

    loadingRef.current = true;
    const offset = items.length;

    console.log('📡 Loading more:', { portfolioId, offset, sortBy, order });

    try {
      await fetchPage({ portfolioId, limit: 20, offset, sortBy, order });
    } catch (err) {
      console.error('❌ loadMore error', err);
    } finally {
      loadingRef.current = false;
    }
  }, [portfolioId, items.length, meta, sortBy, order, fetchPage]);

  // Первичная загрузка
  useEffect(() => {
    if (portfolioId && isFirstLoad) {
      loadPage();
    }
  }, [portfolioId]);

  // Скролл-лисенер
  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (loadingRef.current || debounceId) return;
      debounceId = setTimeout(() => {
        if (document.documentElement.scrollHeight - (window.scrollY + window.innerHeight) < 120) {
          loadMore();
        }
        debounceId = null;
      }, 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (debounceId) clearTimeout(debounceId);
    };
  }, [loadMore]);

  if (isFirstLoad && loadingRef.current) return <Loader />;
  if (isFirstLoad && error) return <div className={styles.errorMessage}>Ошибка загрузки данных</div>;
  if (!isFirstLoad && !error && items.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <div className={styles.emptyScreen}>
          <p>У вас отсутствуют инвестиции.</p>
          <p>Чтобы добавить скины в коллекцию, нажмите на кнопку плюсик внизу экрана.</p>
        </div>
        <div className={styles.downArrow} />
      </div>
    );
  }

  const tableData: TableData[] = items.map(mapInvestmentToTableData);

  return (
    <table className={styles.table}>
      <TableHeader onSort={changeSort} activeSort={sortBy} sortOrder={order} />
      <TableBody data={tableData} />
    </table>
  );
};
