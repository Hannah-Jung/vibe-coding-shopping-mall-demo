# Stripe 결제 에러 해결 가이드

## "Error occurred while creating checkout session" 에러

### 1. 환경 변수 확인

**서버 디렉토리 (`server/.env`)에 다음이 있는지 확인:**
```
STRIPE_SECRET_KEY=sk_test_...
CLIENT_URL=http://localhost:5173
```

**중요:**
- `STRIPE_SECRET_KEY`는 `sk_test_` 또는 `sk_live_`로 시작해야 합니다
- 테스트 모드에서는 `sk_test_`를 사용하세요
- 키 앞뒤에 공백이나 따옴표가 없어야 합니다

### 2. 서버 재시작

환경 변수를 변경한 후에는 **반드시 서버를 재시작**해야 합니다:
```bash
# 서버 디렉토리에서
npm run dev
# 또는
npm start
```

### 3. 서버 콘솔 확인

서버 터미널에서 다음과 같은 디버그 메시지를 확인하세요:
- `[DEBUG] Creating checkout session...`
- `[DEBUG] Stripe key exists: true/false`
- `[DEBUG] Stripe key prefix: sk_test`

만약 `Stripe key exists: false`가 보이면 환경 변수가 제대로 로드되지 않은 것입니다.

### 4. 일반적인 에러 메시지

#### "STRIPE_SECRET_KEY is not configured"
- `.env` 파일이 `server` 디렉토리에 있는지 확인
- 파일 이름이 정확히 `.env`인지 확인 (`.env.txt`가 아님)
- 서버를 재시작했는지 확인

#### "Invalid API Key provided"
- Stripe 키가 올바른지 확인
- 테스트 키(`sk_test_`)를 사용 중인지 확인
- 키에 공백이나 줄바꿈이 없는지 확인

#### "No such price" 또는 "Invalid price"
- 금액이 0보다 큰지 확인
- 카트에 상품이 있는지 확인

### 5. 테스트

브라우저 개발자 도구(F12)의 Console 탭에서도 에러 메시지를 확인할 수 있습니다.

### 6. Stripe Dashboard 확인

[Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)에서:
- API 키가 활성화되어 있는지 확인
- 테스트 모드인지 확인 (개발자 모드 토글)

