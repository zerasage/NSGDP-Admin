import type { UserRole } from "@/types";

export type AccessRequestStatus = "pending" | "approved" | "denied";

export interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  datasetId: string;
  datasetTitle: string;
  reason: string;
  requestedAt: string;
  status: AccessRequestStatus;
}

export type AuditAction =
  | "login"
  | "logout"
  | "upload"
  | "download"
  | "approve"
  | "publish"
  | "reject"
  | "revise"
  | "archive"
  | "register"
  | "role_change"
  | "suspend"
  | "permission_grant"
  | "permission_revoke"
  | "version_update"
  | "access_request"
  | "access_grant"
  | "failed_login";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  ipAddress: string;
}

export interface ActivityItem {
  id: string;
  type: "download" | "upload" | "review" | "register" | "access_request";
  message: string;
  timestamp: string;
  userName?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organisationId?: string;
  organisationName?: string;
  joinedAt: string;
  lastLogin: string;
  status: "active" | "suspended" | "banned";
}

export interface SystemHealth {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  storage: "healthy" | "degraded" | "down";
  queue: "healthy" | "degraded" | "down";
}
