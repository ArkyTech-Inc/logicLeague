import { apiRequest } from "./queryClient";
import type { 
  LoginRequest, 
  LoginResponse, 
  User, 
  Department,
  KPIWithDetails,
  DepartmentPerformance,
  QuickStatsData,
  Alert,
  ActualSubmission,
  ForecastResult,
  ScenarioTestResult
} from "@/types";

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch('/api/auth/me', {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const data = await response.json();
    return data.user;
  }

  // Dashboard endpoints
  async getQuickStats(): Promise<QuickStatsData> {
    const response = await fetch('/api/dashboard/stats', {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return response.json();
  }

  async getDepartmentPerformance(year: number, quarter: number): Promise<DepartmentPerformance[]> {
    const response = await fetch(`/api/dashboard/departments/${year}/${quarter}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch department performance');
    }

    return response.json();
  }

  async getCriticalKPIs(): Promise<KPIWithDetails[]> {
    const response = await fetch('/api/dashboard/critical-kpis', {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch critical KPIs');
    }

    return response.json();
  }

  // Department endpoints
  async getDepartments(): Promise<Department[]> {
    const response = await fetch('/api/departments', {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    return response.json();
  }

  // KPI endpoints
  async getKPIs(departmentId?: string): Promise<KPIWithDetails[]> {
    const url = departmentId ? `/api/kpis?departmentId=${departmentId}` : '/api/kpis';
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch KPIs');
    }

    return response.json();
  }

  // Actual submission endpoints
  async submitActual(data: ActualSubmission): Promise<void> {
    const formData = new FormData();
    formData.append('kpiId', data.kpiId);
    formData.append('targetId', data.targetId);
    formData.append('actualValue', data.actualValue);
    if (data.comments) {
      formData.append('comments', data.comments);
    }
    
    if (data.evidenceFiles) {
      data.evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });
    }

    const response = await fetch('/api/actuals', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit KPI data');
    }
  }

  // Alert endpoints
  async getAlerts(isRead?: boolean): Promise<Alert[]> {
    const url = isRead !== undefined ? `/api/alerts?isRead=${isRead}` : '/api/alerts';
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    return response.json();
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: true }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark alert as read');
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isResolved: true }),
    });

    if (!response.ok) {
      throw new Error('Failed to resolve alert');
    }
  }

  // Analytics endpoints
  async getForecast(kpiId: string): Promise<ForecastResult> {
    const response = await fetch(`/api/analytics/forecast/${kpiId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to generate forecast');
    }

    return response.json();
  }

  async runScenarioTest(kpiId: string, scenarios: any[]): Promise<ScenarioTestResult> {
    const response = await fetch('/api/analytics/scenario', {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ kpiId, scenarioData: scenarios }),
    });

    if (!response.ok) {
      throw new Error('Failed to run scenario test');
    }

    return response.json();
  }

  async downloadFile(filename: string): Promise<Blob> {
    const response = await fetch(`/api/files/${filename}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();
