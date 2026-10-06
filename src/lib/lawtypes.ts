export type Statute = { id: string; law: string; article: string; title: string; text: string; plain: string; url: string };
export type Option = { id: string; label: string; correct: boolean; explain: string };
export type Quiz = { step: number; title: string; question: string; options: Option[] };
export type Element = { id: string; name: string; basis: string; kind: 'text' | 'case'; desc: string; ok: Record<string, 'ok' | 'partial'>; reject: Record<string, string>; fallback: string; success: Record<string, string> };
export type Cross = { evidence: string; statute: string; hint: string; success: string; wrongEvidence: string; wrongStatute: Record<string, string>; generic: string };
// 조문 퍼즐 사건 하나의 설정. 단계: 0 조문 고르기 · 1 접수/방식 · 2 요건 입증 · 3 심문 · 4 에필로그
export type LawCase = {
  code: string; stepNames: string[]; quizzes: Quiz[]; elements: Element[]; cross: Cross[];
  elementsTitle: string; counterCards: string[]; epilogueCards: string[];
  keyCard: string; required: string[]; gather: string[]; gatherSub: string;
  objective: [string, string]; finalTitle: string; gateMessage: string; startLog: string; guide: string;
  illegalId?: string; illegalMessage?: string;
};
export const grade = (mistakes: number) => (mistakes === 0 ? 'S' : mistakes <= 2 ? 'A' : mistakes <= 4 ? 'B' : 'C');
