# 작업 인수인계 — 2026-11-02

## 프로젝트와 방향

- 토익스피킹 형식의 연습 앱을 React Native, Expo, TypeScript로 개발한다.
- 사용자가 선택한 라일락 코치 홈 디자인을 기준으로 한다. 부담 없이 Q5–7 짧은 연습을 시작하는 경험을 우선한다.
- 개발자는 RN을 처음 배우는 중이므로 변경 이유와 코드 구조를 쉽게 설명한다.

## 오늘 완료한 작업

- `main`을 GitHub 저장소 `jkgooooooo/toeic-speaking-rn`에 연결했다.
- iOS용 로컬 Expo 네이티브 모듈 `modules/supertonic-ios`를 추가했다. Swift와 ONNX Runtime으로 Supertonic 3 음성을 기기에서 생성한다.
- 기본 여성 F1과 남성 M1을 선택할 수 있다. 두 목소리는 공통 모델을 사용하며, 시스템 음성 선택지도 남아 있다.
- 모델은 첫 사용 때 약 400MB를 내려받고 SHA-256으로 파일 무결성을 확인한다. 생성된 음성은 임시 파일로 재생한다. 미리 녹음한 Q5–7만 사용하는 방식이 아니다.
- Expo 모듈 자동 연결과 iOS 시뮬레이터 빌드가 성공했다. 타입 검사와 린트도 통과했다.
- 사용자가 iPhone 실기기에서 음성이 나오는 것을 확인했다. 첫 사용에 시간이 걸려 처음에는 소리가 나지 않는 것처럼 보였다. 정확한 생성 시간과 전체 녹음 흐름은 아직 측정하지 않았다.
- Android의 Supertonic 엔진은 아직 없다. Android에서는 시스템 음성을 사용한다.

## 다음 작업: 우선순위

1. **준비 상태 표시**: 모델 다운로드와 음성 생성 중임을 화면에 명확히 표시한다. 다운로드 진행 상황과 실패·재시도 경로도 정리한다.
2. **질문 음성 미리 생성과 캐시**: 연습 시작 전 안내·질문 음성을 준비하고 같은 문장·목소리·모델 설정의 결과를 재사용한다. 텍스트·음성·모델 버전이 바뀌면 새로 생성하도록 키와 파일 정리 정책을 정한다. 현재는 문장마다 새로 생성한다.
3. **iPhone 실기기에서 오디오 흐름 확인**: F1과 M1의 질문 음성 종료 → 준비 3초 → 비프 → 녹음 → 다시 듣기를 확인한다. 첫 음절 누락, 비프 녹음, 이어폰, 중단·백그라운드, 권한 거부를 살펴본다.
4. **안내 음성 선택 저장**: 앱을 다시 켜도 선택한 목소리를 유지한다. 현재 선택은 앱 실행 중에만 유지된다.
5. 이후 Android Supertonic 지원을 검토하고, Q1–11 시험 엔진과 기록 기능을 단계적으로 구현한다. 자세한 항목은 `TODO.md` 참고.

## 집에서 이어가기

1. 다른 PC에서 저장소를 내려받거나 기존 폴더에서 최신 변경을 가져온다.
   ```bash
   git clone https://github.com/jkgooooooo/toeic-speaking-rn.git
   cd toeic-speaking-rn
   npm ci
   ```
   이미 내려받은 폴더라면 작업 내용을 확인한 뒤 `git pull`을 사용한다.
2. iPhone 앱 빌드에는 macOS, Xcode, CocoaPods, Apple 계정과 서명 설정이 필요하다. `ios/`와 `android/`는 생성 폴더여서 Git에 포함되지 않는다. 새 Mac에서는 `npx expo run:ios --device`로 네이티브 프로젝트를 생성·빌드할 수 있다. Xcode로 열 때는 `ios/speaking.xcworkspace`를 사용한다.
3. 개발 빌드 설치 후 프로젝트 터미널에서 `npm start`를 켜고 iPhone과 Mac을 같은 Wi-Fi에 연결한다. 기기가 바뀌면 모델도 새로 다운로드해야 한다.
4. Windows에서도 RN 코드와 Android 작업은 할 수 있지만, 로컬 iOS 빌드는 Mac이 필요하다.

## 주요 파일

- `src/features/practice/use-practice-session.ts`: 질문·준비·비프·녹음 순서
- `src/services/supertonic.ts`: RN에서 iOS 모듈 호출과 음성 재생
- `modules/supertonic-ios/ios/SupertonicModule.swift`: 모델 다운로드·무결성 확인·음성 생성 함수
- `modules/supertonic-ios/ios/SupertonicHelper.swift`: Supertonic 공식 예제 기반 합성 코드
- `src/app/settings.tsx`: 음성 선택과 모델 준비 화면
- `src/content/daily.ts`: 현재 오리지널 질문과 시간

## 참고 사항

- Supertonic 예제 코드는 MIT, 모델은 OpenRAIL-M 라이선스다. 앱 배포 전 고지와 이용 조건을 확인한다.
- iOS 모듈은 시뮬레이터 빌드에 성공했으나 모든 실기기, 음성, 녹음·중단 조합을 검증한 것은 아니다.
- 진행 중인 모델 다운로드와 음성 생성의 취소·복구 동작도 추가 확인이 필요하다.
