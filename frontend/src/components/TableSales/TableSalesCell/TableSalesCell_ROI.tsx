import { getChangeClass } from '../../../utils/getChangeClass';
import styles from './TableSalesCell.module.scss';

type TableSalesCell_ROIProps = {
  priceBuy: number;
  priceSale: number;
  roi: number;
};
// ( 6 - Доходность (RIO) )
export const TableSalesCell_ROI = ({
  priceBuy, priceSale, roi
}: TableSalesCell_ROIProps) => {
  const roiGross = priceBuy > 0
    ? +((priceSale - priceBuy) / priceBuy * 100).toFixed(2)
    : 0;

  const roiGrossCls = getChangeClass(roiGross);
  const roiNetCls = getChangeClass(roi);
  return (
    <td className={styles.wrap}>
      <p className={roiGrossCls}>{roiGross}%</p>
      <p className={`${styles.tooltip} ${roiNetCls}`}>
        ({roi}%)
        <span className={styles.tooltipText}>ROI с учётом комиссии Steam</span>
      </p>
    </td>
  );
};
