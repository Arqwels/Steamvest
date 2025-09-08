import { skipToken } from '@reduxjs/toolkit/query';
import { useSummaryInvestmentsQuery } from '../../api/investmentApi';
import { useAppSelector } from '../../stores/hooks';
import { COMMISSION_RATE } from '../../utils/config';
import { getChangeClass } from '../../utils/getChangeClass';
import { NavSection } from './NavSection';
import style from './Navigation.module.scss';

export const Navigation = () => {
  const portfolioId = useAppSelector(state => state.activePortfolio.portfolioId);
  const { data, isLoading } = useSummaryInvestmentsQuery(portfolioId ?? skipToken);

  const totalInvested = data?.totalInvested ?? 0;
  const currentBalance = data?.currentBalance ?? 0;
  const netProfit = data?.netProfit ?? 0;

  // Класс для стилизации цвета прибыли/убытка/нейтрального
  const profitClass = getChangeClass(netProfit);

  return (
    <div className={style.navigation}>
      <NavSection
        money={totalInvested}
        text={'Всего инвестировано'}
        isLoading={isLoading}
      />
      <NavSection 
        money={currentBalance}
        text={'Текущий баланс'}
        isLoading={isLoading}
      />
      <NavSection 
        money={netProfit}
        //! При наведении показать пояснение, что расчёт прибыли учитывает комиссию
        text={`Общая прибыль (−${(COMMISSION_RATE*100).toFixed(2)}%)`}
        changeClass={profitClass}
        isLoading={isLoading}
      />
    </div>
  )
};
