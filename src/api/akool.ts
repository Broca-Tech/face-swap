// src/api/akool.ts
import axios from 'axios';

const BASE = 'https://openapi.akool.com/api/open/v3';
const SG3 = 'https://sg3.akool.com';
const API_KEY = import.meta.env.AKOOL_API_KEY;

export const AkoolAPI = {
  detect: async (imageUrl: string) => {
    const res = await axios.post(
      `${SG3}/detect`,
      {
        single_face: false,
        image_url: imageUrl,
      },
      { headers: { 'x-api-key': API_KEY } }
    );
    return res.data;
  },

  createSession: async (sourceImage: string, opts: string) => {
    const res = await axios.post(
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
    return res.data.data;
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
