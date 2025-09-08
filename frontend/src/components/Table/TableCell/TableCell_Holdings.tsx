import { formatNumber } from '../../../utils/formatNumber';
import { COMMISSION_RATE } from '../../../utils/config';
import { calcAssets, calcAssetsNet } from '../../../utils/calculations';
import styles from './TableCell.module.scss';

type TableCell_HoldingsProps = {
  price_item: number;
  count_items: number;
  currencyCode?: string;
};

export const TableCell_Holdings = ({
  price_item,
  count_items,
  currencyCode,
}: TableCell_HoldingsProps) => {
  const assets = calcAssets(price_item, count_items);
  const assetsNet = calcAssetsNet(assets, COMMISSION_RATE);

  return (
    <td className={styles.wrap}>
      <span style={{ marginRight: '8px' }}>
        {formatNumber(assets, { currency: currencyCode })}
      </span>
      <span>({formatNumber(assetsNet, { currency: currencyCode })})</span>
    </td>
  );
};
