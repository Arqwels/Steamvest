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
  currencyCode?: string;
};

export const TableCell_CurrentProfit = ({
  price_item,
  buy_price,
  count_items,
  currencyCode,
}: TableCell_CurrentProfitProps) => {
  const invest = calcInvest(count_items, buy_price);
  const assets = calcAssets(price_item, count_items);
  const assetsNet = calcAssetsNet(assets, COMMISSION_RATE);

  const currentProfit = calcCurrentProfit(assets, invest);
  const currentProfitNet = calcCurrentProfitNet(assets, assetsNet, invest);
  const currentProfitPercent = calcCurrentProfitPercent(currentProfit, invest);

  const cls = getChangeClass(currentProfit);
  const netCls = getChangeClass(currentProfitNet);

  return (
    <td className={`${styles.currentProfit} ${cls} ${styles.wrap}`}>
      <div>
        <span style={{ marginRight: '8px' }}>
          {formatNumber(currentProfit, { currency: currencyCode })}
        </span>
        <span className={netCls}>
          ({formatNumber(currentProfitNet, { currency: currencyCode })})
        </span>
      </div>
      <p>{currentProfitPercent}%</p>
    </td>
  );
};
