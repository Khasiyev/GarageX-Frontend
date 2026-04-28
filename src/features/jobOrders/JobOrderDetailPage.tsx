import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, RefreshCw, ArrowLeft, Wrench, Package,
  ArrowRightLeft, CheckCircle, Clock, XCircle, Info,
  ChevronRight, Plus, Paperclip, Trash2, Download, Upload,
} from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { jobOrderService } from '../../services/jobOrder';
import type { JobOrderAttachment } from '../../services/jobOrder';
import { partService } from '../../services/part';
import type { JobOrderResponse } from '../../types/jobOrder';
import { JOB_ORDER_STATUS_LABELS } from '../../types/jobOrder';
import type { PartResponse } from '../../types/part';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';
import { useLang } from '../../context/LanguageContext';
import { isAdmin } from '../../lib/auth';

// ── Status badge helpers ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<number, { color: string; bg: string; icon: React.ElementType }> = {
  1: { color: 'text-blue-500',    bg: 'bg-blue-500/10',    icon: Clock },
  2: { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: RefreshCw },
  3: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
  4: { color: 'text-red-500',     bg: 'bg-red-500/10',     icon: XCircle },
};

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<number, number[]> = {
  1: [2, 4],   // Created → InProgress | Cancelled
  2: [3, 4],   // InProgress → Completed | Cancelled
  3: [],       // Completed → (nothing)
  4: [],       // Cancelled → (nothing)
};

const STATUS_OPTION_LABELS: Record<number, string> = {
  2: 'Davam edir',
  3: 'Tamamlanıb',
  4: 'Ləğv edilib',
};

