import styles from './SettingsMenu.module.scss';
import { useAppDispatch } from '../../../stores/hooks';
import { setActiveView, setProfitMode } from '../../../stores/reducers/activePortfolioSlice';

interface SettingsMenuProps {
  activeView: 'investments' | 'sales';
  profitMode: 'value' | 'percent';
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const SettingsMenu = ({ activeView, profitMode, onRename, onDelete, onClose }: SettingsMenuProps ) => {
  const dispatch = useAppDispatch();

  const toggleProfitMode = () => {
    dispatch(setProfitMode(profitMode === 'value' ? 'percent' : 'value'));
    onClose();
  };

  return (
    <div className={styles.menu}>
      <button onClick={onRename} type='button'>Переименовать</button>
      <button onClick={onDelete} type='button'>Удалить</button>

      <hr />

      <button onClick={toggleProfitMode} type='button'>
        Прибыль: {profitMode === 'value' ? '₽' : '%'}
      </button>

      <hr />

      {activeView === 'investments' ? (
        <button onClick={() => { dispatch(setActiveView('sales')); onClose(); }} type='button'>История продаж</button>
      ) : (
        <button onClick={() => { dispatch(setActiveView('investments')); onClose(); }} type='button'>Инвестиции</button>
      )}
    </div>
  );
};
