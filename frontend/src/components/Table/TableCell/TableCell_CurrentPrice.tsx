import styles from './TableCell.module.scss';
import { formatNumber } from '../../../utils/formatNumber';

type TableCell_CurrentPriceProps = {
  price_item: number;
  currencyCode?: string;
};

export const TableCell_CurrentPrice = ({
  price_item,
  currencyCode,
}: TableCell_CurrentPriceProps) => {

  return (
    <td className={styles.wrap}>
      <p>{formatNumber(price_item, { currency: currencyCode })}</p>
    </td>
  );
};
