# 슈가의 발레왕국 — Android 앱

`town/`(왕국), `cafe/`(발레 카페), `kingdom/`(정령 초상화) 웹 자산을 앱 안에 그대로 넣고, WebView로 띄우는 얇은 래퍼입니다.

| 항목 | 값 |
| --- | --- |
| 패키지 | `com.sugar.balletkingdom` |
| 앱 이름 | 슈가의 발레왕국 |
| 버전 | versionCode `1` / versionName `1.0.0` |
| SDK | minSdk 24, targetSdk 35, compileSdk 35 |
| 화면 | 세로 고정, 안드로이드 15+ 시스템 바 인셋 대응 |
| 웹 자산 | `town/`, `cafe/`, `kingdom/` 를 빌드 시 `app/src/main/assets/www/` 로 복사(`syncWebAssets` 태스크) |
| 표시 방식 | `WebViewAssetLoader` → `https://appassets.androidplatform.net/assets/www/town/index.html` |

`file://` 대신 `https://appassets.androidplatform.net` 오리진을 쓰는 이유: `localStorage`가 안정적으로 유지되고,
`../cafe/` 같은 상대 경로가 웹에서 보던 그대로 동작합니다.

## 뒤로가기

- 앱 안에서 이동할 기록이 있으면 이전 화면으로 갑니다(`webView.goBack()`).
- 첫 화면에서 누르면 "뒤로 가려면 한 번 더 눌러 주세요" 안내 후 2초 안에 다시 누르면 종료됩니다.

## 로컬 빌드

필요: JDK 17, Android SDK(platform 35, build-tools 35.0.0), Gradle 8.9.

```bash
cd android
cat > local.properties <<EOF
sdk.dir=/path/to/android-sdk
EOF
gradle bundleRelease      # 산출물: app/build/outputs/bundle/release/app-release.aab
```

서명 정보를 넣으려면 `android/keystore.properties`를 만듭니다(이 파일은 .gitignore에 있어 커밋되지 않습니다).

```properties
storeFile=/절대경로/upload-keystore.jks
storePassword=********
keyAlias=balletkingdom
keyPassword=********
```

`keystore.properties`가 없으면 서명 없는 `.aab`가 만들어집니다.

## GitHub Actions 로 빌드하려면

`.github/workflows/build-aab.yml` 워크플로우를 쓰려면 저장소에 다음 시크릿이 있어야 합니다.

| 시크릿 | 값 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 upload-keystore.jks` 결과 |
| `ANDROID_KEYSTORE_PASSWORD` | 키스토어 비밀번호 |
| `ANDROID_KEY_ALIAS` | `balletkingdom` |
| `ANDROID_KEY_PASSWORD` | 키 비밀번호 |

```bash
gh secret set ANDROID_KEYSTORE_BASE64   -R sheeny6-cmyk/magic-sugar-game < keystore.b64
gh secret set ANDROID_KEYSTORE_PASSWORD -R sheeny6-cmyk/magic-sugar-game
gh secret set ANDROID_KEY_ALIAS         -R sheeny6-cmyk/magic-sugar-game --body balletkingdom
gh secret set ANDROID_KEY_PASSWORD      -R sheeny6-cmyk/magic-sugar-game
```

이후 `main`에 `android/**` 변경을 푸시하거나 `gh workflow run build-aab.yml`로 실행합니다.

## 서명 키 주의사항

- `.jks`, `*.keystore`, `keystore.properties`는 **절대 커밋하지 않습니다**(.gitignore 처리됨).
- 업로드 키를 잃으면 같은 패키지로 앱을 업데이트할 수 없습니다. 안전한 곳에 백업하세요.
- Google Play 콘솔에서 'Play 앱 서명'을 쓰면 첫 업로드 때 이 키가 업로드 키로 등록되고,
  실제 배포 서명은 Google이 관리합니다.
