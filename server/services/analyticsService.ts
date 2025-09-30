import { storage } from '../storage';

interface ForecastResult {
  kpiId: string;
  forecast: {
    period: string;
    predictedValue: number;
    confidence: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

interface ScenarioTestResult {
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

class AnalyticsService {
  async generateForecast(kpiId: string): Promise<ForecastResult> {
    try {
      // Get historical data for the KPI
      const currentYear = new Date().getFullYear();
      const historicalData = [];
      
      // Gather data from past 4 quarters
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          if (year === currentYear && quarter > Math.ceil(new Date().getMonth() / 3)) break;
          
          const actuals = await storage.getActuals(kpiId, year, quarter);
          if (actuals.length > 0) {
            historicalData.push({
              period: `Q${quarter} ${year}`,
              value: parseFloat(actuals[0].actualValue),
              date: new Date(year, (quarter - 1) * 3, 1),
            });
          }
        }
      }

      if (historicalData.length < 2) {
        throw new Error('Insufficient historical data for forecasting');
      }

      // Simple linear regression for trend analysis
      const n = historicalData.length;
      const sumX = historicalData.reduce((sum, _, index) => sum + index, 0);
      const sumY = historicalData.reduce((sum, data) => sum + data.value, 0);
      const sumXY = historicalData.reduce((sum, data, index) => sum + index * data.value, 0);
      const sumXX = historicalData.reduce((sum, _, index) => sum + index * index, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate forecast for next 4 quarters
      const forecast = [];
      for (let i = 0; i < 4; i++) {
        const nextIndex = historicalData.length + i;
        const predictedValue = intercept + slope * nextIndex;
        const confidence = Math.max(0.6, 1 - (i * 0.1)); // Decreasing confidence over time

        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + (i + 1) * 3);
        const quarter = Math.ceil((futureDate.getMonth() + 1) / 3);
        const year = futureDate.getFullYear();

        forecast.push({
          period: `Q${quarter} ${year}`,
          predictedValue: Math.max(0, predictedValue), // Ensure non-negative values
          confidence: Math.round(confidence * 100) / 100,
        });
      }

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (slope > 0.5) trend = 'increasing';
      else if (slope < -0.5) trend = 'decreasing';

      // Generate recommendation
      let recommendation = '';
      if (trend === 'decreasing') {
        recommendation = 'Performance is trending downward. Consider implementing corrective measures to improve KPI performance.';
      } else if (trend === 'increasing') {
        recommendation = 'Performance is trending upward. Continue current strategies and consider scaling successful initiatives.';
      } else {
        recommendation = 'Performance is stable. Monitor for any changes and consider optimization opportunities.';
      }

      return {
        kpiId,
        forecast,
        trend,
        recommendation,
      };
    } catch (error) {
      console.error('Forecast generation error:', error);
      throw new Error('Failed to generate forecast');
    }
  }

  async runScenarioTest(kpiId: string, scenarioData: any[]): Promise<ScenarioTestResult> {
    try {
      const kpi = await storage.getKPI(kpiId);
      if (!kpi) {
        throw new Error('KPI not found');
      }

      // Get current performance data
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      const currentActuals = await storage.getActuals(kpiId, currentYear, currentQuarter);
      const currentValue = currentActuals.length > 0 ? parseFloat(currentActuals[0].actualValue) : 0;

      const scenarios = scenarioData.map((scenario, index) => {
        const inputValue = scenario.value || 0;
        const changePercent = currentValue > 0 ? ((inputValue - currentValue) / currentValue) * 100 : 0;
        
        // Simple projection based on percentage change
        const projectedOutcome = inputValue * (1 + (changePercent * 0.1)); // 10% amplification factor
        
        let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (changePercent > 5) impact = 'positive';
        else if (changePercent < -5) impact = 'negative';

        const confidence = Math.max(0.5, 1 - (Math.abs(changePercent) / 100));

        return {
          name: scenario.name || `Scenario ${index + 1}`,
          inputValue,
          projectedOutcome: Math.round(projectedOutcome * 100) / 100,
          impact,
          confidence: Math.round(confidence * 100) / 100,
        };
      });

      // Generate recommendations based on scenarios
      const recommendations = [];
      const positiveScenarios = scenarios.filter(s => s.impact === 'positive');
      const negativeScenarios = scenarios.filter(s => s.impact === 'negative');

      if (positiveScenarios.length > 0) {
        recommendations.push(`Consider implementing strategies similar to: ${positiveScenarios.map(s => s.name).join(', ')}`);
      }

      if (negativeScenarios.length > 0) {
        recommendations.push(`Avoid strategies that could lead to: ${negativeScenarios.map(s => s.name).join(', ')}`);
      }

      if (recommendations.length === 0) {
        recommendations.push('All scenarios show neutral impact. Consider more aggressive strategies for improvement.');
      }

      return {
        kpiId,
        scenarios,
        recommendations,
      };
    } catch (error) {
      console.error('Scenario test error:', error);
      throw new Error('Failed to run scenario test');
    }
  }

  async checkThresholds(kpiId: string, actualValue: number): Promise<void> {
    try {
      const kpi = await storage.getKPI(kpiId);
      if (!kpi) return;

      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      
      const targets = await storage.getTargets(kpiId, currentYear, currentQuarter);
      if (targets.length === 0) return;

      const target = targets[0];
      const threshold = target.threshold as { green: number; amber: number; red: number };
      const targetValue = parseFloat(target.targetValue);

      let alertType = '';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let title = '';
      let description = '';

      // Determine alert based on threshold breach
      if (actualValue < threshold.red * targetValue / 100) {
        alertType = 'threshold_breach';
        severity = 'critical';
        title = `Critical: ${kpi.name} Below Red Threshold`;
        description = `${kpi.name} value (${actualValue}) has fallen below critical threshold (${threshold.red}% of target: ${targetValue})`;
      } else if (actualValue < threshold.amber * targetValue / 100) {
        alertType = 'threshold_breach';
        severity = 'high';
        title = `Warning: ${kpi.name} Below Amber Threshold`;
        description = `${kpi.name} value (${actualValue}) has fallen below warning threshold (${threshold.amber}% of target: ${targetValue})`;
      } else if (actualValue > targetValue * 1.1) {
        alertType = 'target_exceeded';
        severity = 'low';
        title = `Success: ${kpi.name} Exceeded Target`;
        description = `${kpi.name} value (${actualValue}) has exceeded target (${targetValue}) by ${Math.round(((actualValue - targetValue) / targetValue) * 100)}%`;
      }

      if (alertType) {
        await storage.createAlert({
          type: alertType,
          severity,
          title,
          description,
          kpiId,
          departmentId: kpi.departmentId,
          isRead: false,
          isResolved: false,
        });

        console.log(`Alert created for KPI ${kpi.name}: ${title}`);
      }
    } catch (error) {
      console.error('Threshold check error:', error);
    }
  }

  async detectAnomalies(kpiId: string): Promise<boolean> {
    try {
      // Get last 6 data points for anomaly detection
      const currentYear = new Date().getFullYear();
      const historicalData = [];
      
      for (let year = currentYear - 1; year <= currentYear; year++) {
        for (let quarter = 1; quarter <= 4; quarter++) {
          if (year === currentYear && quarter > Math.ceil(new Date().getMonth() / 3)) break;
          
          const actuals = await storage.getActuals(kpiId, year, quarter);
          if (actuals.length > 0) {
            historicalData.push(parseFloat(actuals[0].actualValue));
          }
        }
      }

      if (historicalData.length < 3) return false;

      const recent = historicalData.slice(-1)[0];
      const previous = historicalData.slice(-3, -1);
      
      if (previous.length === 0) return false;

      const avgPrevious = previous.reduce((sum, val) => sum + val, 0) / previous.length;
      const stdDev = Math.sqrt(previous.reduce((sum, val) => sum + Math.pow(val - avgPrevious, 2), 0) / previous.length);

      // Anomaly if current value is more than 2 standard deviations away
      const isAnomaly = Math.abs(recent - avgPrevious) > (2 * stdDev);

      if (isAnomaly) {
        const kpi = await storage.getKPI(kpiId);
        if (kpi) {
          await storage.createAlert({
            type: 'anomaly_detected',
            severity: 'medium',
            title: `Anomaly Detected: ${kpi.name}`,
            description: `Unusual performance detected for ${kpi.name}. Current value (${recent}) significantly differs from recent trend (avg: ${Math.round(avgPrevious * 100) / 100})`,
            kpiId,
            departmentId: kpi.departmentId,
            isRead: false,
            isResolved: false,
          });
        }
      }

      return isAnomaly;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return false;
    }
  }
}

export const analyticsService = new AnalyticsService();
