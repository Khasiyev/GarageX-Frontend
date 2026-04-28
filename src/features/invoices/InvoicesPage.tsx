import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle, RefreshCw, CreditCard, ChevronDown, ChevronUp, ArrowLeft, Receipt, Printer, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { jobOrderService } from '../../services/jobOrder';
import { paymentService } from '../../services/payment';
import { useLang } from '../../context/LanguageContext';
import type { JobOrderResponse } from '../../types/jobOrder';
import type { PaymentResponse } from '../../types/payment';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';

interface InvoiceRow { order: JobOrderResponse; }

const PAYMENT_METHOD_OPTIONS = [
  { value: 1, label: 'Nağd' },
  { value: 2, label: 'Kart' },
  { value: 3, label: 'Bank köçürməsi' },
];

const STATUS_LABELS: Record<string, string> = {
  Issued: 'Təqdim edilmiş', Paid: 'Ödənilmiş',
  PartiallyPaid: 'Qismən ödənilmiş', Draft: 'Qaralama', Cancelled: 'Ləğv edilmiş',
};
const STATUS_COLORS: Record<string, string> = {
  Issued: 'bg-blue-500/10 text-blue-500', Paid: 'bg-emerald-500/10 text-emerald-500',
  PartiallyPaid: 'bg-amber-500/10 text-amber-500', Draft: 'bg-skin-hover text-skin-text3',
  Cancelled: 'bg-red-500/10 text-red-500',
};

