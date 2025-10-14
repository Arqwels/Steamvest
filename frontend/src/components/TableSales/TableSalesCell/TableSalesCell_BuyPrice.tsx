import { formatNumber } from '../../../utils/formatNumber';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_BuyPriceProps = {
  priceBuy: number;
  currencyCode?: string;
};
// ( 3 - Цена покупки )
export const TableSalesCell_BuyPrice = ({
  priceBuy,
  currencyCode,
}: TableSalesCell_BuyPriceProps) => {
  return (
    <td className={styles.wrap}>
      <p>{formatNumber(priceBuy, { currency: currencyCode })}</p>
    </td>
  );
};
