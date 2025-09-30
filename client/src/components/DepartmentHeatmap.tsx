import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function DepartmentHeatmap() {
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['/api/dashboard/departments', selectedYear, selectedQuarter],
    queryFn: () => apiClient.getDepartmentPerformance(selectedYear, selectedQuarter),
  });

  const getStatusColor = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return 'bg-green-500 text-white';
      case 'amber':
        return 'bg-yellow-500 text-white';
      case 'red':
        return 'bg-red-500 text-white';
    }
  };

  const getProgressColor = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return 'bg-green-500';
      case 'amber':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
    }
  };

  const handleExport = () => {
    // Generate CSV data
    if (!departments) return;
    
    const csvData = [
      ['Department', 'Code', 'Score', 'Status', 'KPI Count', 'Trend'],
      ...departments.map(dept => [
        dept.name,
        dept.code,
        `${dept.score}%`,
        dept.status.toUpperCase(),
        dept.kpiCount.toString(),
        `${dept.trend > 0 ? '+' : ''}${dept.trend}%`
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `department-performance-Q${selectedQuarter}-${selectedYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Department Performance Heatmap
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select 
              value={`Q${selectedQuarter} ${selectedYear}`}
              onValueChange={(value) => {
                const [quarter, year] = value.split(' ');
                setSelectedQuarter(parseInt(quarter.substring(1)));
                setSelectedYear(parseInt(year));
              }}
            >
              <SelectTrigger className="w-32" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={`Q${currentQuarter} ${currentYear}`}>Q{currentQuarter} {currentYear}</SelectItem>
                <SelectItem value={`Q${currentQuarter - 1 || 4} ${currentQuarter === 1 ? currentYear - 1 : currentYear}`}>
                  Q{currentQuarter - 1 || 4} {currentQuarter === 1 ? currentYear - 1 : currentYear}
                </SelectItem>
                <SelectItem value={`Q${currentQuarter - 2 || (currentQuarter === 1 ? 3 : 4)} ${currentQuarter <= 2 ? currentYear - 1 : currentYear}`}>
                  Q{currentQuarter - 2 || (currentQuarter === 1 ? 3 : 4)} {currentQuarter <= 2 ? currentYear - 1 : currentYear}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleExport}
              disabled={!departments}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-muted rounded-lg p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {departments?.map((dept) => (
              <div
                key={dept.id}
                className="bg-muted rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                data-testid={`department-card-${dept.code}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm text-foreground">{dept.code}</h3>
                  <Badge 
                    className={cn("text-xs px-2 py-1 font-medium", getStatusColor(dept.status))}
                    data-testid={`status-${dept.code}`}
                  >
                    {dept.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1" data-testid={`score-${dept.code}`}>
                  {dept.score}%
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {dept.kpiCount} KPIs
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={dept.score} 
                    className="h-2"
                    data-testid={`progress-${dept.code}`}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={cn(
                      "font-medium",
                      dept.trend > 0 ? "text-green-600" : dept.trend < 0 ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {dept.trend > 0 ? '+' : ''}{dept.trend}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
