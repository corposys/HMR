import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';
import { SettingsField } from '@features/settings/components/settings/SettingsField';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';
import { usePermissions } from '@hooks/usePermissions';

const EMPTY_FORM = { full_name: '', email: '', password: '', role_id: '' };

export default function UsersTab() {
    const { showToast } = useToast();
    const { can } = usePermissions();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([
                apiJson('/api/users'),
                apiJson('/api/roles'),
            ]);
            setUsers(usersData.users || []);
            setRoles(rolesData.roles || []);
        } catch {
            showToast({ title: 'Error', message: 'No se pudieron cargar los usuarios', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const isReadOnly = !can('users', 'write');

    const filtered = users.filter((u) =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const getRoleName = (roleId) => {
        const r = roles.find((role) => role.id === roleId);
        return r?.display_name || r?.name || `Rol ${roleId}`;
    };

    const openCreate = () => {
        setEditingUser(null);
        setForm(EMPTY_FORM);
        setShowDialog(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setForm({ full_name: user.full_name, email: user.email, password: '', role_id: user.role_id || '' });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!form.full_name.trim() || !form.email.trim()) {
            showToast({ title: 'Campos requeridos', message: 'Nombre y correo son obligatorios', type: 'error' });
            return;
        }
        if (!editingUser && !form.password.trim()) {
            showToast({ title: 'Contraseña requerida', message: 'La contraseña es obligatoria para nuevos usuarios', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            const payload = { full_name: form.full_name, email: form.email, role_id: Number(form.role_id) || 3 };
            if (form.password) payload.password = form.password;

            if (editingUser) {
                await apiJson(`/api/users/${editingUser.id}`, { method: 'PUT', body: payload });
                showToast({ title: 'Usuario actualizado', message: form.full_name, type: 'success' });
            } else {
                await apiJson('/api/users', { method: 'POST', body: payload });
                showToast({ title: 'Usuario creado', message: form.full_name, type: 'success' });
            }
            await fetchData();
            setShowDialog(false);
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo guardar', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`¿Desactivar a ${user.full_name}?`)) return;
        try {
            await apiJson(`/api/users/${user.id}`, { method: 'DELETE' });
            showToast({ title: 'Usuario desactivado', message: user.full_name, type: 'success' });
            await fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo eliminar', type: 'error' });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-sm text-[var(--color-text-secondary)]">{users.length} usuarios</span>
                </div>
                <Button onClick={openCreate} disabled={isReadOnly} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o correo..."
                    className="input w-full pl-9"
                />
            </div>

            <SettingsSection title="Usuarios del Sistema" icon={Users}>
                {loading ? (
                    <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">Cargando...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                        {search ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                        {filtered.map((user) => (
                            <div key={user.id} className="flex items-center justify-between py-3 px-1 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-semibold">
                                        {user.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{user.full_name}</span>
                                        <span className="text-xs text-[var(--color-text-muted)]">{user.email}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs px-2 py-1 rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">{getRoleName(user.role_id)}</span>
                                    <button onClick={() => openEdit(user)} disabled={isReadOnly} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40" title="Editar">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(user)} disabled={isReadOnly} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-40" title="Desactivar">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SettingsSection>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <SettingsField label="Nombre completo">
                            <input className="input w-full" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nombre del usuario" autoFocus />
                        </SettingsField>
                        <SettingsField label="Correo electrónico">
                            <input className="input w-full" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
                        </SettingsField>
                        <SettingsField label={editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}>
                            <input className="input w-full" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingUser ? '••••••••' : 'Mín. 8 caracteres'} />
                        </SettingsField>
                        <SettingsField label="Rol">
                            <select className="input w-full" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
                                <option value="">Sin rol asignado</option>
                                {roles.map((r) => <option key={r.id} value={r.id}>{r.display_name || r.name}</option>)}
                            </select>
                        </SettingsField>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSave} loading={saving} disabled={saving} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}