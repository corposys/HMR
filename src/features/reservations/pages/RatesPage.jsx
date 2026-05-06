import { useState } from 'react';
import { Calendar, Grid3X3 } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import SeasonManager from '@features/reservations/components/SeasonManager';
import RateMatrix from '@features/reservations/components/RateMatrix';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function RatesPage() {
    const [activeTab, setActiveTab] = useState('seasons');

    return (
        <PageWrapper>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-2">
                    <TabsTrigger value="seasons" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Temporadas
                    </TabsTrigger>
                    <TabsTrigger value="matrix" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <Grid3X3 className="w-4 h-4" /> Tarifas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="seasons" className="mt-0">
                    <SeasonManager />
                </TabsContent>
                <TabsContent value="matrix" className="mt-0">
                    <RateMatrix />
                </TabsContent>
            </Tabs>
        </PageWrapper>
    );
}
