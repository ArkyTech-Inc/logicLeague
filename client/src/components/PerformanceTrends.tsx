import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Mock data for trends
const mockTrendData = [
  { period: 'Q1 2024', DLCB: 65, DEID: 78, DGCS: 45, DEGS: 85 },
  { period: 'Q2 2024', DLCB: 70, DEID: 82, DGCS: 52, DEGS: 88 },
  { period: 'Q3 2024', DLCB: 72, DEID: 85, DGCS: 48, DEGS: 90 },
  { period: 'Q4 2024', DLCB: 75, DEID: 87, DGCS: 50, DEGS: 92 },
  { period: 'Q1 2025', DLCB: 76, DEID: 89, DGCS: 54, DEGS: 92 },
];

const departmentColors = {
  DLCB: '#f59e0b',
  DEID: '#10b981',
  DGCS: '#ef4444',
  DEGS: '#3b82f6',
};

export default function PerformanceTrends() {
  const [viewBy, setViewBy] = useState<'department' | 'pillar'>('department');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Performance Trends
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={viewBy === 'pillar' ? 'default' : 'outline'}
              onClick={() => setViewBy('pillar')}
              data-testid="button-view-pillar"
            >
              By Pillar
            </Button>
            <Button
              size="sm"
              variant={viewBy === 'department' ? 'default' : 'outline'}
              onClick={() => setViewBy('department')}
              data-testid="button-view-department"
            >
              By Department
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {viewBy === 'department' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend />
                {Object.entries(departmentColors).map(([dept, color]) => (
                  <Line
                    key={dept}
                    type="monotone"
                    dataKey={dept}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: color }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Pillar Performance Trends</p>
                <p className="text-sm text-muted-foreground">
                  Chart showing performance trends by SRAP pillars will be displayed here
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
