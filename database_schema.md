# Musk's Planner - 데이터베이스 스키마 설계

## 개요

**Musk's Planner**를 위한 Supabase 데이터베이스 구조 설계 문서입니다. 일일 계획, 월간 목표, 통계 추적 기능을 지원하는 타임박싱 플래너 애플리케이션입니다.

## 설계 원칙

- **사용자 중심**: 모든 데이터는 `user_id`를 통해 인증된 사용자와 연결
- **날짜 기반**: 일일/월간 데이터를 날짜별로 구성
- **확장 가능**: 향후 기능(통계, 설정 등)을 위한 유연한 구조
- **보안**: 모든 테이블에 RLS(Row Level Security) 적용

---

## 테이블 구조

### 1. `users` (확장 프로필)

Supabase Auth 사용자에 추가 프로필 정보를 저장합니다.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**컬럼 설명:**

- `id`: Supabase Auth의 사용자 ID
- `email`: 사용자 이메일 주소
- `full_name`: 표시 이름
- `avatar_url`: 프로필 사진 URL (Google OAuth에서 가져옴)
- `timezone`: 사용자 시간대 (정확한 시간 추적용)
- `created_at`: 계정 생성 시각
- `updated_at`: 마지막 프로필 업데이트 시각

---

### 2. `daily_plans`

일일 플래너 데이터(주요 작업 및 브레인 덤프 메모)를 저장합니다.

