import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle, Clock, ArrowLeft, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const PAYMENT_METHOD_OPTIONS = [
  { value: 1, label: 'Nağd' },
  { value: 2, label: 'Kart' },
  { value: 3, label: 'Bank köçürməsi' },
];

const STATUS_COLORS: Record<string, string> = {
  Issued: 'bg-blue-500/10 text-blue-500',
  Paid: 'bg-emerald-500/10 text-emerald-500',
  PartiallyPaid: 'bg-amber-500/10 text-amber-500',
  Draft: 'bg-skin-hover text-skin-text3',
  Cancelled: 'bg-red-500/10 text-red-500',
};

export function PaymentsPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [orders, setOrders] = useState<JobOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [payments, setPayments] = useState<Record<number, PaymentResponse[]>>({});

  const [payModal, setPayModal] = useState<{ order: JobOrderResponse } | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 1 });
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<JobOrderResponse | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<JobOrderResponse | null>(null);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await jobOrderService.getAll({});
      if (res.data.success) {
        const withInvoice = res.data.data
          .filter((o) => !!o.invoice)
          .sort((a, b) => new Date(b.invoice!.issuedAt).getTime() - new Date(a.invoice!.issuedAt).getTime());
        setOrders(withInvoice);
        // load all payments
        for (const o of withInvoice) {
          loadPayments(o.invoice!.invoiceId);
        }
      } else {
        setError(res.data.message);
      }
    } catch {
      setError('Məlumatlar yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async (invoiceId: number) => {
    try {
      const res = await paymentService.getByInvoiceId(invoiceId);
      if (res.data.success) setPayments((p) => ({ ...p, [invoiceId]: res.data.data }));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (msg) { const t = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(t); } }, [msg]);

  const handleAddPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!payModal) return;
    const inv = payModal.order.invoice!;
    setPaySubmitting(true);
    try {
      const res = await paymentService.add({
        invoiceId: inv.invoiceId,
        amount: parseFloat(payForm.amount),
        paymentMethod: payForm.paymentMethod,
      });
      if (res.data.success) {
        setPayModal(null);
        setPayForm({ amount: '', paymentMethod: 1 });
        setMsg('Ödəniş uğurla əlavə edildi');
        delete payments[inv.invoiceId];
        fetchData();
      } else {
        setMsg(res.data.message);
      }
    } catch (err) {
      setMsg((err as AxiosError<BaseResponse>).response?.data?.message || 'Xəta');
    } finally {
      setPaySubmitting(false);
    }
  };

  // Summary stats
  const totalPaid = orders.reduce((s, o) => s + (o.invoice?.paidAmount ?? 0), 0);
  const totalPending = orders.reduce((s, o) => s + (o.invoice?.remainingAmount ?? 0), 0);
  const paidCount = orders.filter((o) => o.invoice?.status === 'Paid').length;
  const pendingCount = orders.filter((o) => o.invoice?.status !== 'Paid').length;

  if (loading) return (
    <PageTransition>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-7 w-7 border-2 border-skin-border border-t-skin-text2 rounded-full" />
      </div>
    </PageTransition>
  );

  if (error) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={36} className="text-skin-text3" />
        <p className="text-skin-text2">{error}</p>
        <Button onClick={fetchData} variant="ghost"><RefreshCw size={14} className="mr-2" />{t('retry')}</Button>
      </div>
    </PageTransition>
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowLeft size={16} />{t('back')}
            </Button>
            <h1 className="text-xl font-bold text-skin-text">{t('paymentsTitle')}</h1>
          </div>
          <Button onClick={fetchData} variant="ghost" className="text-xs">
            <RefreshCw size={13} className="mr-1.5" />{t('retry')}
          </Button>
        </div>

        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-emerald-500">{msg}</p>
          </motion.div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('paidRevenue'), value: `${totalPaid.toFixed(2)} ₼`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: t('pendingRevenue'), value: `${totalPending.toFixed(2)} ₼`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: t('paid'), value: paidCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: t('issued'), value: pendingCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="flex items-center gap-3 py-4">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-skin-text3">{s.label}</p>
                  <p className="text-base font-bold text-skin-text">{s.value}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Invoice list */}
        {orders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-14">
            <CreditCard size={40} className="text-skin-text3 mb-3 opacity-30" />
            <p className="text-skin-text2">{t('noPayments')}</p>
          </Card>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-skin-border bg-skin-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-skin-border bg-skin-bg">
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('invoiceId')}</th>
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('jobOrderId')}</th>
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('totalAmount')}</th>
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('paidAmount')}</th>
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('remaining')}</th>
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('status')}</th>
                  <th className="text-left text-xs font-semibold text-skin-text3 uppercase px-5 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const inv = order.invoice!;
                  const isPaid = inv.status === 'Paid';
                  const statusColor = STATUS_COLORS[inv.status] ?? 'bg-skin-hover text-skin-text3';
                  return (
                    <motion.tr key={inv.invoiceId} variants={item} className="border-b border-skin-border last:border-b-0 hover:bg-skin-hover/30 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-skin-text">#{inv.invoiceId}</td>
                      <td className="px-5 py-3.5 text-sm text-skin-text2">#{order.id}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-skin-text">{inv.totalAmount.toFixed(2)} ₼</td>
                      <td className="px-5 py-3.5 text-sm text-emerald-500 font-medium">{inv.paidAmount.toFixed(2)} ₼</td>
                      <td className="px-5 py-3.5 text-sm text-amber-500 font-medium">{inv.remainingAmount.toFixed(2)} ₼</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${statusColor}`}>
                          {inv.status === 'Paid' ? t('paid') : inv.status === 'PartiallyPaid' ? t('partiallyPaid') : t('issued')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" className="text-xs px-2.5 py-1.5" onClick={() => setSelectedOrder(order)}>{t('view')}</Button>
                          <Button variant="ghost" className="text-xs px-2.5 py-1.5" onClick={() => setReceiptOrder(order)}>
                            <Receipt size={12} className="mr-1" />Çek
                          </Button>
                          {!isPaid && (
                            <Button
                              variant="success"
                              className="text-xs px-2.5 py-1.5"
                              onClick={() => {
                                setPayModal({ order });
                                setPayForm({ amount: inv.remainingAmount.toString(), paymentMethod: 1 });
                              }}
                            >
                              <CreditCard size={12} className="mr-1" />{t('addPayment')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Payment detail modal */}
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`${t('invoiceDetails')} #${selectedOrder?.invoice?.invoiceId}`}
        >
          {selectedOrder && (() => {
            const inv = selectedOrder.invoice!;
            const invPayments = payments[inv.invoiceId] ?? [];
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: t('totalAmount'), v: `${inv.totalAmount.toFixed(2)} ₼` },
                    { l: t('paidAmount'), v: `${inv.paidAmount.toFixed(2)} ₼` },
                    { l: t('remaining'), v: `${inv.remainingAmount.toFixed(2)} ₼` },
                    { l: t('issuedAt'), v: new Date(inv.issuedAt).toLocaleDateString('az-AZ') },
                  ].map((r) => (
                    <div key={r.l} className="bg-skin-bg rounded-xl p-3">
                      <p className="text-xs text-skin-text3">{r.l}</p>
                      <p className="text-sm font-bold text-skin-text">{r.v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-skin-text3 uppercase tracking-wider mb-2">Ödəniş Tarixçəsi</p>
                  {invPayments.length === 0 ? (
                    <p className="text-sm text-skin-text3">{t('noPayments')}</p>
                  ) : (
                    <div className="space-y-2">
                      {invPayments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between bg-skin-bg rounded-xl px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-skin-text">{p.amount.toFixed(2)} ₼</p>
                            <p className="text-xs text-skin-text3">
                              {p.paymentMethod === 1 ? t('cash') : p.paymentMethod === 2 ? t('card') : t('bankTransfer')}
                            </p>
                          </div>
                          <p className="text-xs text-skin-text3">{new Date(p.paidAt).toLocaleDateString('az-AZ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Add Payment Modal */}
        <Modal
          open={!!payModal}
          onClose={() => setPayModal(null)}
          title={`${t('addPayment')} — Faktura #${payModal?.order.invoice?.invoiceId}`}
        >
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="bg-skin-bg rounded-xl p-3">
              <p className="text-xs text-skin-text3">{t('remaining')}</p>
              <p className="text-lg font-bold text-skin-text">{payModal?.order.invoice?.remainingAmount.toFixed(2)} ₼</p>
            </div>
            <Input
              label={t('amount')}
              type="number"
              step="0.01"
              min="0.01"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              required
            />
            <Select
              label={t('paymentMethod')}
              value={payForm.paymentMethod}
              onChange={(e) => setPayForm({ ...payForm, paymentMethod: Number(e.target.value) })}
              options={PAYMENT_METHOD_OPTIONS}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setPayModal(null)}>{t('cancel')}</Button>
              <Button type="submit" variant="success" loading={paySubmitting}>
                <CreditCard size={14} className="mr-1.5" />{t('confirm')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Receipt Modal */}
        <Modal open={!!receiptOrder} onClose={() => setReceiptOrder(null)} title="Çek / Qəbz">
          {receiptOrder && receiptOrder.invoice && (() => {
            const inv = receiptOrder.invoice!;
            const laborTotal = receiptOrder.tasks.reduce((s, tk) => s + tk.laborCost, 0);
            const partsTotal = receiptOrder.partUsages.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
            const now = new Date();
            return (
              <div className="space-y-0">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-skin-border overflow-hidden">
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
                    {receiptOrder.tasks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-skin-text3 uppercase tracking-wider mb-2">Görülən İşlər</p>
                        <div className="space-y-1.5">
                          {receiptOrder.tasks.map((tk) => (
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
                    {receiptOrder.partUsages.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-skin-text3 uppercase tracking-wider mb-2">İstifadə Edilən Hissələr</p>
                        <div className="space-y-1.5">
                          {receiptOrder.partUsages.map((p) => (
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
                    <p className="text-center text-[10px] text-skin-text3">GarageX — Səməd Vurğun 123, Bakı • (055) 588-18-98</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setReceiptOrder(null)}>Bağla</Button>
                  <Button onClick={() => window.print()} className="flex items-center gap-1.5">
                    Çap et
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    </PageTransition>
  );
}
