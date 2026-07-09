import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@shared/common/Card';

export default function ChartCard({ title, description, children, className = '' }) {
    return (
        <Card padding="md" className={className}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}
