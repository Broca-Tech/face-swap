import { useEffect, useRef } from 'react';
import { useAgora, type AgoraConfig } from '../hooks/useAgora';
import type { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import './AgoraVideoStream.css';

// ========================================
// 型定義
// ========================================

export interface AgoraVideoStreamProps {
  config: AgoraConfig | null;
  autoJoin?: boolean;
  autoPublish?: boolean;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

// ========================================
// コンポーネント
// ========================================

export const AgoraVideoStream: React.FC<AgoraVideoStreamProps> = ({
  config,
  autoJoin = true,
  autoPublish = true,
  onError,
  onConnected,
  onDisconnected,
}) => {
  const {
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    isConnected,
    isPublished,
    connectionState,
    error,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    publishLocalTracks,
  } = useAgora();

  // ローカルビデオの表示用ref
  const localVideoRef = useRef<HTMLDivElement>(null);

  // リモートビデオの表示用ref
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);

  // 接続試行済みフラグ（無限ループ防止）
  const hasAttemptedJoin = useRef(false);

  // ========================================
  // 自動接続処理
  // ========================================
  useEffect(() => {
    if (config && autoJoin && !isConnected && !hasAttemptedJoin.current) {
      console.log('[AgoraVideoStream] Auto-joining channel...');
      hasAttemptedJoin.current = true;

      joinChannel(config).catch(err => {
        console.error('[AgoraVideoStream] Failed to join channel:', err);
        onError?.(err);
      });
    }
  }, [config, autoJoin, isConnected, joinChannel, onError]);

  // configが変更されたらフラグをリセット
  useEffect(() => {
    hasAttemptedJoin.current = false;
  }, [config?.channel, config?.token]);

  // ========================================
  // 自動publish処理
  // ========================================
  useEffect(() => {
    if (
      isConnected &&
      autoPublish &&
      !isPublished &&
      localVideoTrack &&
      localAudioTrack
    ) {
      console.log('[AgoraVideoStream] Auto-publishing local tracks...');
      publishLocalTracks().catch(err => {
        console.error(
          '[AgoraVideoStream] Failed to publish local tracks:',
          err
        );
        onError?.(err);
      });
    }
  }, [
    isConnected,
    autoPublish,
    isPublished,
    localVideoTrack,
    localAudioTrack,
    publishLocalTracks,
    onError,
  ]);

  // ========================================
  // ローカルビデオの表示
  // ========================================
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      console.log('[AgoraVideoStream] Playing local video...');
      localVideoTrack.play(localVideoRef.current);
    }

    return () => {
      if (localVideoTrack) {
        localVideoTrack.stop();
      }
    };
  }, [localVideoTrack]);

  // ========================================
  // リモートビデオの表示
  // ========================================
  useEffect(() => {
    if (!remoteVideoContainerRef.current) return;

    remoteUsers.forEach((user: IAgoraRTCRemoteUser) => {
      const existingPlayer = document.getElementById(
        `remote-player-${user.uid}`
      );

      if (!existingPlayer && user.videoTrack) {
        console.log(
          '[AgoraVideoStream] Creating remote video player for user:',
          user.uid
        );
        const playerDiv = document.createElement('div');
        playerDiv.id = `remote-player-${user.uid}`;
        playerDiv.className = 'remote-player';
        remoteVideoContainerRef.current?.appendChild(playerDiv);

        user.videoTrack.play(playerDiv);
      }

      // 音声の再生
      if (user.audioTrack) {
        user.audioTrack.play();
      }
    });

    // 退出したユーザーのプレイヤーを削除
    const allPlayers =
      remoteVideoContainerRef.current.querySelectorAll('.remote-player');
    allPlayers.forEach(player => {
      const uid = player.id.replace('remote-player-', '');
      const userExists = remoteUsers.some(u => String(u.uid) === uid);
      if (!userExists) {
        console.log(
          '[AgoraVideoStream] Removing remote video player for user:',
          uid
        );
        player.remove();
      }
    });
  }, [remoteUsers]);

  // ========================================
  // 接続状態の監視
  // ========================================
  useEffect(() => {
    if (isConnected) {
      console.log('[AgoraVideoStream] Connected to channel');
      onConnected?.();
    } else if (connectionState === 'DISCONNECTED' && localVideoTrack === null) {
      console.log('[AgoraVideoStream] Disconnected from channel');
      onDisconnected?.();
    }
  }, [
    isConnected,
    connectionState,
    localVideoTrack,
    onConnected,
    onDisconnected,
  ]);

  // ========================================
  // エラーの監視
  // ========================================
  useEffect(() => {
    if (error) {
      console.error('[AgoraVideoStream] Error:', error);
      onError?.(error);
    }
  }, [error, onError]);

  // ========================================
  // コンポーネントのアンマウント時
  // ========================================
  useEffect(() => {
    return () => {
      console.log(
        '[AgoraVideoStream] Component unmounting, leaving channel...'
      );
      leaveChannel().catch(err => {
        console.error('[AgoraVideoStream] Error leaving channel:', err);
      });
    };
  }, [leaveChannel]);

  // ========================================
  // UIハンドラー
  // ========================================
  const handleToggleCamera = () => {
    toggleCamera().catch(err => {
      console.error('[AgoraVideoStream] Failed to toggle camera:', err);
      onError?.(err);
    });
  };

  const handleToggleMicrophone = () => {
    toggleMicrophone().catch(err => {
      console.error('[AgoraVideoStream] Failed to toggle microphone:', err);
      onError?.(err);
    });
  };

  const handleLeave = () => {
    leaveChannel().catch(err => {
      console.error('[AgoraVideoStream] Failed to leave channel:', err);
      onError?.(err);
    });
  };

  // ========================================
  // レンダリング
  // ========================================
  return (
    <div className="agora-video-stream">
      {/* ヘッダー: 接続状態表示 */}
      <div className="stream-header">
        <div className="connection-status">
          <span
            className={`status-indicator ${
              isConnected ? 'connected' : 'disconnected'
            }`}
          />
          <span className="status-text">{isConnected ? '接続中' : '切断'}</span>
          <span className="connection-state">({connectionState})</span>
        </div>
        {isPublished && (
          <div className="publish-status">
            <span className="status-badge">配信中</span>
          </div>
        )}
      </div>

      {/* ビデオコンテナ */}
      <div className="video-container">
        {/* ローカルビデオ */}
        <div className="local-video-wrapper">
          <div className="video-label">ローカルビデオ (あなた)</div>
          <div ref={localVideoRef} className="local-video" id="local-player" />
          {!localVideoTrack && (
            <div className="video-placeholder">
              <p>カメラが起動していません</p>
            </div>
          )}
        </div>

        {/* リモートビデオ */}
        <div className="remote-video-wrapper">
          <div className="video-label">
            リモートビデオ (Akool加工後)
            {remoteUsers.length > 0 && (
              <span className="user-count"> - {remoteUsers.length}人</span>
            )}
          </div>
          <div
            ref={remoteVideoContainerRef}
            className="remote-video-container"
            id="remote-video-container"
          >
            {remoteUsers.length === 0 && (
              <div className="video-placeholder">
                <p>リモートユーザーが参加していません</p>
                <p className="placeholder-hint">
                  Akoolがストリームを処理中です...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* コントロールパネル */}
      <div className="control-panel">
        <button
          onClick={handleToggleCamera}
          disabled={!localVideoTrack}
          className="control-button camera-button"
          title="カメラのON/OFF"
        >
          {localVideoTrack?.enabled ? '📹 カメラON' : '📹 カメラOFF'}
        </button>

        <button
          onClick={handleToggleMicrophone}
          disabled={!localAudioTrack}
          className="control-button microphone-button"
          title="マイクのON/OFF"
        >
          {localAudioTrack?.enabled ? '🎤 マイクON' : '🎤 マイクOFF'}
        </button>

        <button
          onClick={handleLeave}
          disabled={!isConnected}
          className="control-button leave-button"
          title="チャンネルから退出"
        >
          🚪 退出
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="error-message">
          <strong>エラー:</strong> {error.message}
        </div>
      )}
    </div>
  );
};
