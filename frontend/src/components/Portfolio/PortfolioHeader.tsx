import React, { useEffect, useMemo, useRef } from 'react';
import { PortfolioTabs } from './PortfolioTabs';
import styles from './PortfolioHeader.module.scss';
import { FiPlus, FiSettings, FiShare2 } from 'react-icons/fi';
import { Portfolio } from '../../types';
import { useRenamePortfolioMutation } from '../../api/portfolioApi';
import { PortfolioModal } from '../PortfolioModal/PortfolioModal';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import { useAppSelector } from '../../stores/hooks';
import { useTabsLayout } from '../../hooks/useTabsLayout';
import { useClickOutside } from '../../hooks/useClickOutside';
import { SettingsMenu } from './SettingsMenu/SettingsMenu';

interface PortfolioHeaderProps {
  portfolios: Portfolio[];
  activeIndex: number;
  onTabChange: (id: number) => void;
  onAddClick: () => void;
  onDelete: (id: number) => void;
}

export const PortfolioHeader = ({
  portfolios,
  activeIndex,
  onTabChange,
  onAddClick,
  onDelete
}: PortfolioHeaderProps) => {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const settingsWrapperRef = useRef<HTMLDivElement | null>(null);

  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [renamePortfolio] = useRenamePortfolioMutation();

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const activePortfolio = portfolios[activeIndex];
  const currentName = activePortfolio?.namePortfolio ?? '';

  const activeView = useAppSelector(state => state.activePortfolio.activeView);

  const tabs = useMemo(() => {
    if (portfolios.length === 0) return ['Local Portfolio'];
    return portfolios.map(p => p.namePortfolio);
  }, [portfolios]);

  // tabs layout refs + logic
  const { tabsContainerRef, tabsScrollRef, newBtnRef } = useTabsLayout();

  // refs для каждой кнопки таба
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => { tabRefs.current = new Array(tabs.length).fill(null); }, [tabs.length]);

  // автоскрол к активной вкладке
  useEffect(() => {
    const activeEl = tabRefs.current[activeIndex];
    if (!activeEl) return;
    activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIndex, tabs.length]);

  // click outside для меню настроек
  useClickOutside(settingsWrapperRef, () => setSettingsOpen(false), settingsOpen);

  const handleOpenRename = () => {
    setSettingsOpen(false);
    setIsRenameOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteOpen(true);
    setSettingsOpen(false);
  };

  const handleRename = async (newName: string) => {
    if (!activePortfolio) return;
    await renamePortfolio({ portfolioId: activePortfolio.id, namePortfolio: newName }).unwrap();
    setSettingsOpen(false);
  };

  const confirmDelete = async () => {
    if (!activePortfolio) return;
    setSettingsOpen(false);
    setIsDeleteOpen(false);
    onDelete(activePortfolio.id);
  };

  return (
    <header className={styles.header}>
      <div className={styles.tabsContainer} ref={tabsContainerRef}>
        <div ref={tabsScrollRef} className={styles.tabsScroll}>
          <PortfolioTabs
            items={tabs}
            activeIndex={activeIndex}
            tabRefs={tabRefs}
            onChange={(newIndex) => {
              if (portfolios.length === 0) return;
              onTabChange(portfolios[newIndex].id);
            }}
          />
        </div>

        <button
          ref={newBtnRef}
          className={styles.newPortfolioBtn}
          onClick={onAddClick}
          type='button'
        >
          <FiPlus size={16} style={{ marginRight: 4 }} />
          Новый портфель
        </button>
      </div>

      <div className={styles.actionsSpacer} />

      <div className={styles.actions}>
        <button className={styles.iconButton} onClick={() => console.log('Share')} type='button'>
          <FiShare2 size={20} />
        </button>

        <div ref={settingsWrapperRef} className={styles.settingsWrapper}>
          <button
            className={styles.iconButton}
            onClick={e => {
              e.stopPropagation();
              setSettingsOpen(open => !open);
            }}
            type='button'
          >
            <FiSettings size={20} />
          </button>

          {settingsOpen && (
            <SettingsMenu
              activeView={activeView}
              onRename={handleOpenRename}
              onDelete={handleDelete}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>

      <PortfolioModal
        title='Переименовать портфель'
        initialName={currentName}
        submitLabel='Сохранить'
        active={isRenameOpen}
        setActive={setIsRenameOpen}
        onSubmit={handleRename}
      />

      <ConfirmModal
        active={isDeleteOpen}
        setActive={setIsDeleteOpen}
        title='Удалить портфель?'
        message={`Портфель "${currentName}" будет удалён навсегда.`}
        confirmLabel='Удалить'
        cancelLabel='Отмена'
        onConfirm={confirmDelete}
      />
    </header>
  );
};
