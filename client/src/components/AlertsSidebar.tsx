import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText, 
  FlaskConical, 
  TriangleAlert, 
  Clock, 
  CheckCircle, 
  Lightbulb,
  TrendingUp,
  User,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AlertsSidebarProps {
  onSubmitKPI: () => void;
}

export default function AlertsSidebar({ onSubmitKPI }: AlertsSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: () => apiClient.getAlerts(),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (alertId: string) => apiClient.markAlertAsRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark alert as read',
        variant: 'destructive',
      });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiClient.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: 'Success',
        description: 'Alert resolved successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'destructive',
      });
    },
  });

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') return TriangleAlert;
    if (type === 'overdue_submission') return Clock;
    if (type === 'target_exceeded') return CheckCircle;
    return TriangleAlert;
  };

  const getAlertBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high':
        return 'border-l-red-400 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'border-l-green-400 bg-green-50 dark:bg-green-950/20';
      default:
        return 'border-l-gray-400 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getAlertIconColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const unreadAlerts = alerts?.filter(alert => !alert.isRead) || [];
  const recentAlerts = unreadAlerts.slice(0, 3);

  // Mock data for recent activity
  const recentActivity = [
    {
      id: '1',
      description: 'submitted DLCB Q1 KPI data',
      user: 'John Adamu',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'submission'
    },
    {
      id: '2',
      description: 'generated Q1 performance report',
      user: 'Sarah Mohammed',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      type: 'report'
    },
    {
      id: '3',
      description: 'processed DEGS automation metrics',
      user: 'System',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      type: 'system'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onSubmitKPI}
            data-testid="button-submit-kpi"
          >
            <Plus className="mr-2 h-4 w-4" />
            Submit KPI Data
          </Button>
          <Button
            variant="secondary"
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
            data-testid="button-generate-report"
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button
            variant="outline"
            className="w-full"
            data-testid="button-scenario-test"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            Scenario Testing
          </Button>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Recent Alerts</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-view-all-alerts">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-3 p-3 rounded-lg border-l-4">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No recent alerts</p>
              <p className="text-muted-foreground text-xs">All systems are running smoothly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert) => {
                const IconComponent = getAlertIcon(alert.type, alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg border-l-4 cursor-pointer transition-colors hover:bg-accent/50",
                      getAlertBorderColor(alert.severity)
                    )}
                    onClick={() => !alert.isRead && markAsReadMutation.mutate(alert.id)}
                    data-testid={`alert-${alert.id}`}
                  >
                    <IconComponent className={cn("mt-1 h-4 w-4", getAlertIconColor(alert.severity))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                        </p>
                        {!alert.isResolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs px-2 py-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveAlertMutation.mutate(alert.id);
                            }}
                            data-testid={`button-resolve-${alert.id}`}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">AI Insights</CardTitle>
            <div className="h-6 w-6 bg-secondary rounded-full flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-secondary-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-accent rounded-lg">
            <div className="flex items-start space-x-3">
              <Lightbulb className="text-yellow-600 mt-1 h-4 w-4" />
              <div>
                <p className="text-sm font-medium text-foreground">Recommendation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on current trends, DLCB digital literacy may miss 2025 target. Consider increasing training programs by 15%.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-accent rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp className="text-secondary mt-1 h-4 w-4" />
              <div>
                <p className="text-sm font-medium text-foreground">Forecast</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Q2 2025 overall performance predicted to reach 82% based on current trajectories.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-foreground">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {activity.description}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
