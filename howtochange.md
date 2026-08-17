# 관광 데이터의 Quest 변환 로직

## 1. 설계 원칙

API 콘텐츠를 문장 생성 모델에 바로 넘겨 Quest를 자유 생성하지 않는다. 먼저 규칙으로 **Quest type과 검증 방식**을 정하고, 승인된 **Quest Template**의 슬롯만 API 데이터로 채운다. 생성형 모델은 문구를 자연스럽게 다듬거나 overview에서 근거 문장을 추출하는 보조 역할만 맡으며, API에 없는 사실·영업시간·역사 정보를 만들어서는 안 된다.

변환 결과는 기본적으로 다음 구조를 갖는다.

- 장소 방문: 좌표 반경 진입 또는 현장 체크인
- 탐색: 표식·재료·풍경·작품 등 현장에서 찾을 대상
- 사진 인증: 사람 얼굴·상점 내부·주민 사생활을 피한 대상
- 간단한 행동: 걷기, 관찰, 선택, 기록, 예절 실천

구매, 음식 섭취, 직원과의 대화, 얼굴 촬영은 필수 미션으로 만들지 않는다. 접근성·안전·촬영 금지 정보가 확실하지 않으면 보수적인 템플릿을 선택한다.

## 2. Quest type 결정 규칙

### 판정 우선순위

1. 유효 기간이 있는 행사이며 `contenttypeid=85` 또는 `lclsSystm1=EV` → Festival 계열
2. `lclsSystm3/2/1`의 구체 분류 → Quest type
3. `cat3/2/1`의 구체 분류 → fallback
4. `contenttypeid` → 큰 범위 fallback
5. `title + overview` 키워드 → subtype과 template 선택에만 사용
6. 근거가 충돌하거나 충분하지 않으면 `GENERIC_LOCAL_DISCOVERY` 및 사람 검수

`contenttypeid=76`은 자연과 문화 장소가 모두 들어 있으므로 반드시 category 계층과 함께 판정한다. 행사 표본처럼 `cat*`가 비어도 `EV*`, 행사 기간, 제목을 통해 판정할 수 있어야 한다.

## 3. API category → Quest type 매핑표

아래 표의 `prefix`는 정확 코드가 아니라 계층 prefix 매칭이다. 더 구체적인 3단계 코드 규칙이 넓은 1단계 규칙보다 우선한다. 카테고리 명칭은 `categoryCode2` 동기화 결과와 함께 관리한다.

