import {criminalStatutes,criminalCase} from './criminal';
import {contractStatutes,contractCase} from './contract';
import {laborStatutes,laborCase} from './labor';
import {tortStatutes,tortCase} from './tort';
import {constitutionStatutes,constitutionCase} from './constitution';
import type {LawCase,Statute} from './lawtypes';
export {grade} from './lawtypes';
export type {LawCase,Statute};
// 모든 사건은 시나리오 code로 조문 퍼즐 설정(LawCase)을 찾습니다.
export const statutes:Record<string,Statute>={...criminalStatutes,...contractStatutes,...laborStatutes,...tortStatutes,...constitutionStatutes};
export const lawCases:Record<string,LawCase>={[criminalCase.code]:criminalCase,[contractCase.code]:contractCase,[laborCase.code]:laborCase,[tortCase.code]:tortCase,[constitutionCase.code]:constitutionCase};
export const lawCaseOf=(code:string):LawCase=>{const c=lawCases[code];if(!c)throw new Error(`조문 퍼즐 설정이 없습니다: ${code}`);return c;};
export const cardIds=Object.keys(statutes);
export const elementIds=[...new Set(Object.values(lawCases).flatMap(c=>c.elements.map(e=>e.id)))];
