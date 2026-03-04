export type LexiconScope = "role" | "study" | "reward" | "schedule" | "interview" | "error";
export type SafetyLevel = "safe" | "review";

export const BRAND_TONE_POLICY = {
  baseRatio: 70,
  kitschRatio: 30,
  maxHamTermsPerScreen: 2
} as const;

export interface HamjjiLexiconEntry {
  id: string;
  defaultLabel: string;
  kitschLabel: string;
  description: string;
  usageScope: LexiconScope;
  safetyLevel: SafetyLevel;
}

export const BLOCKED_WORDS = ["멍청", "병신", "꺼져", "죽어"];
export const CAUTION_WORDS = ["찐따", "루저"];

export const HAMJJI_BRAND_LEXICON: HamjjiLexiconEntry[] = [
  { id: "role.userA", defaultLabel: "사용자 A", kitschLabel: "햄찌메이트", description: "설정/관리 역할", usageScope: "role", safetyLevel: "safe" },
  { id: "role.userB", defaultLabel: "사용자 B", kitschLabel: "나햄찌", description: "스터디 실행 역할", usageScope: "role", safetyLevel: "safe" },
  { id: "study.session", defaultLabel: "스터디 세션", kitschLabel: "집중 타임", description: "세션 제목", usageScope: "study", safetyLevel: "safe" },
  { id: "study.todo", defaultLabel: "TODO", kitschLabel: "오늘 할일", description: "할 일 레이블", usageScope: "study", safetyLevel: "safe" },
  { id: "study.achievement", defaultLabel: "달성률", kitschLabel: "오늘 달성률", description: "달성률 라벨", usageScope: "study", safetyLevel: "safe" },
  { id: "reward.card", defaultLabel: "보상 카드", kitschLabel: "추억카", description: "보상 카드 명칭", usageScope: "reward", safetyLevel: "safe" },
  { id: "reward.day", defaultLabel: "데이트 일정", kitschLabel: "데이트데이", description: "데이트 이벤트 명칭", usageScope: "schedule", safetyLevel: "safe" },
  { id: "schedule.syncFail", defaultLabel: "일정 동기화 실패", kitschLabel: "일정 동기화 잠깐 삐끗", description: "동기화 오류 타이틀", usageScope: "error", safetyLevel: "safe" },
  { id: "interview.mode", defaultLabel: "면접 모드", kitschLabel: "면접 연습 모드", description: "면접 모드 라벨", usageScope: "interview", safetyLevel: "safe" },
  { id: "interview.reportHeader", defaultLabel: "면접 리포트", kitschLabel: "면접 피드백 노트", description: "리포트 헤더", usageScope: "interview", safetyLevel: "safe" }
];

const lexiconMap = new Map(HAMJJI_BRAND_LEXICON.map((entry) => [entry.id, entry]));

export function validateLexiconEntry(entry: HamjjiLexiconEntry): boolean {
  return Boolean(
    entry.id &&
      entry.defaultLabel &&
      entry.kitschLabel &&
      entry.description &&
      entry.usageScope &&
      entry.safetyLevel
  );
}

export function validateLexicon(entries: HamjjiLexiconEntry[]): boolean {
  return entries.length >= 10 && entries.every(validateLexiconEntry);
}

export function containsBlockedWord(text: string): boolean {
  const lowered = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lowered.includes(word.toLowerCase()));
}

export function containsCautionWord(text: string): boolean {
  const lowered = text.toLowerCase();
  return CAUTION_WORDS.some((word) => lowered.includes(word.toLowerCase()));
}

export function ensureSafeCopy(text: string): string {
  if (containsBlockedWord(text)) {
    throw new Error("금지어가 포함된 문구는 사용할 수 없습니다.");
  }
  return text;
}

export function getBrandLabel(id: string, useKitsch = true): string {
  const entry = lexiconMap.get(id);
  if (!entry) {
    return id;
  }
  if (useKitsch && entry.kitschLabel) {
    return entry.kitschLabel;
  }
  return entry.defaultLabel;
}

export function getRoleLabel(role: "A" | "B", useKitsch = true): string {
  return getBrandLabel(role === "A" ? "role.userA" : "role.userB", useKitsch);
}

export function getRoleHelper(role: "A" | "B"): string {
  return role === "A" ? "설정/관리/보상 콘텐츠를 담당해요." : "스터디 실행과 면접 연습을 담당해요.";
}

export function formatCalendarTitle(
  organization: string,
  stage: "apply_start" | "apply_end" | "exam" | "result",
  useKitsch = true
): string {
  const stageMap: Record<typeof stage, string> = {
    apply_start: "원서접수 시작",
    apply_end: "원서접수 마감",
    exam: "필기시험",
    result: "발표"
  };
  const prefix = useKitsch ? `${getBrandLabel("reward.day", true)} ·` : "";
  return `${prefix} [${organization}] ${stageMap[stage]}`.trim();
}

export function buildDualSyncFailureMessage(): string {
  return `${getBrandLabel("schedule.syncFail", true)} (일정 동기화 실패: 다시 시도해줘)`;
}

export function getInterviewModeLabel(useKitsch = true): string {
  return getBrandLabel("interview.mode", useKitsch);
}

export function getInterviewReportHeader(useKitsch = true): string {
  return getBrandLabel("interview.reportHeader", useKitsch);
}