| API 근거 | 의미/예시 | 기본 Quest type | 우선 Template |
|---|---|---|---|
| `contenttypeid=85` 또는 `lcls=EV*` | 축제·행사 | `FESTIVAL` | `FESTIVAL_SCENE_HUNT` |
| `EV01*` + 전통/공연/음식/지역 특산 단서 | 지역 축제 | `FESTIVAL` + subtype | `FESTIVAL_TRADITION_TRACE` 또는 `FESTIVAL_FLAVOR_TRACE` |
| `contenttypeid=79`, `cat1=A04`, `lcls=SH*` | 쇼핑 | `LOCAL_MARKET` 또는 `SHOPPING` | `MARKET_INGREDIENT_HUNT` |
| 위 조건 + market/시장/오일장/상설장/골목상권 단서 | 전통·지역시장 | `LOCAL_FOOD` | `MARKET_LOCAL_FOOD_HUNT` |
| 위 조건 + 백화점/면세점/글로벌 브랜드 단서 | 대형 상업시설 | Quest 미생성(기본) | 검수 전용 |
| `contenttypeid=82`, `cat1=A05`, `lcls=FD*` | 음식 | `LOCAL_FOOD` | `LOCAL_DISH_OBSERVER` |
| 음식 + 지역명/특산물/향토/시장 단서 | 지역 음식 | `LOCAL_FOOD` | `LOCAL_FLAVOR_TRACE` |
| 음식 + 지역 근거 없음/체인 의심 | 일반 음식점 | 보류 | 검수 전용 |
| `contenttypeid=76`, `cat1=A01`, `lcls=NA*` | 자연 | `NATURE` | `NATURE_DETAIL_HUNT` |
| 숲·정원·생태·습지 단서 | 자연 관찰 | `NATURE` | `NATURE_COLOR_AND_TEXTURE` |
| 산·오름·트레일·해안·절벽 단서 | 걷기/경관 | `NATURE` | `SAFE_VIEWPOINT_WALK` |
| `contenttypeid=76`, `cat1=A02`, `lcls=VE*` | 문화·역사 관광지 | `CULTURE` | `CULTURE_SYMBOL_HUNT` |
| 거리·계단·마을·골목·전망 단서 또는 `EX*` 체험 장소 | 로컬 탐색 | `NEIGHBORHOOD` | `STREET_DETAIL_HUNT` |
| 궁·성·사찰·유적·기념물 단서 | 문화유산 | `CULTURE` | `HERITAGE_CLUE_HUNT` |
| `contenttypeid=78`, `cat2=A0206`, `lcls=VE*` | 박물관·미술관·공연장 등 | `CULTURE` | `CULTURE_ONE_OBJECT` |
| 공방·체험관·지역문화센터 단서, `EX*` | 체험·공예 | `CRAFT_EXPERIENCE` | `CRAFT_PROCESS_SPOTTER` |
| `contenttypeid=75`, `cat1=A03` | 레포츠 | `ACTIVE` | `ACTIVE_ROUTE_CHECKPOINT` |
| 도보·자전거·카약 등 구체 활동과 안전정보 있음 | 야외 활동 | `ACTIVE` 또는 `NATURE` | 활동별 승인 템플릿 |
| `contenttypeid=80`, `lcls=AC*` | 숙박 | 기본 미생성 | 검수 전용 |
| 숙박 + 한옥/템플스테이/농어촌/전통 체험 근거 | 체류형 문화 경험 | `STAY_CULTURE` | `STAY_ETIQUETTE_DISCOVERY` |
| 분류 불명확, 텍스트만 존재 | 일반 장소 | `LOCAL_DISCOVERY` | `GENERIC_LANDMARK_HUNT` |

### 복합 유형 tie-break

- 축제 기간 중인 콘텐츠는 Festival을 primary로 하고 `food`, `culture`, `nature`를 secondary tag로 둔다.
- 전통시장은 Shopping보다 Local Food/Neighborhood를 우선한다.
- 자연 속 문화유산은 사용자의 핵심 행동에 따라 결정한다. overview가 역사 해설 중심이면 Culture, 탐방로·생태 중심이면 Nature다.
- 박물관의 체험 프로그램은 상설 전시 관람이면 Culture, 예약형 제작 활동이면 Craft Experience다.
- primary type은 하나만 저장하고, secondary tags는 최대 3개로 제한한다.

## 4. Quest Template 공통 구조

```json
{
  "templateId": "NATURE_DETAIL_HUNT_V1",
  "questType": "NATURE",
  "version": 1,
  "eligibility": {
    "requiredSignals": ["VALID_COORDINATES", "NATURE_CATEGORY"],
    "forbiddenFlags": ["DANGEROUS_ACCESS", "PRIVATE_PROPERTY"]
  },
  "source": {
    "contentId": "{{contentid}}",
    "modifiedTime": "{{modifiedtime}}"
  },
  "display": {
    "title": "Notice the small details of {{placeName}}",
    "summary": "{{groundedSummary}}",
    "imageUrl": "{{firstimage}}"
  },
  "location": {
    "address": "{{addr1}} {{addr2}}",
    "longitude": "{{mapx}}",
    "latitude": "{{mapy}}",
    "checkInRadiusM": 100
  },
  "steps": [
    { "kind": "VISIT", "verification": "GEOFENCE" },
    { "kind": "EXPLORE", "prompt": "{{approvedObservationPrompt}}" },
    { "kind": "PHOTO", "prompt": "{{safePhotoPrompt}}", "verification": "USER_PHOTO" },
    { "kind": "REFLECT", "prompt": "{{shortReflectionPrompt}}", "verification": "TEXT_OR_CHOICE" }
  ],
  "safety": {
    "purchaseRequired": false,
    "peoplePhotoRequired": false,
    "indoorPhotoAssumed": false,
    "warnings": "{{verifiedWarnings}}"
  },
  "availability": {
    "startAt": "{{eventstartdate|null}}",
    "endAt": "{{eventenddate|null}}",
    "sourceStatus": "ACTIVE"
  }
}
```

