# HMR — Identidad Visual

Convenciones de diseño para mantener consistencia en todas las vistas del sistema.

## Sistema de Color

Usar CSS custom properties, nunca valores hardcodeados:

| Variable | Uso |
|---|---|
| `--color-bg-primary` | Fondo principal de página |
| `--color-bg-secondary` | Cards, headers, TabsList |
| `--color-bg-tertiary` | Inputs de búsqueda compactos, hover de filas |
| `--color-border` | Bordes de cards, inputs, filas de tabla |
| `--color-text-primary` | Texto principal, títulos |
| `--color-text-secondary` | Subtítulos, labels, texto de tabla |
| `--color-text-muted` | Placeholders, iconos decorativos, texto inactivo |
| `--color-primary` | Acciones principales, enlaces, borde activo |
| `--color-primary-light` | Hover de primary |
| `--color-danger` | Botones y texto de eliminación |

## Tabs (shadcn)

```jsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
    <TabsTrigger
      value="tabId"
      className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2"
    >
      <Icon className="w-4 h-4" />
      Label
    </TabsTrigger>
  </TabsList>
  <TabsContent value="tabId" className="mt-0">
    ...
  </TabsContent>
</Tabs>
```

- **Siempre** `w-full` en `TabsList`, nunca `grid grid-cols-N max-w-md`.
- **Siempre** `mb-4` en `TabsList`.
- **Siempre** `data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)]` para el trigger activo.
- `TabsContent` usa `mt-0` (no `mt-4`) cuando el contenido tiene su propio Card.

## Estructura de Página

```
<PageWrapper>
  {/* Opcional: CardHeader compacto con stats (py-3 px-4) */}
  <Tabs>...</Tabs>
</PageWrapper>
```

- **No duplicar** el título de página en un `<h1>` — el Navbar ya lo muestra vía `pageMeta`.
- Si se necesitan stats del módulo, usar un `Card` con `CardHeader className="py-3 px-4"` como en `LockRackHeader`.

## Search / Filtros

```jsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  {/* Search */}
  <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
    <input className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors" />
    {value && <button onClick={clear}><X className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" /></button>}
  </div>
  {/* Filters + Actions */}
  <div className="flex items-center gap-2">
    <CustomDropdown ... />
    <Button variant="ghost" onClick={onRefresh} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10 shrink-0" />
  </div>
</div>
```

- Input de búsqueda: `h-8`, `rounded-md`, `bg-[var(--color-bg-tertiary)]`, `text-xs`, `focus:border-[var(--color-primary)]` (sin ring).
- Icono Search: `h-3.5 w-3.5`.
- Dropdowns de filtro: usar `CustomDropdown` de `@shared/common/CustomDropdown`, NO `<select>` nativo.

## Botones

| Acción | Variant | Ejemplo |
|---|---|---|
| Crear / Registrar | `register` | `variant="register" icon={Plus}` |
| Refresh | `ghost` | `variant="ghost" icon={RefreshCw} className="h-8 w-8 !p-0"` |
| Eliminar | `danger` | `variant="danger"` |
| Cancelar | `outline` | `variant="outline"` |
| Acción secundaria | `secondary` o `ghost` | — |

- `register`: fondo primary, texto blanco, `!rounded-full`, `shadow-sm`.
- `ghost`: sin fondo, solo icono, `h-8 w-8 !p-0`.
- Nunca usar `h-[38px]` hardcodeado — usar `h-8` o `size="sm"`.

## Tablas

```jsx
<div className="overflow-x-auto">
  <table className="w-full text-left text-sm border-collapse">
    <thead>
      <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
        <th className="py-3 px-4">Columna</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-[var(--color-border)]">
      <tr className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
        <td className="py-3 px-4">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Badges / Estados

- Segmentos: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase`
  - Hotel: `bg-blue-500/10 text-blue-500`
  - Corpo: `bg-purple-500/10 text-purple-500`
