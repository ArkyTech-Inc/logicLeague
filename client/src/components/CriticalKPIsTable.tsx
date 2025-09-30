import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';

export default function CriticalKPIsTable() {
  const { data: criticalKPIs, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/critical-kpis'],
    queryFn: () => apiClient.getCriticalKPIs(),
  });

  const getStatusColor = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return 'rag-green';
      case 'amber':
        return 'rag-amber';
      case 'red':
        return 'rag-red';
    }
  };

  const getStatusText = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return 'ON TRACK';
      case 'amber':
        return 'OFF TRACK';
      case 'red':
        return 'CRITICAL';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Critical KPIs Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !criticalKPIs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Critical KPIs Requiring Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load critical KPIs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter to show only amber and red KPIs
  const criticalOnly = criticalKPIs.filter(kpi => kpi.status === 'amber' || kpi.status === 'red');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Critical KPIs Requiring Attention
          </CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-kpis">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {criticalOnly.length === 0 ? (
          <div className="text-center py-8 px-6">
            <p className="text-muted-foreground">No critical KPIs at this time</p>
            <p className="text-sm text-muted-foreground mt-1">All KPIs are performing within acceptable ranges</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    KPI
                  </TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Department
                  </TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Current
                  </TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Target
                  </TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card divide-y divide-border">
                {criticalOnly.map((kpi) => (
                  <TableRow 
                    key={kpi.id} 
                    className="hover:bg-muted/30"
                    data-testid={`kpi-row-${kpi.id}`}
                  >
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">{kpi.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {kpi.pillar.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {kpi.department.code}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {kpi.currentActual ? `${kpi.currentActual.actualValue}${kpi.unit === 'percentage' ? '%' : ''}` : 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {kpi.currentTarget ? `${kpi.currentTarget.targetValue}${kpi.unit === 'percentage' ? '%' : ''}` : 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        className={cn("text-xs px-2 py-1 font-semibold", getStatusColor(kpi.status))}
                        data-testid={`status-badge-${kpi.id}`}
                      >
                        {getStatusText(kpi.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 font-medium"
                        data-testid={`button-view-details-${kpi.id}`}
                      >
                        View Details
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
