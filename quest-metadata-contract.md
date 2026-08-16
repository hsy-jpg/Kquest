# K-Quest Quest Metadata Contract

## 1. 목적과 적용 범위

이 문서는 `howtochange.md`의 Quest Type, Template, Variant, 기본 Steps 구조를 기준으로 유지하면서 `02_quest_generation_logic.md`의 행동성, 난이도, 시간, 인증, 제약, 사용자 선택 개념을 후처리 metadata로 통합한 K-Quest 공통 계약이다.

이 계약은 관광 콘텐츠 선별 이후 생성되는 **한 개의 게시 후보 Quest**를 표현한다. 현재 정책은 다음과 같다.

- 관광공사 `sourceContentId` 하나당 Quest 하나만 생성한다.
- `localScore`는 기존 `0~100` 척도를 유지한다.
- `steps[].kind`는 `VISIT / EXPLORE / PHOTO / ACTION`만 사용한다.
- 세부 행동은 `steps.kind`를 확장하지 않고 `actionTypes`에 별도로 저장한다.
- API에 없는 사실, 운영 정보, 촬영 허용 여부를 추측하지 않는다.
- 구매, 섭취, 대화, 실내 촬영이 필요한 행동은 검증된 근거가 없으면 필수 조건으로 만들지 않는다.

## 2. 최종 Quest 데이터 모델

```json
{
  "questId": "kq-kto-3544517-craft-process-spotter",
  "sourceContentId": "3544517",
  "title": "Discover ARTEASPOON",
  "description": "Explore the place through one small, observable action.",

  "region": "Seoul",
  "district": "Yongsan-gu",
  "latitude": 37.546467755,
  "longitude": 126.9821240366,
  "image": "https://example.com/image.jpg",

  "questType": "CRAFT_EXPERIENCE",
  "secondaryTags": ["LOCAL_EXPERIENCE"],
  "templateId": "CRAFT_PROCESS_SPOTTER_V1",
  "templateVersion": 1,
  "selectedVariantId": "CRAFT_PROCESS_SPOTTER_V1:craft-pattern",
  "generatorVersion": "quest-generator-v1",

  "steps": [
    {
      "order": 1,
      "kind": "VISIT",
      "prompt": "Visit ARTEASPOON and check in at the public entrance.",
      "verification": "GEOFENCE"
    },
    {
      "order": 2,
      "kind": "EXPLORE",
      "prompt": "Compare two visible patterns or finishes.",
      "verification": "SELF_CONFIRM"
    },
    {
      "order": 3,
      "kind": "PHOTO",
      "prompt": "Photograph one permitted design detail without including people.",
      "verification": "USER_PHOTO"
    },
    {
      "order": 4,
      "kind": "ACTION",
      "prompt": "Choose the most distinctive detail and record why.",
      "verification": "TEXT_OR_CHOICE"
    }
  ],

  "actionTypes": ["FIND", "COMPARE", "CAPTURE", "CHOOSE"],
  "difficulty": "MEDIUM",
  "durationMinutes": 20,
  "proofType": "PHOTO",
  "proofRequirement": "One permitted design detail must be visible without staff or visitors.",
  "completionRule": {
    "requiredStepOrders": [1, 2, 3, 4],
    "minimumCompletedSteps": 4,
    "proofRequired": true,
    "proofType": "PHOTO"
  },
  "season": ["ALL"],
  "recommendedTimes": ["ANYTIME"],
  "constraint": {
    "summary": "Use only publicly accessible areas and permitted subjects.",
    "rules": [
      "Do not photograph staff or visitors.",
      "Do not enter restricted areas."
    ]
  },
  "userChoice": {
    "required": true,
    "prompt": "Which detail feels most distinctive?",
    "responseType": "TEXT",
    "options": null
  },

  "localScore": 70,
  "qualityScore": 100,
  "classificationConfidence": 0.95,
  "groundingFields": ["title", "overview", "lclsSystm3"],
  "generationStatus": "AUTO_PUBLISHABLE",
  "publishBlockingReasons": [],
  "status": "PUBLISHED",

  "availability": {
    "startAt": null,
    "endAt": null
  },
  "sourceModifiedTime": "2025-10-23T14:30:00+09:00"
}
```

## 3. 필드 계약

### 3.1 기존 핵심 필드