- Estados: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium`
  - Operativo: `bg-green-500/10 text-green-600 dark:text-green-400`
  - Mantenimiento: `bg-amber-500/10 text-amber-600 dark:text-amber-400`
  - Fuera de servicio: `bg-red-500/10 text-red-600 dark:text-red-400`

## Modales (shadcn Dialog)

```jsx
<DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] sm:max-w-md">
  <DialogHeader>
    <DialogTitle className="flex items-center gap-2">...</DialogTitle>
    <DialogDescription className="text-[var(--color-text-secondary)]">...</DialogDescription>
  </DialogHeader>
  <form className="flex flex-col gap-4 py-2">
    {/* fields */}
    <DialogFooter className="mt-4 gap-2">
      <Button variant="outline" onClick={close}>Cancelar</Button>
      <Button variant="primary" type="submit">Guardar</Button>
    </DialogFooter>
  </form>
</DialogContent>
```

## Iconos

- Iconos de acción/tab: `w-4 h-4`
- Iconos en search/filtros compactos: `h-3.5 w-3.5`
- Iconos en títulos de diálogo: `w-5 h-5`
- Iconos en empty states: `w-12 h-12`
- Usar `lucide-react` exclusivamente.

## Espaciado

| Contexto | Valor |
|---|---|
| Gap entre secciones principales | `gap-6` |
| Gap entre filtros | `gap-4` |
| Gap entre botones | `gap-2` |
| Padding de cards | `p-6` |
| Padding de CardHeader compacto | `py-3 px-4` |
| Padding de filas de tabla | `py-3 px-4` |
| Padding de empty state | `py-12` |

## Formularios

### Cuándo usar cada componente

| Tipo | Componente | Ejemplo |
|---|---|---|
| Formularios CRUD (crear/editar) | `Modal` de `@shared/common/Modal` | Registrar evento, Nueva Impresora, Nuevo Toner |
| Confirmaciones de eliminación | `Dialog` de shadcn (sin `DialogDescription`) | Eliminar impresora, Eliminar toner |
| Paneles laterales | `Card` de shadcn | SignatureForm (panel Generar Firma) |

### Estructura de Modal (formularios CRUD)

```jsx
import Modal from '@shared/common/Modal';

<Modal
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    title="Registrar X"
    icon={IconName}
    size="md"
    footer={
        <div className="flex gap-3 w-full">
            <button type="button" onClick={close} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                Cancelar
            </button>
            <button type="submit" form="form-id" className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Guardar
            </button>
        </div>
    }
>
    <form id="form-id" onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Label</label>
            <input className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
    </form>
</Modal>
```

### Reglas de formularios

- **Sin `DialogDescription`** en ningún modal. El texto explicativo va en el `title` o se omite.
- **Labels**: `text-xs font-medium text-[var(--color-text-secondary)] mb-1 block` (no `font-semibold`, no `text-sm`, no `mb-1.5`).
- **Inputs**: `w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none`
- **Selects**: misma clase base que inputs, más `focus:border-[var(--color-primary)] focus:outline-none`. Usar `<select>` nativo solo en modales con opciones fijas. Para filtros en la página usar `CustomDropdown`.
- **Textareas**: mismas clases + `resize-none`.
- **Footer**: 2 botones `flex-1 rounded-xl text-sm` — Cancel (borde) + Submit (bg primary/danger). Usar `<button>` nativo (no `Button` de shared). El botón submit usa `type="submit" form="form-id"` (el `<form>` tiene `id="form-id"`).
- **Espaciado entre campos**: `space-y-4` en el `<form>`.
- **Grid 2 columnas**: `grid grid-cols-2 gap-3` para campos lado a lado.
- **Campos requeridos**: `*` al final del label.
- **Opcional**: `(Opcional)` en el label, `text-[11px]` y `font-normal`.

### Estructura de Card (paneles)

```jsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm h-fit">
    <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 m-0">
            <Icon className="w-5 h-5 text-[var(--color-primary)]" />
            Título
        </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        {/* Campos con el mismo estilo de labels/inputs que los modals */}
    </CardContent>
</Card>
```

### Estructura de confirmación de eliminación (Dialog)

```jsx
<Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
    <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] sm:max-w-md">
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Eliminar X
            </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-text-secondary)]">
            ¿Estás seguro de eliminar...?
        </p>
        <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

- La pregunta de confirmación va como `<p>` en el body (no como `DialogDescription`).
- Los botones del footer usan el shared `Button` (es aceptable aquí por simplicidad).
