# 해운 결재시스템 (Maritime Approval System)

현대적인 웹 기술을 사용하여 개발된 해운업계 전용 결재시스템입니다. 기존 레거시 Visual FoxPro 시스템을 대체하는 모던 웹 애플리케이션입니다.

## 🚢 주요 기능

- **다단계 결재 시스템**: 직급별 승인 단계 관리
- **실시간 알림**: Socket.IO 기반 즉시 알림
- **해운업계 특화**: 선박, 선원, 정비 관련 결재 프로세스
- **모바일 친화적**: 반응형 디자인으로 선박에서도 사용 가능
- **첨부파일 관리**: 문서, 이미지 등 파일 첨부 기능

## 🛠 기술 스택

### Backend
- **Node.js + Express**: REST API 서버
- **PostgreSQL**: 메인 데이터베이스
- **Sequelize**: ORM (Object-Relational Mapping)
- **Socket.IO**: 실시간 통신
- **JWT**: 인증 및 권한 관리
- **Multer**: 파일 업로드 처리

### Frontend
- **React.js**: 모던 프론트엔드 프레임워크
- **Ant Design**: UI 컴포넌트 라이브러리
- **React Query**: 서버 상태 관리
- **Axios**: HTTP 클라이언트
- **Socket.IO Client**: 실시간 통신

## 📋 결재 유형

1. **예비품 주문** (Spare Parts Order)
2. **선용품 구매** (Ship Stores)
3. **수리 작업** (Repair Works)
4. **선원 관련** (Crew Matters)
5. **비용 지출** (Expenses)
6. **입거 작업** (Docking Works)

## 🏗 프로젝트 구조

```
approval-system/
├── server/                 # Backend (Node.js + Express)
│   ├── database/           # 데이터베이스 스키마 및 샘플 데이터
│   ├── models/             # Sequelize 모델
│   ├── routes/             # API 라우트
│   ├── middleware/         # 미들웨어 (인증 등)
│   └── index.js           # 서버 진입점
├── client/                 # Frontend (React.js)
│   ├── public/             # 정적 파일
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── contexts/       # Context API (Auth, Socket)
│   │   └── App.js         # 메인 앱 컴포넌트
└── MDD_Document.md        # 모델 기반 개발 문서 (70+ 페이지)
```

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js (v16 이상)
- PostgreSQL (v12 이상)
- npm 또는 yarn

### 1. 저장소 클론
```bash
git clone https://github.com/yeonjeman0-crypto/approval-system.git
cd approval-system
```

### 2. 데이터베이스 설정
```bash
# PostgreSQL에서 데이터베이스 생성
createdb approval_system

# 스키마 생성
psql approval_system < server/database/schema.sql

# 샘플 데이터 삽입
psql approval_system < server/database/sample_data.sql
```

### 3. Backend 실행
```bash
cd server
npm install
npm start
```

### 4. Frontend 실행
```bash
cd client
npm install
npm start
```

## 🔑 테스트 계정

| 사용자명 | 비밀번호 | 역할 |
|---------|---------|------|
| captain_kim | password123 | 선장 (최종 승인자) |
| chief_lee | password123 | 기관장 |
| mgr_ops | password123 | 운영부장 |
| co_park | password123 | 일항사 |

## 📡 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 사용자 정보 확인

### 결재
- `GET /api/approvals` - 결재 목록 조회
- `POST /api/approvals` - 새 결재 생성
- `GET /api/approvals/:id` - 결재 상세 조회
- `POST /api/approvals/:id/process` - 결재 처리 (승인/반려)

### 첨부파일
- `POST /api/approvals/:id/attachments` - 파일 업로드
- `GET /api/attachments/:id` - 파일 다운로드

## 🌊 특별 기능

### 해운업계 특화 UI
- 바다 파도 애니메이션이 적용된 로그인 화면
- 선박 아이콘과 해운업계 친화적 디자인
- 모바일 최적화로 선박에서도 편리한 사용

### 실시간 알림 시스템
- 새로운 결재 요청 즉시 알림
- 결재 상태 변경 실시간 업데이트
- 브라우저 알림 지원

## 🔧 환경 변수

### Server (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=approval_system
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 📖 개발 문서

자세한 시스템 설계 및 개발 가이드는 [MDD_Document.md](./MDD_Document.md) 파일을 참조하세요.

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 내부 개발용으로 제작되었습니다.

## 📞 연락처

프로젝트 관련 문의: [GitHub Issues](https://github.com/yeonjeman0-crypto/approval-system/issues)

---

**⚓ 안전한 항해와 효율적인 업무처리를 위한 현대적 결재시스템**