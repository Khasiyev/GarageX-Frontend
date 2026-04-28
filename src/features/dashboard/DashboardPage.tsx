import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  FileText,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Button } from '../../components/ui/Button';
import { dashboardService } from '../../services/dashboard';
import { jobOrderService } from '../../services/jobOrder';
import { useLang } from '../../context/LanguageContext';
import { isAdmin } from '../../lib/auth';
import type {
  DashboardSummaryResponse,
  MonthlyRevenueResponse,
} from '../../types/dashboard';
import type { JobOrderResponse } from '../../types/jobOrder';

function buildSummaryFromOrders(
  orders: JobOrderResponse[]
): DashboardSummaryResponse {
  const invoices = orders.filter((o) => !!o.invoice).map((o) => o.invoice!);

  return {
    totalJobOrders: orders.length,
    createdJobOrders: orders.filter((o) => o.status === 1).length,
    inProgressJobOrders: orders.filter((o) => o.status === 2).length,
    completedJobOrders: orders.filter((o) => o.status === 3).length,
    cancelledJobOrders: orders.filter((o) => o.status === 4).length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((inv) => inv.status === 'Paid').length,
    partiallyPaidInvoices: invoices.filter((inv) => inv.status === 'PartiallyPaid').length,
    issuedInvoices: invoices.filter((inv) => inv.status === 'Issued').length,
  };
}

function formatAmount(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-xl bg-skin-card border border-skin-border flex items-center justify-center">
        <Icon size={14} className="text-skin-text3" />
      </div>
      <h2 className="text-xs font-bold text-skin-text3 uppercase tracking-[0.18em]">
        {title}
      </h2>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <motion.button
  type="button"
  whileHover={{ y: -2, scale: 1.01 }}
  whileTap={{ scale: 0.985 }}
  transition={{ duration: 0.18, ease: 'easeOut' }}
  onClick={onClick}
  className="group w-full text-left bg-skin-card border border-skin-border rounded-2xl p-4 shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-200"
>
      <div className="flex items-start justify-between gap-3">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>

        <ArrowRight
          size={14}
          className="text-skin-text3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        />
      </div>

      <p className="text-2xl font-bold text-skin-text mt-4 leading-none">
        {value}
      </p>

      <p className="text-xs text-skin-text3 mt-2 leading-tight">
        {label}
      </p>
    </motion.button>
  );
}