### 필수 슬롯

- 출처: `contentid`, `modifiedtime`, 원본 category
- 위치: 장소명, 주소, 좌표
- 근거 문구: overview에서 추출한 1~2문장 또는 사람이 승인한 설명
- 미션: 승인된 prompt variant ID와 채워진 명사 슬롯
- 검증: geofence, 사진, 객관식/짧은 기록 중 하나 이상
- 안전: 구매·촬영·접근성·기간 관련 flag
- 버전: `templateId`, `templateVersion`, `generatorVersion`

## 5. 재사용 가능한 Template 카탈로그

### T1. `MARKET_LOCAL_FOOD_HUNT`

- 대상: 전통시장, 오일장, 지역 음식 축제
- 방문: 시장 대표 좌표 도착
- 탐색: overview에 명시된 지역 식재료/음식 또는 승인된 일반 항목 3종 찾기
- 사진: 상호·사람 얼굴이 아니라 시장 간판, 진열 색감, 공용 공간 중 하나
- 행동: “이 시장에서 처음 본 재료/음식을 하나 기록하기”
- 금지: 구매·시식·상인 대화 강제

### T2. `LOCAL_FLAVOR_TRACE`

- 대상: 지역 음식점, 향토음식 공간
- 방문: 장소 도착
- 탐색: 메뉴판이나 외부 안내에서 지역 음식 이름 찾기
- 사진: 촬영 허용 시 외부 간판 또는 음식; 실내 촬영을 기본 가정하지 않음
- 행동: 재료 또는 조리 특징 하나 선택/기록
- 금지: 주문·결제 필수화. 구매 없이 수행 불가능하면 Quest를 만들지 않음

### T3. `NATURE_DETAIL_HUNT`

- 대상: 숲, 정원, 습지, 해안, 지질 명소
- 방문: 안전한 공개 지점 도착
- 탐색: 계절 색·잎·바위·물결 등 비채집 관찰
- 사진: 자연 디테일 또는 경관
- 행동: 보인 색/소리/질감 하나 기록
- 금지: 채집, 야생동물 접근, 출입로 이탈

### T4. `SAFE_VIEWPOINT_WALK`

- 대상: 산책로, 오름, 전망 지점, 골목 계단
- 방문: 출발 또는 승인된 checkpoint
- 탐색: 표지판/전망 요소 찾기
- 사진: 지정 랜드마크나 경관
- 행동: 짧은 경로 완료 또는 관찰 기록
- 조건: 거리·경사·운영시간·안전 정보를 검증한 경우만 자동 생성. 고난도 등산은 사람 검수

### T5. `HERITAGE_CLUE_HUNT`

- 대상: 사찰, 성곽, 유적, 기념물, 전통 건축
- 방문: 공개 관람 구역 도착
- 탐색: overview에 실제 언급된 문양·재료·인물·연도 중 하나 찾기
- 사진: 촬영 가능한 외관 디테일
- 행동: 발견한 단서와 의미를 객관식 또는 한 문장으로 연결
- 금지: 종교 의식 방해, 유물 접촉, 금지 구역 촬영

### T6. `CULTURE_ONE_OBJECT`

