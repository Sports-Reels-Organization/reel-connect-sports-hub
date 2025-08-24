
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface PageFallbackProps {
  title: string;
  description?: string;
}

export const PageFallback: React.FC<PageFallbackProps> = ({ 
  title, 
  description = "This page is under construction or experiencing issues." 
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
