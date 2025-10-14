import styles from './TableSalesCell.module.scss';
// ( 7 - Дата )
export const TableSalesCell_Date = ({ dateSale }: { dateSale: string }) => {
  const date = new Date(dateSale);

  const datePart = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  });

  const timePart = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow',
  });

  return (
    <td className={styles.wrap}>
      {datePart}
      <br />
      {timePart}
    </td>
  );
};
