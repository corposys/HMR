import { User, Building2 } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import { formatDate } from '@utils/formatters';
import { RESERVATION_STATUS_LABELS } from '@utils/constants';

const STATUS_BADGE_VARIANT = {
    reserved: 'info',
    checked_in: 'success',
    checked_out: 'primary',
    no_show: 'warning',
    cancelled: 'danger',
};

export default function GuestDetailModal({ guest, isOpen, onClose, onEdit }) {
    if (!guest) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={guest.full_name} icon={User} size="lg">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-[var(--color-text-muted)]">Documento</p>
                        <p className="text-[var(--color-text-primary)] font-medium">{guest.id_document_type}-{guest.id_document_number}</p>
                    </div>
                    <div>
                        <p className="text-[var(--color-text-muted)]">Teléfono</p>
                        <p className="text-[var(--color-text-primary)] font-medium">{guest.phone}</p>
                    </div>
                    {guest.email && (
                        <div>
                            <p className="text-[var(--color-text-muted)]">Email</p>
                            <p className="text-[var(--color-text-primary)] font-medium">{guest.email}</p>
                        </div>
                    )}
                    {guest.nationality && (
                        <div>
                            <p className="text-[var(--color-text-muted)]">Nacionalidad</p>
                            <p className="text-[var(--color-text-primary)] font-medium">{guest.nationality}</p>
                        </div>
                    )}
                    {guest.address && (
                        <div className="col-span-2">
                            <p className="text-[var(--color-text-muted)]">Dirección</p>
                            <p className="text-[var(--color-text-primary)] font-medium">{guest.address}</p>
                        </div>
                    )}
                    {guest.notes && (
                        <div className="col-span-2">
                            <p className="text-[var(--color-text-muted)]">Notas</p>
                            <p className="text-[var(--color-text-secondary)]">{guest.notes}</p>
                        </div>
                    )}
                </div>

                {(guest.fiscal_name || guest.fiscal_id) && (
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                            Datos Fiscales
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {guest.fiscal_name && (
                                <div>
                                    <p className="text-[var(--color-text-muted)]">Razón Social</p>
                                    <p className="text-[var(--color-text-primary)]">{guest.fiscal_name}</p>
                                </div>
                            )}
                            {guest.fiscal_id && (
                                <div>
                                    <p className="text-[var(--color-text-muted)]">RIF</p>
                                    <p className="text-[var(--color-text-primary)]">{guest.fiscal_id}</p>
                                </div>
                            )}
                            {guest.fiscal_address && (
                                <div className="col-span-2">
                                    <p className="text-[var(--color-text-muted)]">Dirección Fiscal</p>
                                    <p className="text-[var(--color-text-primary)]">{guest.fiscal_address}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {guest.reservations && guest.reservations.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                            Reservas ({guest.reservation_count || guest.reservations.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {guest.reservations.map((res) => (
                                <div key={res.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-tertiary)] text-sm">
                                    <div>
                                        <span className="font-medium text-[var(--color-text-primary)]">#{res.id}</span>
                                        <span className="text-[var(--color-text-muted)] mx-1">·</span>
                                        <span className="text-[var(--color-text-secondary)]">{formatDate(res.check_in_date)}</span>
                                    </div>
                                    <Badge variant={STATUS_BADGE_VARIANT[res.status] || 'primary'}>
                                        {RESERVATION_STATUS_LABELS[res.status] || res.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 text-xs text-[var(--color-text-muted)]">
                    <span>Creado: {formatDate(guest.created_at)}</span>
                    {guest.updated_at && <span>Actualizado: {formatDate(guest.updated_at)}</span>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cerrar</Button>
                    {onEdit && <Button variant="primary" onClick={() => onEdit(guest)}>Editar</Button>}
                </div>
            </div>
        </Modal>
    );
}