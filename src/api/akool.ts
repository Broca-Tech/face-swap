// src/api/akool.ts
import axios from 'axios';
import type {
  DetectResponse,
  DetectResult,
  CreateSessionResponse,
  CreateSessionResult,
} from './types';

const BASE = 'https://openapi.akool.com/api/open/v3';
const SG3 = 'https://sg3.akool.com';
const API_KEY = import.meta.env.AKOOL_API_KEY;

export const AkoolAPI = {
  detect: async (imageUrl: string): Promise<DetectResult> => {
    const res = await axios.post<DetectResponse>(
      `${SG3}/detect`,
      {
        single_face: false,
        image_url: imageUrl,
      },
      { headers: { 'x-api-key': API_KEY } }
    );

    const { landmarks_str, error_code } = res.data;
    return {
      landmarks_str: landmarks_str[0],
      error_code,
    };
  },

  createSession: async (
    sourceImage: string,
    opts: string
  ): Promise<CreateSessionResult> => {
    const res = await axios.post<CreateSessionResponse>(
      `${BASE}/faceswap/live/create`,
      {
        sourceImage: [
          {
            path: sourceImage,
            opts,
          },
        ],
      },
      { headers: { 'x-api-key': API_KEY } }
    );

    const { _id, ...rest } = res.data.data;
    return {
      session_id: _id,
      ...rest,
    };
  },

  updateSession: async (
    sessionId: string,
    sourceImage: string,
    opts: string
  ) => {
    const res = await axios.post(
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
      { headers: { 'x-api-key': API_KEY } }
    );
    return res.data.data;
  },

  closeSession: async (sessionId: string) => {
    await axios.post(
      `${BASE}/faceswap/live/close`,
      { _id: sessionId },
      {
        headers: { 'x-api-key': API_KEY },
      }
    );
  },
};
