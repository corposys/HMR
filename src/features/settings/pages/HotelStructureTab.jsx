import React, { useState, useEffect, useCallback } from 'react';
import {
    Building2, MapPin, Layers, BedDouble, Wrench,
    ChevronRight, ChevronDown, Edit2, Plus, AlertCircle,
    Loader2, MoreHorizontal, X, Check, Eye,
    ListOrdered, Hash, Type
} from 'lucide-react';
import Button from '@shared/common/Button';
import { useToast } from '@context/ToastContext';

const DEFAULT_SINGLE_TEMPLATE = [{
    name: ' ',
    category: 'hotel',
    floors: 0,
    roomsPerFloor: 0,
}];

const DEFAULT_MULTI_TEMPLATE = [
    {
        baseName: ' ',
        category: 'hotel',
        modulesCount: 0,
        roomsPerModule: 0,
    },
];

const DEFAULT_HORIZONTAL_TEMPLATE = [
    {
        zoneName: ' ',
        category: 'owner',
        rows: 0,
        unitsPerRow: 0,
    },
];

const NUMBERING_OPTIONS = {
    single: [
        {
            value: 'classic',
            label: 'Clásico hotelero',
            description: '101, 102, 201, 202...',
            example: '101',
        },
        {
            value: 'sequential',
            label: 'Secuencial global',
            description: '001, 002, 003...',
            example: '001',
        },
    ],
    multi: [
        {
            value: 'module',
            label: 'Bloque + piso + correlativo',
            description: '2101, 2102, 3101...',
            example: '2101',
        },
        {
            value: 'sequential',
            label: 'Secuencial global',
            description: '001, 002, 003...',
            example: '001',
        },
    ],
    horizontal: [
        {
            value: 'villa',
            label: 'Villa + correlativo',
            description: 'V01-01, V02-01...',
            example: 'V01-01',
        },
        {
            value: 'sequential',
            label: 'Secuencial global',
            description: '001, 002, 003...',
            example: '001',
        },
    ],
};

const getDefaultTemplates = (mode) => {
    if (mode === 'multi') {
        return DEFAULT_MULTI_TEMPLATE;
    }

    if (mode === 'horizontal') {
        return DEFAULT_HORIZONTAL_TEMPLATE;
    }

    return DEFAULT_SINGLE_TEMPLATE;
};

const cloneTemplates = (templates) => templates.map((template) => ({ ...template }));

const createLevelRowsFromMode = (mode, modules) => {
    const firstTemplate = modules?.[0] || {};

    if (mode === 'horizontal') {
        const rows = Math.max(1, Number(firstTemplate.rows) || 1);
        const unitsPerRow = Math.max(1, Number(firstTemplate.unitsPerRow) || 1);
        return Array.from({ length: rows }, (_, index) => ({
            name: index === 0 ? 'Sector Base' : `Sector ${index + 1}`,
            floorCode: String(index + 1),
            startAt: 1,
            quantity: unitsPerRow,
        }));
    }

    if (mode === 'multi') {
        const roomsPerModule = Math.max(1, Number(firstTemplate.roomsPerModule) || 1);
        return [{
            name: 'Nivel Único',
            floorCode: '1',
            startAt: 1,
            quantity: roomsPerModule,
        }];
    }

    const floors = Math.max(1, Number(firstTemplate.floors) || 1);
    const roomsPerFloor = Math.max(1, Number(firstTemplate.roomsPerFloor) || 1);
    return Array.from({ length: floors }, (_, index) => ({
        name: index === 0 ? 'Planta Baja' : `Piso ${index}`,
        floorCode: String(index + 1),
        startAt: 1,
        quantity: roomsPerFloor,
    }));
};

const getNumericFloorValue = (floorCode, fallbackIndex) => {
    const numericFloor = Number.parseInt(String(floorCode), 10);
    return Number.isFinite(numericFloor) && numericFloor > 0 ? numericFloor : fallbackIndex + 1;
};

const getFloorCode = (floorIndex, totalFloors, style) => {
    if (style === 'numeric') {
        return String(floorIndex + 1);
    }

    if (floorIndex === 0) {
        return 'PB';
    }

    if (totalFloors > 2 && floorIndex === totalFloors - 1) {
        return 'PH';
    }

    return `P${floorIndex}`;
};

const buildWizardState = (property) => {
    const existingModules = property?.modules || [];
    const hasMultipleModules = existingModules.length > 1;
    const mode = hasMultipleModules ? 'multi' : 'single';
    const modules = cloneTemplates(getDefaultTemplates(mode));

    return {
        mode,
        numbering: hasMultipleModules ? 'module' : 'classic',
        alphaPrefix: 'A-',
        floorStyle: 'hotel',
        reuseCurrent: false,
        modules,
        levelRows: createLevelRowsFromMode(mode, modules),
    };
};

