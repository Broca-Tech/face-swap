// src/api/types.ts

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
  landmarks_str: string;
  error_code: number;
}

// /faceswap/live/create エンドポイントのレスポンス型
export interface CreateSessionResponse {
  code: number;
  msg: string;
  data: {
    _id: string;
    faceswap_status: number;
    front_user_id: string;
    algorithm_user_id: string;
    front_rtc_token: string;
    channel_id: string;
    app_id: string;
  };
}

// createSessionの戻り値型（dataの部分のみ、_idをsession_idにリネーム）
export interface CreateSessionResult {
  session_id: string;
  faceswap_status: number;
  front_user_id: string;
  algorithm_user_id: string;
  front_rtc_token: string;
  channel_id: string;
  app_id: string;
}
