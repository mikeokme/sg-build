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
import { getFeature, getCategory } from '@/config/features';
import { Button } from '@/components/ui/button';

export default function FeatureRoutePage() {
  const params = useParams<{ category: string; feature: string }>();
  const category = getCategory(params.category);
  const feature = getFeature(params.category, params.feature);

  if (!category || !feature) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
        <p>功能不存在</p>
        <Link href="/"><Button variant="outline" size="sm">返回工作台</Button></Link>
      </div>
    );
  }

  const pageType = feature.pageType || 'list';

  return (
    <div>
      <div className="flex items-center gap-1 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-blue-600">{category.title}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700">{feature.title}</span>
      </div>
      {pageType === 'dashboard' && <StatPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'approval' && <ApprovalPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'gantt' && <GanttPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'calendar' && <CalendarPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'doc' && <DocPage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
      {pageType === 'project-archives' && <ProjectArchivesPage feature={feature} categoryTitle={category.title} />}
      {pageType === 'project-documents' && <ProjectDocumentsPage feature={feature} categoryTitle={category.title} />}
      {pageType === 'user-manage' && <UserManagementPage />}
      {pageType === 'list' && <FeaturePage feature={feature} categoryTitle={category.title} categoryKey={category.key} />}
    </div>
  );
}