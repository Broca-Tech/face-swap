# Agora ビデオストリーム取得 実装計画

## 📋 概要

Agora RTC SDKを使用して、カメラのビデオストリームを取得し、Akool Live FaceSwapと連携させる実装を行う。

## 🎯 目標

1. ローカルカメラからビデオストリームを取得
2. Agoraチャンネルに接続
3. ビデオストリームをpublish
4. Akoolで加工されたストリームをsubscribe
5. 加工後の映像を表示

---

## 📦 必要な準備

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```env
VITE_AKOOL_API_KEY=your_api_key_here
```

**注意**: Agora App IDは環境変数で設定する必要はありません。
Akoolの`createSession` APIのレスポンスから以下の情報が取得できます：

- `app_id`: AgoraのアプリケーションID
- `channel_id`: Agoraのチャンネル名
- `front_rtc_token`: Agora接続用のRTCトークン
- `front_user_id`: クライアント用のユーザーID

### 2. TypeScript型定義の追加

Agora関連の型定義は `src/api/types.ts` に既に含まれています

---

## 🛠 実装ステップ

### Step 1: Agora管理用のHooksを作成

**ファイル**: `src/hooks/useAgora.ts`

**実装内容**:

- Agoraクライアントの初期化
- チャンネルへの接続/切断
- ローカルトラック（カメラ・マイク）の管理
- リモートユーザーの購読処理
- エラーハンドリング

**主要な機能**:

```typescript
- initializeClient(): Agoraクライアントの初期化
- joinChannel(): チャンネルに参加
- publishLocalTracks(): ローカルトラックをpublish
- subscribeRemoteUser(): リモートユーザーをsubscribe
- leaveChannel(): チャンネルから退出
- cleanup(): リソースのクリーンアップ
```

---

### Step 2: Akool + Agora統合用のコンポーネント作成

**ファイル**: `src/components/AgoraVideoStream.tsx`

**実装内容**:

- ローカルビデオプレビュー表示
- リモートビデオ表示（Akoolで加工された映像）
- カメラ・マイクのON/OFF制御
- 接続状態の表示

**UI要素**:

- ローカルビデオプレビュー（`<div id="local-player">`）
- リモートビデオプレビュー（`<div id="remote-player-{uid}">`）
- 接続/切断ボタン
- カメラ/マイクミュートボタン
- 接続状態インジケーター

---

### Step 3: Akool統合用のページ作成

**ファイル**: `src/pages/FaceSwapLive.tsx`

**実装内容**:

1. 顔画像のアップロードとDetect API実行
2. Akoolセッションの作成（CreateSession API）
3. Agoraチャンネルへの接続
4. ビデオストリームのpublish/subscribe
5. セッションの更新と終了処理

**実装フロー**:

```
1. ユーザーが顔画像をアップロード
   ↓
2. Akool Detect APIで顔のランドマークを取得
   ↓
3. CreateSession APIでセッションを作成
   - Agoraチャンネル情報（channel, token, uid）を取得
   ↓
4. Agoraチャンネルに接続
   ↓
5. ローカルカメラストリームをpublish
   ↓
6. Akoolが加工したストリームをsubscribe
   ↓
7. 加工後の映像を表示
   ↓
8. セッション終了時にCloseSession APIを実行
```

---

### Step 4: ルーティングの設定 ✅

**ファイル**: `src/main.tsx` または `src/App.tsx`

**実装内容**:

- ✅ React Routerで `/face-swap-live` ルートを追加
- ✅ ナビゲーションメニューの追加

---

### Step 5: エラーハンドリングとUI改善

**実装内容**:

- カメラアクセス権限のエラー処理
- ネットワークエラーのハンドリング
- Akool API エラーの表示
- ローディング状態の表示
- トースト通知の実装

---

## 🔧 技術的な注意点

### Agora SDK の使用方法

#### 1. クライアントの初期化

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});
```

#### 2. チャンネルへの参加

```typescript
// createSessionのレスポンスから取得した情報を使用
const { app_id, channel_id, front_rtc_token, front_user_id } =
  sessionResponse.data;

await client.join(
  app_id, // Agora App ID (createSessionから取得)
  channel_id, // チャンネルID (createSessionから取得)
  front_rtc_token, // RTCトークン (createSessionから取得)
  front_user_id // ユーザーID (createSessionから取得)
);
```

#### 3. ローカルトラックの作成とpublish

```typescript
// カメラトラック作成
const videoTrack = await AgoraRTC.createCameraVideoTrack({
  encoderConfig: '720p_2',
});