| 필드 | 타입 | 필수 | 의미 |
|---|---|---:|---|
| `questId` | `string` | Y | K-Quest 내부의 안정적인 Quest 식별자 |
| `sourceContentId` | `string` | Y | 관광공사 `contentid`. 현재 장소당 Quest 하나 정책의 upsert key |
| `title` | `string` | Y | 사용자에게 표시할 Quest 제목 |
| `description` | `string` | Y | API 근거에 기반한 장소 및 Quest 설명 |
| `region` | `string` | Y | 정규화된 광역 지역 |
| `district` | `string \| null` | N | 정규화된 시군구 |
| `latitude` | `number \| null` | N | 위도 |
| `longitude` | `number \| null` | N | 경도 |
| `image` | `string \| null` | N | 대표 이미지 URL |
| `questType` | `QuestType` | Y | primary Quest 유형. 한 개만 저장 |
| `secondaryTags` | `string[]` | Y | 보조 유형 및 검색 태그. 최대 3개 권장 |
| `templateId` | `string` | Y | 적용된 승인 Template 식별자 |
| `templateVersion` | `integer` | Y | Template 계약 버전 |
| `selectedVariantId` | `string` | Y | Template 내부에서 선택된 문구 bundle 식별자 |
| `generatorVersion` | `string` | Y | 생성 규칙 버전. 재생성 추적용 |
| `steps` | `QuestStep[]` | Y | 기존 4단계 실행 구조 |
| `localScore` | `integer 0..100` | Y | `whichdata.md`의 지역성 점수 |
| `qualityScore` | `integer 0..100` | Y | 원천 데이터 품질 점수 |
| `classificationConfidence` | `number 0..1` | Y | Quest Type/Template 분류 신뢰도. 난이도와 무관 |
| `sourceModifiedTime` | `ISO-8601 string \| null` | N | 관광공사 원천 수정 시각 |
| `status` | `DRAFT \| PUBLISHED \| PAUSED \| ARCHIVED` | Y | Quest 게시 상태 |

### 3.2 QuestStep 계약

```ts
type QuestStepKind = "VISIT" | "EXPLORE" | "PHOTO" | "ACTION";

type StepVerification =
  | "GEOFENCE"
  | "SELF_CONFIRM"
  | "USER_PHOTO"
  | "TEXT_OR_CHOICE"
  | "NONE";

interface QuestStep {
  order: number;
  kind: QuestStepKind;
  prompt: string;
  verification: StepVerification;
}
```

- `VISIT`: 공개 좌표 또는 입구 도착
- `EXPLORE`: 현장에서 관찰·탐색할 대상
- `PHOTO`: 안전하고 허용 가능한 사진 대상
- `ACTION`: 선택, 비교, 기록, 짧은 행동
- 기존 문서의 `REFLECT` 성격은 호환성을 위해 `ACTION + TEXT_OR_CHOICE`로 표현한다.

### 3.3 신규 후처리 metadata

| 필드 | 타입 | 필수 | 의미 |
|---|---|---:|---|
| `actionTypes` | `ActionType[]` | Y | Quest 전체에 포함된 세부 행동. `steps.kind`와 별도 |
| `difficulty` | `EASY \| MEDIUM \| CHALLENGE` | Y | 행동 수, 제약, 이동 및 인증 복잡도로 산정 |
| `durationMinutes` | `integer` | Y | 예상 수행 시간. 권장 범위 `5~60`분 |
| `proofType` | `PHOTO \| TEXT \| CHOICE \| CHECK \| NONE` | Y | Quest 완료에 요구되는 대표 인증 방식 |
| `proofRequirement` | `string \| null` | 조건부 | 사용자가 제출하거나 확인해야 할 관찰 가능한 결과 |
| `completionRule` | `CompletionRule` | Y | 완료 판정을 위한 step 및 proof 조건 |
| `season` | `Season[]` | Y | 수행 적합 계절. 상시이면 `["ALL"]` |
| `recommendedTimes` | `RecommendedTime[]` | Y | 권장 시간대. 제한이 없으면 `["ANYTIME"]` |
| `constraint` | `QuestConstraint` | Y | 장소·안전·행동에 적용되는 구체 조건 |
| `userChoice` | `UserChoice \| null` | N | 정답 대신 사용자의 선택을 유도하는 요소 |

### 3.4 보조 운영 metadata

