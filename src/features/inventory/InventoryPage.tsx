import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, RefreshCw, Plus, ArrowDownUp, ArrowUpRight, ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { partService, type CreatePartRequest } from '../../services/part';
import { inventoryService } from '../../services/inventory';
import type { PartResponse } from '../../types/part';
import type { StockMovementResponse } from '../../types/inventory';
import { MOVEMENT_TYPE_LABELS } from '../../types/inventory';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';
import { useLang } from '../../context/LanguageContext';

interface PartStock {
  part: PartResponse;
  stock: number;
  movements: StockMovementResponse[];
}

type SortField = 'name' | 'price' | 'stock' | 'date';
type SortDir = 'asc' | 'desc';

function calculateStock(movements: StockMovementResponse[]): number {
  return movements.reduce((sum, m) => {
    if (m.movementType === 1) return sum + m.quantity;
    if (m.movementType === 2) return sum - m.quantity;
    return sum + m.quantity;
  }, 0);
}

function getLastDate(movements: StockMovementResponse[]): Date {
  if (!movements.length) return new Date(0);
  return new Date(Math.max(...movements.map((m) => new Date(m.createdAt).getTime())));
}

export function InventoryPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [partStocks, setPartStocks] = useState<PartStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // New part (stok) creation
  const [createPartOpen, setCreatePartOpen] = useState(false);
  const [createPartForm, setCreatePartForm] = useState<CreatePartRequest>({ name: '', partNumber: '', unitPrice: 0 });
  const [createPartLoading, setCreatePartLoading] = useState(false);
  const [createPartError, setCreatePartError] = useState('');

  // Search & filter state
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');

  const [actionModal, setActionModal] = useState<{ type: 'receive' | 'adjust' | 'issue'; partId: number; partName: string } | null>(null);
  const [actionForm, setActionForm] = useState({ quantity: 0, note: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [historyModal, setHistoryModal] = useState<PartStock | null>(null);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const pRes = await partService.getAll();
      if (!pRes.data.success) { setError(pRes.data.message); setLoading(false); return; }
      const parts = pRes.data.data;
      const stockData: PartStock[] = [];
      for (const part of parts) {
        try {
          const mRes = await inventoryService.getMovements(part.id);
          const movements = mRes.data.success ? mRes.data.data : [];
          stockData.push({ part, stock: calculateStock(movements), movements });
        } catch { stockData.push({ part, stock: 0, movements: [] }); }
      }
      setPartStocks(stockData);
    } catch { setError(t('error')); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (msg) { const timer = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(timer); } }, [msg]);

  const handleCreatePart = async (e: FormEvent) => {
    e.preventDefault();
    setCreatePartLoading(true); setCreatePartError('');
    try {
      const res = await partService.create(createPartForm);
      if (res.data.success) {
        setCreatePartOpen(false);
        setCreatePartForm({ name: '', partNumber: '', unitPrice: 0 });
        setMsg('Yeni stok uğurla əlavə edildi');
        fetchData();
      } else {
        setCreatePartError(res.data.message);
      }
    } catch (err) {
      setCreatePartError((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally {
      setCreatePartLoading(false);
    }
  };

  const handleAction = async (e: FormEvent) => {
    e.preventDefault(); if (!actionModal) return;
    setActionLoading(true);
    try {
      let res;
      if (actionModal.type === 'receive') {
        res = await inventoryService.receiveStock({ partId: actionModal.partId, quantity: actionForm.quantity, note: actionForm.note || undefined });
      } else if (actionModal.type === 'adjust') {
        res = await inventoryService.adjustStock({ partId: actionModal.partId, quantity: actionForm.quantity, reason: actionForm.note });
      } else {
        res = await inventoryService.issueStock({ partId: actionModal.partId, quantity: actionForm.quantity, reason: actionForm.note });
      }
      if (res.data.success) { setActionModal(null); setActionForm({ quantity: 0, note: '' }); setMsg(t('success')); fetchData(); }
      else setMsg(res.data.message);
    } catch (err) { setMsg((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setActionLoading(false); }
  };

  const getStockLevelInfo = (stock: number) => {
    if (stock <= 5) return { label: t('lowStock'), color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (stock > 20) return { label: t('goodStock'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    return { label: t('normalStock'), color: 'text-skin-text2', bg: 'bg-skin-hover' };
  };

  const clearFilters = () => {
    setSearch(''); setSortField('name'); setSortDir('asc');
    setMinPrice(''); setMaxPrice(''); setMinStock(''); setMaxStock('');
  };

  const hasActiveFilters = search || minPrice || maxPrice || minStock || maxStock || sortField !== 'name' || sortDir !== 'asc';

  // Apply search + filters
  const filtered = useMemo(() => {
    let list = [...partStocks];
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((ps) =>
        ps.part.name.toLowerCase().includes(q) ||
        ps.part.partNumber.toLowerCase().includes(q)
      );
    }
    // Price filter
    if (minPrice !== '') list = list.filter((ps) => ps.part.unitPrice >= Number(minPrice));
    if (maxPrice !== '') list = list.filter((ps) => ps.part.unitPrice <= Number(maxPrice));
    // Stock filter
    if (minStock !== '') list = list.filter((ps) => ps.stock >= Number(minStock));
    if (maxStock !== '') list = list.filter((ps) => ps.stock <= Number(maxStock));
    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.part.name.localeCompare(b.part.name);
      else if (sortField === 'price') cmp = a.part.unitPrice - b.part.unitPrice;
      else if (sortField === 'stock') cmp = a.stock - b.stock;
      else if (sortField === 'date') cmp = getLastDate(a.movements).getTime() - getLastDate(b.movements).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [partStocks, search, minPrice, maxPrice, minStock, maxStock, sortField, sortDir]);

  const actionTitles = { receive: t('receiveStock'), adjust: t('adjustStock'), issue: t('issueStock') };

  if (loading) return (
    <PageTransition>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-skin-border border-t-skin-text2 rounded-full" />
      </div>
    </PageTransition>
  );

  if (error) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={40} className="text-skin-text3" />
        <p className="text-skin-text3">{error}</p>
        <Button onClick={fetchData} variant="ghost"><RefreshCw size={16} className="mr-2" />{t('retry')}</Button>
      </div>
    </PageTransition>
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: 'name', label: t('fullName') },
    { field: 'price', label: t('unitPriceLabel') },
    { field: 'stock', label: t('quantity') },
    { field: 'date', label: t('date') },
  ];

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowLeft size={16} />{t('back')}
            </Button>
            <h1 className="text-xl font-bold text-skin-text">{t('inventoryTitle')}</h1>
          </div>
          <Button
            onClick={() => { setCreatePartForm({ name: '', partNumber: '', unitPrice: 0 }); setCreatePartError(''); setCreatePartOpen(true); }}
            className="flex items-center gap-2"
          >
            <Plus size={15} />
            Yeni Stok
          </Button>
        </div>

        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-skin-hover border border-skin-border rounded-xl px-4 py-3">
            <p className="text-sm text-skin-text2">{msg}</p>
          </motion.div>
        )}

        {/* Search + Filter bar */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-skin-text3 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t('search')} (ad, part nömrəsi...)`}
              className="w-full bg-skin-card border border-skin-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-skin-text placeholder:text-skin-text3 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <Button
            variant={filterOpen ? 'warning' : 'ghost'}
            className="text-xs px-3 py-2.5 flex items-center gap-1.5 flex-shrink-0"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <SlidersHorizontal size={15} />
            Filtr
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" className="text-xs px-3 py-2.5 flex items-center gap-1 text-skin-text3 flex-shrink-0" onClick={clearFilters}>
              <X size={14} />
            </Button>
          )}
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="space-y-4">
                <p className="text-xs font-semibold text-skin-text3 uppercase tracking-wider">Filtr & Sıralama</p>

                {/* Sort */}
                <div>
                  <p className="text-xs text-skin-text3 mb-2">Sırala</p>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((s) => (
                      <button
                        key={s.field}
                        onClick={() => {
                          if (sortField === s.field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
                          else { setSortField(s.field); setSortDir('asc'); }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          sortField === s.field
                            ? 'bg-violet-500/10 border-violet-500/30 text-violet-500 font-medium'
                            : 'border-skin-border text-skin-text2 hover:bg-skin-hover'
                        }`}
                      >
                        {s.label} {sortField === s.field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-skin-text3 mb-1">Min qiymət (₼)</p>
                    <input
                      type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full bg-skin-bg border border-skin-border rounded-xl px-3 py-2 text-sm text-skin-text outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-skin-text3 mb-1">Max qiymət (₼)</p>
                    <input
                      type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="∞"
                      className="w-full bg-skin-bg border border-skin-border rounded-xl px-3 py-2 text-sm text-skin-text outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Stock range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-skin-text3 mb-1">Min miqdar</p>
                    <input
                      type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)}
                      placeholder="0"
                      className="w-full bg-skin-bg border border-skin-border rounded-xl px-3 py-2 text-sm text-skin-text outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-skin-text3 mb-1">Max miqdar</p>
                    <input
                      type="number" value={maxStock} onChange={(e) => setMaxStock(e.target.value)}
                      placeholder="∞"
                      className="w-full bg-skin-bg border border-skin-border rounded-xl px-3 py-2 text-sm text-skin-text outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" className="text-xs" onClick={clearFilters}>
                    <X size={13} className="mr-1" />Filtrləri sıfırla
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-xs text-skin-text3">
            {filtered.length} / {partStocks.length} nəticə
          </p>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16">
            <Package size={48} className="text-skin-text3 mb-4 opacity-30" />
            <p className="text-skin-text3">{t('noData')}</p>
          </Card>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ps) => {
              const level = getStockLevelInfo(ps.stock);
              return (
                <motion.div key={ps.part.id} variants={item}>
                  <Card hover className="cursor-pointer" onClick={() => setHistoryModal(ps)}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-skin-text font-medium text-sm">{ps.part.name}</p>
                        <p className="text-skin-text3 text-xs">{ps.part.partNumber}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg ${level.bg} ${level.color}`}>{level.label}</span>
                    </div>
                    <p className="text-4xl font-bold text-skin-text mb-1">{ps.stock}</p>
                    <p className="text-xs text-skin-text3 mb-4">{t('unitPriceLabel')}: {ps.part.unitPrice.toFixed(2)} ₼</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="success" className="text-xs px-2.5 py-1.5"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActionModal({ type: 'receive', partId: ps.part.id, partName: ps.part.name }); setActionForm({ quantity: 0, note: '' }); }}>
                        <Plus size={12} className="mr-1" />{t('receiveStock')}
                      </Button>
                      <Button variant="warning" className="text-xs px-2.5 py-1.5"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActionModal({ type: 'adjust', partId: ps.part.id, partName: ps.part.name }); setActionForm({ quantity: 0, note: '' }); }}>
                        <ArrowDownUp size={12} className="mr-1" />{t('adjustStock')}
                      </Button>
                      <Button variant="danger" className="text-xs px-2.5 py-1.5"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setActionModal({ type: 'issue', partId: ps.part.id, partName: ps.part.name }); setActionForm({ quantity: 0, note: '' }); }}>
                        <ArrowUpRight size={12} className="mr-1" />{t('issueStock')}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Action Modal */}
        <Modal open={!!actionModal} onClose={() => setActionModal(null)}
          title={actionModal ? `${actionTitles[actionModal.type]} — ${actionModal.partName}` : ''}>
          <form onSubmit={handleAction} className="space-y-4">
            <Input label={t('quantity')} type="number" value={actionForm.quantity}
              onChange={(e) => setActionForm({ ...actionForm, quantity: Number(e.target.value) })} required />
            <Textarea
              label={actionModal?.type === 'receive' ? `${t('note')} (${t('optional')})` : t('reason')}
              value={actionForm.note}
              onChange={(e) => setActionForm({ ...actionForm, note: e.target.value })}
              required={actionModal?.type !== 'receive'} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setActionModal(null)}>{t('cancel')}</Button>
              <Button type="submit" loading={actionLoading}>{t('confirm')}</Button>
            </div>
          </form>
        </Modal>

        {/* History Modal */}
        <Modal open={!!historyModal} onClose={() => setHistoryModal(null)}
          title={historyModal ? `${historyModal.part.name} — ${t('stockHistory')}` : ''}>
          {historyModal && historyModal.movements.length === 0 ? (
            <p className="text-skin-text3 text-sm">{t('noData')}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-skin-border max-h-80">
              <table className="w-full">
                <thead>
                  <tr className="bg-skin-input border-b border-skin-border">
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('movementType')}</th>
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('quantity')}</th>
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('note')}</th>
                    <th className="text-left text-xs font-medium text-skin-text3 uppercase px-4 py-3">{t('date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {historyModal?.movements.map((m) => (
                    <tr key={m.id} className="border-b border-skin-border last:border-b-0">
                      <td className="px-4 py-3 text-sm text-skin-text2">{MOVEMENT_TYPE_LABELS[m.movementType] || '—'}</td>
                      <td className="px-4 py-3 text-sm text-skin-text font-medium">{m.quantity}</td>
                      <td className="px-4 py-3 text-sm text-skin-text2">{m.note || '—'}</td>
                      <td className="px-4 py-3 text-sm text-skin-text2">{new Date(m.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>

        {/* ── Create New Part/Stock Modal ── */}
        <Modal
          open={createPartOpen}
          onClose={() => setCreatePartOpen(false)}
          title="Yeni Stok Əlavə Et"
        >
          <div className="flex items-start gap-3 bg-violet-500/8 border border-violet-500/15 rounded-xl px-4 py-3 mb-4">
            <Package size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-500 leading-relaxed">
              Yeni hissə/stok yaradılacaq. Stok miqdarını sonradan <strong>Qəbul et</strong> əməliyyatı ilə artıra bilərsiniz.
            </p>
          </div>
          {createPartError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-500">{createPartError}</p>
            </div>
          )}
          <form onSubmit={handleCreatePart} className="space-y-4">
            <Input
              label="Hissənin adı"
              value={createPartForm.name}
              onChange={(e) => setCreatePartForm({ ...createPartForm, name: e.target.value })}
              required
            />
            <Input
              label="Part nömrəsi"
              value={createPartForm.partNumber}
              onChange={(e) => setCreatePartForm({ ...createPartForm, partNumber: e.target.value })}
              required
            />
            <Input
              label="Vahid qiymət (₼)"
              type="number"
              step="0.01"
              min="0"
              value={createPartForm.unitPrice}
              onChange={(e) => setCreatePartForm({ ...createPartForm, unitPrice: Number(e.target.value) })}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreatePartOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" loading={createPartLoading} className="flex items-center gap-2">
                <Plus size={14} />
                Stok Yarat
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}
