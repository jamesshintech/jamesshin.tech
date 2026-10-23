// "Manufacturer's notes": how the work gets made. Each line is a practice
// with a thing on this site that shows it. Short on purpose.

export interface Principle {
  claim: string;
  evidence: string;
}

export const principles: Principle[] = [
  {
    claim: "Every number has a source.",
    evidence: "The fine print under each title is the point, not a footnote.",
  },
  {
    claim: "Goals in public, graded in public.",
    evidence: "“In review” is never “live”. Patch notes are dated. A product that failed got a write-up, not a quiet 404.",
  },
  {
    claim: "Users, defined broadly.",
    evidence: "No accounts, no tracking, no ads mid-turn. VoiceOver and reduced motion honoured in the games.",
  },
  {
    claim: "Build with AI, verify harder because of it.",
    evidence: "A health check once returned 200 for three months while the database was down. “Should work” is not evidence; served reality is.",
  },
  {
    claim: "The simple thing that works.",
    evidence: "CSS before JavaScript, one engine per game, descope before hiring.",
  },
  {
    claim: "Print the sourcing rule, so the next site has to.",
    evidence: "Every chart on HighSchoolTrends says where its number came from.",
  },
];