- 대상: 박물관, 미술관, 문화센터
- 방문: 시설 도착
- 탐색: 마음에 든 작품/전시 주제 하나 선택
- 사진: 기본은 건물 외관 또는 입구 표식. 내부 촬영은 명시적으로 허용될 때만
- 행동: 선택 이유를 짧게 기록
- 휴관·유료 여부가 불명확하면 검수

### T7. `STREET_DETAIL_HUNT`

- 대상: 문화거리, 벽화마을, 계단, 오래된 골목
- 방문: 경로 시작점 도착
- 탐색: 공공 표식·건축 디테일·거리 예술 찾기
- 사진: 공공 공간의 디테일
- 행동: 과거와 현재가 함께 보이는 요소 하나 기록
- 금지: 주택 창문·주민 얼굴 촬영, 소음, 사유지 진입

### T8. `FESTIVAL_SCENE_HUNT`

- 대상: 일반 축제·행사
- 기간: `eventstartdate <= now <= eventenddate`일 때만 활성화
- 방문: 행사장 도착
- 탐색: 행사 상징·공연·부스 범주 중 하나 찾기
- 사진: 공식 조형물/무대 외관/공용 장식
- 행동: 지역을 가장 잘 보여 준 요소 하나 기록
- 금지: 관람객 얼굴 촬영 강제, 유료 프로그램 참여 강제

### T9. `FESTIVAL_TRADITION_TRACE`

- 대상: 탈춤·풍물·공예·전통 공연 축제
- 탐색: 의상, 악기, 문양, 공예 과정 중 API 설명에 근거한 하나
- 행동: 그 요소가 지역 전통과 연결되는 이유를 선택/기록
- 정보가 부족하면 일반 Festival 템플릿으로 fallback

### T10. `GENERIC_LANDMARK_HUNT`

- 대상: 유형은 명확하지 않지만 품질과 지역성이 충분한 공개 장소
- 방문: 좌표 도착
- 탐색: 장소명 표식 찾기
- 사진: 표식 또는 외관
- 행동: 이 장소가 동네와 연결된다고 느낀 점 한 줄
- 자동 게시용이 아니라 임시 fallback이며 사람 검수를 기본값으로 둔다.

## 6. API 데이터 → Quest 생성 흐름

```text
API 목록 수집
  → 원본 JSON 보존 및 contentid 기준 upsert
  → 상세/소개/행사기간/운영정보 보강
  → UTF-8, 좌표, 날짜, 지역코드 정규화
  → 중복 제거 및 종료·위험·결측 하드 게이트
  → 신 분류(lcls) > 구 분류(cat) > contentType > 텍스트 순으로 의미 판정
  → Local Score + Data Quality Score 계산
  → 채택 / 검수 / 제외
  → primary Quest type + secondary tags 결정
  → eligibility가 맞는 Template 선택
  → API 근거가 있는 슬롯만 채움
  → 안전·촬영·구매·행사기간 validator 실행
  → 지역/유형 quota 및 운영자 검수
  → publish
  → modifiedtime/행사 종료/사용자 피드백으로 갱신·archive
```

### 단계별 산출물

1. **Raw ingest**: 원본 응답, 호출 시각, endpoint, page 저장
2. **Normalize**: 지역코드 fallback, 숫자 좌표, 날짜, taxonomy path 정리
3. **Enrich**: overview와 콘텐츠 유형별 상세 필드를 별도 호출해 결합
4. **Select**: `whichdata.md`의 gate와 점수 적용
5. **Classify**: `questType`, `subtype`, `classificationReasons`, confidence 생성
6. **Instantiate**: template 슬롯에 값 대입. 없는 값은 생성하지 않고 null/검수 flag 처리
7. **Validate**: 좌표 반경, 날짜, 촬영/구매 강제 여부, 금지 동사, 문구 근거 확인
8. **Review/Publish**: 낮은 confidence와 민감 유형만 사람이 확인
9. **Sync**: `modifiedtime` 변경 시 재생성하되 사용자 진행 중 Quest 버전은 고정

## 7. 자동 생성 confidence

