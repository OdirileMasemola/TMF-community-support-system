import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { conflictError, toApiError } from '../../shared/supabase/errors.js';
import { runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { requireRoleProfileId } from '../../shared/supabase/roleProfiles.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import { assertOwnFolder } from '../../shared/utils/storagePaths.js';
import { trimmedOrNull } from '../../shared/utils/text.js';
import {
  DOCUMENT_ACCEPTING_STATUSES,
  DOCUMENT_COLUMNS,
  REQUEST_COLUMNS,
  REQUEST_TRANSITIONS,
  SCHEDULE_COLUMNS,
  type AdminAssistanceRequest,
  type AdminCollectionSchedule,
  type AssistanceRequest,
  type AssistanceRequestDetail,
  type CollectionSchedule,
  type CreateAssistanceRequestBody,
  type CreateDocumentBody,
  type CreateScheduleBody,
  type MyAssistanceRequest,
  type RequestStatus,
  type ScheduleStatus,
  type SupportingDocument,
  type UpdateRequestStatusBody,
} from './assistance.types.js';

export interface AssistanceServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface ScheduleFilters {
  status?: ScheduleStatus;
  requestId?: string;
}

export interface AssistanceService {
  create(accessToken: string, userId: UserId, body: CreateAssistanceRequestBody): Promise<AssistanceRequest>;
  list(accessToken: string, status: RequestStatus | undefined, pagination: PaginationParams): Promise<Page<AdminAssistanceRequest>>;
  listMine(accessToken: string, userId: UserId, status: RequestStatus | undefined, pagination: PaginationParams): Promise<Page<MyAssistanceRequest>>;
  getById(accessToken: string, id: string): Promise<AssistanceRequestDetail>;
  addDocument(accessToken: string, userId: UserId, requestId: string, body: CreateDocumentBody): Promise<SupportingDocument>;
  updateStatus(accessToken: string, userId: UserId, id: string, body: UpdateRequestStatusBody): Promise<AssistanceRequestDetail>;
  createSchedule(accessToken: string, body: CreateScheduleBody): Promise<CollectionSchedule>;
  listSchedules(accessToken: string, filters: ScheduleFilters, pagination: PaginationParams): Promise<Page<AdminCollectionSchedule>>;
  listMySchedules(accessToken: string, userId: UserId, status: ScheduleStatus | undefined, pagination: PaginationParams): Promise<Page<CollectionSchedule>>;
}

const BENEFICIARY_EMBED = 'beneficiary_profiles(id, user_id, profiles(full_name, email))';
const ADMIN_REQUEST_SELECT = `${REQUEST_COLUMNS}, ${BENEFICIARY_EMBED}`;
const MY_REQUEST_SELECT = `${REQUEST_COLUMNS}, supporting_documents(${DOCUMENT_COLUMNS}), collection_schedules(${SCHEDULE_COLUMNS})`;
const DETAIL_SELECT = `${ADMIN_REQUEST_SELECT}, supporting_documents(${DOCUMENT_COLUMNS}), collection_schedules(${SCHEDULE_COLUMNS})`;
const ADMIN_SCHEDULE_SELECT = `${SCHEDULE_COLUMNS}, assistance_requests(id, beneficiary_id, request_type, status)`;

/** Same message for "does not exist" and "hidden by RLS / someone else's". */
const requestNotFound = (): ApiError => ApiError.notFound('Assistance request not found');

type ToError = (error: PostgrestError, status: number) => ApiError;
const listError =
  (resource: string): ToError =>
  (error, status) =>
    toApiError(error, status, 'list', resource);

/**
 * Assistance requests, supporting documents and collection schedules. Beneficiaries act through
 * "Beneficiaries create own assistance requests", "Beneficiaries and admins view assistance requests",
 * "Beneficiaries upload linked documents", "Users and admins view linked documents" and
 * "Beneficiaries view own collection schedules"; administrators through "Admins update assistance
 * requests" and "Admins manage collection schedules". The insert policies only check ownership, so
 * status, review and verification columns are never taken from the request.
 */
export function createAssistanceService(deps: AssistanceServiceDeps): AssistanceService {
  async function loadDetail(client: SupabaseClient, id: string): Promise<AssistanceRequestDetail | null> {
    const { data, error, status } = await client
      .from('assistance_requests')
      .select(DETAIL_SELECT)
      .eq('id', id)
      .maybeSingle<AssistanceRequestDetail>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'load', 'assistance request');
    return data;
  }

  return {
    async create(accessToken, userId, body) {
      const client = deps.createUserClient(accessToken);
      const beneficiaryId = await requireRoleProfileId(client, 'beneficiary', userId);
      const row: Record<string, unknown> = {
        beneficiary_id: beneficiaryId,
        request_type: body.request_type.trim(),
        description: body.description.trim(),
        preferred_collection_area: trimmedOrNull(body.preferred_collection_area),
        status: 'pending',
      };
      if (body.priority !== undefined) row.priority = body.priority;
      const { data, error, status } = await client
        .from('assistance_requests')
        .insert(row)
        .select(REQUEST_COLUMNS)
        .single<AssistanceRequest>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'assistance request');
      return data;
    },

    async list(accessToken, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('assistance_requests').select(head ? 'id' : ADMIN_REQUEST_SELECT, { count: 'exact', head });
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<AdminAssistanceRequest>(
        filtered(false)
          .order('request_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<AdminAssistanceRequest[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('assistance requests'),
      );
    },

    async listMine(accessToken, userId, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const beneficiaryId = await requireRoleProfileId(client, 'beneficiary', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('assistance_requests')
          .select(head ? 'id' : MY_REQUEST_SELECT, { count: 'exact', head })
          .eq('beneficiary_id', beneficiaryId);
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<MyAssistanceRequest>(
        filtered(false)
          .order('request_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<MyAssistanceRequest[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('assistance requests'),
      );
    },

    async getById(accessToken, id) {
      // RLS returns the request only to its beneficiary and to administrators.
      const detail = await loadDetail(deps.createUserClient(accessToken), id);
      if (detail === null) throw requestNotFound();
      return detail;
    },

    async addDocument(accessToken, userId, requestId, body) {
      assertOwnFolder(body.file_path, userId);
      const client = deps.createUserClient(accessToken);
      const beneficiaryId = await requireRoleProfileId(client, 'beneficiary', userId);
      const { data: request, error, status } = await client
        .from('assistance_requests')
        .select('id, status')
        .eq('id', requestId)
        .eq('beneficiary_id', beneficiaryId)
        .maybeSingle<{ id: string; status: RequestStatus }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'load', 'assistance request');
      if (request === null) throw requestNotFound();
      if (!DOCUMENT_ACCEPTING_STATUSES.includes(request.status)) {
        throw conflictError('Documents can no longer be added to a rejected or completed request');
      }
      const inserted = await client
        .from('supporting_documents')
        .insert({
          request_id: request.id,
          document_name: body.document_name.trim(),
          document_type: trimmedOrNull(body.document_type),
          file_path: body.file_path,
          verification_status: 'pending',
        })
        .select(DOCUMENT_COLUMNS)
        .single<SupportingDocument>()
        .retry(false);
      if (inserted.error !== null) throw toApiError(inserted.error, inserted.status, 'create', 'supporting document');
      return inserted.data;
    },

    async updateStatus(accessToken, userId, id, body) {
      const client = deps.createUserClient(accessToken);
      const current = await client
        .from('assistance_requests')
        .select('id, status')
        .eq('id', id)
        .maybeSingle<{ id: string; status: RequestStatus }>()
        .retry(false);
      if (current.error !== null) throw toApiError(current.error, current.status, 'load', 'assistance request');
      if (current.data === null) throw requestNotFound();
      const from = current.data.status;
      if (!REQUEST_TRANSITIONS[from].includes(body.status)) {
        throw conflictError(`An assistance request cannot move from ${from} to ${body.status}`);
      }
      const adminId = await requireRoleProfileId(client, 'administrator', userId);
      const changes: Record<string, unknown> = {
        status: body.status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      };
      if (body.admin_notes !== undefined) changes.admin_notes = trimmedOrNull(body.admin_notes);
      // Guarded on the status that was checked, so a concurrent change is not overwritten. The
      // notify_assistance_status_change trigger notifies the beneficiary.
      const { data, error, status } = await client
        .from('assistance_requests')
        .update(changes)
        .eq('id', id)
        .eq('status', from)
        .select('id')
        .overrideTypes<Array<{ id: string }>, { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', 'assistance request');
      if (data.length === 0) throw conflictError('The assistance request was changed by someone else; reload it and try again');
      const detail = await loadDetail(client, id);
      if (detail === null) throw requestNotFound();
      return detail;
    },

    async createSchedule(accessToken, body) {
      const client = deps.createUserClient(accessToken);
      const requestId = body.request_id ?? null;
      if (requestId !== null) {
        const { data, error, status } = await client
          .from('assistance_requests')
          .select('id, status')
          .eq('id', requestId)
          .maybeSingle<{ id: string; status: RequestStatus }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'load', 'assistance request');
        if (data === null) throw requestNotFound();
        if (data.status !== 'approved') throw conflictError('Collections can only be scheduled for an approved request');
      }
      const row: Record<string, unknown> = {
        request_id: requestId,
        programme_name: trimmedOrNull(body.programme_name),
        location: body.location.trim(),
        collection_date: body.collection_date,
        collection_time: trimmedOrNull(body.collection_time),
      };
      if (body.status !== undefined) row.status = body.status;
      const { data, error, status } = await client
        .from('collection_schedules')
        .insert(row)
        .select(SCHEDULE_COLUMNS)
        .single<CollectionSchedule>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'collection schedule');
      return data;
    },

    async listSchedules(accessToken, filters, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('collection_schedules').select(head ? 'id' : ADMIN_SCHEDULE_SELECT, { count: 'exact', head });
        if (filters.status !== undefined) query = query.eq('status', filters.status);
        if (filters.requestId !== undefined) query = query.eq('request_id', filters.requestId);
        return query;
      };
      return runPagedQuery<AdminCollectionSchedule>(
        filtered(false)
          .order('collection_date', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to)
          .overrideTypes<AdminCollectionSchedule[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('collection schedules'),
      );
    },

    async listMySchedules(accessToken, userId, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const beneficiaryId = await requireRoleProfileId(client, 'beneficiary', userId);
      const requests = await client
        .from('assistance_requests')
        .select('id')
        .eq('beneficiary_id', beneficiaryId)
        .overrideTypes<Array<{ id: string }>, { merge: false }>()
        .retry(false);
      if (requests.error !== null) throw toApiError(requests.error, requests.status, 'list', 'collection schedules');
      const requestIds = requests.data.map((row) => row.id);
      if (requestIds.length === 0) return { items: [], total: 0 };
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('collection_schedules')
          .select(head ? 'id' : SCHEDULE_COLUMNS, { count: 'exact', head })
          .in('request_id', requestIds);
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<CollectionSchedule>(
        filtered(false)
          .order('collection_date', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to)
          .overrideTypes<CollectionSchedule[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('collection schedules'),
      );
    },
  };
}
