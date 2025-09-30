import { useState } from 'react';
import QuickStats from '@/components/QuickStats';
import DepartmentHeatmap from '@/components/DepartmentHeatmap';
import PerformanceTrends from '@/components/PerformanceTrends';
import CriticalKPIsTable from '@/components/CriticalKPIsTable';
import AlertsSidebar from '@/components/AlertsSidebar';
import KPISubmissionModal from '@/components/KPISubmissionModal';

export default function Dashboard() {
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <QuickStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dashboard Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Department Performance Heatmap */}
          <DepartmentHeatmap />

          {/* Performance Trends Chart */}
          <PerformanceTrends />

          {/* Critical KPIs Table */}
          <CriticalKPIsTable />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AlertsSidebar onSubmitKPI={() => setIsKPIModalOpen(true)} />
        </div>
      </div>

      {/* KPI Submission Modal */}
      <KPISubmissionModal
        isOpen={isKPIModalOpen}
        onClose={() => setIsKPIModalOpen(false)}
      />
    </div>
  );
}
