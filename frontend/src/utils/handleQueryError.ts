import toast from 'react-hot-toast';

export function handleQueryError(context: string, err: unknown, payload?: any) {
  console.error(`[${context}]`, { err, payload });
  toast.error('Произошла ошибка. Попробуйте ещё раз.');
}
