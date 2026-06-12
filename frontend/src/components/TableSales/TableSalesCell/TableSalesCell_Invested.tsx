import { formatNumber } from '../../../utils/formatNumber';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_InvestedProps = {
  priceBuy: number;
  countSale: number;
  currencyCode?: string;
};

export const TableSalesCell_Invested = ({
  priceBuy,
  countSale,
  currencyCode,
}: TableSalesCell_InvestedProps) => {
  const totalInvested = +((priceBuy * countSale).toFixed(2));

  return (
    <td className={styles.wrap}>
      <p>{formatNumber(totalInvested, { currency: currencyCode })}</p>
    </td>
  );
};
