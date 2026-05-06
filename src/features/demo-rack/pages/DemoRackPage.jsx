import { useState, useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import RoomCard from '../components/RoomCard';
import RoomDetailDialog from '../components/RoomDetailDialog';

const ROOM_TYPES = ['Sencilla', 'Doble', 'Suite', 'Familiar'];
const STATUSES = ['disponible', 'ocupada', 'limpieza', 'mantenimiento'];

function generateMockRooms() {
    const rooms = [];
    let id = 1;
    for (let floor = 1; floor <= 3; floor++) {
        for (let room = 1; room <= 8; room++) {
            const number = floor * 100 + room;
            const type = ROOM_TYPES[Math.floor(Math.random() * ROOM_TYPES.length)];
            const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
            const guest = status === 'ocupada' ? {
                name: `Huésped ${id}`,
                checkIn: '2026-05-01',
                checkOut: '2026-05-07',
                adults: Math.floor(Math.random() * 3) + 1,
                children: Math.floor(Math.random() * 2),
            } : null;

            rooms.push({
                id: String(id),
                number: String(number),
                floor: String(floor),
                type,
                status,
                guest,
                price: Math.floor(Math.random() * 100) + 50,
            });
            id++;
        }
    }
    return rooms;
}

const mockRooms = generateMockRooms();

export default function DemoRackPage() {
    const [selectedRoom, setSelectedRoom] = useState(null);

    const stats = useMemo(() => {
        const total = mockRooms.length;
        const disponible = mockRooms.filter(r => r.status === 'disponible').length;
        const ocupada = mockRooms.filter(r => r.status === 'ocupada').length;
        const limpieza = mockRooms.filter(r => r.status === 'limpieza').length;
        const mantenimiento = mockRooms.filter(r => r.status === 'mantenimiento').length;
        return { total, disponible, ocupada, limpieza, mantenimiento };
    }, []);

    const floors = ['1', '2', '3'];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Demo Rack de Habitaciones</h1>
                    <p className="text-sm text-[var(--color-text-muted)]">Ejemplo de diseño con shadcn/ui</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <StatBox label="Total" value={stats.total} color="text-[var(--color-text-primary)]" bg="bg-[var(--color-bg-secondary)]" />
                <StatBox label="Disponibles" value={stats.disponible} color="text-[var(--color-success)]" bg="bg-[var(--color-success)]/10" />
                <StatBox label="Ocupadas" value={stats.ocupada} color="text-[var(--color-danger)]" bg="bg-[var(--color-danger)]/10" />
                <StatBox label="Limpieza" value={stats.limpieza} color="text-[var(--color-warning)]" bg="bg-[var(--color-warning)]/10" />
                <StatBox label="Mantenimiento" value={stats.mantenimiento} color="text-[var(--color-text-muted)]" bg="bg-[var(--color-text-muted)]/10" />
            </div>

            <Separator className="bg-[var(--color-border)]" />

            <Tabs defaultValue="todos" className="w-full">
                <TabsList className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <TabsTrigger value="todos" className="data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">
                        Todos
                    </TabsTrigger>
                    {floors.map(f => (
                        <TabsTrigger key={f} value={f} className="data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">
                            Piso {f}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="todos" className="mt-4">
                    <RoomGrid rooms={mockRooms} onRoomClick={setSelectedRoom} />
                </TabsContent>
                {floors.map(f => (
                    <TabsContent key={f} value={f} className="mt-4">
                        <RoomGrid rooms={mockRooms.filter(r => r.floor === f)} onRoomClick={setSelectedRoom} />
                    </TabsContent>
                ))}
            </Tabs>

            <RoomDetailDialog room={selectedRoom} onClose={() => setSelectedRoom(null)} />
        </div>
    );
}

function StatBox({ label, value, color, bg }) {
    return (
        <div className={`rounded-xl border border-[var(--color-border)] p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{label}</p>
        </div>
    );
}

function RoomGrid({ rooms, onRoomClick }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {rooms.map(room => (
                <RoomCard key={room.id} room={room} onClick={() => onRoomClick(room)} />
            ))}
        </div>
    );
}
