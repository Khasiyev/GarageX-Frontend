import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, AlertCircle, RefreshCw, ArrowLeft, Car as CarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../../components/ui/PageTransition';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { vehicleService } from '../../services/vehicle';
import { customerService } from '../../services/customer';
import type { VehicleResponse, CreateVehicleRequest, UpdateVehicleRequest } from '../../types/vehicle';
import type { CustomerResponse } from '../../types/customer';
import { AxiosError } from 'axios';
import type { BaseResponse } from '../../types/common';
import { useLang } from '../../context/LanguageContext';
import { isAdmin, getMyCustomerIds } from '../../lib/auth';

export function VehiclesPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const admin = isAdmin();
  const myCustomerIds = getMyCustomerIds();

  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVehicleRequest>({
    customerId: 0, make: '', model: '',
    year: new Date().getFullYear(), plateNumber: '', vin: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateVehicleRequest>({
    make: '', model: '', year: new Date().getFullYear(), plateNumber: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const cRes = await customerService.getAll();
      const allCustomers: CustomerResponse[] = cRes.data.success ? cRes.data.data : [];

      if (admin) {
        setCustomers(allCustomers);
        const vRes = await vehicleService.getAll();
        if (vRes.data.success) setVehicles(vRes.data.data);
        else setError(vRes.data.message);
      } else {
        // Filter to only user's own customers using stored IDs from login
        const myCustomers = allCustomers.filter((c) => myCustomerIds.includes(c.id));
        setCustomers(myCustomers);

        if (myCustomers.length === 0) {
          setVehicles([]);
        } else {
          // Fetch vehicles for each of the user's customer records
          const allVehicles: VehicleResponse[] = [];
          for (const cust of myCustomers) {
            try {
              const vRes = await vehicleService.getByCustomerId(cust.id);
              if (vRes.data.success) allVehicles.push(...vRes.data.data);
            } catch { /* ignore individual errors */ }
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

  // For User: auto-set customerId to their own customer when opening create modal
  const openCreateModal = () => {
    const defaultCustomerId = !admin && customers.length > 0 ? customers[0].id : 0;
    setCreateForm({
      customerId: defaultCustomerId,
      make: '', model: '',
      year: new Date().getFullYear(),
      plateNumber: '', vin: '',
    });
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setCreateLoading(true); setCreateError('');
    try {
      const res = await vehicleService.create(createForm);
      if (res.data.success) { setCreateOpen(false); setMsg(t('success')); fetchData(); }
      else setCreateError(res.data.message);
    } catch (err) { setCreateError((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setCreateLoading(false); }
  };

  const openEdit = (v: VehicleResponse) => {
    setEditId(v.id);
    setEditForm({ make: v.make, model: v.model, year: v.year, plateNumber: v.plateNumber });
    setEditError('');
    setEditOpen(true);
  };

  // Check ownership: User can only edit their own vehicles
  const canEditVehicle = (v: VehicleResponse): boolean => {
    if (admin) return true;
    return customers.some((c) => c.id === v.customerId);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault(); if (!editId) return;
    setEditLoading(true); setEditError('');
    try {
      const res = await vehicleService.update(editId, editForm);
      if (res.data.success) { setEditOpen(false); setMsg(t('success')); fetchData(); }
      else setEditError(res.data.message);
    } catch (err) { setEditError((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setDeleteLoading(true);
    try {
      const res = await vehicleService.delete(deleteId);
      if (res.data.success) { setDeleteOpen(false); setMsg(t('success')); fetchData(); }
      else setMsg(res.data.message);
    } catch (err) { setMsg((err as AxiosError<BaseResponse>).response?.data?.message || t('error')); }
    finally { setDeleteLoading(false); }
  };

  // Customer options for create form
  // Admin sees all customers; User only sees their own
  const customerOptions = customers.map((c) => ({ value: c.id, label: c.fullName }));

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'make', header: t('make') },
    { key: 'model', header: t('model') },
    { key: 'year', header: t('year') },
    { key: 'plateNumber', header: t('plate') },
    { key: 'vin', header: t('vin') },
    {
      key: 'actions',
      header: t('actions'),
      render: (r: VehicleResponse) => {
        const canEdit = canEditVehicle(r);
        return (
          <div className="flex gap-2 justify-end">
            {canEdit && (
              <Button
                variant="warning"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(r); }}
                className="text-xs px-3 py-1.5"
              >
                <Pencil size={14} />
              </Button>
            )}
            {/* Only Admin can delete */}
            {admin && (
              <Button
                variant="danger"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(r.id); setDeleteOpen(true); }}
                className="text-xs px-3 py-1.5"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return (
    <PageTransition>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-skin-border border-t-skin-text2 rounded-full" />
      </div>
    </PageTransition>
  );

  if (error && vehicles.length === 0) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle size={40} className="text-skin-text3" />
        <p className="text-skin-text3">{error}</p>
        <Button onClick={fetchData} variant="ghost">
          <RefreshCw size={16} className="mr-2" />{t('retry')}
        </Button>
      </div>
    </PageTransition>
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-xs px-3 py-1.5 flex items-center gap-1">
              <ArrowLeft size={16} />{t('back')}
            </Button>
            <h1 className="text-xl font-bold text-skin-text">{t('vehiclesTitle')}</h1>
          </div>
          <Button onClick={openCreateModal}>
            <Plus size={16} className="mr-2" />{t('addVehicle')}
          </Button>
        </div>

        {/* Info banner for non-admins */}
        {!admin && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3"
          >
            <CarIcon size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-500">
              {t('userOwnVehiclesOnly')}
            </p>
          </motion.div>
        )}

        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-skin-hover border border-skin-border rounded-xl px-4 py-3">
            <p className="text-sm text-skin-text2">{msg}</p>
          </motion.div>
        )}

        {vehicles.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-skin-card border border-skin-border rounded-2xl">
            <CarIcon size={48} className="text-skin-text3 opacity-30" />
            <p className="text-skin-text3 text-sm">{t('noData')}</p>
            <Button onClick={openCreateModal}>
              <Plus size={16} className="mr-2" />{t('addVehicle')}
            </Button>
          </div>
        ) : (
          <Table columns={columns} data={vehicles} keyExtractor={(r) => r.id} />
        )}

        {/* Create Modal */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('addVehicle')}>
          {createError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-500">{createError}</p>
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Admin sees customer selector; User's customer is auto-set */}
            {admin ? (
              <Select
                label={t('customer')}
                options={customerOptions}
                placeholder={t('customer')}
                value={createForm.customerId || ''}
                onChange={(e) => setCreateForm({ ...createForm, customerId: Number(e.target.value) })}
                required
              />
            ) : (
              <div className="bg-skin-bg border border-skin-border rounded-xl px-4 py-3">
                <p className="text-xs text-skin-text3">{t('customer')}</p>
                <p className="text-sm font-medium text-skin-text mt-0.5">
                  {customers.find((c) => c.id === createForm.customerId)?.fullName ?? '—'}
                </p>
              </div>
            )}
            <Input label={t('make')} value={createForm.make}
              onChange={(e) => setCreateForm({ ...createForm, make: e.target.value })} required />
            <Input label={t('model')} value={createForm.model}
              onChange={(e) => setCreateForm({ ...createForm, model: e.target.value })} required />
            <Input label={t('year')} type="number"
              value={createForm.year}
              onChange={(e) => setCreateForm({ ...createForm, year: Number(e.target.value) })} required />
            <Input label={t('plate')} value={createForm.plateNumber}
              onChange={(e) => setCreateForm({ ...createForm, plateNumber: e.target.value })} required />
            <Input label={t('vin')} value={createForm.vin}
              onChange={(e) => setCreateForm({ ...createForm, vin: e.target.value })} required />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" loading={createLoading}>{t('save')}</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title={t('editVehicle')}>
          {editError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-sm text-red-500">{editError}</p>
            </div>
          )}
          <form onSubmit={handleEdit} className="space-y-4">
            <Input label={t('make')} value={editForm.make}
              onChange={(e) => setEditForm({ ...editForm, make: e.target.value })} required />
            <Input label={t('model')} value={editForm.model}
              onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} required />
            <Input label={t('year')} type="number" value={editForm.year}
              onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })} required />
            <Input label={t('plate')} value={editForm.plateNumber}
              onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value })} required />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" variant="warning" loading={editLoading}>{t('update')}</Button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal - Admin only */}
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
