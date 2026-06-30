import { formatNumber } from '../../../utils/formatNumber';
import { getChangeClass } from '../../../utils/getChangeClass';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_NetProfitProps = {
  priceBuy: number;
  priceSale: number;
  countSale: number;
  netProfit: number; // чистая с комиссией (с бэка)
  currencyCode?: string;
};

// ( 5 - Чистая прибыль )
export const TableSalesCell_NetProfit = ({
  priceBuy,
  priceSale,
  countSale,
  netProfit,
  currencyCode,
}: TableSalesCell_NetProfitProps) => {
  // Грязная прибыль — без учёта комиссии Steam
  const grossProfit = +((priceSale - priceBuy) * countSale).toFixed(2);

  const clsGross = getChangeClass(grossProfit);
  const clsNet = getChangeClass(netProfit);

  return (
    <td className={styles.wrap}>
      <p className={clsGross}>
        {formatNumber(grossProfit, { currency: currencyCode })}
      </p>
      <p className={`${styles.tooltip} ${clsNet}`}>
        {formatNumber(netProfit, { currency: currencyCode })}
        <span className={styles.tooltipText}>
          Чистая прибыль с учётом комиссии Steam
        </span>
      </p>
    </td>
  );
};
