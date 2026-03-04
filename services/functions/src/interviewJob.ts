import { generateInterviewReportStub, validateInterviewReport } from "./interviewReport";
import { ensureSafeCopy, getInterviewModeLabel, getInterviewReportHeader } from "@nahamzzi/domain";

export async function runInterviewSessionCompletion() {
  const report = await generateInterviewReportStub();
  const validated = validateInterviewReport(report);

  validated.strengths = validated.strengths.map((item) => ensureSafeCopy(item));
  validated.improvements = validated.improvements.map((item) => ensureSafeCopy(item));
  validated.expectedFollowUps = validated.expectedFollowUps.map((item) => ensureSafeCopy(item));

  return {
    modeLabel: getInterviewModeLabel(true),
    reportHeader: getInterviewReportHeader(true),
    report: validated
  };
}
