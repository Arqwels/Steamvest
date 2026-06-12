import { formatNumber } from '../../../utils/formatNumber';
import { getChangeClass } from '../../../utils/getChangeClass';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_NetProfitProps = {
  priceBuy: number;
  priceSale: number;
  countSale: number;
  currencyCode?: string;
};
// ( 5 - Чистая прибыль )
export const TableSalesCell_NetProfit = ({
  priceBuy,
  priceSale,
  countSale,
  currencyCode,
}: TableSalesCell_NetProfitProps) => {
  const totalSale     = +((priceSale * countSale).toFixed(2));
  const totalInvested = +((priceBuy  * countSale).toFixed(2));
  const netProfit     = +(totalSale - totalInvested).toFixed(2);

  const cls = getChangeClass(netProfit);
  // const totalInvest = calcAssets(priceSale, countSale);
  // const totalBuy = calcAssets(priceBuy, countSale);

  // const netProfit = +(totalInvest - totalBuy).toFixed(2);
  // const commissionsNetProfitAsset = calcAssetsNet(netProfit, COMMISSION_RATE);

  // const cls = getChangeClass(netProfit);
  // const clsNet = getChangeClass(commissionsNetProfitAsset);
  return (
    // <td className={styles.wrap}>
    //   <p className={cls}>
    //     {formatNumber(netProfit, { currency: currencyCode })}
    //   </p>
    //   <p className={`${styles.tooltip} ${clsNet}`}>
    //     ({formatNumber(commissionsNetProfitAsset, { currency: currencyCode })})
    //     <span className={styles.tooltipText}>
    //       Чистая прибыль с учётом комиссии Steam
    //     </span>
    //   </p>
    // </td>

    <td className={styles.wrap}>
      <p className={cls}>
        {formatNumber(netProfit, { currency: currencyCode })}
      </p>
      <span className={styles.tooltipText}>
        Чистая прибыль с учётом комиссии Steam
      </span>
    </td>
  );
};



