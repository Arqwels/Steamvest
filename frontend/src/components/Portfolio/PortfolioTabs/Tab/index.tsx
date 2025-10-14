import { forwardRef } from 'react';
import styles from './Tab.module.scss';

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(({ label, isActive, onClick }, ref) => {
  return (
    <button
      ref={ref}
      className={`${styles.tab} ${isActive ? styles.active : ''}`}
      onClick={isActive ? undefined : onClick}
      disabled={isActive}
      type='button'
    >
      {label}
    </button>
  )
});

Tab.displayName = 'Tab';
