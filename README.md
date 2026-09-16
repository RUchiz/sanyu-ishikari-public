# 石狩市データ更新

## 本番適用時に行うこと

### 1. JSONを本番アプリの`public`へ配置する

このリポジトリにある以下のJSONを、本番アプリの`public`直下へ上書き配置する。

- `area.json`
- `choice.json`
- `contact.json`
- `dict.json`
- `faq.json`
- `map.json`
- `type.json`

```bash
cp \
  /Users/ryota/Desktop/sanyu/9_28石狩市更新/sanyu-ishikari-public/{area,choice,contact,dict,faq,map,type}.json \
  /Users/ryota/Desktop/sanyu/sanyu-deploy/gomi-front-sample-ishikari/public/
```

### 2. Firestoreの更新対象を確認する

`calendarPatterns5_updated.json`が本番に適用する確定値。`calendarPatterns5_origin.json`は更新前の証跡。

本番へ書き込む前にdry-runを実行する。

```bash
env \
  FIREBASE_PROJECT_ID=nth-plexus-329507 \
  FIREBASE_SERVICE_ACCOUNT=/Users/ryota/Desktop/sanyu/gomi-server/nth-plexus-329507-2ac2ce7e216b.json \
  node /Users/ryota/Desktop/sanyu/9_28石狩市更新/sanyu-ishikari-public/firestore/update_calendar_patterns.js --dry-run
```

表示内容が以下であることを確認する。

```text
project: nth-plexus-329507
collection: calendarPatterns5
updates: 1,2,3,4,5,6,7,8,9
deletions: none
dry-run: no writes performed
```

### 3. Firestoreを本番適用する

```bash
env \
  FIREBASE_PROJECT_ID=nth-plexus-329507 \
  FIREBASE_SERVICE_ACCOUNT=/Users/ryota/Desktop/sanyu/gomi-server/nth-plexus-329507-2ac2ce7e216b.json \
  node /Users/ryota/Desktop/sanyu/9_28石狩市更新/sanyu-ishikari-public/firestore/update_calendar_patterns.js
```

正常終了時は以下が表示される。

```text
update and verification completed
```

### 4. 再実行して適用完了を確認する

手順3と同じコマンドをもう一度実行する。適用済みの場合はFirestoreへの書き込みは行われない。

```text
updates: none
deletions: none
already up to date: no writes performed
```
