import { Link } from 'react-router-dom';
import styles from './MainPage.module.scss';
import { Routes } from '../../routes/routesPaths';
import hero from '../../assets/hero-placeholder.png';

export const MainPage = () => {
  return (
    <main className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <h1 className={styles.title}>Steamvest</h1>
          <p className={styles.description}>
            Lorem ipsum dolor sit consectetur adipisicing elit. Assumenda totam deleniti corporis aspernatur nulla sapiente unde porro cumque expedita? Deserunt aliquid obcaecati quos esse corporis, quo dignissimos nemo velit quis!
          </p>
          <div className={styles.actions}>
            <Link to={Routes.Public.Login} className={`${styles.btn} ${styles.login}`}>
              Войти
            </Link>
            <Link to={Routes.Public.Register} className={`${styles.btn} ${styles.register}`}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
        <div className={styles.hero}>
          <img src={hero} alt='CS:GO скины и график роста' loading='lazy' />
        </div>
      </div>
    </main>
  );
};
