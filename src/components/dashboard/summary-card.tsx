
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
  href?: string; // Nueva propiedad para el enlace
}

export function SummaryCard({ title, value, icon: Icon, description, className, href }: SummaryCardProps) {
  const cardContent = (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 text-primary-foreground p-4 rounded-lg border-2 border-primary-foreground/20",
      className,
      href ? "hover:bg-primary/80" : "" // Ligero cambio al hacer hover si es un enlace
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 p-0 mb-2">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
        <Icon className="h-7 w-7 text-primary-foreground opacity-80" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-primary-foreground opacity-75 pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