| 필드 | 타입 | 필수 | 의미 |
|---|---|---:|---|
| `groundingFields` | `string[]` | Y | 문구와 조건의 근거가 된 API 필드 |
| `generationStatus` | `AUTO_PUBLISHABLE \| DRAFT_REVIEW_REQUIRED \| REJECTED` | Y | 생성 결과의 게시 가능성. DB의 게시 `status`와 별개 |
| `publishBlockingReasons` | `string[]` | Y | Festival 기간 누락, 촬영 불명확, 안전정보 부족 등 게시 차단 사유 |
| `availability.startAt` | `ISO-8601 string \| null` | N | 행사 또는 Quest 활성 시작 시각 |
| `availability.endAt` | `ISO-8601 string \| null` | N | 행사 또는 Quest 활성 종료 시각 |

## 4. 공통 enum과 세부 타입

### 4.1 QuestType

기존 `howtochange.md`가 정의한 primary type을 유지한다.

```ts
type QuestType =
  | "FESTIVAL"
  | "LOCAL_MARKET"
  | "SHOPPING"
  | "LOCAL_FOOD"
  | "NATURE"
  | "CULTURE"
  | "NEIGHBORHOOD"
  | "CRAFT_EXPERIENCE"
  | "ACTIVE"
  | "STAY_CULTURE"
  | "LOCAL_DISCOVERY"
  | "GENERIC_LOCAL_DISCOVERY";
```

`primary QuestType`은 하나만 저장하며 복합 성격은 `secondaryTags`로 표현한다.

### 4.2 ActionType

```ts
type ActionType =
  | "TRY"
  | "FIND"
  | "CHOOSE"
  | "COMPARE"
  | "CAPTURE"
  | "COLLECT"
  | "CREATE"
  | "INTERACT"
  | "NOTICE"
  | "WALK"
  | "TASTE"
  | "TIME";
```

원칙:

- 한 Quest에 `1~4개`를 권장한다. 안전한 기존 4-step Quest를 정확히 표현하기 위해 02 문서의 `1~3개`를 상한이 아닌 기본 목표로 해석한다.
- 사진 step은 `CAPTURE`, 선택·기록 step은 `CHOOSE`, 탐색 step은 `FIND/NOTICE/COMPARE` 등으로 표현한다.
- `VISIT` 자체는 모든 Quest의 공통 실행 단계이므로 별도 ActionType으로 추가하지 않는다.
- `INTERACT`, `TRY`, `TASTE`, `CREATE`는 구매·대화·섭취를 필수화하지 않는다는 기존 안전 원칙을 통과한 경우만 사용한다.

### 4.3 Difficulty

```text
EASY      핵심 행동 1개, 단순 인증, 짧고 정적인 동선
MEDIUM    핵심 행동 2개 이상 또는 선택/비교/짧은 이동 포함
CHALLENGE 핵심 행동 3개 이상이며 이동·시간·복합 인증 조건 포함
```

사진 촬영이나 `VISIT` step이 있다는 이유만으로 난이도를 올리지 않는다. `classificationConfidence`를 difficulty 계산에 사용하지 않는다. 안전정보가 부족한 어려운 Quest는 `CHALLENGE`로 게시하는 대신 REVIEW로 보낸다.

### 4.4 Duration

- 단위는 분이며 필드명은 `durationMinutes`로 통일한다.
- 기본 권장값: `5, 10, 15, 20, 30, 45, 60`.
- API에 정확한 체험 시간이 없으면 Template별 기본값과 행동 수로 산정한다.
- 이동 시간이 불확실하면 현장 내부 수행 시간만 나타내며 과도하게 정확한 값을 만들지 않는다.

### 4.5 Proof와 CompletionRule

```ts
interface CompletionRule {
  requiredStepOrders: number[];
  minimumCompletedSteps: number;
  proofRequired: boolean;
  proofType: "PHOTO" | "TEXT" | "CHOICE" | "CHECK" | "NONE";
}
```

- `steps[].verification`은 각 단계의 확인 방법이다.
- `proofType`은 Quest 완료에 필요한 대표 증빙이다.
- `completionRule`은 어떤 단계와 증빙이 충족되어야 완료되는지 정의한다.
- 세 필드는 역할이 다르므로 하나로 합치지 않는다.
- `proofType=NONE`이면 `proofRequirement=null`, `proofRequired=false`여야 한다.
- `proofType=PHOTO`는 촬영 가능성과 관찰 가능한 대상을 확보한 경우만 허용한다.

