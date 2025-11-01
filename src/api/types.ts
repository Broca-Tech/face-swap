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
