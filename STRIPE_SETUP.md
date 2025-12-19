# Stripe 결제 설정 가이드

## 환경 변수 설정

### 서버 (server/.env)
```
STRIPE_SECRET_KEY=sk_test_...  # Stripe Secret Key (테스트 모드)
CLIENT_URL=http://localhost:5173  # 클라이언트 URL
```

### 클라이언트 (client/.env)
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Stripe Publishable Key (테스트 모드)
```

## Stripe 계정 설정

1. [Stripe Dashboard](https://dashboard.stripe.com)에 로그인
2. 개발자 모드에서 API 키 확인
   - Publishable key: 클라이언트에서 사용
   - Secret key: 서버에서 사용 (절대 클라이언트에 노출하지 마세요)
3. 테스트 카드 번호 사용:
   - 카드 번호: `4242 4242 4242 4242`
   - 만료일: 미래 날짜
   - CVC: 임의의 3자리 숫자
   - ZIP: 임의의 5자리 숫자

## 주요 변경 사항

1. **KG이니시스/PortOne 제거**: 모든 PortOne 관련 코드가 제거되었습니다.
2. **Stripe Checkout Session 사용**: Stripe의 호스팅된 결제 페이지를 사용합니다.
3. **결제 흐름**:
   - 사용자가 "Place Order" 클릭
   - 서버에서 Checkout Session 생성
   - Stripe 결제 페이지로 리다이렉트
   - 결제 완료 후 `/order/success`로 리다이렉트
   - 주문 생성 및 확인 페이지로 이동

## 테스트

1. 서버와 클라이언트 모두 실행
2. 카트에 상품 추가
3. 체크아웃 페이지로 이동
4. 배송 정보 입력
5. "Place Order" 클릭
6. Stripe 테스트 카드로 결제 진행

