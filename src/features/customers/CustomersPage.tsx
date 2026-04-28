import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, AlertCircle, RefreshCw, ArrowLeft, UserCheck, UserPlus, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { customerService } from '../../services/customer';
import type { CustomerResponse, CreateCustomerRequest } from '../../types/customer';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';
import { useLang } from '../../context/LanguageContext';
import { isAdmin, getMyCustomerIds, setMyCustomerIds, getUser } from '../../lib/auth';

export function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFirstLogin = searchParams.get('firstLogin') === '1';

  const { t } = useLang();
  const admin = isAdmin();
  const currentUser = getUser();
  const [myCustomerIds, setMyCustomerIdsState] = useState<number[]>(getMyCustomerIds());

  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Self-registration form for User (shown when no customer record exists)
  const [selfRegOpen, setSelfRegOpen] = useState(false);
  const [selfRegForm, setSelfRegForm] = useState<CreateCustomerRequest>({
    fullName: currentUser?.fullName ?? '',
    phoneNumber: '',
    email: currentUser?.email ?? '',
  });
  const [selfRegLoading, setSelfRegLoading] = useState(false);
  const [selfRegError, setSelfRegError] = useState('');

  // Admin create form
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCustomerRequest>({ fullName: '', phoneNumber: '', email: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit form
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CreateCustomerRequest>({ fullName: '', phoneNumber: '', email: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await customerService.getAll();
      if (res.data.success) {
        const all = res.data.data;
        if (admin) {
          setCustomers(all);
        } else {
          // Use latest IDs from auth storage
          const latestIds = getMyCustomerIds();
          const mine = all.filter((c) => latestIds.includes(c.id));
          setCustomers(mine);
          setMyCustomerIdsState(latestIds);
        }
      } else {
        setError(res.data.message);
      }
    } catch { setError(t('error')); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData().then(() => {
      // If redirected from login with no customer record, open self-reg modal
      if (isFirstLogin && !admin) {
        setSelfRegOpen(true);
      }
    });
  }, []);

  useEffect(() => {
    if (msg) { const timer = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(timer); }
  }, [msg]);

  // User self-registers as customer
  const handleSelfReg = async (e: FormEvent) => {
    e.preventDefault();
    setSelfRegLoading(true); setSelfRegError('');
    try {
      const res = await customerService.create(selfRegForm);
      if (res.data.success && res.data.data) {
        const newId = res.data.data.id;
        const updatedIds = [...getMyCustomerIds(), newId];
        setMyCustomerIds(updatedIds);
        setMyCustomerIdsState(updatedIds);
        setSelfRegOpen(false);
        setMsg(t('success'));
        await fetchData();
        // After self-registration, go to welcome
        if (isFirstLogin) {
          navigate('/welcome');
        }
      } else {
        setSelfRegError(res.data.message);
      }
    } catch (err) {
      setSelfRegError((err as AxiosError<BaseResponse>).response?.data?.message || t('error'));
    } finally {
      setSelfRegLoading(false);
    }
  };

  // Admin create
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setCreateLoading(true); setCreateError('');
    try {
      const res = await customerService.create(createForm);
      if (res.data.success) {
        setCreateOpen(false);
        setCreateForm({ fullName: '', phoneNumber: '', email: '' });
        setMsg(t('success'));
        fetchData();
      } else { setCreateError(res.data.message); }
    } catch (err) { setCreateError((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setCreateLoading(false); }
  };

  const openEdit = (c: CustomerResponse) => {
    setEditId(c.id);
    setEditForm({ fullName: c.fullName, phoneNumber: c.phoneNumber, email: c.email || '' });
    setEditError('');
    setEditOpen(true);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault(); if (!editId) return;
    setEditLoading(true); setEditError('');
    try {
      const res = await customerService.update(editId, editForm);
      if (res.data.success) { setEditOpen(false); setMsg(t('success')); fetchData(); }
      else setEditError(res.data.message);
    } catch (err) { setEditError((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleteLoading(true);
    try {
      const res = await customerService.delete(deleteId);
      if (res.data.success) { setDeleteOpen(false); setMsg(t('success')); fetchData(); }
      else setMsg(res.data.message);
    } catch (err) { setMsg((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setDeleteLoading(false); }
  };

  const canEdit = (c: CustomerResponse) => admin || myCustomerIds.includes(c.id);
  const userHasNoRecord = !admin && !loading && customers.length === 0;

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'fullName', header: t('fullName') },
    { key: 'phoneNumber', header: t('phone') },
    { key: 'email', header: 'Email', render: (r: CustomerResponse) => r.email || '—' },
    {
      key: 'actions', header: t('actions'),
      render: (r: CustomerResponse) => (
        <div className="flex gap-2 justify-end">
          {canEdit(r) && (
            <Button variant="warning"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(r); }}
              className="text-xs px-3 py-1.5">
              <Pencil size={14} />
            </Button>
          )}
          {admin && (
            <Button variant="danger"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(r.id); setDeleteOpen(true); }}
              className="text-xs px-3 py-1.5">
              <Trash2 size={14} />
            </Button>
          )}
        </div>
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

  if (error && customers.length === 0) return (
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowLeft size={16} />{t('back')}
            </Button>
            <h1 className="text-xl font-bold text-skin-text">{t('customersTitle')}</h1>
          </div>

          {admin ? (
            <Button onClick={() => { setCreateForm({ fullName: '', phoneNumber: '', email: '' }); setCreateError(''); setCreateOpen(true); }}>
              <Plus size={16} className="mr-2" />{t('addCustomer')}
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <UserCheck size={15} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Şəxsi Profil</span>
            </div>
          )}
        </div>

        {/* User info banner */}
        {!admin && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3">
            <UserCheck size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-500">{t('userOwnDataOnly')}</p>
          </motion.div>
        )}

        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-skin-hover border border-skin-border rounded-xl px-4 py-3">
            <p className="text-sm text-skin-text2">{msg}</p>
          </motion.div>
        )}

        {/* Empty state for User with no customer record */}
        <AnimatePresence>
          {userHasNoRecord && !selfRegOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex flex-col items-center justify-center py-16 gap-5 bg-skin-card border border-skin-border rounded-2xl"
            >
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center">
                <UserPlus size={28} className="text-violet-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-skin-text mb-1">
                  Müştəri profiliniz yoxdur
                </h3>
                <p className="text-sm text-skin-text3 max-w-xs">
                  GarageX-dən istifadə etmək üçün əvvəlcə öz profilinizi yaradın.
                </p>
              </div>
              <Button onClick={() => { setSelfRegError(''); setSelfRegOpen(true); }}
                className="flex items-center gap-2">
                <Sparkles size={15} />
                Profil Yarat
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table - only show if there are records */}
        {customers.length > 0 && (
          <Table columns={columns} data={customers} keyExtractor={(r) => r.id} />
        )}

        {/* ── Self-registration Modal (User only) ── */}
        <Modal
          open={selfRegOpen}
          onClose={() => { if (!isFirstLogin) setSelfRegOpen(false); }}
          title="Öz Profilinizi Yaradın"
        >
          <div className="mb-4 flex items-start gap-3 bg-violet-500/8 border border-violet-500/15 rounded-xl px-4 py-3">
            <Sparkles size={16} className="text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-violet-500 leading-relaxed">
              Zəhmət olmasa öz ad, telefon və email məlumatlarınızı daxil edin.
              Bu məlumatlar yalnız sizə görünəcək.
            </p>
          </div>
          {selfRegError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-500">{selfRegError}</p>
            </div>
          )}
          <form onSubmit={handleSelfReg} className="space-y-4">
            <Input
              label={t('fullName')}
              value={selfRegForm.fullName}
              onChange={(e) => setSelfRegForm({ ...selfRegForm, fullName: e.target.value })}
              required
            />
            <Input
              label={t('phone')}
              value={selfRegForm.phoneNumber}
              onChange={(e) => setSelfRegForm({ ...selfRegForm, phoneNumber: e.target.value })}
              required
            />
            <Input
              label={`Email (${t('optional')})`}
              type="email"
              value={selfRegForm.email || ''}
              onChange={(e) => setSelfRegForm({ ...selfRegForm, email: e.target.value || undefined })}
            />
            <div className="flex justify-end gap-3 pt-2">
              {!isFirstLogin && (
                <Button type="button" variant="ghost" onClick={() => setSelfRegOpen(false)}>{t('cancel')}</Button>
              )}
              <Button type="submit" loading={selfRegLoading} className="flex items-center gap-2">
                <UserPlus size={15} />
                Profil Yarat
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Admin Create Modal ── */}
        {admin && (
          <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('addCustomer')}>
            {createError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-red-500">{createError}</p></div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label={t('fullName')} value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} required />
              <Input label={t('phone')} value={createForm.phoneNumber} onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })} required />
              <Input label={`Email (${t('optional')})`} type="email" value={createForm.email || ''} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value || undefined })} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
                <Button type="submit" loading={createLoading}>{t('save')}</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* ── Edit Modal ── */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('editCustomer')}>
          {editError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4"><p className="text-sm text-red-500">{editError}</p></div>}
          <form onSubmit={handleEdit} className="space-y-4">
            <Input label={t('fullName')} value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} required />
            <Input label={t('phone')} value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} required />
            <Input label={`Email (${t('optional')})`} type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value || undefined })} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" variant="warning" loading={editLoading}>{t('update')}</Button>
            </div>
          </form>
        </Modal>

        {/* ── Delete Modal (Admin only) ── */}
        {admin && (
          <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title={t('delete')}>
            <p className="text-skin-text2 mb-6">{t('delete')}?</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>{t('cancel')}</Button>
              <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>{t('delete')}</Button>
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}
