# DESIGN.md — HMR Design System

Sistema de diseño completo para Hotel Margarita Real (HMR)

---

## Tabla de Contenidos

1. [Principios de Diseño](#principios-de-diseño)
2. [Colores](#colores)
3. [Tipografía](#tipografía)
4. [Espaciado](#espaciado)
5. [Sombras](#sombras)
6. [Border Radius](#border-radius)
7. [Iconografía](#iconografía)
8. [Componentes UI (shadcn)](#componentes-ui-shadcn)
9. [Componentes Compartidos](#componentes-compartidos)
10. [Layout](#layout)
11. [Animaciones](#animaciones)
12. [Estados de UI](#estados-de-ui)
13. [Responsive Design](#responsive-design)

---

## Principios de Diseño

### Filosofía
- **Claridad ante decoración**: Interfaces limpias que priorizan la funcionalidad
- **Consistencia visual**: Patrones repetibles en toda la aplicación
- **Accesibilidad**: Contraste adecuado, navegación por teclado, aria-labels
- **Dark Mode nativo**: Soporte completo para temas claro/oscuro

### Características
- Sin bordes redondeados excesivos (máximo `rounded-xl`)
- Bordes sutiles en lugar de sombras pronunciadas
- Espaciado generoso para respiración visual
- Micro-interacciones en hover/focus

---

## Colores

### Light Mode (`:root`)

#### Colores Primarios
```css
--color-primary: #00808a;           /* Teal principal */
--color-primary-light: #14b8c4;     /* Teal claro (hover) */
--color-primary-dark: #006c75;      /* Teal oscuro */
--color-primary-muted: #0e7480;     /* Teal atenuado */
```

#### Fondos
```css
--color-bg-primary: #f2f2f0;        /* Fondo principal (gris cálido claro) */
--color-bg-secondary: #fafaf8;      /* Tarjetas, sidebar */
--color-bg-tertiary: #e8e6e1;       /* Inputs, hover states */
--color-bg-elevated: #f7f7f5;       /* Elementos elevados */
```

#### Texto
```css
--color-text-primary: #171717;      /* Texto principal */
--color-text-secondary: #444444;    /* Texto secundario */
--color-text-muted: #5c5c5c;        /* Texto atenuado */
```

#### Bordes
```css
--color-border: #c5c5c0;            /* Borde estándar */
--color-border-hover: #969696;      /* Borde en hover */
```

#### Semánticos
```css
--color-success: #22c55e;           /* Verde éxito */
--color-warning: #eab308;           /* Amarillo advertencia */
--color-danger: #ef4444;            /* Rojo error */
--color-info: #3b82f6;              /* Azul información */
```

### Dark Mode (`.dark`)

#### Colores Primarios
```css
--color-primary: #009098;           /* Teal más brillante */
--color-primary-light: #14b8c4;
--color-primary-dark: #006c75;
--color-primary-muted: #0e7480;
```

#### Fondos
```css
--color-bg-primary: #0f0f0f;        /* Negro suave */
--color-bg-secondary: #171717;      /* Gris oscuro */
--color-bg-tertiary: #1f1f1f;       /* Gris medio */
--color-bg-elevated: #262626;       /* Gris elevado */
```

#### Texto
```css
--color-text-primary: #fafafa;      /* Blanco hueso */
--color-text-secondary: #a3a3a3;    /* Gris claro */
--color-text-muted: #737373;        /* Gris medio */
```

#### Bordes
```css
--color-border: #2a2a2a;            /* Borde oscuro */
--color-border-hover: #404040;      /* Borde hover */
```

### shadcn CSS Variables

El sistema usa variables CSS de shadcn para componentes UI:

```css
--background: #f2f2f0;              /* Light */
--foreground: #171717;
--card: #fafaf8;
--card-foreground: #171717;
--primary: #00808a;
--primary-foreground: #ffffff;
--secondary: #e8e6e1;
--secondary-foreground: #171717;
--muted: #e8e6e1;
--muted-foreground: #5c5c5c;
--accent: #e8e6e1;
--accent-foreground: #171717;
--destructive: #ef4444;
--destructive-foreground: #ffffff;
--border: #c5c5c0;
--input: #c5c5c0;
--ring: #00808a;
```

---

## Tipografía

### Familias de Fuentes

```css
--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-mono: 'Fira Code', ui-monospace, monospace;
```

### Escala Tipográfica

| Elemento | Tamaño | Peso | Line Height |
|----------|--------|------|-------------|
| `h1` | 1.5rem (24px) | 600 | 1.25 |
| `h2` | 1.25rem (20px) | 600 | 1.25 |
| `h3` | 1.25rem (20px) | 600 | 1.25 |
| `h4` | 1rem (16px) | 600 | 1.25 |
| `h5` | 1rem (16px) | 600 | 1.25 |
| `h6` | 1rem (16px) | 600 | 1.25 |
| Body | 0.875rem (14px) | 400 | 1.6 |
| Small | 0.75rem (12px) | 400 | 1.5 |
| Stat Value | 2rem (32px) | 700 | 1 |

### Estilos Base

```css
body {
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
  margin: 0;
}

p {
  margin: 0;
  color: var(--color-text-secondary);
}
```

---

## Espaciado

### Escala de Espaciado

```css
--spacing-section: 5rem;   /* 80px - Espaciado entre secciones */
--spacing-card: 1.5rem;    /* 24px - Padding interno de tarjetas */
```

### Padding de Componentes

| Componente | Padding |
|------------|---------|
| Card (sm) | 1rem (16px) |
| Card (md) | 1.5rem (24px) |
| Card (lg) | 2rem (32px) |
| Button (sm) | 0.75rem 1rem |
| Button (md) | 1rem 1.5rem |
| Button (lg) | 1.5rem 2rem |
| Input | 0.625rem 0.875rem |

### Grid Gaps

- **Stats Grid**: `gap-4` (16px)
- **Cards Grid**: `gap-6` (24px)
- **Form Fields**: `gap-4` (16px)

---

## Sombras

### Escala de Sombras

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### Dark Mode

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3);
```

### Uso

- **Cards estándar**: Sin sombra (usan borde)
- **Modales**: `shadow-2xl`
- **Dropdowns**: `shadow-xl`
- **Botones**: `shadow-sm` (solo en variantes específicas)

---

## Border Radius

### Escala

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius: 0.5rem;       /* 8px - default */
```

### Aplicación

| Elemento | Border Radius |
|----------|---------------|
| Cards | `rounded-xl` (16px) |
| Botones | `rounded-md` (8px) |
| Inputs | `rounded-md` (8px) |
| Badges | `rounded-full` (9999px) |
| Modales | `rounded-xl` (16px) |
| Avatares | `rounded-full` |

---

## Iconografía

### Librería

**Lucide React** - Iconos consistentes y ligeros

### Tamaños Estándar

| Contexto | Tamaño |
|----------|--------|
| Sidebar navigation | `w-4 h-4` (16px) |
| Botones | `w-4 h-4` (16px) |
| Inputs (icono interno) | `w-4 h-4` (16px) |
| Stat cards | `w-5 h-5` (20px) |
| Empty states | `w-12 h-12` (48px) |

### Iconos Comunes

```jsx
// Navegación
Home, Settings, LayoutDashboard, LayoutGrid, ServerCog

// Acciones
Plus, Edit, Trash2, Download, Upload, RefreshCw

// Estados
Check, X, AlertCircle, AlertTriangle, Info

// Módulos
Hotel, BedDouble, DoorOpen, CalendarCheck, Receipt, ClipboardCheck
```

---

## Componentes UI (shadcn)

### Componentes Disponibles

8 componentes generados en `src/components/ui/`:

1. **Button** - Botones con variantes (default, destructive, outline, secondary, ghost, link)
2. **Badge** - Etiquetas con variantes (default, secondary, destructive, outline)
3. **Card** - Tarjetas con CardHeader, CardTitle, CardDescription, CardContent, CardFooter
4. **Dialog** - Modales con DialogTrigger, DialogContent, DialogHeader, DialogTitle
5. **Separator** - Separadores horizontales/verticales
6. **Table** - Tablas con TableHeader, TableBody, TableRow, TableHead, TableCell
7. **Tabs** - Pestañas con TabsList, TabsTrigger, TabsContent
8. **Tooltip** - Tooltips con TooltipProvider, TooltipTrigger, TooltipContent

### Uso

```jsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
```

---

## Componentes Compartidos

### Ubicación

`src/shared/common/` - Componentes personalizados reutilizables

### Componentes Principales

#### Button
```jsx
<Button 
  variant="primary|secondary|ghost|outline|danger|register|back"
  size="sm|md|lg"
  icon={Icon}
  iconPosition="left|right"
  loading={boolean}
>
  Texto
</Button>
```

#### Card
```jsx
<Card padding="none|sm|md|lg" hover={boolean} elevated={boolean}>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Acciones</CardFooter>
</Card>
```

#### StatCard
```jsx
<StatCard
  title="Título"
  value="123"
  subtitle="Descripción"
  icon={Icon}
  trend={8}
  trendLabel="vs mes anterior"
  variant="default|primary|success|warning|danger"
/>
```

#### Modal
```jsx
<Modal
  isOpen={boolean}
  onClose={function}
  title="Título"
  icon={Icon}
  size="sm|md|lg|xl"
  footer={<Button>Guardar</Button>}
>
  Contenido
</Modal>
```

#### Input
```jsx
<Input
  label="Email"
  icon={Mail}
  error="Error message"
  placeholder="ejemplo@email.com"
/>
```

#### Badge
```jsx
<Badge variant="primary|success|warning|danger|info">
  Estado
</Badge>
```

#### Alert
```jsx
<Alert type="error|success|warning|info" title="Título">
  Mensaje descriptivo
</Alert>
```

#### EmptyState
```jsx
<EmptyState
  icon={Icon}
  title="No hay datos"
  description="Descripción"
  actionLabel="Crear"
  onAction={function}
/>
```

#### LoadingSpinner
```jsx
<LoadingSpinner size="sm|md|lg" />
```

#### PageWrapper
```jsx
<PageWrapper>
  {/* Contenido de página */}
</PageWrapper>
```

---

## Layout

### Estructura Principal

```
Layout (flex h-screen)
├── Sidebar (fixed left, collapsible)
│   ├── Header (logo)
│   ├── Navigation (links + dropdowns)
│   └── Footer (settings link)
└── Main Content (flex-1)
    ├── Navbar (sticky top, h-14)
    │   ├── Page Title + Icon
    │   ├── BCV Rate Indicator
    │   ├── Notifications
    │   ├── Theme Toggle
    │   └── Profile Dropdown
    └── Content Area (overflow-y-auto)
        └── <Outlet /> (React Router)
```

### Sidebar

- **Width**: 56px (colapsado) → 224px (expandido)
- **Mobile**: 256px (overlay con backdrop)
- **Comportamiento**: Expande en hover (desktop) o click (mobile)
- **Estilo**: Fondo `--color-bg-secondary`, borde derecho

### Navbar

- **Height**: 56px (h-14)
- **Posición**: Sticky top
- **Fondo**: `--color-bg-primary` con backdrop-blur
- **Borde**: Inferior con `--color-border`

### Content Area

- **Padding**: `py-5 px-5` (20px vertical, 20px horizontal)
- **Max Width**: Sin límite (full width)
- **Scroll**: Vertical en el área principal

---

## Animaciones

### Keyframes

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Clases de Animación

```css
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
```

### Uso

- **Modales**: `animate-fade-in` al abrir
- **Dropdowns**: `animate-fade-in` al desplegar
- **Loading**: `animate-spin` (Lucide Loader2)
- **Pulse**: `animate-pulse-subtle` para indicadores

---

## Estados de UI

### Loading State

```jsx
<LoadingSpinner size="md" />
```

- Spinner centrado con padding vertical
- Color primario
- Tamaños: sm (20px), md (32px), lg (48px)

### Empty State

```jsx
<EmptyState
  icon={InboxIcon}
  title="No hay elementos"
  description="Comienza creando un nuevo elemento"
  actionLabel="Crear"
  onAction={handleCreate}
/>
```

- Icono grande atenuado (48px, opacity-40)
- Texto centrado
- Botón de acción opcional

### Error State

```jsx
<ErrorState message="Error al cargar datos" onRetry={handleRetry} />
```

- Alert de tipo error
- Botón de reintentar

### Error Boundary

```jsx
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

- Captura errores de React
- Muestra UI de fallback

---

## Responsive Design

### Breakpoints

| Breakpoint | Tamaño | Descripción |
|------------|--------|-------------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop large |

### Adaptaciones

#### Sidebar
- **Mobile**: Overlay con backdrop, toggle con botón
- **Desktop**: Colapsado (56px) por defecto, expande en hover

#### Navbar
- **Mobile**: Solo botón de menú y perfil
- **Desktop**: Título de página, BCV rate, notificaciones, tema, perfil

#### Grids
- **Stats**: 1 col (mobile) → 2 cols (tablet) → 4 cols (desktop)
- **Charts**: 1 col (mobile/tablet) → 2 cols (desktop)
- **Cards**: 1 col (mobile) → 2 cols (tablet) → 3-4 cols (desktop)

#### Tipografía Responsive

```css
@media (max-width: 1024px) {
  h1 { font-size: 1.875rem; }
  h2 { font-size: 1.5rem; }
}

@media (max-width: 768px) {
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
}
```

---

## Patrones de Diseño

### Cards con Hover

```jsx
<div className="card hover:border-[var(--color-border-hover)] transition-colors">
  {/* Contenido */}
</div>
```

### Botones con Iconos

```jsx
<Button icon={Plus}>
  Nuevo
</Button>
```

### Formularios

```jsx
<div className="space-y-4">
  <Input label="Nombre" placeholder="Ingresa tu nombre" />
  <Input label="Email" type="email" icon={Mail} />
  <Button variant="primary" className="w-full">
    Enviar
  </Button>
</div>
```

### Tablas

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Badges de Estado

```jsx
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger">Inactivo</Badge>
```

---

## Accesibilidad

### Prácticas

- **aria-label** en botones sin texto
- **aria-expanded** en dropdowns
- **role="button"** en elementos clickeables
- **focus-visible** en elementos interactivos
- **Contraste WCAG AA** en todos los textos
- **Navegación por teclado** completa

### Focus States

```css
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## Scrollbars Personalizados

### Estilo

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

### Ocultar Scrollbar

```jsx
<div className="scrollbar-hide">
  {/* Contenido scrolleable sin scrollbar visible */}
</div>
```

---

## Utilidades CSS

### Clases Personalizadas

```css
.gradient-text {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass {
  background: rgba(23, 23, 23, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
}

.card {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.card-elevated {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
```

### Clases de Botones

```css
.btn { /* Base styles */ }
.btn-primary { /* Primary variant */ }
.btn-secondary { /* Secondary variant */ }
.btn-ghost { /* Ghost variant */ }
```

### Clases de Inputs

```css
.input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.input:focus {
  border-color: var(--color-primary);
}
```

### Clases de Badges

```css
.badge {
  display: inline-flex;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  border-radius: 9999px;
}

.badge-primary { /* Teal background */ }
.badge-success { /* Green background */ }
.badge-warning { /* Yellow background */ }
.badge-danger { /* Red background */ }
.badge-info { /* Blue background */ }
```

---

## Ejemplos de Uso

### Dashboard con Stats

```jsx
<PageWrapper>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      title="Reservas"
      value="142"
      icon={CalendarCheck}
      trend={8}
      trendLabel="vs mes anterior"
    />
    {/* Más stats */}
  </div>
  
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <Card>
      <CardHeader>
        <CardTitle>Ocupación</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart */}
      </CardContent>
    </Card>
  </div>
</PageWrapper>
```

### Modal de Confirmación

```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmar acción"
  icon={AlertCircle}
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setShowModal(false)}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={handleConfirm}>
        Confirmar
      </Button>
    </>
  }
>
  <p>¿Estás seguro de que deseas continuar?</p>
</Modal>
```

### Formulario con Validación

```jsx
<Card>
  <CardHeader>
    <CardTitle>Nueva Reserva</CardTitle>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del huésped"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        icon={Mail}
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        error={errors.email}
      />
      <Button type="submit" loading={isSubmitting}>
        Crear Reserva
      </Button>
    </form>
  </CardContent>
</Card>
```

---

## Recursos Adicionales

### Archivos Clave

- **Variables CSS**: `src/index.css`
- **Componentes UI**: `src/components/ui/`
- **Componentes Compartidos**: `src/shared/common/`
- **Layout**: `src/shared/layout/`
- **Tailwind Config**: No existe (Tailwind v4 usa `@theme` en CSS)

### Documentación Externa

- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Radix UI](https://www.radix-ui.com/)
- [Recharts](https://recharts.org/)

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0
