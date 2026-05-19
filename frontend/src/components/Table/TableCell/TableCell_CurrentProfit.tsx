import styles from './TableCell.module.scss';
import { formatNumber } from '../../../utils/formatNumber';
import { getChangeClass } from '../../../utils/getChangeClass';
import {
  calcAssets,
  calcAssetsNet,
  calcCurrentProfit,
  calcCurrentProfitNet,
  calcCurrentProfitPercent,
  calcInvest,
} from '../../../utils/calculations';
import { COMMISSION_RATE } from '../../../utils/config';

type TableCell_CurrentProfitProps = {
  price_item: number;
  buy_price: number;
  count_items: number;
  profit_value: number;
  profit_percent: number;
  currencyCode?: string;
};

export const TableCell_CurrentProfit = ({
  price_item,
  buy_price,
  count_items,
  profit_value,
  profit_percent,
  currencyCode,
}: TableCell_CurrentProfitProps) => {
  const invest = calcInvest(count_items, buy_price);
  const assets = calcAssets(price_item, count_items);
  const assetsNet = calcAssetsNet(assets, COMMISSION_RATE);

  const currentProfitNet = calcCurrentProfitNet(assets, assetsNet, invest);

  const cls = getChangeClass(profit_value);
  const netCls = getChangeClass(currentProfitNet);

  return (
    <td className={`${styles.currentProfit} ${cls} ${styles.wrap}`}>
      <div>
        <span style={{ marginRight: '8px' }}>
          {formatNumber(profit_value, { currency: currencyCode })}
        </span>
        <span className={netCls}>
          ({formatNumber(currentProfitNet, { currency: currencyCode })})
        </span>
      </div>
      <p>{(profit_percent ?? 0).toFixed(2)}%</p>
    </td>
  );
};
