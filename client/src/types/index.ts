export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  departmentId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pillar {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface KPI {
  id: string;
  name: string;
  description?: string;
  pillarId: string;
  departmentId: string;
  unit: string;
  dataType: string;
  frequency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KPIWithDetails extends KPI {
  pillar: Pillar;
  department: Department;
  currentTarget?: Target;
  currentActual?: Actual;
  status: 'green' | 'amber' | 'red';
  progress: number;
}

export interface Target {
  id: string;
  kpiId: string;
  year: number;
  quarter?: number;
  targetValue: string;
  threshold: {
    green: number;
    amber: number;
    red: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Actual {
  id: string;
  kpiId: string;
  targetId: string;
  actualValue: string;
  submittedBy: string;
  submissionDate: string;
  evidenceFiles: string[];
  comments?: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  kpiId?: string;
  departmentId?: string;
  triggeredBy?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  metadata?: any;
  createdAt: string;
}

export interface DepartmentPerformance {
  id: string;
  name: string;
  code: string;
  score: number;
  status: 'green' | 'amber' | 'red';
  kpiCount: number;
  trend: number;
}

export interface QuickStatsData {
  overallPerformance: number;
  activeKPIs: number;
  departments: number;
  alerts: number;
  trends: {
    overallTrend: number;
    onTrackPercentage: number;
    needAttentionCount: number;
    criticalAlertsCount: number;
  };
}

export interface ActualSubmission {
  kpiId: string;
  targetId: string;
  actualValue: string;
  comments?: string;
  evidenceFiles?: File[];
}

export interface ForecastResult {
  kpiId: string;
  forecast: {
    period: string;
    predictedValue: number;
    confidence: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export interface ScenarioTestResult {
  kpiId: string;
  scenarios: {
    name: string;
    inputValue: number;
    projectedOutcome: number;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }[];
  recommendations: string[];
}
