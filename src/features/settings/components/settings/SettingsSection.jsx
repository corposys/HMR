import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/ui/card';

export function SettingsSection({ title, description, icon: Icon, children, className = '' }) {
    return (
        <Card className={`bg-[var(--color-bg-secondary)] border-[var(--color-border)] ${className}`}>
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-[var(--color-primary)]/10">
                            <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">{children}</CardContent>
        </Card>
    );
}