import { formatNumber } from '../../../utils/formatNumber';
import styles from './TableCell.module.scss';

type TableCell_BuyPriceProps = {
  buy_price: number;
  currencyCode?: string;
};

export const TableCell_BuyPrice = ({
  buy_price,
  currencyCode,
}: TableCell_BuyPriceProps) => {
  return (
    <td className={styles.wrap}>
      <p>{formatNumber(buy_price, { currency: currencyCode })}</p>
    </td>
  );
};
