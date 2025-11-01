// src/api/types.ts

// ========================================
// コード定義
// ========================================

// APIレスポンスコードの定義
export const API_RESPONSE_CODES = {
  SUCCESS: 1000,
  PARAMETER_ERROR: 1003,
  INVALID_AUTHORIZATION: 1101,
  AUTHORIZATION_EMPTY: 1102,
  INSUFFICIENT_QUOTA: 1104,
} as const;

// faceswap_statusの定義
export const FACESWAP_STATUS = {
  QUEUING: 1, // Queuing
  PROCESSING: 2, // Processing (when this value is 2, the frontend can connect to Agora's server)
  SUCCESS: 3, // Success
  FAILED: 4, // Failed
} as const;

// APIレスポンスコードの型
export type ApiResponseCode =
  (typeof API_RESPONSE_CODES)[keyof typeof API_RESPONSE_CODES];

// faceswap_statusの型
export type FaceswapStatus =
  (typeof FACESWAP_STATUS)[keyof typeof FACESWAP_STATUS];

// ========================================
// レスポンスボディの型定義
// ========================================

// /detect エンドポイントの完全なレスポンス型
export interface DetectResponse {
  error_code: number;
  error_msg: string;
  landmarks: number[][][];
  landmarks_str: string[];
  region: number[][];
  seconds: number;
  trx_id: string;
}

// 必要な情報のみを含む型
export interface DetectResult {
  landmarks_str: string; // 顔のランドマーク文字列(createSession, updateSessionで、optsで使用)
  error_code: number; // エラーコード
}

// /faceswap/live/create エンドポイントのレスポンス型
export interface CreateSessionResponse {
  code: ApiResponseCode;
  msg: string;
  data: {
    _id: string; // セッションID(updateSession/closeSession時に指定する主キー)
    faceswap_status: FaceswapStatus; // 顔交換のステータス
    front_user_id: string; // クライアントがAgoraに接続する際のユーザーID
    algorithm_user_id: string; // アルゴリズムが使用するユーザーID
    front_rtc_token: string; // クライアントがAgoraに接続する際のRTCトークン
    channel_id: string; // AgoraのチャンネルID
    app_id: string; // AgoraのアプリID
  };
}

// /faceswap/live/update エンドポイントのレスポンス型
export interface UpdateSessionResponse {
  code: ApiResponseCode;
  msg: string;
}

// /faceswap/live/close エンドポイントのレスポンス型
export interface CloseSessionResponse {
  code: ApiResponseCode;
  msg: string;
}
