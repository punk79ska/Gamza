# 🥔 감자 마켓 (Gamza Market)

> **"우리 동네 따뜻한 이웃 간의 구황작물 중고 직거래 마켓"**  
> 포슬포슬 따뜻한 감자 온도로 신뢰를 쌓아가는 지역 기반 중고거래 웹 애플리케이션입니다.

---

## ✨ 주요 기능 (Key Features)

- **🛒 상품 피드 & 직관적인 브라우징**
  - 실시간 물품 목록 탐색 및 반응형 그리드 뷰
  - 상단 즉시 검색 (키워드, 동네명, 카테고리) 및 카테고리별 실시간 필터링
  - 판매 상태 뱃지 (판매중 / 예약중 / 거래 완료)

- **🔍 상품 상세 정보 및 상호작용**
  - 고화질 상품 이미지 모달 팝업 및 캐러셀 뷰
  - 판매자의 **감자 온도(℃)** 및 신뢰도 표시
  - 관심 상품 찜(좋아요) 토글 및 실시간 카운트 반영
  - 판매자의 상품 상태 변경(판매중, 예약중, 거래 완료) 및 수정/삭제

- **✏️ 따뜻한 물건 등록 (글쓰기)**
  - 상품명, 카테고리, 가격, 거래 장소, 상세 설명 입력
  - 이미지 파일 드래그 앤 드롭 및 즉시 미리보기
  - 가격 무료 나눔(0원) 옵션 지원
  - 폼 실시간 유효성 검증

- **💬 실시간 1:1 감자 채팅 (Gamza Chat)**
  - 상품 상세 모달 내 **[채팅 시작하기]** 원클릭 1:1 대화방 즉시 생성 및 연결
  - 상단 헤더 및 모바일 플로팅(FAB) **[감자톡]** 버튼을 통한 전체 대화방 목록 조회
  - 상단 거래 상품 미니 카드 요약 (제목, 가격, 판매상태) 및 바로가기 연동
  - 빠른 추천 답장 칩 ("구매 가능한가요? 🥔", "언제 직거래 가능한가요? 📍", "네고 가능한가요? 😊")
  - Supabase Realtime 채널 구독 및 생생한 판매자 자동 답장(인터랙티브 타이핑 인디케이터)
  - 네트워크 단절 및 비로그인 상태 시 로컬 스토리지 기반 안전한 세션 유지

- **🥔 감자 회원 인증 (Auth & Profiles)**
  - 닉네임 기반 빠른 가입 및 세션 관리
  - 비로그인 사용자를 위한 로컬 익명 세션 지원 (체험 가능)
  - 글쓰기/판매 상태 변경 시 로그인 유도 브릿지 연동

- **☁️ Supabase 클라우드 실시간 동기화**
  - 클라우드 데이터베이스(`products`, `user_profiles`) 완전 연동
  - 네트워크 단절 시에도 `shared/mock_data.js`를 통한 안정적인 폴백 지원

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 기술 / 도구 |
| :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, Modern CSS3 |
| **Design Tokens** | 감자 테마 컬러 시스템, 모바일 친화적 반응형 UI |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, JS SDK v2) |
| **Typography** | Pretendard CDN Font |
| **Hosting & Deploy** | GitHub Pages, Vercel, Netlify 호환 정적 웹 앱 |

---

## 📁 프로젝트 구조 (Project Structure)

```text
Gamza/
├── components/                 # 분리형 화면 UI 컴포넌트
│   ├── screen1_list.css        # [화면 1] 메인 상품 목록 스타일
│   ├── screen1_list.html       # [화면 1] 상품 목록 템플릿
│   ├── screen1_list.js         # [화면 1] 피드 및 필터 컨트롤 로직
│   ├── screen2_detail.css      # [화면 2] 상품 상세 모달 스타일
│   ├── screen2_detail.html     # [화면 2] 상세 모달 템플릿
│   ├── screen2_detail.js       # [화면 2] 상세 및 상태 변경 로직
│   ├── screen3_write.css       # [화면 3] 상품 등록 모달 스타일
│   ├── screen3_write.html      # [화면 3] 상품 등록 템플릿
│   ├── screen3_write.js        # [화면 3] 상품 작성 및 유효성 검증 로직
│   ├── screen4_chat.css        # [화면 4] 실시간 채팅 및 대화목록 스타일
│   └── screen4_chat.js         # [화면 4] 실시간 대화/응답 및 톡 컨트롤러 로직
├── shared/                     # 전역 공유 모듈 및 에셋
│   ├── auth.css                # 로그인/회원가입 모달 스타일
│   ├── auth.js                 # 인증 및 세션 관리 모듈
│   ├── design_tokens.css       # 감자 테마 컬러 변수 및 공통 토큰
│   ├── mock_data.js            # 네트워크 오프라인 시 폴백 데이터
│   └── supabase_client.js      # Supabase 클라이언트 연결 브릿지
├── app.js                      # 메인 오케스트레이터 및 컴포넌트 브릿지
├── index.html                  # 애플리케이션 진입점 (Single Page View)
├── style.css                   # 전역 레이아웃 및 리셋 스타일
├── supabase_schema.sql         # Supabase PostgreSQL DDL 스키마
├── apply_schema.js             # Supabase 스키마 자동 마이그레이션 스크립트
├── .env.example                # 환경 변수 템플릿 파일
└── .gitignore                  # Git 추적 제외 설정 파일
```

---

## 🚀 빠른 시작 (Getting Started)

별도의 빌드 과정(Webpack/Vite 등)이 필요 없는 순수 정적 웹 애플리케이션이므로, 로컬 웹 서버로 즉시 실행할 수 있습니다.

### 1. 저장소 클론
```bash
git clone https://github.com/punk79ska/Gamza.git
cd Gamza
```

### 2. 로컬 웹 서버 실행
원하시는 방법으로 로컬 서버를 실행하세요:

- **VS Code Live Server 확장 프로그램**: `index.html` 우클릭 -> `Open with Live Server`
- **Node.js (npx)**:
  ```bash
  npx serve .
  ```
- **Python 3**:
  ```bash
  python -m http.server 3000
  ```

브라우저에서 `http://localhost:3000` (또는 해당 포트)에 접속하면 바로 감자 마켓을 만나보실 수 있습니다.

---

## ⚙️ 환경 변수 및 Supabase 설정

본 프로젝트는 기본적으로 사전 구성된 Supabase 프로젝트와 연결되어 있으며, 오프라인 시 목(Mock) 데이터로 자동 폴백됩니다.  
개인 Supabase 인스턴스를 구축하여 사용하시려면 아래 단계를 참고하세요:

1. `.env.example` 파일을 복사하여 `.env` 생성:
   ```bash
   cp .env.example .env
   ```
2. `.env` 파일에 발급받은 Supabase 정보를 입력합니다.
3. 데이터베이스 스키마 생성:
   - Supabase 대시보드의 **SQL Editor**에서 `supabase_schema.sql` 내용을 복사하여 실행하거나,
   - 스크립트로 자동 적용:
     ```bash
     node apply_schema.js
     ```

---

## 📄 라이선스 (License)

This project is licensed under the MIT License.
