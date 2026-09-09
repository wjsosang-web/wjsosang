# 사진 넣는 곳

여기에 사진을 넣고 아래 명령을 실행하면 홈페이지에 올라간다.
사진 파일 자체는 저장소에 올라가지 않는다 (.gitignore).

## 1. 임원 얼굴 사진

사람 이름으로 저장한다.

```
photos/
  박승환.jpg
  유인주.jpg
```

```bash
node scripts/upload-org-photos.mjs photos/
```

4:3 으로 자르고 가로 1600px 로 줄여서 올린다. 인물이라 위쪽(얼굴)을 남긴다.
이미 사진이 있는 사람은 건너뛴다. 바꾸려면 `--force` 를 붙인다.

## 2. 협회활동 사진

행사별로 폴더를 만든다. 파일 이름이 곧 사진 설명이 된다.
앞의 번호는 순서를 맞추는 용도라 설명에서 빠진다.

```
photos/운동회/
  01 단체사진.jpg
  02 줄다리기.jpg
```

```bash
node scripts/new-activity.mjs photos/운동회 --title "원청협 웰니스 운동회" --date 2026-05-31
```

이미 만들어 둔 글에 사진만 붙일 수도 있다.

```bash
node scripts/new-activity.mjs photos/운동회 --post activity-20260531-wellness
```

만들어진 글은 **비공개**다. 관리자 화면에서 내용을 다듬고 공개로 바꾸면 된다.

붙일 수 있는 것: `--title` `--date` `--category` `--place` `--summary` `--body`

## 3. 히어로 배너 배경 사진

메인홈 맨 위 슬라이드의 배경이다. 세 장을 순서대로 넣는다.

```
photos/히어로/
  1 운동회.jpg
  2 임원진.jpg
  3 설명회.jpg
```

```bash
node scripts/hero-slides.mjs --photos photos/히어로
```

한 장만 바꾸려면:

```bash
node scripts/hero-slides.mjs --photo 2=photos/새사진.jpg
```

지금 상태만 보려면 옵션 없이 실행한다.

```bash
node scripts/hero-slides.mjs
```

- **가로로 넓은 사진**을 쓴다. 2000×1100 으로 잘라 올린다
- 왼쪽에 글씨가 얹히므로 **사람이 오른쪽에 있는 사진**이 잘 어울린다
- 용량은 1MB 아래로 자동으로 줄인다
