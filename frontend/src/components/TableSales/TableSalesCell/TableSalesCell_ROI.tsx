import { getChangeClass } from '../../../utils/getChangeClass';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_ROIProps = {
  priceBuy: number;
  priceSale: number;
  countSale: number;
};
// ( 6 - Доходность (RIO) )
export const TableSalesCell_ROI = ({
  priceBuy,
  priceSale,
  countSale,
}: TableSalesCell_ROIProps) => {
  const totalSale = +((priceSale * countSale).toFixed(2));
  const totalInvested = +((priceBuy  * countSale).toFixed(2));
  const netProfit = +(totalSale - totalInvested).toFixed(2);
  const roi  = +((netProfit / totalInvested) * 100).toFixed(2);

  // const commissionsNetProfitAsset = calcAssetsNet(netProfit, COMMISSION_RATE);
  // const roiNet = +((commissionsNetProfitAsset / totalBuy) * 100).toFixed(2);

  const roiCls = getChangeClass(roi);
  // const roiNetCls = getChangeClass(roiNet);
  return (
    // <td className={styles.wrap}>
    //   <p className={roiCls}>{roi}%</p>
    //   <p className={`${styles.tooltip} ${roiNetCls}`}>
    //     ({roiNet}%)
    //     <span className={styles.tooltipText}>ROI с учётом комиссии Steam</span>
    //   </p>
    // </td>

    <td className={styles.wrap}>
      <p className={roiCls}>{roi}%</p>
      <span className={styles.tooltipText}>ROI с учётом комиссии Steam</span>
    </td>
  );
};
