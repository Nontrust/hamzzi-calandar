export interface AuditEvent {
  requestId: string;
  userId: string | null;
  action: string;
  resource: string;
  outcome: "success" | "denied" | "error";
  reason?: string;
  at: string;
}

const auditEvents: AuditEvent[] = [];

export function recordAuditEvent(event: AuditEvent): void {
  auditEvents.push(event);
}

export function listAuditEvents(): AuditEvent[] {
  return [...auditEvents];
}

export function clearAuditEvents(): void {
  auditEvents.length = 0;
}
