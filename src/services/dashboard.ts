import api from './api';
import type { BaseResponse } from '../types/common';
import type { DashboardSummaryResponse, MonthlyRevenueResponse } from '../types/dashboard';

export const dashboardService = {
  getSummary: () =>
    api.get<BaseResponse<DashboardSummaryResponse>>('/Dashboard/summary'),

  getMonthlyRevenue: (year: number) =>
    api.get<BaseResponse<MonthlyRevenueResponse[]>>('/Dashboard/monthly-revenue', {
      params: { year },
    }),
};
