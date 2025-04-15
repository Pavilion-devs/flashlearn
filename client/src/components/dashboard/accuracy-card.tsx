import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AccuracyItem {
  type: string;
  percentage: number;
}

interface AccuracyCardProps {
  items: AccuracyItem[];
}

export function AccuracyCard({ items }: AccuracyCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-5">
        <h3 className="font-medium text-lg mb-4">Accuracy</h3>
        <div className="flex flex-col space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-neutral-600">{item.type}</span>
              <div className="w-20 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    item.percentage >= 80 ? 'bg-success' : 
                    item.percentage >= 60 ? 'bg-accent' : 'bg-secondary-400'
                  }`} 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
