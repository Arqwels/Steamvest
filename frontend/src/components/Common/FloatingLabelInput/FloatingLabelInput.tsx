import { useState, FC, CSSProperties, useEffect } from 'react';
import styles from './FloatingLabelInput.module.scss';

interface FloatingLabelInputProps {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
   type?: 'integer' | 'decimal';
  style?: CSSProperties;
  disabled?: boolean;
  decimalPlaces?: number;
  maxValue?: number;
}

export const FloatingLabelInput: FC<FloatingLabelInputProps> = ({ 
  id,
  label,
  value,
  onChange,
  type = 'integer',
  style,
  disabled,
  decimalPlaces = 2,
  maxValue,
}) => {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Функция для обрезания десятичных знаков без округления
  const truncateDecimal = (num: number, decimals: number) => {
    const factor = Math.pow(10, decimals);
    return Math.floor(num * factor) / factor;
  };

  useEffect(() => {
    if (value === null) {
      setInputValue('');
    } else if (!focused) {
      const formattedValue = type === 'decimal'
        ? truncateDecimal(value, decimalPlaces).toFixed(decimalPlaces).replace('.', ',')
        : value.toString();
      setInputValue(formattedValue);
    }
  }, [value, focused, type, decimalPlaces]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value
      .replace(/,/g, '.')
      .replace(/[^0-9.]/g, '');

    if (rawValue === '') {
      setInputValue('');
      onChange(null);
      return;
    }

    if (type === 'integer') {
      rawValue = rawValue.replace(/\./g, '');
      let newValue = parseInt(rawValue, 10);
      if (!isNaN(newValue)) {
        // Ограничение по максимуму
        if (maxValue !== undefined && newValue > maxValue) {
          newValue = maxValue;
        }
        setInputValue(newValue.toString());
        onChange(newValue);
      }
      return;
    }

    if (type === 'decimal') {
      const parts = rawValue.split('.');
      if (parts.length > 2) return;

      if (rawValue.startsWith('.')) {
        rawValue = `0.${parts[1] || ''}`;
      }

      // Обрезаем ввод пользователя до нужного количества знаков
      if (parts.length > 1) {
        parts[1] = parts[1].slice(0, decimalPlaces);
        rawValue = `${parts[0]}.${parts[1]}`;
      }

      setInputValue(rawValue.replace('.', ','));

      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        // Используем обрезание вместо округления
        const truncatedValue = truncateDecimal(numValue, decimalPlaces);
        onChange(truncatedValue);
      }
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (type === 'decimal' && value !== null) {
      // Форматируем с обрезанием
      const truncatedValue = truncateDecimal(value, decimalPlaces);
      setInputValue(truncatedValue.toFixed(decimalPlaces).replace('.', ','));
    }
  }

  return (
    <div className={styles.inputContainer}>
      <input 
        id={id}
        type='text'
        inputMode='decimal'
        placeholder=' '
        value={inputValue}
        className={styles.skinInput}
        style={style}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onChange={handleChange}
        disabled={disabled}
      />
      <label 
        htmlFor={id} 
        className={`${styles.label}`}
      >
        {label}
      </label>
    </div>
  );
};
