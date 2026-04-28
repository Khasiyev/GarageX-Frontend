import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Eye, AlertCircle, RefreshCw, ArrowLeft, ClipboardList, X } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { jobOrderService } from '../../services/jobOrder';
import { vehicleService } from '../../services/vehicle';
import { customerService } from '../../services/customer';
import type { JobOrderResponse } from '../../types/jobOrder';
import { JOB_ORDER_STATUS_LABELS } from '../../types/jobOrder';
import type { VehicleResponse } from '../../types/vehicle';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';
import { useLang } from '../../context/LanguageContext';
import { isAdmin, getMyCustomerIds } from '../../lib/auth';

const STATUS_COLORS: Record<number, string> = {
  1: 'bg-blue-500/10 text-blue-500',
  2: 'bg-amber-500/10 text-amber-500',
  3: 'bg-emerald-500/10 text-emerald-500',
  4: 'bg-red-500/10 text-red-500',
};

export function JobOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') ? Number(searchParams.get('status')) : null;

  const { t } = useLang();
  const admin = isAdmin();
  const myCustomerIds = getMyCustomerIds();

  const [allOrders, setAllOrders] = useState<JobOrderResponse[]>([]);
  const [orders, setOrders] = useState<JobOrderResponse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ vehicleId: 0, complaint: '', notes: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const oRes = await jobOrderService.getAll({});
      if (oRes.data.success) {
        setAllOrders(oRes.data.data);
      } else {
        setError(oRes.data.message);
      }

      if (admin) {
        const vRes = await vehicleService.getAll();
        if (vRes.data.success) setVehicles(vRes.data.data);
      } else {
        if (myCustomerIds.length > 0) {
          const cRes = await customerService.getAll();
          const allCustomers = cRes.data.success ? cRes.data.data : [];
          const myCustomers = allCustomers.filter((c) => myCustomerIds.includes(c.id));
          const allVehicles: VehicleResponse[] = [];
          for (const cust of myCustomers) {
            try {
              const vRes = await vehicleService.getByCustomerId(cust.id);
              if (vRes.data.success) allVehicles.push(...vRes.data.data);
            } catch { /* ignore */ }
          }
          setVehicles(allVehicles);
        }
      }
    } catch { setError(t('error')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (msg) { const timer = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(timer); }
  }, [msg]);

  // Apply status filter whenever allOrders or statusFilter changes
  useEffect(() => {
    if (statusFilter !== null) {
      setOrders(allOrders.filter((o) => o.status === statusFilter));
    } else {
      setOrders(allOrders);
    }
  }, [statusFilter, allOrders]);

  const clearFilter = () => {
    setSearchParams({});
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setCreateLoading(true); setCreateError('');
    try {
      const res = await jobOrderService.create({
        vehicleId: createForm.vehicleId,
        complaint: createForm.complaint,
        notes: createForm.notes || undefined,
      });
      if (res.data.success) {
        setCreateOpen(false);
        setCreateForm({ vehicleId: 0, complaint: '', notes: '' });
        setMsg(t('success'));
        fetchData();
      } else {
        setCreateError(res.data.message);
      }
    } catch (err) {
      setCreateError((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally { setCreateLoading(false); }
  };

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.make} ${v.model} — ${v.plateNumber}`,
  }));

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'complaint', header: t('complaint'),
      render: (r: JobOrderResponse) => (
        <span className="line-clamp-1 max-w-xs text-sm text-skin-text2">{r.complaint}</span>
      ),
    },
    {
      key: 'status', header: t('status'),
      render: (r: JobOrderResponse) => (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_COLORS[r.status] ?? 'bg-skin-hover text-skin-text3'}`}>
          {JOB_ORDER_STATUS_LABELS[r.status] || '—'}
        </span>
      ),
    },
    {
      key: 'openedAt', header: t('openedAt'),
      render: (r: JobOrderResponse) => (
        <span className="text-sm text-skin-text3">{new Date(r.openedAt).toLocaleDateString('az-AZ')}</span>
      ),
    },
    {
      key: 'actions', header: '',
      render: (r: JobOrderResponse) => (
        <Button variant="ghost"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/job-orders/${r.id}`); }}
          className="text-xs px-3 py-1.5">
          <Eye size={14} className="mr-1" />{t('view')}
        </Button>
      ),
    },
  ];

  if (loading) return (
    <PageTransition>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-skin-border border-t-skin-text2 rounded-full" />
      </div>
    </PageTransition>
  );

  if (error && allOrders.length === 0) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={40} className="text-skin-text3" />
        <p className="text-skin-text3">{error}</p>
        <Button onClick={fetchData} variant="ghost"><RefreshCw size={16} className="mr-2" />{t('retry')}</Button>
      </div>
    </PageTransition>
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowLeft size={16} />{t('back')}
            </Button>
            <h1 className="text-xl font-bold text-skin-text">{t('jobOrdersTitle')}</h1>
            {statusFilter !== null && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-500 font-medium">
                {JOB_ORDER_STATUS_LABELS[statusFilter]}
                <button onClick={clearFilter} className="hover:text-violet-700 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
          <Button onClick={() => {
            setCreateForm({ vehicleId: 0, complaint: '', notes: '' });
            setCreateError('');
            setCreateOpen(true);
          }}>
            <Plus size={16} className="mr-2" />{t('addJobOrder')}
          </Button>
        </div>

        {!admin && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3">
            <ClipboardList size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-500">
              Siz öz şikayətinizi bildirə bilərsiniz. Servis işçisi tapşırıqları icra edib statusu yeniləyəcək.
            </p>
          </motion.div>
        )}

        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-skin-hover border border-skin-border rounded-xl px-4 py-3">
            <p className="text-sm text-skin-text2">{msg}</p>
          </motion.div>
        )}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-skin-card border border-skin-border rounded-2xl">
            <ClipboardList size={48} className="text-skin-text3 opacity-30" />
            <p className="text-skin-text3 text-sm">
              {statusFilter !== null
                ? `"${JOB_ORDER_STATUS_LABELS[statusFilter]}" statusunda sifariş yoxdur`
                : t('noData')}
            </p>
            {statusFilter !== null ? (
              <Button variant="ghost" onClick={clearFilter}>
                <X size={14} className="mr-1" />Filtri sil
              </Button>
            ) : (
              <Button onClick={() => { setCreateForm({ vehicleId: 0, complaint: '', notes: '' }); setCreateError(''); setCreateOpen(true); }}>
                <Plus size={16} className="mr-2" />{t('addJobOrder')}
              </Button>
            )}
          </div>
        ) : (
          <Table columns={columns} data={orders} keyExtractor={(r) => r.id} />
        )}

        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('addJobOrder')}>
          {!admin && (
            <div className="flex items-start gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3 mb-4">
              <ClipboardList size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-500 leading-relaxed">
                Avtomobiliniz üçün şikayətinizi bildirin. Servis mütəxəssisi nəzərdən keçirəcək.
              </p>
            </div>
          )}
          {createError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-500">{createError}</p>
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <Select
              label={t('vehicle')}
              options={vehicleOptions}
              placeholder={t('vehicle')}
              value={createForm.vehicleId || ''}
              onChange={(e) => setCreateForm({ ...createForm, vehicleId: Number(e.target.value) })}
              required
            />
            <Textarea
              label={t('complaint')}
              value={createForm.complaint}
              onChange={(e) => setCreateForm({ ...createForm, complaint: e.target.value })}
              required
            />
            <Textarea
              label={`${t('notes')} (${t('optional')})`}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" loading={createLoading}>{t('save')}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}