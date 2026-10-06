# JUSTICE ROOM — 에이전트 작업 안내

고등학생 대상 법률 학습 게임(조사·심문 RPG). Next.js(App Router) + TypeScript + Zustand + Canvas. 화면 문구는 한국어입니다.

## 명령
- `npm run dev` — http://localhost:3100 (0.0.0.0 바인딩)
- `npm test` — `tsx --test tests/*.test.ts` (규칙·데이터 검증, 브라우저 없이 실행)
- `npx tsc --noEmit` — 타입 검사
- `npx tsx scripts/seed.ts` — `src/lib/scenarios.ts`와 `lawcases.ts`에서 `supabase/seed.sql` 재생성

## 구조
- `src/lib/scenarios.ts` — 사건 5개의 장면·오브젝트·증거·진술 (형사 0, 노동 1, 민사 2, 계약 3, 헌법 4)
- `src/lib/lawtypes.ts` — 조문 퍼즐 타입(`LawCase`, `Statute`, `Quiz`, `Element`, `Cross`)과 등급 계산
- `src/lib/{criminal,labor,tort,contract,constitution}.ts` — 사건별 조문 카드·퀴즈·요건판·반박 데이터
- `src/lib/lawcases.ts` — 위 설정을 시나리오 `code`로 등록하고 조문 카드를 합칩니다. **새 사건은 여기에 등록**
- `src/lib/store.ts` — 게임 규칙(Zustand + 저장/검증). 화면 코드 없이 테스트됩니다
- `src/components/Game.tsx`(조사·인벤토리·결과), `LawTrial.tsx`(조문 퍼즐 5단계), `World.tsx`(Canvas)
- `tests/game.test.ts` — 5개 사건 전체 경로, 오답·함정, 저장값 검증

## 조문 퍼즐 규칙
- 단계: 0 조문 고르기 → 1 접수·청구 방식 퀴즈 → 2 요건판(증거 채우기) → 3 심문(증거 + 근거 조문) → 4 에필로그 퀴즈.
- 틀린 답은 1턴이 소모되고 `mistakes`가 오릅니다. 정답 제시는 턴을 쓰지 않습니다. 등급: S(0회) A(≤2) B(≤4) C.
- 몰래 녹음 같은 함정 증거는 `LawCase.illegalId`/`illegalMessage`로 설정하고, 쓰면 적법성 −25와 오답으로 처리됩니다.
- 저장 형식을 바꾸면 `store.ts`의 `isSave`와 `snapshot`, 목록(`objectIds`, `clueIds`)을 함께 고칩니다. 기존 저장값(새 필드 없음)도 통과해야 합니다.

## 법령 데이터 규칙 (중요)
- 조문 원문은 **기억으로 쓰지 말고** 국가법령정보센터(law.go.kr)의 현행 조문을 확인해서 넣습니다. 확인일은 파일 머리 주석과 사건의 `law` 문구에 적습니다(현재 2026-10-06).
- 최근 개정으로 기억과 다른 조문이 있었습니다(형법 제347조 법정형, 형사소송법 제245조의7 이의신청 3개월, 헌법재판소법 제68·69·75조, 소액사건심판법 제2조의 금액 기준 위임). 개정을 의심하면 원문부터 다시 확인하세요.
- 조문에 직접 쓰여 있지 않은 요건(재산상 손해, 인과관계, 과잉금지원칙 단계 등)은 `kind: 'case'`로 표시하고 판례·통설상 기준임을 밝힙니다.
- 해설은 단정하지 않습니다. 실제 판단이 사안에 따라 달라질 수 있는 부분은 그렇게 적고, 게임의 24턴은 법정기간이 아니라는 점을 유지합니다.

## 힉스필드(영상 컷인) 연결
- 정답 제시 때 `NEXT_PUBLIC_OBJECTION_VIDEO_URL`(공개 HTTPS MP4/WebM)이 있으면 영상으로 재생하고, 없거나 실패하면 도트 컷인을 보여 줍니다(`Game.tsx`의 `video`).
- API 비밀키는 브라우저 코드에 넣지 않습니다. 영상은 별도로 생성하고 결과 URL만 환경 변수로 전달합니다.
- 환경 변수는 `.env.example`을 복사해 `.env.local`로 만듭니다(`.env*`는 git에서 제외).

## 작업 원칙
- 변경 후 `npx tsc --noEmit`과 `npm test`를 통과시킵니다. 화면에 영향이 있으면 5개 사건 중 최소 하나는 직접 끝까지 플레이해 확인합니다.
- 기존 코드는 한 줄 압축 스타일이 많습니다. 새 데이터 파일은 읽기 쉽게 쓰고, 기존 파일은 동작과 무관한 포맷 변경을 하지 않습니다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