### 4.6 Season과 RecommendedTime

```ts
type Season = "ALL" | "SPRING" | "SUMMER" | "FALL" | "WINTER";

type RecommendedTime =
  | "ANYTIME"
  | "MORNING"
  | "AFTERNOON"
  | "SUNSET"
  | "EVENING"
  | "NIGHT";
```

- 근거가 없으면 각각 `ALL`, `ANYTIME`을 사용한다.
- 제목이나 분위기만으로 계절·시간대를 추정하지 않는다.
- `SUNSET`, `NIGHT`처럼 안전과 운영시간에 영향을 주는 값은 상세정보 또는 승인된 Template 규칙이 필요하다.

### 4.7 Constraint와 UserChoice

```ts
interface QuestConstraint {
  summary: string;
  rules: string[];
}

interface UserChoice {
  required: boolean;
  prompt: string;
  responseType: "TEXT" | "CHOICE" | "CHECK";
  options: string[] | null;
}
```

- `constraint`는 수행 범위, 개수, 공개 구역, 촬영·접촉 금지 등을 구체적으로 표현한다.
- `userChoice`는 객관적인 정답보다 사용자가 직접 고르거나 기록할 요소를 표현한다.
- API 근거 없이 “현지인이 가장 많이 주문하는 메뉴”처럼 확인 불가능한 선택을 요구하지 않는다.

## 5. 채택한 규칙과 책임 경계

### 5.1 `howtochange.md`에서 유지한 규칙

- `lcls > cat > contentType > text` 분류 우선순위
- primary `questType` 하나와 최대 3개의 `secondaryTags`
- 승인된 `templateId`와 `selectedVariantId`
- `lclsSystm3 / cat3 / title / overview` 기반 variant 선택
- `VISIT / EXPLORE / PHOTO / ACTION` 기본 steps
- grounding, classification confidence, REVIEW/publish blocking
- 구매·섭취·대화·얼굴 촬영 비필수 원칙
- Festival 기간·venue 확인, 자연·촬영·안전 validator
- 장소당 Quest 하나와 안정적인 재생성

### 5.2 `02_quest_generation_logic.md`에서 채택한 규칙

- 장소 설명보다 구체적인 행동을 우선
- Where + Action + Constraint + Proof + Choice 구조
- 세부 `actionTypes`
- 행동 복잡도 기반 `difficulty`
- 분 단위 `durationMinutes`
- 대표 `proofType`과 관찰 가능한 `proofRequirement`
- `completionRule`
- `season`, `recommendedTimes`
- 작은 발견, 개인 선택, 기록 중심의 Quest
- specificity, participation, proofability 품질 기준
- 추상적 문구 및 유사 Quest 제거

### 5.3 채택하지 않거나 보류한 규칙

- 한 장소에서 여러 Quest 생성: 현재 `sourceContentId`당 하나 정책과 DB unique 제약 때문에 보류한다.
- 구매·음식 섭취를 전제로 한 시장/카페 Quest: 기존 안전 원칙을 우선하므로 검증되지 않으면 필수 미션으로 채택하지 않는다.
- `localScore 0~3`: 기존 `0~100`을 유지하고 추천 단계에서만 구간화한다.
- `isActive` 별도 boolean: 현재는 게시 상태와 기간으로 파생한다. 중복된 상태 source를 만들지 않는다.
- 자유로운 Action Type 문장 생성: enum과 승인 Template 규칙으로 제한한다.

## 6. 생성 및 후처리 순서

```text
whichdata.md 선별 결과
  → howtochange.md Quest Type 결정
  → Template 선택
  → Variant 선택
  → 기존 4-kind Steps 생성
  → actionTypes 파생
  → constraint / userChoice 생성
  → proofType / proofRequirement / completionRule 생성
  → difficulty / durationMinutes 생성
  → season / recommendedTimes / availability 생성
  → grounding / 중복 / 안전 / 수행 가능성 검증
  → AUTO_PUBLISHABLE 또는 DRAFT_REVIEW_REQUIRED
  → PUBLISHED / DRAFT 상태 결정
```

후처리 metadata가 생성되지 않았거나 규칙 간 모순이 있으면 기본값으로 자동 게시하지 않고 REVIEW로 보낸다. 단, `season=ALL`, `recommendedTimes=ANYTIME`, `userChoice=null`은 정상적인 명시적 기본값이다.

