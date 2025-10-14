import { calcAssets } from '../../../utils/calculations';
import { formatNumber } from '../../../utils/formatNumber';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_InvestedProps = {
  priceBuy: number;
  countSale: number;
  currencyCode?: string;
};
// ( 4 - Всего инвестировано )
export const TableSalesCell_Invested = ({
  priceBuy,
  countSale,
  currencyCode,
}: TableSalesCell_InvestedProps) => {
  const assets = calcAssets(priceBuy, countSale);
  return (
    <td className={styles.wrap}>
      <p>{formatNumber(assets, { currency: currencyCode })}</p>
    </td>
  );
};
