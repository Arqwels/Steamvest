import { Investment } from './investment';
import { Skin } from './skin';

export interface Sale {
  id: number;
  skinId: number;
  portfolioId: number;
  countSale: number;
  priceSale: number;
  priceBuy: number;
  dateSale: string;
  createdAt: string;
  updatedAt: string;
  skin: Skin;
}

export interface SalesResponse {
  sales: Sale[];
  meta: {
    lastId: number | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface SaleInvestmentBase {
  ok: boolean;
  saleId: number;
}

export interface SaleInvestmentFull extends SaleInvestmentBase {
  removedId: number;
}

export interface SaleInvestmentPartial extends SaleInvestmentBase {
  investment: Investment;
}

// итоговый ответ может быть или полная, или частичная продажа
export type SaleInvestmentResponse = SaleInvestmentFull | SaleInvestmentPartial;

export interface SaleInvestmentRequest {
  investmentId: number;
  portfolioId: number;
  countSale: number;
  priceSale: number;
  saleDate: string;
}