`classificationConfidence`는 다음처럼 계산한다.

- 0.95: `contenttypeid`, 구체 `lclsSystm3`, 구체 `cat3`, 텍스트가 모두 일치
- 0.85: 신 분류와 content type이 일치하고 overview가 충분
- 0.70: content type + 구 분류만 일치
- 0.55: content type과 제목 키워드만 있음
- 0.40 이하: 분류 충돌 또는 텍스트 부족

0.80 이상만 자동 Template 선택, 0.60~0.79는 생성 후 검수, 0.59 이하는 사람 분류로 보낸다. Festival은 날짜와 장소 검증을 통과하지 못하면 confidence와 관계없이 게시하지 않는다.

## 8. 생성 문구의 grounding 규칙

- 장소명, 역사, 특산물, 작품, 식재료는 API overview 또는 승인된 구조화 필드에 있을 때만 언급한다.
- overview에서 고유명사와 관찰 가능한 명사만 추출하여 template slot 후보로 사용한다.
- “가장 오래된”, “유명한”, “현지인만 아는” 같은 비교·인기 표현은 근거가 없으면 제거한다.
- 운영 시간·입장료·촬영 가능 여부를 추정하지 않는다.
- 정보가 없을 때는 “외관의 표식을 찾아보세요”처럼 안전한 일반 variant를 사용한다.
- 최종 문구와 함께 `groundingFields`를 저장해 각 문장이 어떤 API 필드에서 왔는지 추적한다.

### 8.1 Variant 카탈로그

각 Template은 `EXPLORE`, `PHOTO`, `ACTION`별로 최소 4개, 권장 6개의 승인된 variant를 가진다. 자유 문장 생성 대신 다음 구조의 카탈로그에서 선택한다.

```json
{
  "templateId": "NATURE_DETAIL_HUNT_V1",
  "variants": [
    {
      "variantId": "forest-texture",
      "signals": ["lclsSystm3:NA01*", "title:forest|woodland"],
      "explore": "Find two textures around {{feature}} while staying on the public path.",
      "photo": "Photograph one texture at {{place}} without collecting plants.",
      "action": "Record one color, sound, or texture you noticed."
    }
  ]
}
```

- Template마다 variant ID는 영구적으로 고유해야 한다.
- variant에는 필요한 신호, 금지 flag, 사용할 수 있는 grounding slot을 명시한다.
- 장소명만 바꾼 동일 문구는 서로 다른 variant로 세지 않는다.
- Explore·Photo·Action은 같은 variant bundle을 기본으로 사용하되 안전 문구는 별도 validator가 덧붙일 수 있다.

### 8.2 Variant 선택 우선순위

1. `lclsSystm3`과 일치하는 variant
2. `cat3`과 일치하는 variant
3. `title`의 명시적 장소·지형·행사 주제와 일치하는 variant
4. overview/detail에서 추출한 근거 명사와 일치하는 variant
5. 해당 Template의 `safe-general-*` variant

여러 variant가 일치하면 신호별 가중치를 합산한다.

```text
lclsSystm3 exact/prefix +40
cat3 exact/prefix        +30
title keyword            +20
overview/detail keyword  +15
secondary tag            +10
safe general              +1
```

동점은 `hash(contentid + templateVersion)`로 결정하여 같은 원본·버전은 재생성해도 같은 결과가 나오게 한다.

### 8.3 최근 variant 반복 방지

생성 함수는 선택적으로 `recentVariantIds`를 입력받는다. 같은 사용자의 최근 20개 Quest 또는 최근 30일 사용 기록을 권장 범위로 한다.

1. 점수가 가장 높은 후보군에서 최근 사용 variant를 제외한다.
2. 모두 최근 사용됐다면 가장 오래전에 사용한 variant를 선택한다.
3. 안전 조건을 충족하는 variant가 하나뿐이면 반복 방지보다 안전을 우선한다.
4. 저장 시 `selectedVariantId`와 `variantSelectionReasons`를 남긴다.

