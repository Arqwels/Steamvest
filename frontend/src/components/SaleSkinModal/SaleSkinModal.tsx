import { useEffect, useState } from 'react';
import { Modal } from '../Modal/Modal';
import styles from './SaleSkinModal.module.scss';
import { FloatingLabelInput } from '../Common/FloatingLabelInput/FloatingLabelInput';
import { useAppSelector } from '../../stores/hooks';
import { BtnCloseModal } from '../Modal/BtnCloseModal';
import { useSaleInvestmentMutation } from '../../api/investmentApi';
import toast from 'react-hot-toast';
import { FaInfoCircle } from 'react-icons/fa';

interface SaleSkinModalProps {
  active: boolean;
  setActive: (active: boolean) => void;
  investmentId: number;
  market_name: string;
  image_url: string;
  price_item: number;
  count_items: number;
  market_hash_name: string;
}

export const SaleSkinModal = ({
  active,
  setActive,
  investmentId,
  market_name,
  image_url,
  price_item,
  count_items,
  market_hash_name,
}: SaleSkinModalProps) => {
  const portfolioId = useAppSelector((state) => state.activePortfolio.portfolioId!);

  const getNowLocal = () => new Date().toISOString().slice(0, 16);

  const [saleDate, setSaleDate] = useState<string>(getNowLocal());

  const [count, setCount] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [useCurrentPrice, setUseCurrentPrice] = useState<boolean>(false);

  const [saleInvestment] = useSaleInvestmentMutation();

  // При открытии модального — сбрасываем поля в начальное состояние
  useEffect(() => {
    if (active) {
      setSaleDate(getNowLocal());
      setCount(null);
      setPrice(null);
      setAllSelected(false);
      setUseCurrentPrice(false);
    }
  }, [active]);

  useEffect(() => {
    if (useCurrentPrice) {
      setPrice(price_item ?? null);
    }
  }, [useCurrentPrice, price_item]);

  const handleAllClick = () => {
    if (allSelected) {
      setAllSelected(false);
      setCount(null);
    } else {
      setAllSelected(true);
      setCount(count_items ?? null);
    }
  };

  const handleCurrentPriceClick = () => {
    if (useCurrentPrice) return;
    setUseCurrentPrice(true);
    setPrice(price_item ?? null);
  };

  const onPriceChange = (val: number | null) => {
    if (val === price_item) {
      setPrice(val);
      setUseCurrentPrice(true);
      return;
    }

    setUseCurrentPrice(false);
    setPrice(val);
  };

  const onCountChange = (val: number | null) => {
    setAllSelected(false);
    setCount(val);
  };

  const sellHandler = async () => {
    if (count && price && saleDate) {
      const saleData = {
        investmentId,
        portfolioId,
        countSale: Number(count),
        priceSale: Number(price),
        saleDate,
      };

      try {
        await saleInvestment(saleData).unwrap();
        toast.success('Продажа успешно завершена!');
        setActive(false);
      } catch (error) {
        console.error('Ошибка при продажи инвестиции!', error);
      }
    }
  };

  return (
    <Modal active={active} setActive={setActive}>
      <div className={styles.modalWrap}>
        <h2 className={styles.titleHead}>Продажа</h2>

        <div className={styles.titleSkin}>
          <img src={image_url} alt={market_hash_name} />
          <p>{market_name}</p>
        </div>

        <hr className={styles.divider} />

        <div className={styles.inputWrap}>
          <FloatingLabelInput
            id='count'
            label='Количество'
            value={count}
            onChange={onCountChange}
            type='integer'
            maxValue={count_items}
          />

          <button
            type='button'
            className={styles.inputBtnAll}
            onClick={handleAllClick}
          >
            {allSelected ? 'Снять' : 'Все'}
          </button>
        </div>

        <div className={styles.inputWrap}>
          <FloatingLabelInput
            id='price'
            label='Цена'
            value={price}
            onChange={onPriceChange}
            type='decimal'
            decimalPlaces={2}
          />

          <span className={styles.icon}>
            <FaInfoCircle />
            <span className={styles.tooltipText}>
              Введите сумму из «Покупатель заплатит», комиссия будет вычтена автоматически.
            </span>
          </span>

          <button
            type='button'
            className={`${styles.btnCurrentPrice} ${useCurrentPrice ? styles.active : ''}`}
            onClick={handleCurrentPriceClick}
          >
            Текущая цена
          </button>
        </div>

        <div className={styles.inputWrap}>
          <input
            id='saleDate'
            type='datetime-local'
            min='2013-05-13T00:00'
            className={styles.inputSaleDate}
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
          <label htmlFor='saleDate' className={styles.labelSaleDate}>
            Дата & Время
          </label>
        </div>

        <button
          className={styles.btnConfirm}
          onClick={sellHandler}
          disabled={!count || !price || !saleDate}
        >
          Подтвердить
        </button>

        <BtnCloseModal
          onClose={() => setActive(false)}
          position={{ top: '5%', right: '5.5%' }}
        />
      </div>
    </Modal>
  );
};
