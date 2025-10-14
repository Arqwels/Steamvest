import { Sale } from '../../types';
import { TableSalesRow } from './TableSalesRow';

export const TableSalesBody = ({ data }: { data: Sale[] }) => {
  return (
    <tbody>
      {data.map((row) => (
        <TableSalesRow key={row.id} row={row} />
      ))}
    </tbody>
  );
};
