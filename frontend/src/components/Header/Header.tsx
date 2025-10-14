import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../../api/authApi';
import { useAppDispatch } from '../../stores/hooks';
import styles from './Header.module.scss';
import { logoutAndReset } from '../../stores/reducers/authSlice';
import { Routes } from '../../routes/routesPaths';

export const Header = () => {
  const [logoutApi] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutApi()
      .unwrap()
      .catch(() => {});

    dispatch(logoutAndReset());

    navigate(Routes.Public.Login, { replace: true });
  };

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Steamvest</h1>

      <div className={styles.profile}>
        <button className={styles.btn}>Профиль</button>
        <button
          className={`${styles.btn} ${styles.btnLogout}`}
          onClick={handleLogout}
        >
          Выйти
        </button>
      </div>
    </header>
  );
};