## 7. 후속 기능별 사용 필드

| 기능 | 사용하는 필드 |
|---|---|
| For You | `region`, `district`, `questType`, `secondaryTags`, `actionTypes`, `difficulty`, `durationMinutes`, `season`, `latitude`, `longitude`, `localScore`, `status` |
| For Today | `status`, `availability.startAt/endAt`, `season`, `recommendedTimes`, `durationMinutes`, `questType`, `localScore`, 좌표, `publishedAt/updatedAt` |
| Trending | `questId`, `questType`, `localScore`, `status`와 향후 `quest_events`, completion/photo/save 통계. Trending 점수 자체는 이 metadata에 저장하지 않음 |
| Completion | `steps`, `proofType`, `proofRequirement`, `completionRule`, `constraint`, `userChoice`, `difficulty`, `durationMinutes`, `availability` |
| Photo Verification | `steps[].verification`, `proofType`, `proofRequirement`, `constraint`, grounding 및 safety 관련 문구 |
| 운영자 Review | `classificationConfidence`, `groundingFields`, `generationStatus`, `publishBlockingReasons`, Template/Variant/Generator 버전 |

## 8. Supabase schema 추가 필요 필드

현재 `quests` 테이블에 다음 필드를 추가해야 이 계약을 영속화할 수 있다. 이 문서 단계에서는 migration을 만들거나 적용하지 않는다.

| 제안 컬럼 | 권장 타입 | 기본값/제약 |
|---|---|---|
| `template_version` | `integer` | `not null`, `>= 1` |
| `selected_variant_id` | `text` | `not null` |
| `generator_version` | `text` | `not null` |
| `action_types` | `text[]` | `not null default '{}'` + enum 값 check |
| `difficulty` | `text` | `EASY/MEDIUM/CHALLENGE` check |
| `duration_minutes` | `smallint` | `5..60` 권장 check |
| `proof_type` | `text` | `PHOTO/TEXT/CHOICE/CHECK/NONE` check |
| `proof_requirement` | `text` | nullable |
| `completion_rule` | `jsonb` | object check |
| `season` | `text[]` | `not null default '{ALL}'` |
| `recommended_times` | `text[]` | `not null default '{ANYTIME}'` |
| `constraint_data` | `jsonb` | object check |
| `user_choice` | `jsonb` | nullable, object check |
| `grounding_fields` | `text[]` | `not null default '{}'` |
| `generation_status` | `text` | publishability enum check |
| `publish_blocking_reasons` | `text[]` | `not null default '{}'` |
| `available_from` | `timestamptz` | nullable |
| `available_until` | `timestamptz` | nullable, `>= available_from` |

기존 컬럼은 그대로 유지한다.

- `quest_id`, `source_content_id`
- `title`, `description`
- `quest_type`, `secondary_tags`
- `template_id`, `steps`
- `classification_confidence`
- `region`, `district`, 좌표, 이미지
- `status`, `source_modified_time`, 게시·생성·수정 시각

`localScore`와 `qualityScore`는 현재 `tour_places`에 존재하므로 정규화 관점에서는 FK join으로 사용하는 것을 기본으로 한다. 추천 쿼리 성능 때문에 `quests`에 복제하려면 별도의 denormalization 정책과 동기화 책임을 먼저 정의해야 한다.

## 9. 불변 조건

최종 구현은 다음 조건을 항상 만족해야 한다.

1. `sourceContentId`당 현재 Quest는 최대 하나다.
2. `questType`은 하나이고 복합 유형은 `secondaryTags`로 표현한다.
3. 모든 step kind는 기존 네 값 중 하나다.
4. `actionTypes`는 steps를 설명하지만 steps를 대체하지 않는다.
5. `classificationConfidence`는 분류 신뢰도이며 difficulty가 아니다.
6. `status`는 게시 상태이며 사용자 진행 상태가 아니다.
7. `generationStatus`는 자동 게시 가능성이고 `status`와 별개다.
8. `localScore`는 항상 `0~100`이다.
9. proof는 관찰 가능하고 안전하며 장소와 관련된 결과를 요구해야 한다.
10. 행사 기간, 운영 시간, 촬영 가능 여부와 고유 사실은 API 또는 승인된 근거 없이 생성하지 않는다.