function ReceiptModal({ order, onClose }: { order: JobOrderResponse; onClose: () => void }) {
  const inv = order.invoice!;
  const laborTotal = order.tasks.reduce((s, tk) => s + tk.laborCost, 0);
  const partsTotal = order.partUsages.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const now = new Date();

  return (
    <div className="space-y-0">
      <div id="receipt-content" className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-skin-border overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-5 text-white text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Receipt size={18} />
            <span className="font-bold text-lg">GarageX</span>
          </div>
          <p className="text-violet-200 text-xs">SERVICE • REPAIR • CARE</p>
          <div className="mt-3 pt-3 border-t border-violet-400/30">
            <p className="text-sm font-semibold">Faktura #{inv.invoiceId}</p>
            <p className="text-violet-200 text-xs mt-0.5">{now.toLocaleString('az-AZ')}</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {order.tasks.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-skin-text3 uppercase tracking-wider mb-2">Görülən İşlər</p>
              <div className="space-y-1.5">
                {order.tasks.map((tk) => (
                  <div key={tk.id} className="flex justify-between items-center">
                    <span className="text-xs text-skin-text2 flex-1 pr-3">{tk.title}</span>
                    <span className="text-xs font-semibold text-skin-text whitespace-nowrap">{tk.laborCost.toFixed(2)} ₼</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-skin-border">
                <span className="text-xs font-medium text-skin-text2">İşçilik cəmi</span>
                <span className="text-xs font-bold text-violet-500">{laborTotal.toFixed(2)} ₼</span>
              </div>
            </div>
          )}
          {order.partUsages.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-skin-text3 uppercase tracking-wider mb-2">İstifadə Edilən Hissələr</p>
              <div className="space-y-1.5">
                {order.partUsages.map((p) => (
                  <div key={p.id} className="flex justify-between items-center">
                    <div className="flex-1 pr-3">
                      <span className="text-xs text-skin-text2">{p.partName}</span>
                      <span className="text-[10px] text-skin-text3 ml-1">×{p.quantity}</span>
                    </div>
                    <span className="text-xs font-semibold text-skin-text whitespace-nowrap">{(p.quantity * p.unitPrice).toFixed(2)} ₼</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-skin-border">
                <span className="text-xs font-medium text-skin-text2">Hissələr cəmi</span>
                <span className="text-xs font-bold text-amber-500">{partsTotal.toFixed(2)} ₼</span>
              </div>
            </div>
          )}
          <div className="border-t-2 border-skin-border pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-xs text-skin-text3">İşçilik</span>
              <span className="text-xs text-violet-500 font-medium">{laborTotal.toFixed(2)} ₼</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-skin-text3">Hissələr</span>
              <span className="text-xs text-amber-500 font-medium">{partsTotal.toFixed(2)} ₼</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-skin-border">
              <span className="text-sm font-bold text-skin-text">Ümumi</span>
              <span className="text-sm font-bold text-skin-text">{inv.totalAmount.toFixed(2)} ₼</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-skin-text3">Ödənilib</span>
              <span className="text-xs text-emerald-500 font-semibold">{inv.paidAmount.toFixed(2)} ₼</span>
            </div>
            {inv.remainingAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-xs text-skin-text3">Qalıq</span>
                <span className="text-xs text-red-500 font-semibold">{inv.remainingAmount.toFixed(2)} ₼</span>
              </div>
            )}
          </div>
          <div className="text-center py-2">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[inv.status] ?? 'bg-skin-hover text-skin-text3'}`}>
              {STATUS_LABELS[inv.status] ?? inv.status}
            </span>
          </div>
          <p className="text-center text-[10px] text-skin-text3">GarageX — Səməd Vurğun 123, Bakı • (055) 588-18-98</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>Bağla</Button>
        <Button onClick={() => window.print()} className="flex items-center gap-1.5">
          <Printer size={14} />Çap et
        </Button>
      </div>
    </div>
  );
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status'); // 'Paid' | 'PartiallyPaid' | 'Issued' | null

  const { t } = useLang();
  const [allRows, setAllRows] = useState<InvoiceRow[]>([]);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [payments, setPayments] = useState<Record<number, PaymentResponse[]>>({});
  const [payLoading, setPayLoading] = useState<number | null>(null);
  const [payModal, setPayModal] = useState<{ invoiceId: number; remaining: number } | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 1 });
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<JobOrderResponse | null>(null);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await jobOrderService.getAll({});
      if (res.data.success) {
        const withInvoice = res.data.data
          .filter((o) => !!o.invoice)
          .sort((a, b) => new Date(b.invoice!.issuedAt).getTime() - new Date(a.invoice!.issuedAt).getTime());
        const mapped = withInvoice.map((order) => ({ order }));
        setAllRows(mapped);
        setRows(mapped);
      } else { setError(res.data.message); }
    } catch { setError('Məlumatlar yüklənmədi'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (msg) { const timer = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(timer); } }, [msg]);

  // Apply status filter
  useEffect(() => {
    if (statusFilter) {
      setRows(allRows.filter((r) => r.order.invoice?.status === statusFilter));
    } else {
      setRows(allRows);
    }
  }, [statusFilter, allRows]);

  const clearFilter = () => setSearchParams({});

  const loadPayments = async (invoiceId: number) => {
    if (payments[invoiceId]) return;
    setPayLoading(invoiceId);
    try {
      const res = await paymentService.getByInvoiceId(invoiceId);
      if (res.data.success) setPayments((p) => ({ ...p, [invoiceId]: res.data.data }));
    } catch { /* ignore */ } finally { setPayLoading(null); }
  };

  const toggleExpand = async (row: InvoiceRow) => {
    const invId = row.order.invoice!.invoiceId;
    if (expanded === invId) { setExpanded(null); }
    else { setExpanded(invId); await loadPayments(invId); }
  };

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault(); if (!payModal) return;
    setPaySubmitting(true);
    try {
      const res = await paymentService.add({ invoiceId: payModal.invoiceId, amount: parseFloat(payForm.amount), paymentMethod: payForm.paymentMethod });
      if (res.data.success) {
        setPayModal(null); setPayForm({ amount: '', paymentMethod: 1 });
        setPayments((p) => { const u = { ...p }; delete u[payModal.invoiceId]; return u; });
        setMsg('Ödəniş uğurla əlavə edildi'); fetchData();
      } else { setMsg(res.data.message); }
    } catch (err) { setMsg((err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta'); }
    finally { setPaySubmitting(false); }
  };

  if (loading) return <PageTransition><div className="flex items-center justify-center h-64"><div className="animate-spin h-7 w-7 border-2 border-skin-border border-t-skin-text2 rounded-full" /></div></PageTransition>;
  if (error) return <PageTransition><div className="flex flex-col items-center justify-center h-64 gap-4"><AlertCircle size={36} className="text-skin-text3" /><p className="text-skin-text2">{error}</p><Button onClick={fetchData} variant="ghost"><RefreshCw size={14} className="mr-2" />{t('retry')}</Button></div></PageTransition>;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const activeFilterLabel = statusFilter ? STATUS_LABELS[statusFilter] ?? statusFilter : null;

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowLeft size={16} />{t('back')}
            </Button>
            <h1 className="text-xl font-bold text-skin-text">{t('invoicesTitle')}</h1>
            {activeFilterLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-500 font-medium">
                {activeFilterLabel}
                <button onClick={clearFilter} className="hover:text-sky-700 transition-colors">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
          <Button onClick={fetchData} variant="ghost" className="text-xs">
            <RefreshCw size={13} className="mr-1.5" />{t('retry')}
          </Button>
        </div>

        {msg && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"><p className="text-sm text-emerald-500">{msg}</p></motion.div>}

        {rows.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-14 gap-3">
            <FileText size={40} className="text-skin-text3 opacity-30" />
            <p className="text-skin-text2">
              {activeFilterLabel
                ? `"${activeFilterLabel}" statusunda faktura yoxdur`
                : t('noInvoices')}
            </p>
            {activeFilterLabel && (
              <Button variant="ghost" onClick={clearFilter} className="text-xs">
                <X size={13} className="mr-1" />Filtri sil
              </Button>
            )}
          </Card>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {rows.map(({ order }) => {
              const inv = order.invoice!;
              const isExpanded = expanded === inv.invoiceId;
              const statusLabel = STATUS_LABELS[inv.status] ?? inv.status;
              const statusColor = STATUS_COLORS[inv.status] ?? 'bg-skin-hover text-skin-text3';
              const isPaid = inv.status === 'Paid';
              const laborTotal = order.tasks.reduce((s, tk) => s + tk.laborCost, 0);
              const partsTotal = order.partUsages.reduce((s, p) => s + p.quantity * p.unitPrice, 0);

              return (
                <motion.div key={inv.invoiceId} variants={item}>
                  <Card className="p-0 overflow-hidden">
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-skin-text3">{t('invoiceId')}</p>
                          <p className="text-sm font-semibold text-skin-text">#{inv.invoiceId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-skin-text3">{t('jobOrderId')}</p>
                          <p className="text-sm font-semibold text-skin-text">#{order.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-skin-text3">{t('totalAmount')}</p>
                          <p className="text-sm font-semibold text-skin-text">{inv.totalAmount.toFixed(2)} ₼</p>
                        </div>
                        <div>
                          <p className="text-xs text-skin-text3">{t('remaining')}</p>
                          <p className="text-sm font-semibold text-skin-text">{inv.remainingAmount.toFixed(2)} ₼</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${statusColor}`}>{statusLabel}</span>
                        <Button variant="ghost" className="text-xs px-2.5 py-1.5"
                          onClick={() => setReceiptOrder(order)}>
                          <Receipt size={13} className="mr-1" />Çek
                        </Button>
                        {!isPaid && (
                          <Button variant="success" className="text-xs px-3 py-1.5"
                            onClick={() => { setPayModal({ invoiceId: inv.invoiceId, remaining: inv.remainingAmount }); setPayForm({ amount: inv.remainingAmount.toString(), paymentMethod: 1 }); }}>
                            <CreditCard size={12} className="mr-1.5" />{t('addPayment')}
                          </Button>
                        )}
                        <button onClick={() => toggleExpand({ order })} className="p-1.5 rounded-lg hover:bg-skin-hover text-skin-text3 transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {(laborTotal > 0 || partsTotal > 0) && (
                      <div className="px-5 pb-3 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                          <span className="text-[11px] text-skin-text3">İşçilik: <strong className="text-violet-500">{laborTotal.toFixed(2)} ₼</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span className="text-[11px] text-skin-text3">Hissələr: <strong className="text-amber-500">{partsTotal.toFixed(2)} ₼</strong></span>
                        </div>
                      </div>
                    )}

                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-skin-border">
                        <div className="px-5 py-4">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-skin-bg rounded-xl p-3">
                              <p className="text-xs text-skin-text3">{t('totalAmount')}</p>
                              <p className="text-base font-bold text-skin-text">{inv.totalAmount.toFixed(2)} ₼</p>
                              <div className="mt-1 space-y-0.5">
                                <p className="text-[10px] text-violet-500">İşçilik: {laborTotal.toFixed(2)} ₼</p>
                                <p className="text-[10px] text-amber-500">Hissələr: {partsTotal.toFixed(2)} ₼</p>
                              </div>
                            </div>
                            <div className="bg-skin-bg rounded-xl p-3">
                              <p className="text-xs text-skin-text3">{t('paidAmount')}</p>
                              <p className="text-base font-bold text-emerald-500">{inv.paidAmount.toFixed(2)} ₼</p>
                            </div>
                            <div className="bg-skin-bg rounded-xl p-3">
                              <p className="text-xs text-skin-text3">{t('remaining')}</p>
                              <p className="text-base font-bold text-amber-500">{inv.remainingAmount.toFixed(2)} ₼</p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-skin-text3 uppercase tracking-wider mb-2">Ödəniş Tarixçəsi</p>
                          {payLoading === inv.invoiceId ? (
                            <div className="flex items-center gap-2 text-skin-text3 text-sm py-2">
                              <div className="animate-spin h-4 w-4 border border-skin-border border-t-skin-text3 rounded-full" />{t('loading')}
                            </div>
                          ) : (payments[inv.invoiceId] ?? []).length === 0 ? (
                            <p className="text-sm text-skin-text3">{t('noPayments')}</p>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-skin-border">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-skin-bg border-b border-skin-border">
                                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-2.5">ID</th>
                                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-2.5">{t('amount')}</th>
                                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-2.5">{t('paymentMethod')}</th>
                                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-2.5">{t('paidAt')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(payments[inv.invoiceId] ?? []).map((p) => (
                                    <tr key={p.id} className="border-b border-skin-border last:border-b-0">
                                      <td className="px-4 py-3 text-sm text-skin-text2">#{p.id}</td>
                                      <td className="px-4 py-3 text-sm font-semibold text-skin-text">{p.amount.toFixed(2)} ₼</td>
                                      <td className="px-4 py-3 text-sm text-skin-text2">{p.paymentMethod === 1 ? t('cash') : p.paymentMethod === 2 ? t('card') : t('bankTransfer')}</td>
                                      <td className="px-4 py-3 text-sm text-skin-text3">{new Date(p.paidAt).toLocaleDateString('az-AZ')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`${t('addPayment')} — Faktura #${payModal?.invoiceId}`}>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="bg-skin-bg rounded-xl p-3">
              <p className="text-xs text-skin-text3">{t('remaining')}</p>
              <p className="text-lg font-bold text-skin-text">{payModal?.remaining.toFixed(2)} ₼</p>
            </div>
            <Input label={t('amount')} type="number" step="0.01" min="0.01" max={payModal?.remaining}
              value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
            <Select label={t('paymentMethod')} value={payForm.paymentMethod}
              onChange={(e) => setPayForm({ ...payForm, paymentMethod: Number(e.target.value) })}
              options={PAYMENT_METHOD_OPTIONS} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPayModal(null)}>{t('cancel')}</Button>
              <Button type="submit" variant="success" loading={paySubmitting}><CreditCard size={14} className="mr-1.5" />{t('confirm')}</Button>
            </div>
          </form>
        </Modal>

        <Modal open={!!receiptOrder} onClose={() => setReceiptOrder(null)} title="Çek / Qəbz">
          {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
        </Modal>
      </div>
    </PageTransition>
  );
}