```sql
CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  main_things JSONB DEFAULT '[]',
  brain_dump TEXT DEFAULT '',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**컬럼 설명:**

- `id`: 고유 플랜 식별자
- `user_id`: 플랜 소유자
- `date`: 플랜 날짜 (YYYY-MM-DD)
- `main_things`: 주요 작업 배열 (JSON 형식)
  ```json
  [
    { "text": "작업 설명", "completed": false },
    { "text": "다른 작업", "completed": true }
  ]
  ```
- `brain_dump`: 자유 형식 메모/생각
- `completed`: 하루 완료 여부
- `created_at`: 플랜 생성 시각
- `updated_at`: 마지막 수정 시각

**인덱스:**

```sql
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date DESC);
CREATE INDEX idx_daily_plans_completed ON daily_plans(user_id, completed);
```

---

### 3. `time_blocks`

일일 타임 플랜의 10분 단위 시간 블록을 저장합니다 (오전 4시 - 오후 12시).

```sql
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_plan_id UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL CHECK (hour >= 4 AND hour <= 12),
  segment INTEGER NOT NULL CHECK (segment >= 0 AND segment <= 5),
  color TEXT,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(daily_plan_id, hour, segment)
);
```

**컬럼 설명:**

- `id`: 고유 블록 식별자
- `daily_plan_id`: 상위 일일 플랜 참조
- `hour`: 시간 (4-12)
- `segment`: 10분 단위 세그먼트 (0-5, :00, :10, :20, :30, :40, :50 의미)
- `color`: 색상 카테고리 (blue, green, yellow, purple, pink)
- `content`: 작업/이벤트 설명
- `created_at`: 블록 생성 시각
- `updated_at`: 마지막 수정 시각

**인덱스:**

```sql
CREATE INDEX idx_time_blocks_daily_plan ON time_blocks(daily_plan_id);
```

---

### 4. `monthly_plans`

월간 목표와 계획을 저장합니다.

```sql
CREATE TABLE monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  content JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);
```

**컬럼 설명:**

- `id`: 고유 플랜 식별자
- `user_id`: 플랜 소유자
- `year`: 연도 (예: 2026)
- `month`: 월 (1-12)
- `content`: 월간 목표 배열 (JSON 형식)
  ```json
  [
    { "text": "프로젝트 V1 출시", "completed": true },
    { "text": "생산성 책 2권 읽기", "completed": false }
  ]
  ```
- `created_at`: 플랜 생성 시각
- `updated_at`: 마지막 수정 시각

**인덱스:**

```sql
CREATE INDEX idx_monthly_plans_user_date ON monthly_plans(user_id, year DESC, month DESC);
```

---

### 5. `user_settings` (향후 구현)

사용자 환경설정 및 선호사항을 저장합니다.

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT TRUE,
  haptic_feedback BOOLEAN DEFAULT FALSE,
  intensity_mode BOOLEAN DEFAULT FALSE,
  time_box_interval INTEGER DEFAULT 10 CHECK (time_box_interval IN (5, 10, 15, 30)),
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 6. `user_stats` (향후 구현)

통계 페이지를 위한 집계 데이터를 저장합니다.

```sql
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_boxed_hours DECIMAL(4,2) DEFAULT 0,
  deep_work_hours DECIMAL(4,2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0 CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**인덱스:**

```sql
CREATE INDEX idx_user_stats_user_date ON user_stats(user_id, date DESC);
```

---

## RLS (Row Level Security) 정책

### 모든 테이블에 RLS 활성화

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
```

### Users 테이블 정책

```sql
-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 생성 가능
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Daily Plans 정책

```sql
-- 사용자는 자신의 일일 플랜만 조회 가능
CREATE POLICY "Users can view own daily plans"
  ON daily_plans FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 일일 플랜만 생성 가능
CREATE POLICY "Users can create own daily plans"
  ON daily_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 일일 플랜만 수정 가능
CREATE POLICY "Users can update own daily plans"
  ON daily_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 일일 플랜만 삭제 가능
CREATE POLICY "Users can delete own daily plans"
  ON daily_plans FOR DELETE
  USING (auth.uid() = user_id);
```

### Time Blocks 정책

```sql
-- 사용자는 자신의 일일 플랜에 속한 타임 블록만 조회 가능
CREATE POLICY "Users can view own time blocks"
  ON time_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = time_blocks.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );

-- 사용자는 자신의 일일 플랜에만 타임 블록 생성 가능
CREATE POLICY "Users can create own time blocks"
  ON time_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = time_blocks.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );

-- 사용자는 자신의 타임 블록만 수정 가능
CREATE POLICY "Users can update own time blocks"
  ON time_blocks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = time_blocks.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );

-- 사용자는 자신의 타임 블록만 삭제 가능
CREATE POLICY "Users can delete own time blocks"
  ON time_blocks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM daily_plans
      WHERE daily_plans.id = time_blocks.daily_plan_id
      AND daily_plans.user_id = auth.uid()
    )
  );
```

### Monthly Plans 정책

```sql
-- 사용자는 자신의 월간 플랜만 조회 가능
CREATE POLICY "Users can view own monthly plans"
  ON monthly_plans FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 월간 플랜만 생성 가능
CREATE POLICY "Users can create own monthly plans"
  ON monthly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 월간 플랜만 수정 가능
CREATE POLICY "Users can update own monthly plans"
  ON monthly_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 월간 플랜만 삭제 가능
CREATE POLICY "Users can delete own monthly plans"
  ON monthly_plans FOR DELETE
  USING (auth.uid() = user_id);
```

### User Settings 정책

```sql
-- 사용자는 자신의 설정만 조회 가능
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 설정만 생성 가능
CREATE POLICY "Users can create own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 설정만 수정 가능
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

### User Stats 정책

```sql
-- 사용자는 자신의 통계만 조회 가능
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 통계만 생성 가능
CREATE POLICY "Users can create own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 통계만 수정 가능
CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 데이터베이스 함수

### `updated_at` 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_plans_updated_at BEFORE UPDATE ON daily_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at BEFORE UPDATE ON time_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_plans_updated_at BEFORE UPDATE ON monthly_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 마이그레이션 전략

### 1단계: 핵심 테이블 (즉시 구현)

1. `users` 테이블 생성
2. `daily_plans` 테이블 생성
3. `time_blocks` 테이블 생성
4. `monthly_plans` 테이블 생성
5. RLS 정책 적용
6. 인덱스 생성

### 2단계: 추가 기능 (향후 구현)

1. `user_settings` 테이블 생성
2. `user_stats` 테이블 생성
3. 필요에 따라 추가 인덱스 생성

---

## 데이터 마이그레이션 참고사항

- **게스트 데이터**: 현재 `localStorage`에 저장됨
- **마이그레이션 경로**: Google OAuth 후 로컬 데이터를 Supabase로 이전하도록 안내
- **충돌 해결**: 로컬과 클라우드 데이터가 모두 있는 경우 사용자가 선택하거나 병합

---

## 성능 고려사항

1. **인덱스**: 자주 조회되는 컬럼(`user_id`, `date`)에 인덱스 추가
2. **파티셔닝**: 데이터가 많아지면 `daily_plans`와 `time_blocks`를 날짜별로 파티셔닝 고려
3. **아카이빙**: 1년 이상 된 플랜 데이터 아카이빙 구현
4. **캐싱**: Supabase 실시간 구독을 사용한 라이브 업데이트

---

## 보안 고려사항

1. **RLS**: 모든 테이블에 RLS 활성화
2. **인증**: 인증된 사용자만 데이터 접근 가능
3. **검증**: 중요 필드(hour, segment, month)에 체크 제약 조건
4. **API 키**: 클라이언트 코드에 service_role 키 노출 금지

---

## 향후 개선사항

1. **협업**: 팀원과 일일 플랜 공유
2. **템플릿**: 일일 플랜 템플릿 저장 및 재사용
3. **분석**: 고급 통계 및 인사이트
4. **알림**: 미완료 작업 리마인더
5. **내보내기**: PDF/CSV로 데이터 내보내기
6. **AI 제안**: 히스토리 기반 스마트 타임 블록 제안
