import styles from './TableCell.module.scss';
import { getChangeClass } from '../../../utils/getChangeClass';

type TableCell_Percent24hProps = {
  change_price_percent_24h: number | null;
};

export const TableCell_Percent24h = ({
  change_price_percent_24h,
}: TableCell_Percent24hProps) => {
  const value = change_price_percent_24h ?? 0;
  const cls = getChangeClass(value);

  return (
    <td className={styles.wrap}>
      <p className={cls}>{value}%</p>
    </td>
  );
};
