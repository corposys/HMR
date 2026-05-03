export const RESERVATION_STATUS = {
    RESERVED: 'reserved',
    CHECKED_IN: 'checked_in',
    CHECKED_OUT: 'checked_out',
    NO_SHOW: 'no_show',
    CANCELLED: 'cancelled',
};

export const RESERVATION_STATUS_LABELS = {
    reserved: 'Reservada',
    checked_in: 'Check-in',
    checked_out: 'Check-out',
    no_show: 'No Show',
    cancelled: 'Cancelada',
};

export const RESERVATION_STATUS_COLORS = {
    reserved: 'bg-blue-500/20 text-blue-400',
    checked_in: 'bg-green-500/20 text-green-400',
    checked_out: 'bg-gray-500/20 text-gray-400',
    no_show: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-red-500/20 text-red-400',
};

export const RESERVATION_SOURCES = {
    walk_in: 'Walk-in',
    whatsapp: 'WhatsApp',
    email: 'Email',
    online_agency: 'Agencia Online',
};

export const PAYMENT_METHODS = {
    cash_usd: 'Efectivo USD',
    cash_ves: 'Efectivo Bs',
    zelle: 'Zelle',
    pago_movil: 'Pago Móvil',
    credit_card: 'Tarjeta de Crédito',
    bank_transfer: 'Transferencia Bancaria',
};

export const PAYMENT_METHOD_CURRENCIES = {
    cash_usd: 'USD',
    cash_ves: 'VES',
    zelle: 'USD',
    pago_movil: 'VES',
    credit_card: 'USD',
    bank_transfer: 'USD',
};

export const IGTF_METHODS = ['cash_usd', 'zelle', 'bank_transfer'];

export const DOCUMENT_TYPES = [
    { value: 'V', label: 'V - Venezolano' },
    { value: 'E', label: 'E - Extranjero' },
    { value: 'P', label: 'P - Pasaporte' },
    { value: 'J', label: 'J - Jurídico' },
];

export const BRACELET_COLORS = {
    red: { label: 'Rojo', description: 'Todo Incluido' },
    yellow: { label: 'Amarillo', description: 'Desayuno Incluido' },
    green: { label: 'Verde', description: 'Solo Habitación' },
    blue: { label: 'Azul', description: 'Personalizado' },
};

export const HOUSEKEEPING_STATUS = {
    clean: { label: 'Limpia', color: 'bg-green-500/20 text-green-400' },
    dirty: { label: 'Sucia', color: 'bg-red-500/20 text-red-400' },
    maintenance: { label: 'Mantenimiento', color: 'bg-yellow-500/20 text-yellow-400' },
    inspection: { label: 'Inspección', color: 'bg-blue-500/20 text-blue-400' },
};

export const FOLIO_STATUS = {
    open: { label: 'Abierto', color: 'bg-green-500/20 text-green-400' },
    closed: { label: 'Cerrado', color: 'bg-gray-500/20 text-gray-400' },
    cancelled: { label: 'Anulado', color: 'bg-red-500/20 text-red-400' },
};

export const PAYMENT_STATUS = {
    pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400' },
    verified: { label: 'Verificado', color: 'bg-green-500/20 text-green-400' },
    rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400' },
};

export const CHARGE_TYPES = {
    room_night: 'Noche de habitación',
    early_checkin: 'Early Check-in',
    late_checkout: 'Late Checkout',
    extra: 'Extra',
};

export const SETTINGS_CATEGORIES = {
    hotel: { label: 'Hotel', icon: 'Building2' },
    financial: { label: 'Financiero', icon: 'DollarSign' },
    reservations: { label: 'Reservas', icon: 'CalendarDays' },
    system: { label: 'Sistema', icon: 'Settings' },
};

export const DEFAULT_SETTINGS = {
    hotel_name: 'Hotel Margarita Real',
    hotel_timezone: 'America/Caracas',
    default_currency: 'USD',
    igtf_rate: '0.03',
    iva_rate: '0.00',
    early_checkin_surcharge: '0.50',
    late_checkout_surcharge: '0.50',
    allow_partial_payments: 'true',
    checkin_time: '14:00',
    checkout_time: '12:00',
    require_phone: 'true',
    max_upload_size_mb: '2',
    date_format: 'dd/mm/yyyy',
};

export const CATEGORY_OPTIONS = [
    { value: '5', label: '5 Estrellas' },
    { value: '4', label: '4 Estrellas' },
    { value: '3', label: '3 Estrellas' },
    { value: 'boutique', label: 'Hotel Boutique' },
    { value: 'resort', label: 'Resort' },
    { value: 'posada', label: 'Posada' },
];

export const TIMEZONE_OPTIONS = [
    { value: 'America/Caracas', label: 'America/Caracas (GMT-4)' },
    { value: 'America/Bogota', label: 'America/Bogota (GMT-5)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
    { value: 'Europe/Madrid', label: 'Europe/Madrid (GMT+1)' },
];