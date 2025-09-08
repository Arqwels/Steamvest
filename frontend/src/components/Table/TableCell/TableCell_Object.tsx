import styles from './TableCell.module.scss';

type TableCell_ObjectProps = {
  image_url: string;
  item_hash_name: string;
  item_name: string;
};

// Функция для сокращения текста
const truncateText = (
  text: string | null | undefined,
  maxLength: number,
  suffix = '...',
): string => {
  if (!text) return 'Туть должен был быть название скина :)';

  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  return lastSpaceIndex > 0
    ? truncated.slice(0, lastSpaceIndex) + suffix
    : truncated + suffix;
};

export const TableCell_Object = ({
  image_url,
  item_hash_name,
  item_name,
}: TableCell_ObjectProps) => {
  const truncateItemName = truncateText(item_name, 60);

  return (
    <td className={styles.object}>
      <img src={image_url} alt={item_hash_name} />
      <p>{truncateItemName}</p>
    </td>
  );
};
