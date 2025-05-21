
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
  className?: string; // For border color, e.g., "border-primary", "border-sky-500"
  href?: string;
}

export function SummaryCard({ title, value, icon: Icon, description, className, href }: SummaryCardProps) {
  const cardContent = (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border-l-4 bg-card text-card-foreground",
      className, // This will apply the border color class
      href ? "hover:bg-muted/50" : ""
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={cn("h-6 w-6 text-muted-foreground", className?.replace("border-", "text-"))} /> 
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
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
