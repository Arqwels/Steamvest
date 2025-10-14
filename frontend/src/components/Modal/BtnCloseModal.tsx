import PlusIcon from '../Svg/PlusIcon';
import styles from './Modal.module.scss';

interface BtnCloseModalProps {
  onClose: () => void;
  position?: { top?: string; right?: string; bottom?: string; left?: string };
}

export const BtnCloseModal = ({ onClose, position }: BtnCloseModalProps) => {
  return (
    <button
      type='button'
      className={styles.closeModal}
      style={{ ...position }}
      onClick={onClose}
    >
      <PlusIcon />
    </button>
  );
};
