import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { toApiError } from '../../shared/supabase/errors.js';
import { runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { requireRoleProfileId } from '../../shared/supabase/roleProfiles.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import { REPORT_COLUMNS, type CreateReportBody, type Report } from './report.types.js';

export interface ReportServiceDeps {
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface ReportService {
  list(accessToken: string, pagination: PaginationParams): Promise<Page<Report>>;
  create(accessToken: string, userId: UserId, body: CreateReportBody): Promise<Report>;
}

const listError = (error: PostgrestError, status: number) => toApiError(error, status, 'list', 'reports');

/** Reports. "Admins manage reports" is the only policy, so every route is administrator-only. */
export function createReportService(deps: ReportServiceDeps): ReportService {
  return {
    async list(accessToken, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const query = (head: boolean) => client.from('reports').select(head ? 'id' : REPORT_COLUMNS, { count: 'exact', head });
      return runPagedQuery<Report>(
        query(false).order('generated_at', { ascending: false }).order('id', { ascending: false }).range(from, to).overrideTypes<Report[], { merge: false }>().retry(false),
        () => query(true).retry(false),
        listError,
      );
    },

    async create(accessToken, userId, body) {
      const client = deps.createUserClient(accessToken);
      const adminId = await requireRoleProfileId(client, 'administrator', userId);
      const row: Record<string, unknown> = {
        admin_id: adminId,
        report_name: body.report_name.trim(),
        report_type: body.report_type.trim(),
        metadata: body.metadata ?? {},
        file_path: body.file_path ?? null,
      };
      if (body.status !== undefined) row.status = body.status;
      const { data, error, status } = await client.from('reports').insert(row).select(REPORT_COLUMNS).single<Report>().retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'report');
      return data;
    },
  };
}
