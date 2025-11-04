// src/api/akool.ts
import axios from 'axios';
import type {
  DetectResponse,
  DetectResult,
  CreateSessionResponse,
  UpdateSessionResponse,
  CloseSessionResponse,
} from './types';

// 開発環境ではプロキシ経由、本番環境では直接アクセス
const BASE = import.meta.env.DEV
  ? '/api/akool'
  : 'https://openapi.akool.com/api/open/v3';
const SG3 = import.meta.env.DEV ? '/api/sg3' : 'https://sg3.akool.com';

// 開発環境ではプロキシがAPIキーを追加するため不要
const API_KEY = import.meta.env.DEV
  ? undefined
  : import.meta.env.VITE_AKOOL_API_KEY;

export const AkoolAPI = {
  detect: async (imageUrl: string): Promise<DetectResult> => {
    const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
    const res = await axios.post<DetectResponse>(
      `${SG3}/detect`,
      {
        single_face: false,
        image_url: imageUrl,
      },
      { headers }
    );

    const { landmarks_str, error_code } = res.data;

    // landmarks_strが配列の場合は最初の要素を取得、文字列の場合はそのまま使用
    let landmarkString: string;

    if (Array.isArray(landmarks_str)) {
      if (landmarks_str.length === 0) {
        throw new Error('No face landmarks detected in the image');
      }
      landmarkString = landmarks_str[0];
    } else if (typeof landmarks_str === 'string') {
      landmarkString = landmarks_str;
    } else {
      throw new Error('No face landmarks detected in the image');
    }

    return {
      landmarks_str: landmarkString,
      error_code,
    };
  },

  createSession: async (
    sourceImage: string,
    opts: string
  ): Promise<CreateSessionResponse> => {
    const requestBody = {
      sourceImage: [
        {
          path: sourceImage,
          opts,
        },
      ],
    };

    console.log('=== CreateSession Request ===');
    console.log('URL:', `${BASE}/faceswap/live/create`);
    console.log('Dev mode:', import.meta.env.DEV);
    console.log('Using proxy:', import.meta.env.DEV ? 'YES' : 'NO');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('sourceImage:', sourceImage);
    console.log('opts:', opts);

    const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
    const res = await axios.post<CreateSessionResponse>(
      `${BASE}/faceswap/live/create`,
      requestBody,
      { headers }
    );

    console.log('=== CreateSession Response ===');
    console.log('Response:', JSON.stringify(res.data, null, 2));

    return res.data;
  },

  updateSession: async (
    sessionId: string,
    sourceImage: string,
    opts: string
  ): Promise<UpdateSessionResponse> => {
    const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
    const res = await axios.post<UpdateSessionResponse>(
      `${BASE}/faceswap/live/update`,
      {
        _id: sessionId,
        sourceImage: [
          {
            path: sourceImage,
            opts,
          },
        ],
      },
      { headers }
    );
    return res.data;
  },

  closeSession: async (sessionId: string): Promise<CloseSessionResponse> => {
    const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
    const res = await axios.post<CloseSessionResponse>(
      `${BASE}/faceswap/live/close`,
      { _id: sessionId },
      { headers }
    );
    return res.data;
  },
};
