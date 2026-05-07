import styles from './Table.module.scss';
import { useAppSelector } from '../../stores/hooks';

type TableHeaderProps = {
  onSort: (field: string) => void;
  activeSort: string | undefined;
  sortOrder: 'ASC' | 'DESC';
};

export const TableHeader = ({ onSort, activeSort, sortOrder }: TableHeaderProps) => {
  const profitMode = useAppSelector(state => state.activePortfolio.profitMode);

  const renderTh = (label: string, field: string) => {
    const isActive = activeSort === field;

    return (
      <th
        onClick={() => onSort(field)}
        className={`${styles.sortableTh} ${isActive ? styles.sortableThActive : ''}`}
      >
        <span className={styles.thInner}>
          {label}
          <span className={`${styles.sortIcons} ${isActive ? styles.sortIconsActive : ''}`}>
            <span className={`${styles.sortArrow} ${isActive && sortOrder === 'ASC' ? styles.sortArrowActive : ''}`}>▲</span>
            <span className={`${styles.sortArrow} ${isActive && sortOrder === 'DESC' ? styles.sortArrowActive : ''}`}>▼</span>
          </span>
        </span>
        <span className={`${styles.sortUnderline} ${isActive ? styles.sortUnderlineActive : ''}`} />
      </th>
    );
  };

  return (
    <thead>
      <tr>
        <th className={styles.thFirst}>Предмет</th>
        {renderTh('Текущая Цена', 'price_item')}
        {renderTh('24ч %', 'changePercent')}
        {renderTh('24ч Профит', 'changePrice')}
        {renderTh('Вложения ₽/шт', 'investmentValue')}
        {renderTh('Цена покупки', 'buyPrice')}
        {renderTh(
          `Текущая прибыль (${profitMode === 'value' ? '₽' : '%'})`,
          profitMode === 'value' ? 'profitValue' : 'profitPercent'
        )}
        {renderTh('Активы', 'assetsValue')}
      </tr>
    </thead>
  );
};
