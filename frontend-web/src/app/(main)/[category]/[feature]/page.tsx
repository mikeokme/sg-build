'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';
import { StatPage } from '@/components/StatPage';
import { ApprovalPage } from '@/components/ApprovalPage';
import { GanttPage } from '@/components/GanttPage';
import { CalendarPage } from '@/components/CalendarPage';
import { DocPage } from '@/components/DocPage';
import { UserManagementPage } from '@/components/UserManagementPage';
import { ProjectArchivesPage } from '@/components/ProjectArchivesPage';
import ProjectDetailPage from '@/components/ProjectDetailPage';
import { ProjectDocumentsPage } from '@/components/ProjectDocumentsPage';
import { EngineeringOverviewPage } from '@/components/EngineeringOverviewPage';
import { EngineeringModulePage } from '@/components/EngineeringModulePage';
import { SchedulePage } from '@/components/SchedulePage';
import { ConstructionLogsPage } from '@/components/ConstructionLogsPage';
import { MilestonesPage } from '@/components/MilestonesPage';
import { ProductionValuePage } from '@/components/ProductionValuePage';
import { ProcurementOverviewPage } from '@/components/ProcurementOverviewPage';
import { ProcurementPlanPage } from '@/components/ProcurementPlanPage';
import { ReceiptsPage } from '@/components/ReceiptsPage';
import { SupplierEvalPage } from '@/components/SupplierEvalPage';
import { SubcontractOverviewPage } from '@/components/SubcontractOverviewPage';
import { OaOverviewPage } from '@/components/OaOverviewPage';
import { OaTasksPage } from '@/components/OaTasksPage';
import { OaMeetingsPage } from '@/components/OaMeetingsPage';
import { OaDocumentsPage } from '@/components/OaDocumentsPage';
import { MarketOverviewPage } from '@/components/MarketOverviewPage';
import { MarketPipelinePage } from '@/components/MarketPipelinePage';
import { MarketCustomersPage } from '@/components/MarketCustomersPage';
import { FinanceOverviewPage } from '@/components/FinanceOverviewPage';
import { FinanceApprovalPage } from '@/components/FinanceApprovalPage';
import { FinanceReimbursePage } from '@/components/FinanceReimbursePage';
import { QualityOverviewPage } from '@/components/QualityOverviewPage';
import { SafetyOverviewPage } from '@/components/SafetyOverviewPage';
import { SixMechanismsPage } from '@/components/SixMechanismsPage';
import { HrOverviewPage } from '@/components/HrOverviewPage';
import { HrStaffPage } from '@/components/HrStaffPage';
import { PlatformOverviewPage } from '@/components/PlatformOverviewPage';
import { ResourceOverviewPage } from '@/components/ResourceOverviewPage';
import { CloudDrivePage } from '@/components/CloudDrivePage';
import { VideoConferencePage } from '@/components/VideoConferencePage';
import { getFeature, getCategory } from '@/config/features';
import { Button } from '@/components/ui/button';
import { ProjectProvider, PROJECT_FILTERED_CATEGORIES } from '@/context/ProjectContext';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { useT } from '@/i18n';

export default function FeatureRoutePage() {
  const params = useParams<{ category: string; feature: string }>();
  const category = getCategory(params.category);
  const feature = getFeature(params.category, params.feature);
  const { t, tCat, tFeat } = useT();

  if (!category || !feature) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
        <p>{t('notFound')}</p>
        <Link href="/"><Button variant="outline" size="sm">{t('backHome')}</Button></Link>
      </div>
    );
  }

  const pageType = feature.pageType || 'list';
  const hasProjectField = feature.fields.some((f) => f.key === 'project' || f.key === 'projectId');
  const filteredCategory = PROJECT_FILTERED_CATEGORIES.includes(category.key) || hasProjectField;

  return (
    <ProjectProvider>
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Link href="/" className="hover:text-blue-600">{tCat(category.key)}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700">{tFeat(category.key, feature.key)}</span>
          </div>
          {filteredCategory && <ProjectSwitcher />}
        </div>
      {pageType === 'dashboard' && <StatPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'approval' && <ApprovalPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'gantt' && <GanttPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'calendar' && <CalendarPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'doc' && <DocPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'project-archives' && <ProjectArchivesPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'project-documents' && <ProjectDocumentsPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'user-manage' && <UserManagementPage />}
      {pageType === 'engineering-overview' && <EngineeringOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'engineering-module' && <EngineeringModulePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'engineering-schedule' && <SchedulePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'engineering-logs' && <ConstructionLogsPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'engineering-milestones' && <MilestonesPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'engineering-production' && <ProductionValuePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'procurement-overview' && <ProcurementOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'procurement-plan' && <ProcurementPlanPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'receipts' && <ReceiptsPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'supplier-eval' && <SupplierEvalPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'subcontract-overview' && <SubcontractOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'oa-overview' && <OaOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'oa-tasks' && <OaTasksPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'oa-meetings' && <OaMeetingsPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'oa-documents' && <OaDocumentsPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'market-overview' && <MarketOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'market-pipeline' && <MarketPipelinePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'market-customers' && <MarketCustomersPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'finance-overview' && <FinanceOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'finance-approval' && <FinanceApprovalPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'finance-reimburse' && <FinanceReimbursePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'quality-overview' && <QualityOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'safety-overview' && <SafetyOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'safety-six-mechanisms' && <SixMechanismsPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'hr-overview' && <HrOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'hr-staff' && <HrStaffPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'platform-overview' && <PlatformOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'resource-overview' && <ResourceOverviewPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'cloud-drive' && <CloudDrivePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'video-conference' && <VideoConferencePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'list' && <FeaturePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      </div>
    </ProjectProvider>
  );
}