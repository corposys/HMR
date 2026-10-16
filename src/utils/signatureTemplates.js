export const SIGNATURE_TEMPLATES = [
    {
        id: 'hmr',
        label: 'Hotel Margarita Real',
        emailDomain: 'margaritareal.com.ve',
        logoPath: '/img/logo-hmr-main-white-signature.png',
        logoAlt: 'Hotel Margarita Real',
        officePhone: '+58(0295)5001300',
        website: 'www.hotelmargaritareal.com',
        websiteUrl: 'https://www.hotelmargaritareal.com/',
        addressLine1: 'Av. Aldonza Manrique, Final Calle Camarón, Hotel Margarita Real.',
        addressLine2: 'Ofc. Admin. Pampatar, Edo. Nueva Esparta. Venezuela 6316',
        emailPlaceholder: 'correo@margaritareal.com.ve',
        colors: {
            logoBackground: '#009098',
            panelBackground: '#ffffff',
            name: '#009098',
            separator: '#009098',
            jobTitle: '#555555',
            email: '#555555',
            phone: '#009098',
            website: '#009098',
            address: '#555555',
        },
    },
    {
        id: 'corporeal',
        label: 'Corporeal',
        emailDomain: 'corporeal.com.ve',
        logoPath: '/img/logo-corpo-main-white-signature.png',
        logoAlt: 'Corporeal',
        officePhone: '+58(0295)5001300',
        website: '',
        websiteUrl: '',
        addressLine1: 'Av. Aldonza Manrique, Final Calle Camarón, Hotel Margarita Real.',
        addressLine2: 'Ofc. Admin. Pampatar, Edo. Nueva Esparta. Venezuela 6316',
        emailPlaceholder: 'correo@corporeal.com.ve',
        colors: {
            logoBackground: '#002d72',
            panelBackground: '#fbf3e7',
            name: '#002d72',
            separator: '#c8b369',
            jobTitle: '#c8b369',
            email: '#002d72',
            phone: '#002d72',
            website: '#002d72',
            address: '#002d72',
        },
    },
];

export const DEFAULT_SIGNATURE_TEMPLATE_ID = 'hmr';

export function getSignatureTemplate(id) {
    return SIGNATURE_TEMPLATES.find(t => t.id === id) || SIGNATURE_TEMPLATES[0];
}

export function detectSignatureTemplate(email) {
    if (!email || !email.includes('@')) return null;
    const domain = email.split('@').pop().toLowerCase();
    return SIGNATURE_TEMPLATES.find(t => t.emailDomain.toLowerCase() === domain) || null;
}

export function formatSignaturePhone(value) {
    let digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('58')) digits = digits.slice(2);
    if (!digits) return '';
    if (!digits.startsWith('0')) digits = '0' + digits;
    const area = digits.slice(0, 4);
    const rest = digits.slice(4);
    return `+58(${area})${rest}`;
}