// マイクトラック作成
const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

// publish
await client.publish([videoTrack, audioTrack]);

// プレビュー表示
videoTrack.play('local-player');
```

#### 4. リモートユーザーのsubscribe

```typescript
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);

  if (mediaType === 'video') {
    const remoteVideoTrack = user.videoTrack;
    remoteVideoTrack?.play(`remote-player-${user.uid}`);
  }

  if (mediaType === 'audio') {
    const remoteAudioTrack = user.audioTrack;
    remoteAudioTrack?.play();
  }
});
```

#### 5. クリーンアップ

```typescript
// トラックの停止とクローズ
videoTrack.stop();
videoTrack.close();
audioTrack.stop();
audioTrack.close();

// チャンネルから退出
await client.leave();
```

---

## 🔐 セキュリティ考慮事項

1. **API キーの管理**
   - 環境変数を使用
   - `.env.local` を `.gitignore` に追加
   - 本番環境ではバックエンドでトークンを生成

2. **Agora Token**
   - Akool APIから取得したトークンを使用
   - トークンの有効期限を考慮

3. **カメラ・マイクの権限**
   - ユーザーに明示的に許可を求める
   - 権限エラーの適切な処理

---

## 🎨 UI/UX 改善ポイント

1. **ローディング状態**
   - API呼び出し中のスピナー表示
   - 接続中の状態表示

2. **エラーメッセージ**
   - わかりやすいエラーメッセージ
   - リトライボタンの提供

3. **プレビュー**
   - ローカルビデオのミラー表示
   - リモートビデオの画質調整

4. **制御パネル**
   - カメラ切り替え（フロント/バック）
   - マイク・カメラのミュート
   - 接続状態の可視化

---

## 📝 実装順序

### フェーズ1: 基本機能(必須)

1. ✅ Agora SDK のインストール(完了)
2. ✅ `useAgora` フックの作成(完了)
3. ✅ `AgoraVideoStream` コンポーネントの作成(完了)
4. ⬜ 基本的な接続とビデオ表示のテスト

### フェーズ2: Akool統合

1. ✅ `FaceSwapLive` ページの作成(完了)
2. ✅ Detect API との連携(完了)
3. ✅ CreateSession API との連携(完了)
4. ✅ Agoraチャンネル情報の取得と接続(完了)

### フェーズ3: 改善

1. ⬜ エラーハンドリングの強化
2. ⬜ UI/UX の改善
3. ⬜ パフォーマンス最適化
4. ⬜ ドキュメントの整備

---

## 🧪 テスト項目

### 機能テスト

- [ ] カメラアクセスの許可
- [ ] Agoraチャンネルへの接続
- [ ] ローカルビデオの表示
- [ ] リモートビデオの表示（Akool加工後）
- [ ] カメラのミュート/アンミュート
- [ ] マイクのミュート/アンミュート
- [ ] セッションの開始と終了

### エラーハンドリングテスト

- [ ] カメラアクセス拒否時の処理
- [ ] ネットワークエラー時の処理
- [ ] Akool API エラー時の処理
- [ ] Agora接続エラー時の処理

### パフォーマンステスト

- [ ] ビデオ品質の確認
- [ ] レイテンシの測定
- [ ] メモリリークの確認

---

## 📚 参考資料

- [Agora Web SDK Documentation](https://docs.agora.io/en/video-calling/get-started/get-started-sdk)
- [Akool API Documentation](https://www.akool.com/docs)
- [React + Agora Best Practices](https://docs.agora.io/en/video-calling/develop/product-workflow)

---

## ⚠️ 既知の課題と対応

### 課題1: トークンの有効期限

**対応**: セッション作成時に取得したトークンの有効期限を監視し、必要に応じて更新

### 課題2: ネットワーク品質の変動

**対応**: Agoraのネットワーク品質APIを使用してビデオ品質を動的に調整

### 課題3: ブラウザ互換性

**対応**: WebRTC対応ブラウザのチェックと、非対応時のエラーメッセージ表示

---

## 🚀 次のステップ

1. この計画を確認し、必要に応じて修正
2. `useAgora` フックの実装から開始
3. 各コンポーネントを順次実装
4. テストと改善を繰り返す

---

**作成日**: 2025年11月3日  
**最終更新**: 2025年11月3日
