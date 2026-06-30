type FormatNumberOptions = {
  locale?: string; // Локаль, по умолчанию 'ru-RU'
  currency?: string; // Код валюты, если нужен
};

export const formatNumber = (
  value: number,
  options: FormatNumberOptions = {}
): string => {
  const { locale = 'ru-RU', currency } = options;

  return new Intl.NumberFormat(locale, {
    style: currency ? 'currency' : 'decimal',
    ...(currency && { currency }),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};
