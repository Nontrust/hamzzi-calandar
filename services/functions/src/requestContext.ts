export interface RequestContext {
  requestId: string;
  now: Date;
}

function createPseudoRequestId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `req_${t}_${r}`;
}

export function createRequestContext(now = new Date()): RequestContext {
  return {
    requestId: createPseudoRequestId(),
    now
  };
}
