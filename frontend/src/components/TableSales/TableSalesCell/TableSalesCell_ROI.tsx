import { calcAssets, calcAssetsNet } from '../../../utils/calculations';
import { COMMISSION_RATE } from '../../../utils/config';
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
  const totalInvest = calcAssets(priceSale, countSale);
  const totalBuy = calcAssets(priceBuy, countSale);

  const netProfit = +(totalInvest - totalBuy).toFixed(2);

  const commissionsNetProfitAsset = calcAssetsNet(netProfit, COMMISSION_RATE);

  const roi = +((netProfit / totalBuy) * 100).toFixed(2);
  const roiNet = +((commissionsNetProfitAsset / totalBuy) * 100).toFixed(2);

  const roiCls = getChangeClass(roi);
  const roiNetCls = getChangeClass(roiNet);
  return (
    <td className={styles.wrap}>
      <p className={roiCls}>{roi}%</p>
      <p className={`${styles.tooltip} ${roiNetCls}`}>
        ({roiNet}%)
        <span className={styles.tooltipText}>ROI с учётом комиссии Steam</span>
      </p>
    </td>
  );
};
