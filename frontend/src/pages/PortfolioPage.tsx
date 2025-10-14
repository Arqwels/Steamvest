import { Navigation } from '../components/Navigation/Navigation';
import { Table } from '../components/Table/Table';
import { Footer } from '../components/Footer/Footer';
import { PortfolioHeader } from '../components/Portfolio/PortfolioHeader';
import { useActivatePortfolioMutation, useCreatePortfolioMutation, useDeletePortfolioMutation, useGetAllPortfolioQuery } from '../api/portfolioApi';
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { setActivePortfolio, setActiveView } from '../stores/reducers/activePortfolioSlice';
import { Loader } from '../components/Loader/Loader';
import { PortfolioModal } from '../components/PortfolioModal/PortfolioModal';
import { Header } from '../components/Header/Header';
import { TableSales } from '../components/TableSales/TableSales';

export const PortfolioPage = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((state) => state.activePortfolio.portfolioId);
  const activeView = useAppSelector((state) => state.activePortfolio.activeView);

  const { data: portfolios, isLoading: isLoadingAll } = useGetAllPortfolioQuery();
  const [activatePortfolio] = useActivatePortfolioMutation();
  const [createPortfolio] = useCreatePortfolioMutation();
  const [deletePortfolio] = useDeletePortfolioMutation();

  useEffect(() => {
    if (!portfolios?.length) return;

    const serverActive = portfolios.find(p => p.isActive);
    if (activeId == null) {
      const first = serverActive?.id ?? portfolios[0].id;
      dispatch(setActivePortfolio(first));
      return;
    }

    if (serverActive && serverActive.id !== activeId) {
      dispatch(setActivePortfolio(serverActive.id));
      return;
    }

    const stillExists = portfolios.some(p => p.id === activeId);
    if (activeId == null || !stillExists) {
      const first = portfolios.find(p => p.isActive)?.id ?? portfolios[0].id;
      dispatch(setActivePortfolio(first));
    }
  }, [dispatch, portfolios, activeId]);

  const activeIndex = useMemo(() => {
    if (!portfolios || activeId == null) return 0;
    const idx = portfolios.findIndex(p => p.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [portfolios, activeId]);

  const handleTabChange = async (id: number) => {
    if (id == null) return;
    
    try {
      await activatePortfolio(id).unwrap();
      dispatch(setActivePortfolio(id));

      // Наше поведение - если пользователь до этого был в истории продаж — переводим его на investments.
      if (activeView === 'sales') {
        dispatch(setActiveView('investments'));
      }

    } catch (error) {
      console.error('Ошибка при активации портфеля', error);
    }
  };

  const handleCreate = async (name: string) => {
    if (activeId == null) return;

    try {
      const newPortfolio = await createPortfolio({ portfolioId: activeId, namePortfolio: name }).unwrap();
      await activatePortfolio(newPortfolio.id).unwrap();
      dispatch(setActivePortfolio(newPortfolio.id));
      setIsAddOpen(false);
    } catch (error) {
      console.error('Ошибка при создании портфолио!', error);
    }
  };

  const handleDeleteAndActivate = async (deletedId: number) => {
    try {
      await deletePortfolio(deletedId).unwrap();
    } catch (error) {
      console.error('Ошибка при удалении портфеля!', error);
    }
  };

  const tableKey = `portfolio-${activeId}-view-${activeView}`;

  if (isLoadingAll) return <Loader />;

  return (
    <main className='container'>
      <Header />
      <Navigation />
      <PortfolioHeader
        portfolios={portfolios ?? []}
        activeIndex={activeIndex}
        onTabChange={handleTabChange}
        onAddClick={() => setIsAddOpen(true)}
        onDelete={(id) => handleDeleteAndActivate(id)}
      />

      {activeView === 'sales' ? (
        <TableSales key={tableKey} />
      ) : (
        <Table key={tableKey} />
      )}

      <Footer />

      <PortfolioModal
        title='Новый портфель'
        initialName=''
        submitLabel='Создать'
        active={isAddOpen}
        setActive={setIsAddOpen}
        onSubmit={handleCreate}
      />
    </main>
  );
};
