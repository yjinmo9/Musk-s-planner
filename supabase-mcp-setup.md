# Supabase MCP 연결 가이드

## 1. Claude Desktop 설정 파일 찾기

macOS에서 Claude Desktop 설정 파일 위치:

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

## 2. 설정 파일 편집

`claude_desktop_config.json` 파일을 열어서 다음 내용을 추가하세요:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase", "run"],
      "env": {
        "SUPABASE_URL": "https://xyqmuwvmxjptbbggmarw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE"
      }
    }
  }
}
```

## 3. Service Role Key 찾기

1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. Settings → API 메뉴로 이동
4. **service_role** 키 복사 (⚠️ 주의: anon key가 아닌 service_role key 사용)

## 4. 환경 변수 설정

위 설정에서 다음 값들을 실제 값으로 교체:

- `SUPABASE_URL`: 이미 `.env.local`에 있는 URL 사용

  ```
  https://xyqmuwvmxjptbbggmarw.supabase.co
  ```

- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard에서 복사한 service_role 키

## 5. Claude Desktop 재시작

설정 파일을 저장한 후 Claude Desktop을 완전히 종료하고 다시 시작하세요.

## 6. 연결 확인

Claude Desktop을 재시작한 후, 다음과 같이 확인할 수 있습니다:

- 채팅에서 "Supabase 데이터베이스의 테이블 목록을 보여줘" 같은 요청을 해보세요
- MCP 서버가 정상적으로 연결되면 데이터베이스 쿼리가 가능합니다

## 대안: 로컬 MCP 서버 직접 실행

별도로 MCP 서버를 실행하고 싶다면:

```bash
# Supabase MCP 서버 설치
npm install -g @supabase/mcp-server-supabase

# 환경 변수 설정 후 실행
export SUPABASE_URL="https://xyqmuwvmxjptbbggmarw.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# MCP 서버 실행
supabase-mcp-server
```

## 주의사항 ⚠️

1. **Service Role Key는 절대 공개하지 마세요!**
   - GitHub에 커밋하지 않기
   - 환경 변수나 안전한 곳에 보관

2. **Anon Key vs Service Role Key**
   - Anon Key: 클라이언트에서 사용 (제한된 권한)
   - Service Role Key: 서버/MCP에서 사용 (전체 권한)

3. **보안**
   - Service Role Key는 모든 데이터베이스 작업이 가능하므로 신중하게 관리

## 현재 프로젝트 정보

- **Supabase URL**: `https://xyqmuwvmxjptbbggmarw.supabase.co`
- **Anon Key**: `.env.local`에 저장됨
- **Service Role Key**: Supabase Dashboard에서 확인 필요

## 참고 링크

- Supabase MCP 공식 문서: https://github.com/supabase/mcp-server-supabase
- MCP 프로토콜: https://modelcontextprotocol.io/
