
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  // iconColorClass is less relevant if the whole card is themed
  // but can be used if we want to color icons differently from text.
  // For now, icons will inherit text-primary-foreground.
}

export function SummaryCard({ title, value, icon: Icon, description }: SummaryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-primary text-primary-foreground p-4 rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-0 mb-2">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary-foreground opacity-75" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-primary-foreground opacity-75 pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
