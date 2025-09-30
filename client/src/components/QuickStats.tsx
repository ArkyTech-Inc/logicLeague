import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Building, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';

export default function QuickStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => apiClient.getQuickStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Failed to load stats</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Overall Performance',
      value: `${stats.overallPerformance}%`,
      icon: Target,
      trend: stats.trends.overallTrend,
      trendText: `${stats.trends.overallTrend > 0 ? '+' : ''}${stats.trends.overallTrend}% from last quarter`,
      bgColor: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      title: 'Active KPIs',
      value: stats.activeKPIs.toString(),
      icon: Target,
      trend: null,
      trendText: `${stats.trends.onTrackPercentage}% on track`,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Departments',
      value: stats.departments.toString(),
      icon: Building,
      trend: null,
      trendText: `${stats.trends.needAttentionCount} need attention`,
      bgColor: 'bg-accent',
      iconColor: 'text-accent-foreground',
    },
    {
      title: 'Alerts',
      value: stats.alerts.toString(),
      icon: AlertTriangle,
      trend: null,
      trendText: `${stats.trends.criticalAlertsCount} critical`,
      bgColor: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid={`stat-value-${index}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`h-12 w-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                  <IconComponent className={`${stat.iconColor} text-xl h-6 w-6`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  {stat.trend !== null && (
                    <>
                      {stat.trend > 0 ? (
                        <TrendingUp className="text-green-600 mr-1 h-4 w-4" />
                      ) : (
                        <TrendingDown className="text-red-600 mr-1 h-4 w-4" />
                      )}
                      <span className={stat.trend > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {stat.trend > 0 ? '+' : ''}{stat.trend}%
                      </span>
                      <span className="text-muted-foreground ml-1">from last quarter</span>
                    </>
                  )}
                  {stat.trend === null && (
                    <span className="text-muted-foreground">{stat.trendText}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
