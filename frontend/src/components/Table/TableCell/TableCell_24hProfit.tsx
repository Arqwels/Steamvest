import { formatNumber } from '../../../utils/formatNumber';
import { getChangeClass } from '../../../utils/getChangeClass';
import styles from './TableCell.module.scss';

type TableCell_24hProfitProps = {
  count_items: number;
  change_price_profit_24h: number;
  currencyCode?: string;
};

export const TableCell_24hProfit = ({
  count_items,
  change_price_profit_24h,
  currencyCode,
}: TableCell_24hProfitProps) => {
  const totalProfit = count_items * change_price_profit_24h;

  return (
    <td className={styles.wrap}>
      <p className={getChangeClass(totalProfit)}>
        {formatNumber(totalProfit, { currency: currencyCode })}
      </p>
    </td>
  );
};
