import { formatNumber } from '../../../utils/formatNumber';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_SaleInfoProps = {
  priceSale: number;
  countSale: number;
  currencyCode?: string;
};
// ( 2 - Цена/Кол-во продажи )
export const TableSalesCell_SaleInfo = ({
  priceSale,
  countSale,
  currencyCode,
}: TableSalesCell_SaleInfoProps) => {
  return (
    <td className={styles.wrap}>
      <p>{formatNumber(priceSale, { currency: currencyCode })}</p>
      <p>{countSale} шт.</p>
    </td>
  );
};
