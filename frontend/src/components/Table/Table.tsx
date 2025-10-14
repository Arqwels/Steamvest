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
  setMeta,
  upsertMany,
} from '../../stores/reducers/investmentsSlice';
import { Loader } from '../Loader/Loader';

export const Table = () => {
  const dispatch = useAppDispatch();
  const portfolioId = useAppSelector((state) => state.activePortfolio.portfolioId);

  const [fetchPage, { error }] = useLazyGetInvestmentsQuery();

  const items = useAppSelector((state) => selectInvestmentsByPortfolio(state, portfolioId ?? -1));
  const meta = useAppSelector((state) => selectMetaByPortfolio(state, portfolioId ?? -1));

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const loadingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  const loadFirstPage = useCallback(async () => {
    if (!portfolioId) return;
    // очищаем предыдущие данные конкретного портфеля
    dispatch(clearPortfolio(portfolioId));
    loadingRef.current = true;
    try {
      const maybe = await fetchPage({ portfolioId, limit: 20 });
      // lazy trigger возвращает объект: { data } или { error }
      if ('data' in maybe && maybe.data) {
        dispatch(upsertMany(maybe.data.investments));
        dispatch(setMeta({ portfolioId, meta: maybe.data.meta }));
      }
    } catch (error) {
      console.error('loadFirstPage error', error);
    } finally {
      loadingRef.current = false;
      setIsFirstLoad(false);
    }
  }, [portfolioId, dispatch, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!portfolioId || loadingRef.current) return;
    if (meta && meta.hasMore === false) return;
    const lastId = items.length ? items[items.length - 1].id : undefined;
    loadingRef.current = true;
    try {
      const maybe = await fetchPage({ portfolioId, limit: 20, lastId });
      if ('data' in maybe && maybe.data) {
        dispatch(upsertMany(maybe.data.investments));
        dispatch(setMeta({ portfolioId, meta: maybe.data.meta }));
      }
    } catch (error) {
      console.error('loadMore error', error);
    } finally {
      loadingRef.current = false;
    }
  }, [portfolioId, items, meta, dispatch, fetchPage]);

  useEffect(() => {
    if (!portfolioId) return;
    loadFirstPage();
  }, [portfolioId]);

  useEffect(() => {
    const onScroll = (_event: Event) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      debounceRef.current = window.setTimeout(() => {
        const doc = document.documentElement;
        const nearBottom = doc.scrollHeight - (doc.scrollTop + window.innerHeight) < 120;
        if (nearBottom && !loadingRef.current) {
          loadMore();
        }
      }, 120);
    };

    document.addEventListener('scroll', onScroll);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      document.removeEventListener('scroll', onScroll);
    };
  }, [loadMore]);

  if (isFirstLoad && loadingRef.current) return <Loader />;

  if (isFirstLoad && error) {
    return <div className={styles.errorMessage}>Ошибка загрузки данных</div>;
  }

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
      <TableHeader />
      <TableBody data={tableData} />
    </table>
  );
};
