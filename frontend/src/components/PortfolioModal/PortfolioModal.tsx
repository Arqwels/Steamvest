import { useEffect, useId, useState } from 'react';
import { Modal } from '../Modal/Modal';
import styles from './PortfolioModal.module.scss';
import { BtnCloseModal } from '../Modal/BtnCloseModal';

interface PortfolioModalProps {
  title: string;
  initialName?: string;
  submitLabel: string;
  active: boolean;
  setActive: (active: boolean) => void;
  onSubmit: (name: string) => Promise<any>;
}

export const PortfolioModal = ({
  title,
  initialName = '',
  submitLabel,
  active,
  setActive,
  onSubmit,
}: PortfolioModalProps) => {
  const id = useId();

  const [name, setName] = useState<string>(initialName);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    setName(active ? initialName : '');
  }, [active, initialName]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSubmit(name.trim());
      setActive(false);
    } catch (err) {
      console.error(`Ошибка при ${title.toLowerCase()}`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal active={active} setActive={setActive}>
      <div className={styles.addPortfolio}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <div className={styles.inputWrapper}>
          <input
            id={`${id}-portfolioName`}
            type='text'
            placeholder=' '
            className={styles.inputField}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
          <label htmlFor={`${id}-portfolioName`} className={styles.inputLabel}>
            Название портфеля
          </label>
        </div>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!name.trim() || isLoading}
        >
          {isLoading ? 'Сохранение...' : submitLabel}
        </button>
        <BtnCloseModal
          onClose={() => setActive(false)}
          position={{ top: "1%", right: "1%" }}
        />
      </div>
    </Modal>
  )
};
