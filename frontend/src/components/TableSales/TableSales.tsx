import { TableSalesBody } from './TableSalesBody';
import { TableSalesHeader } from './TableSalesHeader';
import styles from './TableSales.module.scss';
import { useAppSelector } from '../../stores/hooks';
import { useGetSalesQuery, useLazyGetSalesQuery } from '../../api/saleApi';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Sale } from '../../types';
import { Loader } from '../Loader/Loader';

export const TableSales = () => {
  const portfolioId = useAppSelector((state) => state.activePortfolio.portfolioId);

  const { data, error, isFetching, refetch }= useGetSalesQuery(
    { portfolioId: portfolioId ?? -1, limit: 20 },
    { skip: !portfolioId },
  );

  // Lazy used только для дозагрузки (loadMore)
  const [fetchPage] = useLazyGetSalesQuery();

  const loadingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    setIsFirstLoad(true);

    if (portfolioId) refetch();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [portfolioId, refetch]);

  useEffect(() => {
    if (!isFetching) {
      setIsFirstLoad(false);
    }
  }, [isFetching]);

  const loadMore = useCallback(async () => {
    if (!portfolioId || loadingRef.current) return;

    if (data?.meta?.hasMore === false) return;

    const lastId =
      data?.sales && data.sales.length ? data.sales[data.sales.length - 1].id : undefined;

    if (lastId === undefined) return;

    loadingRef.current = true;
    try {
      if (isFetching) return;
      await fetchPage({ portfolioId, limit: 20, lastId });
    } catch (error) {
      console.error('Ошибка при подзагрузке!', error);
    } finally {
      loadingRef.current = false;
    }
  }, [portfolioId, data, fetchPage, isFetching]);

  useEffect(() => {
    const onScroll = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
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

  if (isFirstLoad && isFetching) return <Loader />

  //! Доделать нормальное отображение ошибки
  if (isFirstLoad && error) {
    return <div className={styles.errorMessage}>Ошибка загрузки данных</div>;
  }

  const tableData: Sale[] = data?.sales ?? [];

  if (!isFirstLoad && !error && tableData.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <div className={styles.emptyScreen}>
          <p>У вас отсутствуют продажи.</p>
          <p>Чтобы создать продажу — используйте соответствующий функционал.</p>
        </div>
        <div className={styles.downArrow} />
      </div>
    );
  }

  return (
    <table className={styles.table}>
      <TableSalesHeader />
      <TableSalesBody data={tableData} />
    </table>
  );
};
