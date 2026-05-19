import { Skin } from './skin';

export interface Investment {
  id: number;
  idItem: number;
  portfolioId: number;
  countItems: number;
  buyPrice: number;
  dateBuyItem: string;
  updatedAt: string;
  investmentValue: number;
  profitValue: number;
  profitPercent: number;
  assetsValue: number;
  skin: Skin;
  changePercent: number;
  changePrice: number;
  comment?: string;
}

export interface InvestmentsResponse {
  investments: Investment[];
  meta: {
    lastId: number | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface SummaryInvestments {
  totalInvested: number;
  currentBalance: number;
  grossProfit: number;
  netProfit: number;
}

export interface CreateInvestmentRequest {
  idItem: number;
  portfolioId: number;
  countItems: number;
  buyPrice: number;
  dateBuyItem: string;
}

export interface UpdateInvestmentRequest extends CreateInvestmentRequest {
  id: number;
  comment?: string;
}
