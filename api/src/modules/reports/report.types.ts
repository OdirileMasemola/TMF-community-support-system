/** Report types. Field names are the public.reports column names. */

/** Values of the public.report_status enum. */
export const REPORT_STATUSES = ['generated', 'archived'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_COLUMNS = 'id, admin_id, report_name, generated_at, report_type, status, metadata, file_path';

export interface Report {
  id: string;
  admin_id: string;
  report_name: string;
  generated_at: string;
  report_type: string;
  status: ReportStatus;
  metadata: Record<string, unknown>;
  file_path: string | null;
}

export interface CreateReportBody {
  report_name: string;
  report_type: string;
  status?: ReportStatus;
  metadata?: Record<string, unknown>;
  file_path?: string | null;
}

export interface ListReportsQuery {
  page?: number;
  pageSize?: number;
}
