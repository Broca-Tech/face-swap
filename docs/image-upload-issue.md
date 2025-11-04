# 画像アップロード問題と対策

## 日付

2025年11月3日

## 問題の概要

### 発生している問題

Akool APIの`createSession, updateSession`エンドポイントが、**base64エンコードされた画像データに対応していない**ことが判明しました。

現在の実装では、ユーザーがアップロードした画像をbase64形式で取得し、そのまま`createSession`に渡していましたが、このAPIは**画像URLのみ**を受け付けるため、セッションの作成に失敗していました。

### 技術的詳細

#### 現在の実装フロー（問題あり）

```
1. ユーザーが画像をアップロード
2. FileReader APIでbase64形式に変換
3. detectBase64(base64Image) → 顔検出成功
4. createSession(base64Image, landmarks) → ❌ 失敗（base64非対応）
```

#### APIの仕様

- **Detect API (`/detect`)**:
  - `image_url`: URL形式 ✅
  - `img`: base64形式 ✅
  - 両方に対応
- **CreateSession API (`/faceswap/live/create`)**:
  - `sourceImage[].path`: **URL形式のみ** ⚠️
  - base64形式は非対応

## 対策

### 解決方針

画像をSupabaseストレージにアップロードし、公開URLを取得してからAkool APIを呼び出す方式に変更します。

### 新しい実装フロー

```
1. ユーザーが画像をアップロード
2. Supabaseストレージに画像をアップロード
3. 公開URL取得
4. detect(imageUrl) → 顔検出
5. createSession(imageUrl, landmarks) → ✅ 成功
```

### 実装手順

#### 1. Supabaseクライアントのセットアップ

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 2. 画像アップロード関数の作成

```typescript
// src/api/storage.ts
import { supabase } from '../lib/supabase';

export const uploadImage = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('face-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('face-images').getPublicUrl(data.path);

  return publicUrl;
};
```

#### 3. FaceSwapLiveコンポーネントの修正

```typescript
const handleImageUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setSessionState('uploading');

  try {
    // 1. Supabaseにアップロード
    const imageUrl = await uploadImage(file);
    setUploadedImageUrl(imageUrl);

    // 2. 顔検出（URL版を使用）
    setSessionState('detecting');
    const detectResult = await AkoolAPI.detect(imageUrl);

    // 3. セッション作成（URL版を使用）
    setSessionState('creating');
    const sessionResponse = await AkoolAPI.createSession(
      imageUrl,
      detectResult.landmarks_str
    );

    setSessionData(sessionResponse.data);
    setSessionState('ready');
  } catch (err) {
    setError(err.message);
    setSessionState('error');
  }
};
```

### 必要な環境変数

```.env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabaseストレージのセットアップ

1. Supabaseプロジェクトで新しいバケット`face-images`を作成
2. バケットを**Public**に設定（公開URL生成のため）
3. 必要に応じてStorage Policyを設定

## 廃止予定のコード

### 削除予定のメソッド

以下のbase64関連メソッドは、新しいURL方式の実装完了後に削除予定です：

#### `AkoolAPI.detectBase64()`

- **場所**: `src/api/akool.ts`
- **理由**: `detect()`メソッドでURL方式を使用するため不要
- **削除予定時期**: URL方式の動作確認後

```typescript
// ❌ 削除予定
detectBase64: async (base64Image: string): Promise<DetectResult> => {
  // ...
};
```

### 影響を受けるファイル

- `src/api/akool.ts` - `detectBase64`メソッドの削除
- `src/pages/FaceSwapLive.tsx` - `detectBase64`の使用箇所を`detect`に変更

## メリット

### 1. API仕様との整合性

- Akool APIの仕様に完全準拠
- エラーの原因を排除

### 2. パフォーマンス向上

- base64エンコード/デコードのオーバーヘッド削減
- ネットワーク転送効率の向上（base64は約33%容量増）

### 3. スケーラビリティ

- 画像の永続化が可能
- セッション更新時に同じURLを再利用可能
- 画像の履歴管理が容易

### 4. セキュリティ

- Supabaseのアクセス制御を利用可能
- 画像の有効期限設定が可能

## 注意事項

### コスト

- Supabaseのストレージ使用量が増加
- 適切な画像削除ロジックの実装を推奨

### セキュリティ

- バケットをPublicにするため、URLを知っていれば誰でもアクセス可能
- 機密性の高い画像の場合は、Signed URLの使用を検討

### エラーハンドリング

- Supabaseへのアップロード失敗時の処理
- ネットワークエラーの処理
- 画像サイズ制限のチェック

## 今後のタスク

- [ ] Supabaseクライアントのセットアップ
- [ ] `storage.ts`ファイルの作成
- [ ] `FaceSwapLive.tsx`の修正
- [ ] 動作確認とテスト
- [ ] `detectBase64`メソッドの削除
- [ ] 不要になったbase64関連コードのクリーンアップ
- [ ] 画像削除ロジックの実装（オプション）

## 参考

### Akool API仕様

- Detect API: base64 (`img`) とURL (`image_url`) の両方をサポート
- CreateSession API: URL (`sourceImage[].path`) のみをサポート

### Supabase Storage

- https://supabase.com/docs/guides/storage
