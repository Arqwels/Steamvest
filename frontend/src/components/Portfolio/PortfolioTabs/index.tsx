import { Tab } from './Tab';
import styles from './PortfolioTabs.module.scss';
import { MutableRefObject } from 'react';

interface PortfolioTabsProps {
  items: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  tabRefs?: MutableRefObject<Array<HTMLButtonElement | null>>
}

export const PortfolioTabs = ({ items, activeIndex, onChange, tabRefs }: PortfolioTabsProps) => {
  return (
    <div className={styles.tabs}>
      {items.map((tab, index) => (
        <Tab
          key={index}
          label={tab}
          isActive={index === activeIndex}
          onClick={() => onChange(index)}
          ref={el => {
            if (tabRefs) {
              tabRefs.current[index] = el;
            }
          }}
        />
      ))}
    </div>
  );
};
