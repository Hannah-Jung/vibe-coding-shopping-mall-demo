# Shopping Mall Server

Node.js, Express, MongoDB를 사용한 쇼핑몰 데모 서버입니다.

## 기술 스택

- **Node.js**: JavaScript 런타임
- **Express**: 웹 애플리케이션 프레임워크
- **MongoDB**: NoSQL 데이터베이스
- **Mongoose**: MongoDB 객체 모델링 도구

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env.example` 파일을 참고하여 `.env` 파일을 생성하고 MongoDB 연결 정보를 입력하세요.

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shopping-mall
```

## 실행 방법

### 개발 모드 (nodemon 사용)
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## MongoDB 설정

로컬 MongoDB를 사용하는 경우:
1. MongoDB가 설치되어 있고 실행 중인지 확인하세요.
2. `.env` 파일에서 `MONGODB_URI`를 설정하세요.

MongoDB Atlas를 사용하는 경우:
1. MongoDB Atlas 계정을 생성하고 클러스터를 만드세요.
2. 연결 문자열을 `.env` 파일의 `MONGODB_URI`에 설정하세요.

## API 엔드포인트

- `GET /` - 서버 상태 확인

## 프로젝트 구조

```
server/
├── index.js          # 메인 서버 파일
├── package.json      # 프로젝트 의존성 및 스크립트
├── package-lock.json # 의존성 잠금 파일
├── .env              # 환경 변수 (gitignore에 포함)
├── .env.example      # 환경 변수 예제
├── .gitignore        # Git 제외 파일 목록
└── README.md         # 프로젝트 문서
```

