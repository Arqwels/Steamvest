import styles from './TableCell.module.scss';
import { formatNumber } from '../../../utils/formatNumber';
import { getChangeClass } from '../../../utils/getChangeClass';

type TableCell_CurrentProfitProps = {
  price_item: number;
  buy_price: number;
  count_items: number;
  profit_value: number;
  profit_percent: number;
  currencyCode?: string;
};

export const TableCell_CurrentProfit = ({
  price_item,
  buy_price,
  count_items,
  profit_value,
  profit_percent,
  currencyCode,
}: TableCell_CurrentProfitProps) => {
  const profitGross = +((price_item - buy_price) * count_items).toFixed(2);

  const netProfitClass = getChangeClass(profit_value);
  const grossProfitClass = getChangeClass(profitGross);

  return (
    <td className={`${styles.currentProfit} ${grossProfitClass } ${styles.wrap}`}>
      <div>
        <span style={{ marginRight: '8px' }}>
          {formatNumber(profitGross, { currency: currencyCode })}
        </span>
        <span className={netProfitClass}>
          ({formatNumber(profit_value, { currency: currencyCode })})
        </span>
      </div>
      <p>{(profit_percent ?? 0).toFixed(2)}%</p>
    </td>
  );
};
