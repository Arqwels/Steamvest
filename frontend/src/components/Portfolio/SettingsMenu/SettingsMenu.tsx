import styles from './SettingsMenu.module.scss';
import { useAppDispatch } from '../../../stores/hooks';
import { setActiveView } from '../../../stores/reducers/activePortfolioSlice';

interface SettingsMenuProps {
  activeView: 'investments' | 'sales';
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const SettingsMenu = ({ activeView, onRename, onDelete, onClose }: SettingsMenuProps ) => {
  const dispatch = useAppDispatch();

  return (
    <div className={styles.menu}>
      <button onClick={onRename} type='button'>Переименовать</button>
      <button onClick={onDelete} type='button'>Удалить</button>
      <hr />
      {activeView === 'investments' ? (
        <button onClick={() => { dispatch(setActiveView('sales')); onClose(); }} type='button'>История продаж</button>
      ) : (
        <button onClick={() => { dispatch(setActiveView('investments')); onClose(); }} type='button'>Инвестиции</button>
      )}
    </div>
  );
};
