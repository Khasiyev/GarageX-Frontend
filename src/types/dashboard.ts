export interface DashboardSummaryResponse {
  totalJobOrders: number;
  createdJobOrders: number;
  inProgressJobOrders: number;
  completedJobOrders: number;
  cancelledJobOrders: number;
  totalInvoices: number;
  paidInvoices: number;
  partiallyPaidInvoices: number;
  issuedInvoices: number;
}

export interface MonthlyRevenueResponse {
  month: number;
  monthName: string;
  revenue: number;
}
