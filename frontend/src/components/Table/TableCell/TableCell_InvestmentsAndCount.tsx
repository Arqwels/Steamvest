import styles from './TableCell.module.scss';
import { formatNumber } from '../../../utils/formatNumber';
import { calcInvest } from '../../../utils/calculations';

type TableCell_InvestmentsAndCountProps = {
  count_items: number;
  buy_price: number;
  currencyCode?: string;
};

export const TableCell_InvestmentsAndCount = ({
  count_items,
  buy_price,
  currencyCode,
}: TableCell_InvestmentsAndCountProps) => {
  const investment = calcInvest(count_items, buy_price);

  return (
    <td className={styles.wrap}>
      <p>{formatNumber(investment, { currency: currencyCode })}</p>
      <p className={styles.investmentCount}>{count_items} шт.</p>
    </td>
  );
};
