import styles from './TableCell.module.scss';
import { formatNumber } from '../../../utils/formatNumber';
import { getChangeClass } from '../../../utils/getChangeClass';

type TableCell_Price24hProps = {
  price_item: number;
  change_price_percent_24h: number;
  currencyCode?: string;
};

export const TableCell_Price24h = ({
  price_item,
  change_price_percent_24h,
  currencyCode,
}: TableCell_Price24hProps) => {
  const cls = getChangeClass(change_price_percent_24h);

  return (
    <td className={styles.wrap}>
      <p>{formatNumber(price_item, { currency: currencyCode })}</p>
      <p className={cls}>{change_price_percent_24h}%</p>
    </td>
  );
};