DB schema가 준비되기 전에는 호출자가 최근 ID 배열을 전달하는 순수 함수로 구현한다. 이 문서 단계에서는 기존 DB를 변경하지 않는다.

### 8.4 Grounding slot 생성

- `place`: API `title`의 영문 장소명
- `region`: 정규화된 시도·시군구
- `feature`: `lclsSystm3`, `cat3`, title, overview/detail에서 확인된 지형·시설·시장·거리 요소
- `topic`: overview/detail에 실제 등장한 전시·역사·음식·축제 주제
- `object`: 현장에서 관찰할 수 있다고 API 근거로 확인된 명사

overview/detail이 존재하면 문장별 `groundingFields`에 사용한 원문 필드를 기록한다. 추출값이 없으면 고유 사실을 추측하지 않고 `public sign`, `exterior detail`, `landscape feature`, `official festival symbol` 같은 안전한 일반 slot을 사용한다.

### 8.5 게시 차단 규칙

Quest 초안 생성 성공과 자동 게시 가능 여부를 분리한다. 다음 항목은 문구를 생성할 수 있어도 `REVIEW` 상태를 유지한다.

- `GENERIC_LOCAL_DISCOVERY` 또는 taxonomy 충돌
- confidence가 Template 요구값보다 낮음
- B-Con Ground처럼 장소 성격을 구조화 필드로 확정하지 못함
- ARTEASPOON처럼 체험 프로그램 운영 여부가 확인되지 않음
- Baengnokdam처럼 경로·난이도·입산·기상 안전정보가 필요한 자연 장소
- Festival의 `eventstartdate`, `eventenddate`, `venue` 중 하나라도 없음
- 촬영·구매·예약이 필요한 Template인데 허용 여부를 확인하지 못함

게시 차단 결과에는 `generationStatus: DRAFT_REVIEW_REQUIRED`와 구체적인 `publishBlockingReasons`를 저장한다.

## 9. 예시 변환

### Ahopsan Forest

- 근거: `contenttypeid=76`, `cat1=A01`, `lclsSystm1=NA`, 부산 기장군 좌표
- 판정: `NATURE`, 높은 confidence
- Template: `NATURE_DETAIL_HUNT`
- Quest: 도착 → 숲의 서로 다른 초록색/질감 찾기 → 길을 벗어나지 않고 자연 디테일 촬영 → 관찰 한 줄

### 168 Stairs

- 근거: 관광지 76, 문화/체험 계열 category, 동구 주소, 계단이라는 관찰 가능한 장소명
- 판정: `NEIGHBORHOOD`, 중~높은 confidence
- Template: `STREET_DETAIL_HUNT` 또는 안전정보 확인 후 `SAFE_VIEWPOINT_WALK`
- Quest: 시작점 도착 → 공공 표식이나 계단 주변 디테일 찾기 → 주민 얼굴·주택 내부를 피한 사진 → 이 길에서 느낀 동네 특징 기록

### Chuncheon Makguksu & Dakgalbi Festival

- 근거: `contenttypeid=85`, `EV/EV01/EV010300`, 행사 기간, 춘천 주소
- 판정: primary `FESTIVAL`, secondary `LOCAL_FOOD`
- Template: `FESTIVAL_FLAVOR_TRACE`(승인 추가) 또는 `FESTIVAL_SCENE_HUNT`
- Quest: 행사 기간 중 도착 → 지역 음식 이름/재료 표식 찾기 → 공식 장식 사진 → 구매 없이 새로 알게 된 음식 특징 기록

## 10. 구현 경계

이 문서는 데이터/Quest 생성 규칙만 정의한다. 현 단계에서는 기존 UI, Quest 화면, 인증 기능, 데이터베이스 schema를 변경하지 않는다. 구현 시에도 먼저 배치 분석 결과와 운영자 검수 화면용 데이터 계약을 확정한 다음 기존 기능과 연결한다.