function StatusBadge({ status }: { status: number }) {
  const cfg = STATUS_CONFIG[status] ?? { color: 'text-skin-text3', bg: 'bg-skin-hover', icon: Info };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl ${cfg.bg} ${cfg.color}`}>
      <Icon size={13} />
      {JOB_ORDER_STATUS_LABELS[status] ?? '—'}
    </span>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function JobOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLang();
  const admin = isAdmin();

  const [order, setOrder] = useState<JobOrderResponse | null>(null);
  const [parts, setParts] = useState<PartResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin: status change
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Admin: task
  const [taskForm, setTaskForm] = useState({ title: '', description: '', laborCost: 0 });
  const [taskMsg, setTaskMsg] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [showStatusSuggestion, setShowStatusSuggestion] = useState(false);

  // Admin: part usage
  const [partForm, setPartForm] = useState({ partId: 0, quantity: 1, unitPrice: 0 });
  const [partMsg, setPartMsg] = useState('');
  const [partLoading, setPartLoading] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<JobOrderAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentMsg, setAttachmentMsg] = useState('');
  const [attachmentMsgType, setAttachmentMsgType] = useState<'success' | 'error'>('success');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const oRes = await jobOrderService.getById(Number(id));
      if (oRes.data.success) {
        setOrder(oRes.data.data);
      } else {
        setError(oRes.data.message);
      }
      if (admin) {
        const pRes = await partService.getAll();
        if (pRes.data.success) setParts(pRes.data.data);
      }
    } catch { setError(t('error')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); fetchAttachments(); }, [id]);

  // Auto-clear messages
  useEffect(() => {
    if (statusMsg) { const t2 = setTimeout(() => setStatusMsg(''), 4000); return () => clearTimeout(t2); }
  }, [statusMsg]);
  useEffect(() => {
    if (taskMsg) { const t2 = setTimeout(() => setTaskMsg(''), 4000); return () => clearTimeout(t2); }
  }, [taskMsg]);
  useEffect(() => {
    if (partMsg) { const t2 = setTimeout(() => setPartMsg(''), 4000); return () => clearTimeout(t2); }
  }, [partMsg]);

  // ── Admin handlers ──────────────────────────────────────────────────────────
  const handleStatusChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !newStatus) return;
    setStatusLoading(true); setStatusMsg('');
    try {
      const res = await jobOrderService.changeStatus(Number(id), {
        newStatus: Number(newStatus),
        note: statusNote || undefined,
      });
      if (res.data.success) {
        setStatusMsg(t('success'));
        setStatusNote('');
        setNewStatus('');
        fetchData();
      } else {
        setStatusMsg(res.data.message);
      }
    } catch (err) {
      setStatusMsg((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally { setStatusLoading(false); }
  };

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setTaskLoading(true); setTaskMsg('');
    try {
      const res = await jobOrderService.addTask(Number(id), {
        title: taskForm.title,
        description: taskForm.description || undefined,
        laborCost: taskForm.laborCost,
      });
      if (res.data.success) {
        setTaskMsg(t('success'));
        setTaskForm({ title: '', description: '', laborCost: 0 });
        fetchData().then(() => {
          // Suggest moving to InProgress if still Created
          if (order && order.status === 1) setShowStatusSuggestion(true);
        });
      } else {
        setTaskMsg(res.data.message);
      }
    } catch (err) {
      setTaskMsg((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally { setTaskLoading(false); }
  };

  const handleAddPartUsage = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setPartLoading(true); setPartMsg('');
    try {
      const res = await jobOrderService.addPartUsage(Number(id), {
        partId: partForm.partId,
        quantity: partForm.quantity,
        unitPrice: partForm.unitPrice,
      });
      if (res.data.success) {
        setPartMsg(t('success'));
        setPartForm({ partId: 0, quantity: 1, unitPrice: 0 });
        fetchData();
      } else {
        setPartMsg(res.data.message);
      }
    } catch (err) {
      setPartMsg((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally { setPartLoading(false); }
  };

  const handlePartSelect = (partId: number) => {
    const p = parts.find((x) => x.id === partId);
    setPartForm({ ...partForm, partId, unitPrice: p?.unitPrice ?? 0 });
  };

  // Quick status change from suggestion
  const handleQuickStatus = async (newSt: number) => {
    if (!id) return;
    setShowStatusSuggestion(false);
    try {
      await jobOrderService.changeStatus(Number(id), { newStatus: newSt });
      fetchData();
    } catch { /* ignore */ }
  };

  // ── Attachment handlers ────────────────────────────────────────────────────
  const fetchAttachments = async () => {
    if (!id) return;
    setAttachmentsLoading(true);
    try {
      const res = await jobOrderService.getAttachments(Number(id));
      if (res.data.success) setAttachments(res.data.data ?? []);
    } catch { /* ignore */ } finally { setAttachmentsLoading(false); }
  };

  const showAttachMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setAttachmentMsg(msg);
    setAttachmentMsgType(type);
    setTimeout(() => setAttachmentMsg(''), 4000);
  };

  const handleUpload = async () => {
    if (!id || !selectedFiles || selectedFiles.length === 0) return;
    setUploadLoading(true);
    try {
      if (selectedFiles.length === 1) {
        const res = await jobOrderService.uploadAttachment(Number(id), selectedFiles[0]);
        if (res.data.success) { showAttachMsg('Fayl uğurla yükləndi'); }
        else { showAttachMsg(res.data.message || 'Xəta baş verdi', 'error'); }
      } else {
        const res = await jobOrderService.uploadMultipleAttachments(Number(id), Array.from(selectedFiles));
        if (res.data.success) { showAttachMsg(`${selectedFiles.length} fayl uğurla yükləndi`); }
        else { showAttachMsg(res.data.message || 'Xəta baş verdi', 'error'); }
      }
      setSelectedFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchAttachments();
    } catch (err) {
      const axErr = err as AxiosError<BaseResponse>;
      const status = axErr.response?.status;
      if (status === 400) showAttachMsg(axErr.response?.data?.message || 'Validation xətası', 'error');
      else if (status === 401) { window.location.href = '/login'; }
      else if (status === 403) showAttachMsg('Giriş qadağandır', 'error');
      else showAttachMsg('Server xətası baş verdi', 'error');
    } finally { setUploadLoading(false); }
  };

  const handleDownload = async (attachmentId: number) => {
    setDownloadingId(attachmentId);
    try {
      const res = await jobOrderService.getAttachmentDownloadUrl(attachmentId);
      if (res.data.success && res.data.data) {
        window.open(res.data.data, '_blank');
      }
    } catch (err) {
      const axErr = err as AxiosError<BaseResponse>;
      const status = axErr.response?.status;
      if (status === 401) { window.location.href = '/login'; }
      else if (status === 403) showAttachMsg('Giriş qadağandır', 'error');
      else showAttachMsg('Yükləmə xətası baş verdi', 'error');
    } finally { setDownloadingId(null); }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!window.confirm('Faylı silmək istəyirsiniz?')) return;
    setDeletingId(attachmentId);
    try {
      const res = await jobOrderService.deleteAttachment(attachmentId);
      if (res.data.success) { showAttachMsg('Fayl silindi'); fetchAttachments(); }
      else { showAttachMsg(res.data.message || 'Xəta baş verdi', 'error'); }
    } catch (err) {
      const axErr = err as AxiosError<BaseResponse>;
      const status = axErr.response?.status;
      if (status === 401) { window.location.href = '/login'; }
      else if (status === 403) showAttachMsg('Giriş qadağandır', 'error');
      else showAttachMsg('Server xətası baş verdi', 'error');
    } finally { setDeletingId(null); }
  };
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <PageTransition>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-skin-border border-t-skin-text2 rounded-full" />
      </div>
    </PageTransition>
  );

  if (error || !order) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={40} className="text-skin-text3" />
        <p className="text-skin-text3">{error || t('noData')}</p>
        <Button onClick={fetchData} variant="ghost">
          <RefreshCw size={16} className="mr-2" />{t('retry')}
        </Button>
      </div>
    </PageTransition>
  );

  const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status] ?? [];
  const statusOptions = allowedNextStatuses.map((s) => ({
    value: s,
    label: STATUS_OPTION_LABELS[s] ?? JOB_ORDER_STATUS_LABELS[s],
  }));
  const partOptions = parts.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.partNumber})`,
  }));

  const laborTotal = order.tasks.reduce((s, tk) => s + tk.laborCost, 0);
  const partsTotal = order.partUsages.reduce((s, p) => s + p.quantity * p.unitPrice, 0);

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
            <ArrowLeft size={16} />{t('back')}
          </Button>
          <h1 className="text-xl font-bold text-skin-text">
            {t('jobOrderDetail')} <span className="text-skin-text3">#{order.id}</span>
          </h1>
          <StatusBadge status={order.status} />
        </div>

        {/* ── Status Suggestion Banner (Admin, after adding task) ── */}
        <AnimatePresence>
          {showStatusSuggestion && admin && order.status === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3"
            >
              <Info size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-500 flex-1">
                Tapşırıq əlavə edildi. Statusu <strong>Davam edir</strong> etmək istəyirsiniz?
              </p>
              <div className="flex gap-2">
                <Button variant="warning" className="text-xs px-3 py-1.5"
                  onClick={() => handleQuickStatus(2)}>
                  <ChevronRight size={13} className="mr-1" />Bəli
                </Button>
                <Button variant="ghost" className="text-xs px-3 py-1.5"
                  onClick={() => setShowStatusSuggestion(false)}>
                  Xeyr
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── General Info ── */}
        <Card>
          <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider mb-4">{t('generalInfo')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-skin-text3 mb-1">{t('status')}</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-xs text-skin-text3 mb-1">{t('openedAt')}</p>
              <p className="text-sm text-skin-text2">{new Date(order.openedAt).toLocaleDateString('az-AZ')}</p>
            </div>
            {order.closedAt && (
              <div>
                <p className="text-xs text-skin-text3 mb-1">Bağlanma tarixi</p>
                <p className="text-sm text-skin-text2">{new Date(order.closedAt).toLocaleDateString('az-AZ')}</p>
              </div>
            )}
            <div className="sm:col-span-2 md:col-span-3">
              <p className="text-xs text-skin-text3 mb-1">{t('complaint')}</p>
              <p className="text-sm text-skin-text2 bg-skin-bg rounded-xl px-4 py-3 border border-skin-border">
                {order.complaint}
              </p>
            </div>
            {order.notes && (
              <div className="sm:col-span-2 md:col-span-3">
                <p className="text-xs text-skin-text3 mb-1">{t('notes')}</p>
                <p className="text-sm text-skin-text2 bg-skin-bg rounded-xl px-4 py-3 border border-skin-border">
                  {order.notes}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ═══════════════════════════════════════════════════════
            ADMIN ONLY SECTIONS
        ═══════════════════════════════════════════════════════ */}
        {admin && (
          <>
            {/* ── Change Status ── */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft size={15} className="text-skin-text3" />
                <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">{t('changeStatus')}</h2>
              </div>

              {allowedNextStatuses.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-skin-text3">
                  <Info size={15} />
                  {order.status === 3 ? 'Sifariş tamamlanmışdır, status dəyişdirilə bilməz.' :
                   order.status === 4 ? 'Sifariş ləğv edilmişdir.' : ''}
                </div>
              ) : (
                <>
                  {statusMsg && (
                    <div className="bg-skin-hover border border-skin-border rounded-xl px-4 py-2 mb-4">
                      <p className="text-sm text-skin-text2">{statusMsg}</p>
                    </div>
                  )}
                  <form onSubmit={handleStatusChange} className="flex flex-wrap gap-4 items-end">
                    <Select
                      label={t('newStatus')}
                      options={statusOptions}
                      placeholder={t('selectStatus')}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    />
                    <Input
                      label={`${t('note')} (${t('optional')})`}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                    <Button type="submit" loading={statusLoading} disabled={!newStatus}>
                      {t('changeStatusBtn')}
                    </Button>
                  </form>
                </>
              )}
            </Card>

            {/* ── Add Task ── */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Wrench size={15} className="text-skin-text3" />
                <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">{t('addTask')}</h2>
              </div>
              {taskMsg && (
                <div className="bg-skin-hover border border-skin-border rounded-xl px-4 py-2 mb-4">
                  <p className="text-sm text-skin-text2">{taskMsg}</p>
                </div>
              )}
              <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t('title')}
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
                <Textarea
                  label={`${t('description')} (${t('optional')})`}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
                <div className="flex flex-col gap-3">
                  <Input
                    label={t('laborCost')}
                    type="number"
                    step="0.01"
                    min="0"
                    value={taskForm.laborCost}
                    onChange={(e) => setTaskForm({ ...taskForm, laborCost: Number(e.target.value) })}
                    required
                  />
                  <Button type="submit" variant="success" loading={taskLoading}>
                    <Plus size={14} className="mr-1" />{t('addTaskBtn')}
                  </Button>
                </div>
              </form>
            </Card>

            {/* ── Add Part Usage ── */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Package size={15} className="text-skin-text3" />
                <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">{t('addPartUsage')}</h2>
              </div>
              {partMsg && (
                <div className="bg-skin-hover border border-skin-border rounded-xl px-4 py-2 mb-4">
                  <p className="text-sm text-skin-text2">{partMsg}</p>
                </div>
              )}
              <form onSubmit={handleAddPartUsage} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <Select
                  label={t('part')}
                  options={partOptions}
                  placeholder={t('selectPart')}
                  value={partForm.partId || ''}
                  onChange={(e) => handlePartSelect(Number(e.target.value))}
                />
                <Input
                  label={t('quantity')}
                  type="number"
                  min={1}
                  value={partForm.quantity}
                  onChange={(e) => setPartForm({ ...partForm, quantity: Number(e.target.value) })}
                  required
                />
                <Input
                  label={t('unitPrice')}
                  type="number"
                  step="0.01"
                  min="0"
                  value={partForm.unitPrice}
                  onChange={(e) => setPartForm({ ...partForm, unitPrice: Number(e.target.value) })}
                  required
                />
                <Button type="submit" variant="success" loading={partLoading}>
                  <Plus size={14} className="mr-1" />{t('addPartBtn')}
                </Button>
              </form>
            </Card>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            USER READ-ONLY NOTICE
        ═══════════════════════════════════════════════════════ */}
        {!admin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3"
          >
            <Info size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-500">
              Tapşırıqlar və hissələr servis tərəfindən əlavə edilir. Siz yalnız öz sifarişinizin vəziyyətini izləyə bilərsiniz.
            </p>
          </motion.div>
        )}

        {/* ── Tasks (Both roles — Admin editable, User read-only) ── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={15} className="text-skin-text3" />
            <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">{t('tasks')}</h2>
            {order.tasks.length > 0 && (
              <span className="ml-auto text-xs font-semibold text-violet-500">
                İşçilik: {laborTotal.toFixed(2)} ₼
              </span>
            )}
          </div>
          {order.tasks.length === 0 ? (
            <p className="text-skin-text3 text-sm">{t('noData')}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-skin-border">
              <table className="w-full">
                <thead>
                  <tr className="bg-skin-input border-b border-skin-border">
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('title')}</th>
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('description')}</th>
                    <th className="text-right text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('laborCost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.tasks.map((tk) => (
                    <tr key={tk.id} className="border-b border-skin-border last:border-b-0">
                      <td className="px-4 py-3 text-sm text-skin-text2">{tk.title}</td>
                      <td className="px-4 py-3 text-sm text-skin-text2">{tk.description || '—'}</td>
                      <td className="px-4 py-3 text-sm text-skin-text font-semibold text-right">{tk.laborCost.toFixed(2)} ₼</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Part Usages ── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package size={15} className="text-skin-text3" />
            <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">{t('partUsages')}</h2>
            {order.partUsages.length > 0 && (
              <span className="ml-auto text-xs font-semibold text-amber-500">
                Hissələr: {partsTotal.toFixed(2)} ₼
              </span>
            )}
          </div>
          {order.partUsages.length === 0 ? (
            <p className="text-skin-text3 text-sm">{t('noData')}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-skin-border">
              <table className="w-full">
                <thead>
                  <tr className="bg-skin-input border-b border-skin-border">
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('part')}</th>
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('partNumber')}</th>
                    <th className="text-center text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('quantity')}</th>
                    <th className="text-right text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('unitPrice')}</th>
                    <th className="text-right text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.partUsages.map((p) => (
                    <tr key={p.id} className="border-b border-skin-border last:border-b-0">
                      <td className="px-4 py-3 text-sm text-skin-text2">{p.partName}</td>
                      <td className="px-4 py-3 text-sm text-skin-text3">{p.partNumber}</td>
                      <td className="px-4 py-3 text-sm text-skin-text2 text-center">{p.quantity}</td>
                      <td className="px-4 py-3 text-sm text-skin-text2 text-right">{p.unitPrice.toFixed(2)} ₼</td>
                      <td className="px-4 py-3 text-sm text-skin-text font-semibold text-right">{(p.quantity * p.unitPrice).toFixed(2)} ₼</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Invoice Summary ── */}
        {order.invoice ? (
          <Card>
            <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider mb-4">{t('invoiceSummary')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div className="bg-skin-bg rounded-xl p-3">
                <p className="text-xs text-skin-text3">{t('totalAmount')}</p>
                <p className="text-base font-bold text-skin-text mt-0.5">{order.invoice.totalAmount.toFixed(2)} ₼</p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[10px] text-violet-500">İşçilik: {laborTotal.toFixed(2)} ₼</p>
                  <p className="text-[10px] text-amber-500">Hissələr: {partsTotal.toFixed(2)} ₼</p>
                </div>
              </div>
              <div className="bg-skin-bg rounded-xl p-3">
                <p className="text-xs text-skin-text3">{t('paidAmount')}</p>
                <p className="text-base font-bold text-emerald-500 mt-0.5">{order.invoice.paidAmount.toFixed(2)} ₼</p>
              </div>
              <div className="bg-skin-bg rounded-xl p-3">
                <p className="text-xs text-skin-text3">{t('remaining')}</p>
                <p className="text-base font-bold text-amber-500 mt-0.5">{order.invoice.remainingAmount.toFixed(2)} ₼</p>
              </div>
              <div className="bg-skin-bg rounded-xl p-3">
                <p className="text-xs text-skin-text3">{t('status')}</p>
                <p className="text-sm text-skin-text2 mt-0.5">{order.invoice.status}</p>
              </div>
              <div className="bg-skin-bg rounded-xl p-3">
                <p className="text-xs text-skin-text3">{t('issuedAt')}</p>
                <p className="text-sm text-skin-text2 mt-0.5">{new Date(order.invoice.issuedAt).toLocaleDateString('az-AZ')}</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider mb-3">{t('invoiceSummary')}</h2>
            <p className="text-sm text-skin-text3">{t('noData')}</p>
          </Card>
        )}
        {/* ── Attachments ── */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Paperclip size={15} className="text-skin-text3" />
            <h2 className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">Əlavələr</h2>
            {attachments.length > 0 && (
              <span className="ml-auto text-xs font-semibold text-blue-500">{attachments.length} fayl</span>
            )}
          </div>

          {/* Admin: upload area */}
          {admin && (
            <div className="mb-5 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-skin-text3 mb-1.5">Fayl seçin</label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="block w-full text-sm text-skin-text2 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-skin-border file:text-xs file:font-medium file:bg-skin-hover file:text-skin-text2 hover:file:bg-skin-input cursor-pointer bg-skin-input border border-skin-border rounded-xl px-3 py-2"
                  />
                </div>
                {selectedFiles && selectedFiles.length > 0 && (
                  <p className="text-xs text-skin-text3 mt-1.5">
                    {selectedFiles.length === 1
                      ? `Seçildi: ${selectedFiles[0].name}`
                      : `${selectedFiles.length} fayl seçildi`}
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpload}
                variant="success"
                loading={uploadLoading}
                disabled={!selectedFiles || selectedFiles.length === 0}
              >
                <Upload size={14} className="mr-1.5" />Yüklə
              </Button>
            </div>
          )}

          {/* Attachment message */}
          <AnimatePresence>
            {attachmentMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4 text-sm font-medium ${
                  attachmentMsgType === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/10 border border-red-500/20 text-red-500'
                }`}
              >
                {attachmentMsgType === 'success'
                  ? <CheckCircle size={14} />
                  : <AlertCircle size={14} />}
                {attachmentMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachments list */}
          {attachmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-skin-border border-t-skin-text2 rounded-full" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-skin-text3">
              <Paperclip size={28} className="opacity-40" />
              <p className="text-sm">Bu iş sifarişi üçün fayl yoxdur</p>
            </div>
          ) : (
            <div className="divide-y divide-skin-border rounded-xl border border-skin-border overflow-hidden">
              {attachments.map((att) => (
                <motion.div
                  key={att.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 px-4 py-3 bg-skin-card hover:bg-skin-hover transition-colors"
                >
                  <Paperclip size={15} className="text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-skin-text2 font-medium truncate">{att.fileName}</p>
                    <p className="text-[11px] text-skin-text3 mt-0.5">
                      {att.contentType}
                      {att.createdAt && (
                        <span className="ml-2">
                          · {new Date(att.createdAt).toLocaleDateString('az-AZ')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      className="text-xs px-2.5 py-1.5"
                      onClick={() => handleDownload(att.id)}
                      disabled={downloadingId === att.id}
                      loading={downloadingId === att.id}
                    >
                      <Download size={13} className="mr-1" />Yüklə
                    </Button>
                    {admin && (
                      <Button
                        variant="danger"
                        className="text-xs px-2.5 py-1.5"
                        onClick={() => handleDeleteAttachment(att.id)}
                        disabled={deletingId === att.id}
                        loading={deletingId === att.id}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </PageTransition>
  );
}
