import { formatNumber } from '../../../utils/formatNumber';
import styles from './TableCell.module.scss';

type TableCell_HoldingsProps = {
  price_item: number;
  count_items: number;
  assets_value: number;
  currencyCode?: string;
};

export const TableCell_Holdings = ({
  price_item,
  count_items,
  assets_value,
  currencyCode,
}: TableCell_HoldingsProps) => {
  const assetsGross = +((price_item * count_items).toFixed(2));

  return (
    <td className={styles.wrap}>
      <span style={{ marginRight: '8px' }}>
        {formatNumber(assetsGross, { currency: currencyCode })}
      </span>
      <span>({formatNumber(assets_value, { currency: currencyCode })})</span>
    </td>
  );
};