const createStructurePlan = (property, wizard) => {
    const expandedTemplates = wizard.modules.flatMap((template, groupIndex) => {
        if (wizard.mode === 'multi') {
            const modulesCount = Math.max(1, Number(template.modulesCount) || 1);
            const roomsPerModule = Math.max(1, Number(template.roomsPerModule) || 1);
            const baseName = template.baseName?.trim() || `Grupo ${groupIndex + 1}`;

            return Array.from({ length: modulesCount }, (_, index) => ({
                name: modulesCount > 1 ? `${baseName} ${index + 1}` : baseName,
                category: template.category || 'hotel',
                floors: 1,
                roomsPerFloor: roomsPerModule,
            }));
        }

        if (wizard.mode === 'horizontal') {
            return [{
                name: template.zoneName?.trim() || `Zona ${groupIndex + 1}`,
                category: template.category || 'owner',
                floors: Math.max(1, Number(template.rows) || 1),
                roomsPerFloor: Math.max(1, Number(template.unitsPerRow) || 1),
            }];
        }

        return [{
            name: template.name?.trim() || `Torre ${groupIndex + 1}`,
            category: template.category || 'hotel',
            floors: Math.max(1, Number(template.floors) || 1),
            roomsPerFloor: Math.max(1, Number(template.roomsPerFloor) || 1),
        }];
    });

    const existingRoomNumbers = new Set();
    const levelRows = (wizard.levelRows || []).map((row, index) => ({
        name: row.name?.trim() || `Nivel ${index + 1}`,
        floorCode: String(row.floorCode || index + 1),
        startAt: Math.max(1, Number(row.startAt) || 1),
        quantity: Math.max(1, Number(row.quantity) || 1),
    }));
    const alphaPrefix = (wizard.alphaPrefix || 'A-').trim();
    const existingModuleMax = property?.modules?.reduce((max, module) => Math.max(max, Number(module.number) || 0), 0) || 0;

    property?.modules?.forEach((module) => {
        module.floors?.forEach((floor) => {
            floor.rooms?.forEach((room) => {
                existingRoomNumbers.add(String(room.room_number));
            });
        });
    });

    const totalRoomsPlanned = expandedTemplates.reduce((acc) => {
        return acc + levelRows.reduce((rowAcc, row) => rowAcc + row.quantity, 0);
    }, 0);

    const sequentialWidth = Math.max(3, String(existingRoomNumbers.size + totalRoomsPlanned).length);
    let nextSequentialNumber = existingRoomNumbers.size + 1;
    let nextModuleNumber = existingModuleMax + 1;

    const planModules = expandedTemplates.map((template) => {
        const moduleNumber = nextModuleNumber++;
        const moduleCode = wizard.mode === 'multi' ? String(moduleNumber) : '1';

        const floors = levelRows.map((row, floorIndex) => {
            const floorCode = row.floorCode || getFloorCode(floorIndex, levelRows.length, wizard.floorStyle);
            const roomNumbers = Array.from({ length: row.quantity }, (_, roomOffset) => {
                const currentRoomIndex = row.startAt + roomOffset;
                const roomSequence = String(currentRoomIndex).padStart(2, '0');
                let roomNumber;

                if (wizard.numbering === 'sequential') {
                    roomNumber = String(nextSequentialNumber++).padStart(sequentialWidth, '0');
                } else if (wizard.numbering === 'alphanumeric') {
                    const floorDigit = getNumericFloorValue(floorCode, floorIndex);
                    const baseNumber = wizard.mode === 'multi'
                        ? `${moduleCode}${floorDigit}${roomSequence}`
                        : `${floorDigit}${roomSequence}`;
                    roomNumber = `${alphaPrefix}${baseNumber}`;
                } else if (wizard.numbering === 'villa') {
                    roomNumber = `V${String(moduleNumber).padStart(2, '0')}-${roomSequence}`;
                } else if (wizard.mode === 'multi') {
                    const floorDigit = getNumericFloorValue(floorCode, floorIndex);
                    roomNumber = `${moduleCode}${floorDigit}${roomSequence}`;
                } else {
                    const floorDigit = getNumericFloorValue(floorCode, floorIndex);
                    roomNumber = `${floorDigit}${roomSequence}`;
                }

                if (existingRoomNumbers.has(roomNumber)) {
                    throw new Error(`La habitación ${roomNumber} ya existe en la estructura actual.`);
                }

                existingRoomNumbers.add(roomNumber);
                return roomNumber;
            });

            return {
                code: floorCode,
                name: row.name,
                roomNumbers,
            };
        });

        return {
            moduleNumber,
            name: template.name || (wizard.mode === 'multi' ? `Módulo ${moduleNumber}` : wizard.mode === 'horizontal' ? `Zona ${moduleNumber}` : 'Torre Principal'),
            category: template.category || 'hotel',
            floors,
        };
    });

    return {
        modules: planModules,
        totalModules: planModules.length,
        totalFloors: planModules.reduce((acc, module) => acc + module.floors.length, 0),
        totalRooms: totalRoomsPlanned,
        previewRooms: planModules.flatMap((module) => module.floors.flatMap((floor) => floor.roomNumbers)).slice(0, 12),
    };
};

