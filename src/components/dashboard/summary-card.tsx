
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string; 
}

export function SummaryCard({ title, value, icon: Icon, description, className }: SummaryCardProps) {
  return (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 bg-primary text-primary-foreground p-4 rounded-lg border-2 border-primary-foreground/20",
      className
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-0 mb-2">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
        <Icon className="h-6 w-6 text-primary-foreground opacity-80" />
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
