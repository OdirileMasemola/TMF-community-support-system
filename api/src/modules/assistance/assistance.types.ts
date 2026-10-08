/**
 * Assistance types. Field names are the public.assistance_requests, public.supporting_documents and
 * public.collection_schedules column names.
 */

/** Values of the public.request_status enum. */
export const REQUEST_STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'completed'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Status changes an administrator may make (current status -> allowed next statuses). */
export const REQUEST_TRANSITIONS: Readonly<Record<RequestStatus, readonly RequestStatus[]>> = {
  pending: ['under_review', 'approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['completed'],
  rejected: [],
  completed: [],
};

/** Statuses an administrator can move a request to. */
export const ADMIN_TARGET_STATUSES = ['under_review', 'approved', 'rejected', 'completed'] as const;
export type AdminTargetStatus = (typeof ADMIN_TARGET_STATUSES)[number];

/** Request statuses that still accept supporting documents from the beneficiary. */
export const DOCUMENT_ACCEPTING_STATUSES: readonly RequestStatus[] = ['pending', 'under_review', 'approved'];

/** API values for assistance_requests.priority (free text in the database, default 'normal'). */
export const PRIORITIES = ['low', 'normal', 'medium', 'high', 'urgent'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Values allowed by collection_schedule_status_check. */
export const SCHEDULE_STATUSES = ['upcoming', 'confirmed', 'completed', 'missed'] as const;
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

/** Values of the public.verification_status enum (supporting_documents.verification_status). */
export const DOCUMENT_VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type DocumentVerificationStatus = (typeof DOCUMENT_VERIFICATION_STATUSES)[number];

/** Columns returned for a request (same list as web/mobile services/assistance.ts). */
export const REQUEST_COLUMNS =
  'id, beneficiary_id, request_date, request_type, description, status, priority, preferred_collection_area, admin_notes, reviewed_by, reviewed_at';

/** Columns returned for a supporting document (same list as web services/assistance.ts). */
export const DOCUMENT_COLUMNS = 'id, request_id, document_name, document_type, file_path, upload_date, verification_status';

/** Columns returned for a collection schedule (same list as web services/assistance.ts). */
export const SCHEDULE_COLUMNS = 'id, request_id, programme_name, location, collection_date, collection_time, status, created_at';

export interface AssistanceRequest {
  id: string;
  beneficiary_id: string;
  request_date: string;
  request_type: string;
  description: string;
  status: RequestStatus;
  priority: string | null;
  preferred_collection_area: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface SupportingDocument {
  id: string;
  request_id: string;
  document_name: string;
  document_type: string | null;
  file_path: string;
  upload_date: string;
  verification_status: DocumentVerificationStatus;
}

export interface CollectionSchedule {
  id: string;
  request_id: string | null;
  programme_name: string | null;
  location: string;
  collection_date: string;
  collection_time: string | null;
  status: ScheduleStatus;
  created_at: string;
}

export interface BeneficiaryRef {
  id: string;
  user_id: string;
  profiles: { full_name: string; email: string } | null;
}

/** A request in the admin list. */
export interface AdminAssistanceRequest extends AssistanceRequest {
  beneficiary_profiles: BeneficiaryRef | null;
}

/** A request with its documents and collection schedules. */
export interface AssistanceRequestDetail extends AdminAssistanceRequest {
  supporting_documents: SupportingDocument[];
  collection_schedules: CollectionSchedule[];
}

/** A request in GET /assistance-requests/me. */
export interface MyAssistanceRequest extends AssistanceRequest {
  supporting_documents: SupportingDocument[];
  collection_schedules: CollectionSchedule[];
}

/** A schedule in the admin list, with its request. */
export interface AdminCollectionSchedule extends CollectionSchedule {
  assistance_requests: Pick<AssistanceRequest, 'id' | 'beneficiary_id' | 'request_type' | 'status'> | null;
}

/** POST /assistance-requests. status, beneficiary_id and the review fields are never accepted. */
export interface CreateAssistanceRequestBody {
  request_type: string;
  description: string;
  priority?: Priority;
  preferred_collection_area?: string | null;
}

/** POST /assistance-requests/:id/documents. verification_status is never accepted. */
export interface CreateDocumentBody {
  document_name: string;
  document_type?: string | null;
  file_path: string;
}

/** PATCH /admin/assistance-requests/:id */
export interface UpdateRequestStatusBody {
  status: AdminTargetStatus;
  admin_notes?: string | null;
}

/** POST /admin/collection-schedules */
export interface CreateScheduleBody {
  request_id?: string | null;
  programme_name?: string | null;
  location: string;
  collection_date: string;
  collection_time?: string | null;
  status?: ScheduleStatus;
}

export interface ListRequestsQuery {
  status?: RequestStatus;
  page?: number;
  pageSize?: number;
}

export interface ListSchedulesQuery {
  status?: ScheduleStatus;
  request_id?: string;
  page?: number;
  pageSize?: number;
}

export interface MySchedulesQuery {
  status?: ScheduleStatus;
  page?: number;
  pageSize?: number;
}

export interface AssistanceIdParams {
  id: string;
}