const StructureWizardModal = ({ open, property, onClose, onCreated }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [wizard, setWizard] = useState(() => buildWizardState(property));

    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(1);
        setError('');
        setWizard(buildWizardState(property));
    }, [open, property]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    const updateMode = (mode) => {
        const nextModules = cloneTemplates(getDefaultTemplates(mode));
        setWizard((current) => ({
            ...current,
            mode,
            numbering: mode === 'multi' ? 'module' : mode === 'horizontal' ? 'villa' : 'classic',
            alphaPrefix: 'A-',
            reuseCurrent: false,
            modules: nextModules,
            levelRows: createLevelRowsFromMode(mode, nextModules),
        }));
    };

    const updateModule = (index, field, value) => {
        setWizard((current) => {
            const nextModules = [...current.modules];
            const numericFields = ['floors', 'roomsPerFloor', 'modulesCount', 'roomsPerModule', 'rows', 'unitsPerRow'];
            nextModules[index] = {
                ...nextModules[index],
                [field]: numericFields.includes(field) ? Number(value) : value,
            };
            return { ...current, modules: nextModules };
        });
    };

    const addModule = () => {
        setWizard((current) => ({
            ...current,
            modules: [
                ...current.modules,
                current.mode === 'horizontal'
                    ? {
                        zoneName: `Sector ${current.modules.length + 1}`,
                        category: 'owner',
                        rows: 3,
                        unitsPerRow: 8,
                    }
                    : current.mode === 'multi'
                        ? {
                            baseName: `Grupo ${current.modules.length + 1}`,
                            category: 'hotel',
                            modulesCount: 3,
                            roomsPerModule: 2,
                        }
                        : {
                        name: `Módulo ${current.modules.length + 1}`,
                        category: 'hotel',
                        floors: 4,
                        roomsPerFloor: 10,
                    },
            ],
            mode: current.mode === 'horizontal' ? 'horizontal' : 'multi',
            numbering: current.mode === 'horizontal' ? 'villa' : 'module',
            reuseCurrent: false,
        }));
    };

    const removeModule = (index) => {
        setWizard((current) => {
            if (current.modules.length === 1) {
                return current;
            }

            const nextModules = current.modules.filter((_, moduleIndex) => moduleIndex !== index);
            const nextMode = current.mode === 'horizontal'
                ? 'horizontal'
                : nextModules.length > 1
                    ? 'multi'
                    : 'single';

            return {
                ...current,
                modules: nextModules,
                mode: nextMode,
                numbering: nextMode === 'horizontal' ? 'villa' : nextMode === 'multi' ? 'module' : 'classic',
            };
        });
    };

    const updateLevelRow = (index, field, value) => {
        setWizard((current) => {
            const nextRows = [...(current.levelRows || [])];
            const numericFields = ['startAt', 'quantity'];
            nextRows[index] = {
                ...nextRows[index],
                [field]: numericFields.includes(field) ? Number(value) : value,
            };

            return {
                ...current,
                levelRows: nextRows,
            };
        });
    };

    const addLevelRow = () => {
        setWizard((current) => {
            const nextRows = [...(current.levelRows || [])];
            const nextIndex = nextRows.length;
            nextRows.push({
                name: current.mode === 'horizontal' ? `Sector ${nextIndex + 1}` : `Piso ${nextIndex}`,
                floorCode: String(nextIndex + 1),
                startAt: 1,
                quantity: 4,
            });

            return {
                ...current,
                levelRows: nextRows,
            };
        });
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        setWizard((current) => {
            const fallbackRows = createLevelRowsFromMode(current.mode, current.modules);
            if (!current.levelRows || current.levelRows.length === 0) {
                return { ...current, levelRows: fallbackRows };
            }

            if (current.mode === 'single') {
                const expectedRows = Math.max(1, Number(current.modules?.[0]?.floors) || 1);
                if (current.levelRows.length !== expectedRows) {
                    return { ...current, levelRows: fallbackRows };
                }
            }

            if (current.mode === 'horizontal') {
                const expectedRows = Math.max(1, Number(current.modules?.[0]?.rows) || 1);
                if (current.levelRows.length !== expectedRows) {
                    return { ...current, levelRows: fallbackRows };
                }
            }

            if (current.mode === 'multi' && current.levelRows.length !== 1) {
                return { ...current, levelRows: fallbackRows };
            }
            return current;
        });
    }, [open, wizard.mode, wizard.modules]);

    if (!open) {
        return null;
    }

    const plan = (() => {
        try {
            return createStructurePlan(property, wizard);
        } catch (planError) {
            return { error: planError.message };
        }
    })();

    const handleSave = async () => {
        if (!property?.id) {
            setError('No hay una propiedad activa para guardar la estructura.');
            return;
        }

        if (plan.error) {
            setError(plan.error);
            return;
        }

        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            };

            for (const modulePlan of plan.modules) {
                const moduleResponse = await fetch('/api/structure/modules', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        property_id: property.id,
                        number: modulePlan.moduleNumber,
                        name: modulePlan.name,
                        category: modulePlan.category,
                    }),
                });

                if (!moduleResponse.ok) {
                    throw new Error(await moduleResponse.text());
                }

                const moduleData = await moduleResponse.json();

                for (const floorPlan of modulePlan.floors) {
                    const floorResponse = await fetch('/api/structure/floors', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            module_id: moduleData.id,
                            code: floorPlan.code,
                            name: floorPlan.name || (floorPlan.code === 'PB' ? 'Planta Baja' : `Piso ${floorPlan.code}`),
                        }),
                    });

                    if (!floorResponse.ok) {
                        throw new Error(await floorResponse.text());
                    }

                    const floorData = await floorResponse.json();

                    for (const roomNumber of floorPlan.roomNumbers) {
                        const roomResponse = await fetch('/api/structure/rooms', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                floor_id: floorData.id,
                                room_number: roomNumber,
                                category: modulePlan.category,
                            }),
                        });

                        if (!roomResponse.ok) {
                            throw new Error(await roomResponse.text());
                        }
                    }
                }
            }

            showToast({
                title: 'Estructura creada',
                message: 'La configuración se generó correctamente.',
                type: 'success',
            });

            onCreated();
            onClose();
        } catch (saveError) {
            const message = saveError?.message?.replace(/^Error:\s*/i, '') || 'No se pudo crear la estructura.';
            setError(message);
            showToast({
                title: 'No se pudo guardar',
                message,
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const levelRows = wizard.levelRows || [];
    const isHorizontalMode = wizard.mode === 'horizontal';
    const numberingCards = [
        {
            value: 'classic',
            title: 'ESTÁNDAR',
            example: '101',
            hint: 'Piso + N°',
            icon: Hash,
        },
        {
            value: 'module',
            title: 'BLOQUE INT.',
            example: '3101',
            hint: 'Prefijo + Piso + N°',
            icon: Layers,
        },
        {
            value: 'alphanumeric',
            title: 'ALFANUMÉRICO',
            example: 'A-101',
            hint: 'Letra + Piso + N°',
            icon: Type,
        },
        {
            value: isHorizontalMode ? 'villa' : 'sequential',
            title: 'SECUENCIAL',
            example: isHorizontalMode ? '01' : '001',
            hint: isHorizontalMode ? 'N° Absoluto (Villas)' : 'N° Absoluto',
            icon: ListOrdered,
        },
    ];

    const getRowPreview = (row, rowIndex) => {
        const start = Math.max(1, Number(row.startAt) || 1);
        const quantity = Math.max(1, Number(row.quantity) || 1);
        const end = start + quantity - 1;
        const floorDigit = getNumericFloorValue(row.floorCode, rowIndex);
        const startPad2 = String(start).padStart(2, '0');
        const endPad2 = String(end).padStart(2, '0');

        if (wizard.numbering === 'alphanumeric') {
            return [`${wizard.alphaPrefix || 'A-'}${floorDigit}${startPad2}`, `${wizard.alphaPrefix || 'A-'}${floorDigit}${endPad2}`];
        }

        if (wizard.numbering === 'module') {
            return [`3${floorDigit}${startPad2}`, `3${floorDigit}${endPad2}`];
        }

        if (wizard.numbering === 'sequential') {
            return [String(start).padStart(3, '0'), String(end).padStart(3, '0')];
        }

        if (wizard.numbering === 'villa') {
            return [String(start).padStart(2, '0'), String(end).padStart(2, '0')];
        }

        return [`${floorDigit}${startPad2}`, `${floorDigit}${endPad2}`];
    };
    const topologyOptions = [
        {
            mode: 'single',
            icon: Building2,
            title: 'Edificio / Torre',
            iconClass: 'text-[var(--color-primary)]',
            iconBg: 'bg-[var(--color-primary)]/10',
        },
        {
            mode: 'multi',
            icon: Layers,
            title: 'Módulos / Villas',
            iconClass: 'text-emerald-400',
            iconBg: 'bg-emerald-500/10',
        },
        {
            mode: 'horizontal',
            icon: MapPin,
            title: 'Zonas Horizontales',
            iconClass: 'text-amber-400',
            iconBg: 'bg-amber-500/10',
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl flex flex-col slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/70 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-[var(--color-primary)]">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl text-white font-extrabold uppercase tracking-[0.04em] leading-none">Asistente de Estructura</h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
                        aria-label="Cerrar asistente"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] overflow-hidden">
                    <aside className="border-b xl:border-b-0 xl:border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]/35 p-4 xl:p-5 space-y-3">
                        {[
                            { id: 1, label: 'Topología', icon: Layers },
                            { id: 2, label: 'Numeración', icon: ListOrdered },
                            { id: 3, label: 'Resumen', icon: Eye },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setStep(item.id)}
                                className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all relative ${step === item.id
                                    ? 'border-[var(--color-primary)]/50 bg-[linear-gradient(145deg,rgba(0,200,190,0.14),rgba(0,200,190,0.05))] shadow-[0_0_0_1px_rgba(0,200,190,0.12)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-hover)]'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl border ${step === item.id
                                            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/12 text-[var(--color-primary)]'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                                            }`}>
                                            <item.icon className="w-5 h-5" />
                                            <span className={`absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full text-[10px] font-extrabold leading-5 text-center ${step === item.id
                                                ? 'bg-[var(--color-primary)] text-[var(--color-bg-primary)]'
                                                : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                                                }`}>
                                                {item.id}
                                            </span>
                                        </div>

                                        <div className="flex flex-col justify-center">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Paso {item.id}</p>
                                            <h4 className="mt-0.5 text-xl font-semibold text-[var(--color-text-primary)] leading-none">{item.label}</h4>
                                        </div>
                                    </div>
                                    {step > item.id && <Check className="w-4 h-4 text-[var(--color-primary)] mt-1" />}
                                </div>
                            </button>
                        ))}
                    </aside>

                    <div className="overflow-y-auto p-5 xl:p-6 space-y-6 max-h-[92vh]">
                        {error && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="rounded-lg bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xl font-bold uppercase tracking-[0.04em] text-[var(--color-text-primary)]">Selecciona la topología principal</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {topologyOptions.map((option) => {
                                        const active = wizard.mode === option.mode;
                                        const Icon = option.icon;

                                        return (
                                            <button
                                                key={option.mode}
                                                onClick={() => updateMode(option.mode)}
                                                className={`rounded-xl border px-4 py-3 text-left transition-all min-h-[82px] flex items-center ${active
                                                    ? 'border-[var(--color-primary)]/50 bg-[linear-gradient(145deg,rgba(0,200,190,0.14),rgba(0,200,190,0.06))] shadow-[0_0_0_1px_rgba(0,200,190,0.16)]'
                                                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]'
                                                    }`}
                                            >
                                                <div className="w-full flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-lg p-2.5 ${option.iconBg}`}>
                                                            <Icon className={`w-4 h-4 ${option.iconClass}`} />
                                                        </div>
                                                        <h5 className="text-lg font-semibold leading-tight text-[var(--color-text-primary)]">{option.title}</h5>
                                                    </div>
                                                    <div className={`h-4 w-4 rounded-full border-2 ${active
                                                        ? 'border-[var(--color-primary)]'
                                                        : 'border-[var(--color-text-muted)]/40'
                                                        }`}>
                                                        {active ? <span className="block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] mt-[3px] ml-[3px]" /> : null}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-[var(--color-text-primary)]">
                                                <span className="rounded-md bg-[var(--color-bg-tertiary)] p-1 text-[var(--color-primary)]">
                                                    {wizard.mode === 'horizontal'
                                                        ? <MapPin className="w-4 h-4" />
                                                        : wizard.mode === 'single'
                                                            ? <Building2 className="w-4 h-4" />
                                                            : <Layers className="w-4 h-4" />}
                                                </span>
                                                    {wizard.mode === 'single'
                                                        ? 'Plantilla de edificio'
                                                        : wizard.mode === 'horizontal'
                                                            ? 'Plantilla de zonas'
                                                            : 'Plantilla de módulos'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={addModule}
                                            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text-primary)] transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                                {wizard.mode === 'single'
                                                    ? 'Añadir Edificio'
                                                    : wizard.mode === 'horizontal'
                                                        ? 'Añadir Zona'
                                                        : 'Añadir Módulos'}
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {wizard.modules.map((module, index) => (
                                            <div key={`${module.name || module.baseName || module.zoneName || 'template'}-${index}`} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
                                                <div className="flex items-center justify-between gap-3 mb-4">
                                                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                                        <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                                {wizard.mode === 'single'
                                                                    ? module.name || `Torre ${index + 1}`
                                                                    : wizard.mode === 'horizontal'
                                                                        ? module.zoneName || `Zona ${index + 1}`
                                                                        : module.baseName || `Grupo ${index + 1}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeModule(index)}
                                                        disabled={wizard.modules.length === 1}
                                                        className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] disabled:opacity-40 hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/40 transition-colors"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>

                                                {wizard.mode === 'single' && (
                                                    <>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div className="space-y-1.5 md:col-span-2">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Nombre del Edifico / Torre</label>
                                                                <input
                                                                    type="text"
                                                                    value={module.name}
                                                                    onChange={(event) => updateModule(index, 'name', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                    placeholder={`Torre ${index + 1}`}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Niveles / Pisos</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={module.floors}
                                                                    onChange={(event) => updateModule(index, 'floors', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Hab. por Nivel</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={module.roomsPerFloor}
                                                                    onChange={(event) => updateModule(index, 'roomsPerFloor', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[var(--color-text-muted)]">Tipo: Edificación</span>
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-primary)]/10 px-2.5 py-1 text-[var(--color-primary)]">{module.floors} pisos</span>
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[var(--color-text-muted)]">{module.roomsPerFloor} hab/piso aprox</span>
                                                        </div>
                                                    </>
                                                )}

                                                {wizard.mode === 'multi' && (
                                                    <>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div className="space-y-1.5 md:col-span-2">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Nombre Módulo</label>
                                                                <input
                                                                    type="text"
                                                                    value={module.baseName}
                                                                    onChange={(event) => updateModule(index, 'baseName', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                    placeholder={`Grupo ${index + 1}`}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Cant. de Módulos</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={module.modulesCount}
                                                                    onChange={(event) => updateModule(index, 'modulesCount', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Hab. por Módulo</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={module.roomsPerModule}
                                                                    onChange={(event) => updateModule(index, 'roomsPerModule', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[var(--color-text-muted)]">Tipo: Bloques Independientes</span>
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-primary)]/10 px-2.5 py-1 text-[var(--color-primary)]">Se crearán {module.modulesCount} módulos</span>
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[var(--color-text-muted)]">{module.roomsPerModule} hab/módulo</span>
                                                        </div>
                                                    </>
                                                )}

                                                {wizard.mode === 'horizontal' && (
                                                    <>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                            <div className="space-y-1.5 md:col-span-2">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Nombre de la Zona</label>
                                                                <input
                                                                    type="text"
                                                                    value={module.zoneName}
                                                                    onChange={(event) => updateModule(index, 'zoneName', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                    placeholder={`Sector ${index + 1}`}
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Calles / Filas</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={module.rows}
                                                                    onChange={(event) => updateModule(index, 'rows', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Unidades por Calle</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={module.unitsPerRow}
                                                                    onChange={(event) => updateModule(index, 'unitsPerRow', event.target.value)}
                                                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[var(--color-text-muted)]">Tipo: Área abierta</span>
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-primary)]/10 px-2.5 py-1 text-[var(--color-primary)]">{module.rows} calles/filas</span>
                                                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[var(--color-text-muted)]">{module.unitsPerRow} unidades/calle</span>
                                                        </div>
                                                    </>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {step === 2 && (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="rounded-lg bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
                                        <ListOrdered className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xl font-bold uppercase tracking-[0.04em] text-[var(--color-text-primary)]">Formato de Nomenclatura</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {numberingCards.map((card) => {
                                        const active = wizard.numbering === card.value;
                                        const Icon = card.icon;

                                        return (
                                            <button
                                                key={card.value}
                                                type="button"
                                                onClick={() => setWizard((current) => ({ ...current, numbering: card.value }))}
                                                className={`group relative flex flex-col rounded-[14px] border px-3.5 py-3 text-left transition-all ${
                                                    active
                                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]-[0.03] shadow-[0_0_15px_rgba(0,200,190,0.05)]'
                                                        : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]'
                                                }`}
                                            >
                                                <div className="flex w-full items-start justify-between mb-3">
                                                    <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-primary)] transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                    </span>
                                                    <div className={`flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] transition-colors mt-[3px] ${active ? 'border-[var(--color-primary)]' : 'border-[var(--color-text-muted)]/40 group-hover:border-[var(--color-border-hover)]'}`}>
                                                        {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-0.5 mt-auto">
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                                        {card.title}
                                                    </p>
                                                    <p className={`text-[1.4rem] leading-none font-bold tracking-tight ${active ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
                                                        {card.example}
                                                    </p>
                                                    <p className="text-[9.5px] font-medium text-[var(--color-text-muted)] mt-0.5">
                                                        {card.hint}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {wizard.numbering === 'alphanumeric' && (
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">Prefijo alfanumérico</label>
                                            <input
                                                type="text"
                                                value={wizard.alphaPrefix || ''}
                                                onChange={(event) => setWizard((current) => ({ ...current, alphaPrefix: event.target.value }))}
                                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                placeholder="A-"
                                            />
                                        </div>
                                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-3 text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                                            <Edit2 className="w-4 h-4 text-[var(--color-primary)]" />
                                            <span>Se aplicará al inicio de cada número generado.</span>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="text-2xl font-bold text-[var(--color-text-primary)]">2. Plantilla de Niveles y Vista Previa</h4>
                                        <button
                                            onClick={addLevelRow}
                                            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3.5 py-2 text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/60 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Añadir Nivel
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
                                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] gap-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)] pb-3 border-b border-[var(--color-border)]">
                                            <span>{wizard.mode === 'horizontal' ? 'Sector/Zona' : 'Nivel (Nombre)'}</span>
                                            <span>Cód. Piso</span>
                                            <span>N° Inicio</span>
                                            <span>Cantidad</span>
                                            <span className="text-[var(--color-primary)] flex items-center gap-1"><Eye className="w-3.5 h-3.5" />Vista Previa</span>
                                        </div>

                                        <div className="space-y-2.5 pt-3">
                                            {levelRows.map((row, index) => {
                                                const [previewStart, previewEnd] = getRowPreview(row, index);
                                                const lockFloorCode = wizard.numbering === 'sequential' || wizard.numbering === 'villa';

                                                return (
                                                    <div key={`${row.name}-${index}`} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.4fr] gap-3 items-center">
                                                        <input
                                                            type="text"
                                                            value={row.name}
                                                            onChange={(event) => updateLevelRow(index, 'name', event.target.value)}
                                                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={row.floorCode}
                                                            onChange={(event) => updateLevelRow(index, 'floorCode', event.target.value)}
                                                            disabled={lockFloorCode}
                                                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-center text-[var(--color-text-primary)] disabled:opacity-50 focus:border-[var(--color-primary)] focus:outline-none"
                                                        />
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={row.startAt}
                                                            onChange={(event) => updateLevelRow(index, 'startAt', event.target.value)}
                                                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-center text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                        />
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={row.quantity}
                                                            onChange={(event) => updateLevelRow(index, 'quantity', event.target.value)}
                                                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-center text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                        />
                                                        <div className="justify-self-start rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">
                                                            {previewStart} &rarr; {previewEnd}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {step === 3 && (
                            <section className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Módulos</p>
                                        <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{plan.totalModules}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Niveles</p>
                                        <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{plan.totalFloors}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Habitaciones</p>
                                        <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{plan.totalRooms}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Modo</p>
                                        <p className="mt-1 text-lg font-bold text-[var(--color-text-primary)] capitalize">{wizard.mode === 'multi' ? 'Varios módulos' : wizard.mode === 'horizontal' ? 'Horizontal villas/bungalows' : 'Edificio único'}</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Estructura que se generará</h4>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">La vista previa muestra los módulos y sus primeros niveles.</p>
                                        </div>
                                        <span className="text-xs text-[var(--color-text-muted)]">{wizard.numbering === 'sequential' ? 'Numeración secuencial' : 'Numeración estructurada'}</span>
                                    </div>

                                    <div className="space-y-3 max-h-[34vh] overflow-y-auto pr-1">
                                        {plan.modules.map((module) => (
                                            <div key={module.moduleNumber} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{module.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {module.floors.length} niveles · {module.floors.reduce((acc, floor) => acc + floor.roomNumbers.length, 0)} habitaciones
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                                                        Módulo {module.moduleNumber}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                    {module.floors.slice(0, 4).map((floor) => (
                                                        <div key={`${module.moduleNumber}-${floor.code}`} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{floor.code}</p>
                                                                <span className="text-[10px] text-[var(--color-text-muted)]">{floor.roomNumbers.length} hab.</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {floor.roomNumbers.slice(0, 4).map((roomNumber) => (
                                                                    <span key={roomNumber} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-primary)]">
                                                                        {roomNumber}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div className="text-xs text-[var(--color-text-muted)]">
                        {plan.error ? plan.error : 'Puedes volver a cualquier paso antes de guardar.'}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <Button variant="ghost" onClick={onClose} disabled={saving} className="!rounded-full">
                            Cancelar
                        </Button>
                        {step > 1 && (
                            <Button
                                variant="secondary"
                                onClick={() => setStep((current) => current - 1)}
                                disabled={saving}
                                className="!rounded-full"
                            >
                                Atrás
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button
                                variant="register"
                                onClick={() => setStep((current) => current + 1)}
                                disabled={saving || Boolean(plan.error)}
                                className="!rounded-full"
                            >
                                Siguiente
                            </Button>
                        ) : (
                            <Button
                                variant="register"
                                onClick={handleSave}
                                disabled={saving || Boolean(plan.error)}
                                className="!rounded-full"
                            >
                                {saving ? 'Creando estructura...' : 'Crear estructura'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Shared Components ────────────────────────────────────────────────────────

const ToggleSwitch = ({ checked, onChange, disabled, size = "md", activeLabel, inactiveLabel }) => {
    const height = size === "sm" ? "h-5" : "h-6";
    const width = size === "sm" ? "w-9" : "w-11";
    const circleSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
    // Centering calculation:
    // Container height: h-5 (20px) or h-6 (24px)
    // Circle height: h-3 (12px) or h-4 (16px)
    // Vertical gap: (20-12)/2 = 4px or (24-16)/2 = 4px.
    // Border is 2px. So inner gap is 2px.
    // translate-x for ON state: width (36 or 44) - circle (12 or 16) - 2*gap (4) - borders (4) ? 
    // Let's use flexbox for easier centering or absolute with precise values.
    
    // Using flex + padding/gap approach for cleaner CSS
    // But absolute is standard for switches.
    const translate = size === "sm" ? "translate-x-4" : "translate-x-5";

    return (
        <div className="flex items-center gap-2">
            {(activeLabel || inactiveLabel) && (
                <span className={`text-[10px] font-bold tracking-wider uppercase ${checked ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {checked ? activeLabel : inactiveLabel}
                </span>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`
                    relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                    ${height} ${width}
                    ${checked ? 'bg-[var(--color-primary)]' : 'bg-zinc-700'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <span
                    aria-hidden="true"
                    className={`
                        pointer-events-none inline-block rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out absolute top-1/2 left-[2px] -translate-y-1/2
                        ${circleSize}
                        ${checked ? translate : 'translate-x-0'}
                    `}
                />
            </button>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, bgClass }) => (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-3 flex items-start justify-between shadow-sm hover:border-[var(--color-border-hover)] transition-colors">
        <div>
            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{label}</p>
            <h4 className="text-xl font-bold text-[var(--color-text-primary)] mt-0.5">{value}</h4>
            {subtext && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-medium">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
    </div>
);

// ── Room Card (Level 3) ──────────────────────────────────────────────────────

const RoomCard = ({ room, onToggle }) => {
    const isActive = room.status === 'active';
    
    // Estilos para estado Inactivo (Oscuro/Apagado) vs Activo
    const containerClasses = isActive
        ? "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 shadow-sm"
        : "bg-black/40 border-red-900/20"; // Fondo muy oscuro para inactivos
    
    const textNumberClasses = isActive
        ? "text-[var(--color-text-primary)]"
        : "text-zinc-600 line-through decoration-red-900/50 decoration-2";

    const iconColor = isActive 
        ? "text-[var(--color-primary)]" 
        : "text-red-900/40";

    return (
        <div className={`relative flex flex-col p-2 rounded-lg border transition-all duration-200 ${containerClasses}`}>
            {/* Header: Icono + Switch */}
            <div className="flex justify-between items-start mb-2">
                <div className={`flex items-center gap-2 ${isActive ? '' : 'opacity-50'}`}>
                    <BedDouble className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <ToggleSwitch 
                    checked={isActive} 
                    onChange={() => onToggle(room.id, isActive ? 'inactive' : 'active')} 
                    size="sm" 
                />
            </div>
            
            {/* Body: Numero + Tipo */}
            <div className="mt-0.5">
                <span className={`text-sm font-bold block ${textNumberClasses}`}>
                    {room.room_number}
                </span>
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 rounded-md inline-block mt-1 ${isActive ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]' : 'bg-red-950/20 text-red-900 border border-red-900/10'}`}>
                   {isActive ? (room.type || 'Standard') : 'Mantenimiento'}
                </span>
            </div>

            {/* Inactive Overlay Text */}
            {!isActive && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-red-900/60">
                    <span className="text-[9px] font-black tracking-tighter">O.O.O</span>
                    <AlertCircle className="w-2.5 h-2.5" />
                </div>
            )}
        </div>
    );
};

// ── Floor Section (Level 2) ──────────────────────────────────────────────────

const FloorSection = ({ floor, onToggleFloor, onToggleRoom }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const activeRooms = floor.rooms.filter(r => r.status === 'active').length;
    
    return (
        <div className="relative pl-5 pb-2">
             {/* Línea conectora vertical */}
            <div className="absolute left-[10px] top-0 bottom-0 w-px bg-[var(--color-border)] opacity-50"></div>
            
            <div className="bg-[var(--color-bg-tertiary)]/30 border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-border-hover)] transition-colors">
                {/* Floor Header */}
                <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-tertiary)]/10 border-b border-[var(--color-border)]/50">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-muted)]"
                    >
                         {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                            {floor.name || `Piso ${floor.code}`}
                        </span>
                    </div>

                    <div className="h-3 w-px bg-[var(--color-border)] mx-1"></div>
                    
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                        {floor.rooms.length} habitaciones
                    </span>

                    <div className="ml-auto flex items-center gap-3">
                        <ToggleSwitch 
                            checked={floor.is_active} 
                            onChange={(val) => onToggleFloor(floor.id, val)}
                            size="sm"
                        />
                    </div>
                </div>

                {/* Floor Content: Room Grid */}
                {isExpanded && (
                    <div className="p-2 bg-[var(--color-bg-primary)]/50">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                            {floor.rooms.map(room => (
                                <RoomCard 
                                    key={room.id} 
                                    room={room} 
                                    onToggle={onToggleRoom} 
                                />
                            ))}
                            
                            {/* Botón Añadir Habitación Compacto */}
                            <button className="group flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all gap-1 min-h-[80px]">
                                <div className="p-1.5 rounded-full bg-[var(--color-bg-tertiary)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                                    <Plus className="w-3.5 h-3.5 centered" />
                                </div>
                                <span className="text-[9px] font-medium uppercase tracking-wide">Añadir Hab.</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Building Card (Level 1) ──────────────────────────────────────────────────

const BuildingCard = ({ module, onToggleModule, onToggleFloor, onToggleRoom }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    // Calcular estadísticas locales
    const totalFloors = module.floors.length;
    const totalRooms = module.floors.reduce((acc, f) => acc + f.rooms.length, 0);

    return (
        <div className={`group bg-[var(--color-bg-secondary)] border rounded-xl transition-all duration-300 shadow-sm ${module.is_active ? 'border-[var(--color-border)]' : 'border-red-900/30 bg-red-950/10'}`}>
            {/* Header del Edificio */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 ${module.is_active ? 'bg-[var(--color-bg-tertiary)]/30' : 'bg-transparent'} rounded-t-xl`}>
                
                {/* Left: Controls & Title */}
                <div className="flex items-center gap-3">
                    <button 
                         onClick={() => setIsExpanded(!isExpanded)}
                         className="p-1.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md hover:border-[var(--color-text-muted)] transition-colors text-[var(--color-text-secondary)]"
                    >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                             <div className={`p-1 rounded-md ${module.is_active ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-red-900/20 text-red-700'}`}>
                                <Building2 className="w-3.5 h-3.5" />
                            </div>
                            <h3 className={`text-base font-bold ${module.is_active ? 'text-[var(--color-text-primary)]' : 'text-zinc-500 line-through'}`}>
                                {module.name || `Edificio ${module.number}`}
                            </h3>
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded">
                                {module.category === 'owner' ? 'Villa' : 'Edificio'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] mt-0.5 ml-0.5">
                            <span>Niveles: <strong className="text-[var(--color-text-secondary)]">{totalFloors}</strong></span>
                            <span className="w-0.5 h-0.5 rounded-full bg-zinc-600"></span>
                            <span>Unidades: <strong className="text-[var(--color-text-secondary)]">{totalRooms}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Toggle */}
                <div className="flex items-center gap-3 pl-10 sm:pl-0">
                    <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1.5 hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <ToggleSwitch 
                        checked={module.is_active} 
                        onChange={(val) => onToggleModule(module.id, val)}
                        activeLabel="Operativo"
                        inactiveLabel="Clausurado"
                    />
                </div>
            </div>

            {/* Contenido Colapsable (Pisos) */}
            {isExpanded && (
                <div className={`p-3 space-y-3 ${!module.is_active && 'opacity-40 grayscale pointer-events-none'}`}>
                    <div className="space-y-3 pt-0.5">
                         {module.floors.map(floor => (
                            <FloorSection 
                                key={floor.id} 
                                floor={floor} 
                                onToggleFloor={onToggleFloor}
                                onToggleRoom={onToggleRoom}
                            />
                        ))}
                    </div>
                    
                    {/* Botón Añadir Nivel Footer */}
                    <button className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)]/20 hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Añadir Nivel</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function HotelStructureTab() {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const { showToast } = useToast();

    const fetchTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/structure/tree', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al cargar la estructura');
            const data = await res.json();
            setProperty(data.property);
        } catch (err) {
            setError(err.message);
            showToast({
                title: 'No se pudo cargar la estructura',
                message: err.message,
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchTree(); }, [fetchTree]);

    // Mock functions (replace with real API calls if needed)
    const patchEntity = async (entity, id, body) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/structure/${entity}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            await fetchTree(); // Refresh
        } catch (e) { console.error(e); }
    };

    const handleToggleModule = (id, newActive) => patchEntity('modules', id, { is_active: newActive });
    const handleToggleFloor = (id, newActive) => patchEntity('floors', id, { is_active: newActive });
    const handleToggleRoom = (id, newStatus) => patchEntity('rooms', id, { status: newStatus });
    const handleStructureCreated = () => {
        fetchTree();
    };

    // Loading & Metrics
    if (loading && !property) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" /></div>;
    }

    const totalBuildings = property?.modules?.length || 0;
    const totalFloors = property?.modules?.reduce((acc, m) => acc + m.floors.length, 0) || 0;
    const totalRooms = property?.modules?.reduce((acc, m) => acc + m.floors.reduce((accF, f) => accF + f.rooms.length, 0), 0) || 0;
    const activeRooms = property?.modules?.reduce((acc, m) => acc + m.floors.reduce((accF, f) => accF + f.rooms.filter(r => r.status === 'active').length, 0), 0) || 0;
    const maintenanceRooms = totalRooms - activeRooms;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <div className="flex items-center gap-2 text-[var(--color-primary)] mb-1">
                        <MapPin className="w-5 h-5" />
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                            Estructura Física del Complejo
                        </h2>
                   </div>
                </div>
                <Button variant="register" icon={Plus} onClick={() => setIsWizardOpen(true)}>
                    Crear Estructura
                </Button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Metrics */}
            {property && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        icon={Building2} label="Edificios / Zonas" value={totalBuildings} 
                        bgClass="bg-blue-500/10" colorClass="text-blue-500" 
                    />
                    <StatCard 
                        icon={Layers} label="Niveles / Pisos" value={totalFloors} 
                        bgClass="bg-amber-500/10" colorClass="text-amber-500" 
                    />
                    <StatCard 
                        icon={BedDouble} label="Hab. Activas" value={activeRooms} 
                        subtext={`${activeRooms}/${totalRooms}`}
                        bgClass="bg-emerald-500/10" colorClass="text-emerald-500" 
                    />
                    <StatCard 
                        icon={Wrench} label="Mantenimiento" value={maintenanceRooms} 
                        bgClass="bg-rose-500/10" colorClass="text-rose-500" 
                    />
                </div>
            )}

            {/* Tree */}
            <div className="space-y-6">
                {property?.modules?.map(module => (
                    <BuildingCard 
                        key={module.id} module={module} 
                        onToggleModule={handleToggleModule}
                        onToggleFloor={handleToggleFloor}
                        onToggleRoom={handleToggleRoom}
                    />
                ))}
                
                {/* Empty State */}
                {(!property?.modules || property?.modules.length === 0) && (
                     <div className="text-center py-16 bg-[var(--color-bg-secondary)] rounded-2xl border border-dashed border-[var(--color-border)] opacity-60">
                        <Building2 className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Sin Estructura</h3>
                        <p className="text-[var(--color-text-secondary)]">Añade tu primer edificio para comenzar.</p>
                     </div>
                )}
            </div>

            <StructureWizardModal
                open={isWizardOpen}
                property={property}
                onClose={() => setIsWizardOpen(false)}
                onCreated={handleStructureCreated}
            />
        </div>
    );
}
