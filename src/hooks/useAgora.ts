import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

// ========================================
// 型定義
// ========================================

export interface AgoraConfig {
  appId: string;
  channel: string;
  token: string;
  uid: string | number;
}

export interface UseAgoraReturn {
  // 状態
  localVideoTrack: ICameraVideoTrack | null;
  localAudioTrack: IMicrophoneAudioTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  isConnected: boolean;
  isPublished: boolean;
  connectionState: string;
  error: Error | null;

  // メソッド
  joinChannel: (config: AgoraConfig) => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  publishLocalTracks: () => Promise<void>;
  unpublishLocalTracks: () => Promise<void>;
}

// ========================================
// カスタムフック
// ========================================

export const useAgora = (): UseAgoraReturn => {
  // Agoraクライアント
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  // ローカルトラック
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);

  // リモートユーザー
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  // 接続状態
  const [isConnected, setIsConnected] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [error, setError] = useState<Error | null>(null);

  // カメラ・マイクのミュート状態
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);

  // ========================================
  // クライアントの初期化
  // ========================================
  const initializeClient = useCallback(() => {
    if (!clientRef.current) {
      console.log('[Agora] Initializing client...');
      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      });
      clientRef.current = client;

      // イベントリスナーの設定
      setupEventListeners(client);
    }
    return clientRef.current;
  }, []);

  // ========================================
  // イベントリスナーの設定
  // ========================================
  const setupEventListeners = (client: IAgoraRTCClient) => {
    // ユーザーが参加した時
    client.on('user-joined', user => {
      console.log('[Agora] User joined:', user.uid);
    });

    // ユーザーが退出した時
    client.on('user-left', user => {
      console.log('[Agora] User left:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    // リモートユーザーがメディアを公開した時
    client.on('user-published', async (user, mediaType) => {
      console.log(`[Agora] User published ${mediaType}:`, user.uid);
      await client.subscribe(user, mediaType);
      console.log(`[Agora] Subscribed to ${mediaType}:`, user.uid);

      // リモートユーザーリストを更新
      setRemoteUsers(prev => {
        const existingUser = prev.find(u => u.uid === user.uid);
        if (existingUser) {
          return prev.map(u => (u.uid === user.uid ? user : u));
        }
        return [...prev, user];
      });
    });

    // リモートユーザーがメディアを非公開にした時
    client.on('user-unpublished', (user, mediaType) => {
      console.log(`[Agora] User unpublished ${mediaType}:`, user.uid);
      setRemoteUsers(prev => prev.map(u => (u.uid === user.uid ? user : u)));
    });

    // 接続状態が変化した時
    client.on('connection-state-change', (curState, prevState, reason) => {
      console.log(
        `[Agora] Connection state changed: ${prevState} -> ${curState} (reason: ${reason})`
      );
      setConnectionState(curState);
    });

    // エラーが発生した時
    client.on('exception', event => {
      console.error('[Agora] Exception:', event);
    });
  };

  // ========================================
  // チャンネルに参加
  // ========================================
  const joinChannel = useCallback(
    async (config: AgoraConfig) => {
      try {
        console.log('[Agora] Joining channel...', config);
        setError(null);

        // クライアントの初期化
        const client = initializeClient();

        // ローカルトラックの作成
        console.log('[Agora] Creating local tracks...');
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '720p_2',
        });
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        // チャンネルに参加
        console.log('[Agora] Joining channel with UID:', config.uid);
        await client.join(
          config.appId,
          config.channel,
          config.token,
          config.uid
        );

        console.log('[Agora] Successfully joined channel');
        setIsConnected(true);
      } catch (err) {
        console.error('[Agora] Failed to join channel:', err);
        setError(err as Error);
        throw err;
      }
    },
    [initializeClient]
  );

  // ========================================
  // チャンネルから退出
  // ========================================
  const leaveChannel = useCallback(async () => {
    try {
      console.log('[Agora] Leaving channel...');

      // ローカルトラックのクリーンアップ
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }

      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }

      // チャンネルから退出
      if (clientRef.current) {
        await clientRef.current.leave();
        console.log('[Agora] Successfully left channel');
      }

      // 状態をリセット
      setIsConnected(false);
      setIsPublished(false);
      setRemoteUsers([]);
      setConnectionState('DISCONNECTED');
    } catch (err) {
      console.error('[Agora] Failed to leave channel:', err);
      setError(err as Error);
      throw err;
    }
  }, [localVideoTrack, localAudioTrack]);

  // ========================================
  // ローカルトラックをpublish
  // ========================================
  const publishLocalTracks = useCallback(async () => {
    try {
      if (!clientRef.current) {
        throw new Error('Client not initialized');
      }

      if (!localVideoTrack || !localAudioTrack) {
        throw new Error('Local tracks not available');
      }

      console.log('[Agora] Publishing local tracks...');
      await clientRef.current.publish([localVideoTrack, localAudioTrack]);
      console.log('[Agora] Successfully published local tracks');
      setIsPublished(true);
    } catch (err) {
      console.error('[Agora] Failed to publish local tracks:', err);
      setError(err as Error);
      throw err;
    }
  }, [localVideoTrack, localAudioTrack]);

  // ========================================
  // ローカルトラックをunpublish
  // ========================================
  const unpublishLocalTracks = useCallback(async () => {
    try {
      if (!clientRef.current) {
        throw new Error('Client not initialized');
      }

      console.log('[Agora] Unpublishing local tracks...');
      await clientRef.current.unpublish();
      console.log('[Agora] Successfully unpublished local tracks');
      setIsPublished(false);
    } catch (err) {
      console.error('[Agora] Failed to unpublish local tracks:', err);
      setError(err as Error);
      throw err;
    }
  }, []);

  // ========================================
  // カメラのON/OFF切り替え
  // ========================================
  const toggleCamera = useCallback(async () => {
    try {
      if (!localVideoTrack) {
        throw new Error('Video track not available');
      }

      if (isCameraEnabled) {
        await localVideoTrack.setEnabled(false);
        console.log('[Agora] Camera disabled');
      } else {
        await localVideoTrack.setEnabled(true);
        console.log('[Agora] Camera enabled');
      }

      setIsCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error('[Agora] Failed to toggle camera:', err);
      setError(err as Error);
      throw err;
    }
  }, [localVideoTrack, isCameraEnabled]);

  // ========================================
  // マイクのON/OFF切り替え
  // ========================================
  const toggleMicrophone = useCallback(async () => {
    try {
      if (!localAudioTrack) {
        throw new Error('Audio track not available');
      }

      if (isMicrophoneEnabled) {
        await localAudioTrack.setEnabled(false);
        console.log('[Agora] Microphone disabled');
      } else {
        await localAudioTrack.setEnabled(true);
        console.log('[Agora] Microphone enabled');
      }

      setIsMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error('[Agora] Failed to toggle microphone:', err);
      setError(err as Error);
      throw err;
    }
  }, [localAudioTrack, isMicrophoneEnabled]);

  // ========================================
  // クリーンアップ
  // ========================================
  useEffect(() => {
    return () => {
      console.log('[Agora] Cleaning up...');
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (clientRef.current) {
        clientRef.current.leave().catch(err => {
          console.error('[Agora] Error during cleanup:', err);
        });
      }
    };
  }, [localVideoTrack, localAudioTrack]);

  // ========================================
  // 返り値
  // ========================================
  return {
    // 状態
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isConnected,
    isPublished,
    connectionState,
    error,

    // メソッド
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    publishLocalTracks,
    unpublishLocalTracks,
  };
};
