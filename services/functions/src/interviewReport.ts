import { z } from "zod";

export const InterviewReportSchema = z.object({
  strengths: z.array(z.string()).length(3),
  improvements: z.array(z.string()).length(3),
  improvedSampleAnswer: z.string().min(1),
  expectedFollowUps: z.array(z.string()).length(5),
  scores: z.object({
    structure: z.number().min(0).max(5),
    specificity: z.number().min(0).max(5),
    roleFit: z.number().min(0).max(5),
    publicValue: z.number().min(0).max(5),
    clarity: z.number().min(0).max(5)
  })
});

export type InterviewReport = z.infer<typeof InterviewReportSchema>;

export function validateInterviewReport(report: unknown): InterviewReport {
  return InterviewReportSchema.parse(report);
}

export async function generateInterviewReportStub(): Promise<InterviewReport> {
  return validateInterviewReport({
    strengths: ["문제 구조화", "경험 연결", "답변 속도"],
    improvements: ["수치 근거 강화", "핵심 문장 압축", "직무 용어 정확성"],
    improvedSampleAnswer: "상황, 과제, 행동, 결과 순으로 답변을 재구성했습니다.",
    expectedFollowUps: ["정량 성과는?", "갈등 대응은?", "실패 사례는?", "재현 가능성은?", "공공성 연결은?"],
    scores: {
      structure: 4,
      specificity: 3,
      roleFit: 4,
      publicValue: 4,
      clarity: 4
    }
  });
}