function MonthlyRevenueChart({
  data,
  year,
  onYearChange,
}: {
  data: MonthlyRevenueResponse[];
  year: number;
  onYearChange: (y: number) => void;
}) {
  const { t } = useLang();
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-skin-card border border-skin-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-skin-text">
              {t('monthlyRevenue')}
            </h2>
            <p className="text-xs text-skin-text3 mt-0.5">
              {t('totalRevenue')}{' '}
              <span className="text-emerald-500 font-bold">
                {formatAmount(totalRevenue)} ₼
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-skin-hover border border-skin-border rounded-xl px-2 py-1">
          <button
            type="button"
            onClick={() => onYearChange(year - 1)}
            className="p-1.5 rounded-lg hover:bg-skin-card transition-colors text-skin-text3 hover:text-skin-text"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-xs font-bold text-skin-text px-2 min-w-[44px] text-center">
            {year}
          </span>

          <button
            type="button"
            onClick={() => onYearChange(year + 1)}
            disabled={year >= currentYear}
            className="p-1.5 rounded-lg hover:bg-skin-card transition-colors text-skin-text3 hover:text-skin-text disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const heightPct = max > 0 ? (d.revenue / max) * 100 : 0;
          const isEmpty = d.revenue === 0;

          return (
            <motion.div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-2 group relative"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035 }}
            >
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-skin-text text-skin-bg text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                {d.revenue.toFixed(2)} ₼
              </div>

              <div className="w-full h-32 flex items-end rounded-xl bg-skin-hover/40 overflow-hidden">
                <motion.div
                  className={`w-full rounded-t-xl transition-all duration-200 ${
                    isEmpty
                      ? 'bg-skin-border/70'
                      : 'bg-gradient-to-t from-emerald-500/80 to-emerald-400/45 group-hover:from-emerald-500 group-hover:to-emerald-400/70'
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, isEmpty ? 4 : 8)}%` }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.035,
                    ease: 'easeOut',
                  }}
                  style={{ minHeight: '4px' }}
                />
              </div>

              <span className="text-[10px] text-skin-text3 font-semibold">
                {d.monthName.substring(0, 3)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const admin = isAdmin();

  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [revenueData, setRevenueData] = useState<MonthlyRevenueResponse[] | null>(null);
  const [revenueYear, setRevenueYear] = useState(new Date().getFullYear());
  const [revenueLoading, setRevenueLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      if (admin) {
        try {
          const res = await dashboardService.getSummary();

          if (res.data.success && res.data.data) {
            setData(res.data.data);
            return;
          }
        } catch {
          // fallback below
        }
      }

      const res = await jobOrderService.getAll({});

      if (res.data.success) {
        setData(buildSummaryFromOrders(res.data.data));
      } else {
        setError(res.data.message);
      }
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async (year: number) => {
    setRevenueLoading(true);

    try {
      const res = await dashboardService.getMonthlyRevenue(year);

      if (res.data.success && res.data.data) {
        setRevenueData(res.data.data);
      }
    } catch {
      setRevenueData(null);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (admin) fetchRevenue(revenueYear);
  }, [admin, revenueYear]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-7 w-7 border-2 border-skin-border border-t-skin-text2 rounded-full" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle size={36} className="text-skin-text3" />
          <p className="text-skin-text2">{error}</p>
          <Button onClick={fetchData} variant="ghost">
            <RefreshCw size={14} className="mr-2" />
            {t('retry')}
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (!data) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.055 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
  };

  const jobStats = [
    {
      label: t('totalOrders'),
      value: data.totalJobOrders,
      icon: ClipboardList,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      to: '/job-orders',
    },
    {
      label: t('created'),
      value: data.createdJobOrders,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      to: '/job-orders?status=1',
    },
    {
      label: t('inProgress'),
      value: data.inProgressJobOrders,
      icon: RefreshCw,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      to: '/job-orders?status=2',
    },
    {
      label: t('completed'),
      value: data.completedJobOrders,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      to: '/job-orders?status=3',
    },
    {
      label: t('cancelled'),
      value: data.cancelledJobOrders,
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      to: '/job-orders?status=4',
    },
  ];

  const invStats = [
    {
      label: t('totalInvoices'),
      value: data.totalInvoices,
      icon: FileText,
      color: 'text-sky-500',
      bg: 'bg-sky-500/10',
      to: '/invoices',
    },
    {
      label: t('paid'),
      value: data.paidInvoices,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      to: '/invoices?status=Paid',
    },
    {
      label: t('partiallyPaid'),
      value: data.partiallyPaidInvoices,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      to: '/invoices?status=PartiallyPaid',
    },
    {
      label: t('issued'),
      value: data.issuedInvoices,
      icon: ArrowRight,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      to: '/invoices?status=Issued',
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-skin-text tracking-tight">
              {t('dashboardTitle')}
            </h1>
            <p className="text-sm text-skin-text3 mt-1">
              GarageX üzrə ümumi əməliyyat xülasəsi
            </p>
          </div>

          {!admin && (
            <span className="text-xs text-skin-text3 bg-skin-card border border-skin-border rounded-xl px-3 py-2 shadow-sm">
              {t('userOwnDataOnly')}
            </span>
          )}
        </div>

        <section>
          <SectionTitle icon={ClipboardList} title={t('jobOrders')} />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {jobStats.map((s) => (
              <motion.div key={s.label} variants={item}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  color={s.color}
                  bg={s.bg}
                  onClick={() => navigate(s.to)}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section>
          <SectionTitle icon={FileText} title={t('invoices')} />

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {invStats.map((s) => (
              <motion.div key={s.label} variants={item}>
                <StatCard
                  label={s.label}
                  value={s.value}
                  icon={s.icon}
                  color={s.color}
                  bg={s.bg}
                  onClick={() => navigate(s.to)}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {admin && (
          <section>
            <SectionTitle icon={TrendingUp} title={t('revenueTitle')} />

            {revenueLoading ? (
              <div className="bg-skin-card border border-skin-border rounded-2xl p-5 flex items-center justify-center h-56 shadow-sm">
                <div className="animate-spin h-6 w-6 border-2 border-skin-border border-t-emerald-500 rounded-full" />
              </div>
            ) : revenueData ? (
              <MonthlyRevenueChart
                data={revenueData}
                year={revenueYear}
                onYearChange={setRevenueYear}
              />
            ) : (
              <div className="bg-skin-card border border-skin-border rounded-2xl p-6 text-center shadow-sm">
                <p className="text-sm text-skin-text3">
                  Revenue data is not available.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </PageTransition>
  );
}