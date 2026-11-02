# speaking

React Native + Expo로 만드는 토익스피킹 형식 연습 앱. 사용자가 선택한 [라일락 코치 원본](./docs/lilac-coach-reference.png)을 기준으로 개발한다.

## 현재 범위

- 학습·모의고사·기록 탭과 앱에 포함된 Pretendard 글꼴
- Q5–7 오리지널 질문 3개: 질문 음성 → 준비 3초 → 시작 신호 → 답변 녹음
- 답변 시간 15초·15초·30초, 기기 내 파일 보관과 다시 듣기
- iOS Supertonic F1·M1 및 시스템 영어 음성 선택·미리듣기
- 설정에서 Q5 한 문항만 실행하는 오디오 확인
- 취소·백그라운드 진입 시 중단 처리

전체 11문항 모의고사, 사진·표, SQLite 기록 관리, Supertonic 다운로드는 후속 단계다. 다운로드 탭은 준비 상태만 표시한다. 배포용 앱 식별자와 아이콘도 아직 확정하지 않았다.

진행 상황은 [TODO.md](./TODO.md)를 따른다. 실기기에서 지연과 녹음 품질을 확인하기 전까지 첫 단계를 완료로 표시하지 않는다.

## 실행

Node.js 22 LTS 이상과 npm을 사용한다. 의존성은 `package-lock.json`에 고정되어 있다.

```bash
npm ci
npm run ios
```

이 Mac처럼 기본 개발자 경로가 Command Line Tools인 경우:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npm run ios
```

Android는 Android Studio의 SDK와 에뮬레이터 또는 USB 디버깅이 허용된 기기가 필요하다.

```bash
npm run android
```

개발 빌드를 한 번 설치한 뒤에는 아래 명령으로 JS 변경을 반영한다.

```bash
npm start
```

웹에서는 화면과 탐색을 미리 볼 수 있다. 실제 녹음 연습은 iOS·Android 앱에서만 제공한다.

```bash
npm run web
```

## 작업 확인

```bash
npm run typecheck
npm run lint
```

자동화 테스트는 아직 추가하지 않았다. 린트·타입 검사·JS 번들 생성만으로 실제 녹음이나 네이티브 빌드 성공을 판단하지 않는다.

## 코드 구성

```text
src/app/                         Expo Router 화면
src/app/(tabs)/index.tsx         확정한 라일락 코치 홈
src/features/practice/          오디오 세션 순서와 취소 처리
src/services/audio-tasks.ts      음성 종료·준비 시간·시작 신호
src/services/recordings.ts       녹음 파일과 문항 메타데이터
src/content/daily.ts             오리지널 Q5–7 콘텐츠
src/state/settings.tsx          기기 영어 음성과 세션 중 선택
src/design/theme.ts             색상·글꼴
assets/audio/                   앱용 시작 신호
assets/fonts/                   Pretendard와 OFL 고지
```

화면은 상태를 표시하고 오디오 흐름은 `usePracticeSession`이 관리한다. 질문 음성의 `onDone` 이후 준비 시간을 시작한다. 녹음은 네이티브 `forDuration`으로 종료하고, 화면의 남은 시간은 단조 시계로 계산한다. 중단된 답변을 정상 완료로 저장하지 않는다.

녹음은 앱 Documents의 `answers/`에 저장한다. 문항별 JSON에는 상대 파일 이름을 기록한다. 첫 단계의 파일 기반 저장소는 4단계에서 SQLite 저장소로 확장한다. 음성 선택은 현재 실행 중인 앱에서 유지되며, 재실행 후 설정 복원은 후속 작업이다.

## 오디오 확인

- 처음 녹음할 때 마이크 권한을 요청한다. 거부했으면 기기 설정에서 허용한다.
- iPhone 시스템 TTS는 무음 모드에서 들리지 않을 수 있다. 무음 모드를 해제한다.
- 영어 음성 종류와 오프라인 사용 가능 여부는 기기에 따라 다르다.
- 백그라운드로 이동하면 현재 연습을 중단한다. 이미 저장된 답변은 남는다.
- `cueToRecordCommandMs`는 신호 종료 이벤트부터 녹음 명령까지의 시간이다. 실제 마이크 입력 시작 지연을 측정한 값이 아니다.
- 시작 신호는 앱에서 생성한 1,337Hz·0.89초 사인파다. 참조 영상의 관측값을 바탕으로 했으며 ETS 공식 신호 규격이라는 뜻은 아니다.

## 참고

- [Expo SDK 58 오디오](https://docs.expo.dev/versions/v58.0.0/sdk/audio/)
- [Expo SDK 58 시스템 음성](https://docs.expo.dev/versions/v58.0.0/sdk/speech/)
- [Expo 개발 빌드](https://docs.expo.dev/develop/development-builds/introduction/)
- [Pretendard 1.3.9](https://github.com/orioncactus/pretendard/releases/tag/v1.3.9): SIL Open Font License, 앱에 고지 포함

앱 질문과 시작 신호는 이 프로젝트에서 작성·생성했다. 참조 영상의 시험 음성·문항·사진을 복사해 포함하지 않았다.

## 기본 질문 음성

iOS에서 Supertonic 3 모델을 최초 1회 약 400MB 내려받고 SHA-256을 확인한다. 이후 F1·M1 중 선택한 목소리로 영어 문장을 기기에서 생성한다. Android는 시스템 음성을 사용한다. 음성 선택은 앱 실행 중에만 유지된다. 네이티브 모듈 변경 후 CocoaPods 설치와 개발 빌드 재설치가 필요하다. 실기기 동작은 확인 전이다.

모델: Supertone Supertonic 3, OpenRAIL-M; 모델 라이선스는 `assets/audio/supertonic/LICENSE-OpenRAIL-M.txt`를 참고한다. 합성에 사용한 예제 코드는 MIT 라이선스다.
