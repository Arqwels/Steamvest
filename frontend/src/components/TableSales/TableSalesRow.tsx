import { Sale } from '../../types'
import { TableSalesCell_BuyPrice } from './TableSalesCell/TableSalesCell_BuyPrice';
import { TableSalesCell_ROI } from './TableSalesCell/TableSalesCell_ROI';
import { TableSalesCell_Date } from './TableSalesCell/TableSalesCell_Date';
import { TableSalesCell_Invested } from './TableSalesCell/TableSalesCell_Invested';
import { TableSalesCell_NetProfit } from './TableSalesCell/TableSalesCell_NetProfit';
import { TableSalesCell_Object } from './TableSalesCell/TableSalesCell_Object';
import { TableSalesCell_SaleInfo } from './TableSalesCell/TableSalesCell_SaleInfo';
import { FiTrash2 } from 'react-icons/fi';
import styles from './TableSales.module.scss';
import { useAppSelector } from '../../stores/hooks';
import { useDeleteSaleMutation } from '../../api/saleApi';
import { useState } from 'react';
import { ConfirmModal } from '../ConfirmModal/ConfirmModal';
import toast from 'react-hot-toast';

export const TableSalesRow = ({ row }: { row: Sale }) => {
  const portfolioId = useAppSelector((state) => state.activePortfolio.portfolioId);
  const [deleteSaleSkin] = useDeleteSaleMutation();

  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!portfolioId) return;
    try {
      const response = await deleteSaleSkin({ saleId: row.id, portfolioId }).unwrap();
      toast.success(response.message || 'Удалено успешно!');
    } catch (error: any) {
      console.error('Ошибка при удалении продажи:', error);
      toast.error(error?.data?.message || 'Произошла ошибка при удалении');
    }
  };

  return (
    <>
      <tr>
        {/* ( 1 - Предмет ) */}
        <TableSalesCell_Object
          image_url={row.skin.image_url}
          item_hash_name={row.skin.market_hash_name}
          item_name={row.skin.market_name}
        />
        {/* ( 2 - Цена/Кол-во продажи ) */}
        <TableSalesCell_SaleInfo
          priceSale={row.priceSale}
          countSale={row.countSale}
          currencyCode={row.skin.currency_code}
        />
        {/* ( 3 - Цена покупки ) */}
        <TableSalesCell_BuyPrice
          priceBuy={row.priceBuy}
          currencyCode={row.skin.currency_code}
        />
        
        {/* ( 4 - Всего инвестировано ) */}
        <TableSalesCell_Invested
          priceBuy={row.priceBuy}
          countSale={row.countSale}
          currencyCode={row.skin.currency_code}
        />
        {/* ( 5 - Чистая прибыль ) */}
        <TableSalesCell_NetProfit
          priceBuy={row.priceBuy}
          priceSale={row.priceSale}
          countSale={row.countSale}
          currencyCode={row.skin.currency_code}
        />
        {/* ( 6 - Доходность (RIO) ) */}
        <TableSalesCell_ROI
          priceBuy={row.priceBuy}
          priceSale={row.priceSale}
          countSale={row.countSale}
        />
        {/* ( 7 - Дата ) */}
        <TableSalesCell_Date
          dateSale={row.dateSale}
        />
        {/* ( 8 - Действие ) */}
        <td className={styles.actionCell}>
          <button
            onClick={() => setConfirmOpen(true)}
            className={styles.deleteButton}
          >
            <FiTrash2 size={18} color='var(--color-text)' />
          </button>
        </td>
      </tr>

      <ConfirmModal
        active={isConfirmOpen}
        setActive={setConfirmOpen}
        title='Подтверждение удаления'
        message={`Удаляем запись о продаже '${row.skin.market_name}'. Вы уверены?`}
        confirmLabel='Удалить'
        cancelLabel='Отмена'
        onConfirm={handleDelete}
      />
    </>
  );
};
