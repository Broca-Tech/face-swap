// src/pages/FaceSwapLive.tsx
import { useState, useRef, useEffect } from 'react';
import { AkoolAPI } from '../api/akool';
import { FACESWAP_STATUS } from '../api/types';
import type { CreateSessionResponse } from '../api/types';
import { AgoraVideoStream } from '../components/AgoraVideoStream';
import './FaceSwapLive.css';

type SessionState =
  | 'idle'
  | 'detecting'
  | 'creating'
  | 'ready'
  | 'connected'
  | 'error';

export default function FaceSwapLive() {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<
    CreateSessionResponse['data'] | null
  >(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [landmarksStr, setLandmarksStr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // セッション状態の監視
  useEffect(() => {
    if (!sessionData) return;

    const checkSessionStatus = async () => {
      // faceswap_statusが2（Processing）になったら接続可能
      if (sessionData.faceswap_status === FACESWAP_STATUS.PROCESSING) {
        setSessionState('ready');
      }
    };

    checkSessionStatus();
  }, [sessionData]);

  // 画像のアップロードとDetect API実行
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSessionState('detecting');

    try {
      // 画像をData URLとして読み込む
      const reader = new FileReader();
      reader.onload = async e => {
        const base64Image = e.target?.result as string;
        setUploadedImageUrl(base64Image);

        console.log('=== File Upload Info ===');
        console.log('File name:', file.name);
        console.log('File type:', file.type);
        console.log('File size:', file.size, 'bytes');
        console.log('Base64 length:', base64Image.length);

        try {
          // Detect APIを実行（base64エンコーディング使用）
          console.log('Detecting face landmarks...');
          const detectResult = await AkoolAPI.detectBase64(base64Image);

          if (detectResult.error_code !== 0) {
            throw new Error(
              `Face detection failed with error code: ${detectResult.error_code}`
            );
          }

          console.log('Face detected successfully');
          console.log('Landmarks:', detectResult.landmarks_str);
          setLandmarksStr(detectResult.landmarks_str);

          // CreateSession APIを実行
          setSessionState('creating');
          console.log('Creating session...');
          const sessionResponse = await AkoolAPI.createSession(
            base64Image,
            detectResult.landmarks_str
          );

          if (sessionResponse.code !== 1000) {
            throw new Error(`Session creation failed: ${sessionResponse.msg}`);
          }

          console.log('Session created successfully');
          console.log('Session ID:', sessionResponse.data._id);
          console.log('Faceswap Status:', sessionResponse.data.faceswap_status);
          console.log('Agora Info:', {
            app_id: sessionResponse.data.app_id,
            channel_id: sessionResponse.data.channel_id,
            front_user_id: sessionResponse.data.front_user_id,
          });

          setSessionData(sessionResponse.data);

          // ステータスがすでにProcessingの場合は即座に接続可能状態にする
          if (
            sessionResponse.data.faceswap_status === FACESWAP_STATUS.PROCESSING
          ) {
            setSessionState('ready');
          } else {
            // それ以外の場合は監視を開始
            setSessionState('creating');
          }
        } catch (err) {
          console.error('Error in face detection or session creation:', err);
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown error occurred';
          setError(
            errorMessage.includes('No face landmarks')
              ? '画像から顔を検出できませんでした。別の画像を試してください。'
              : errorMessage
          );
          setSessionState('error');
        }
      };

      reader.onerror = () => {
        setError('Failed to read image file');
        setSessionState('error');
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setSessionState('error');
    }
  };

  // セッションの更新
  const handleUpdateSession = async () => {
    if (!sessionData || !uploadedImageUrl || !landmarksStr) {
      setError('Session data is missing');
      return;
    }

    try {
      console.log('Updating session...');
      const updateResponse = await AkoolAPI.updateSession(
        sessionData._id,
        uploadedImageUrl,
        landmarksStr
      );

      if (updateResponse.code !== 1000) {
        throw new Error(`Session update failed: ${updateResponse.msg}`);
      }

      console.log('Session updated successfully');
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to update session');
    }
  };

  // セッションの終了
  const handleCloseSession = async () => {
    if (!sessionData) return;

    try {
      console.log('Closing session...');
      const closeResponse = await AkoolAPI.closeSession(sessionData._id);

      if (closeResponse.code !== 1000) {
        throw new Error(`Session close failed: ${closeResponse.msg}`);
      }

      console.log('Session closed successfully');

      // 状態をリセット
      setSessionData(null);
      setSessionState('idle');
      setUploadedImageUrl(null);
      setLandmarksStr(null);
      setError(null);
    } catch (err) {
      console.error('Error closing session:', err);
      setError(err instanceof Error ? err.message : 'Failed to close session');
    }
  };

  // Agora接続状態が変更されたとき
  const handleAgoraStateChange = (connected: boolean) => {
    if (connected) {
      setSessionState('connected');
    } else if (sessionState === 'connected') {
      setSessionState('ready');
    }
  };

  return (
    <div className="face-swap-live">
      <h1>Akool Live Face Swap</h1>

      <div className="content">
        {/* 左側: コントロールパネル */}
        <div className="control-panel">
          <div className="upload-section">
            <h2>1. 顔画像をアップロード</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={sessionState !== 'idle'}
              className="file-input"
            />
            {uploadedImageUrl && (
              <div className="preview">
                <img src={uploadedImageUrl} alt="Uploaded face" />
              </div>
            )}
          </div>

          <div className="status-section">
            <h2>2. セッション状態</h2>
            <div className={`status-badge status-${sessionState}`}>
              {sessionState === 'idle' && '待機中'}
              {sessionState === 'detecting' && '顔検出中...'}
              {sessionState === 'creating' && 'セッション作成中...'}
              {sessionState === 'ready' && '接続準備完了'}
              {sessionState === 'connected' && '接続中'}
              {sessionState === 'error' && 'エラー'}
            </div>

            {error && (
              <div className="error-message">
                <strong>エラー:</strong> {error}
              </div>
            )}

            {sessionData && (
              <div className="session-info">
                <h3>セッション情報</h3>
                <div className="info-item">
                  <span className="label">セッションID:</span>
                  <span className="value">{sessionData._id}</span>
                </div>
                <div className="info-item">
                  <span className="label">チャンネルID:</span>
                  <span className="value">{sessionData.channel_id}</span>
                </div>
                <div className="info-item">
                  <span className="label">ユーザーID:</span>
                  <span className="value">{sessionData.front_user_id}</span>
                </div>
                <div className="info-item">
                  <span className="label">ステータス:</span>
                  <span className="value">
                    {sessionData.faceswap_status === FACESWAP_STATUS.QUEUING &&
                      'キュー中'}
                    {sessionData.faceswap_status ===
                      FACESWAP_STATUS.PROCESSING && '処理中'}
                    {sessionData.faceswap_status === FACESWAP_STATUS.SUCCESS &&
                      '成功'}
                    {sessionData.faceswap_status === FACESWAP_STATUS.FAILED &&
                      '失敗'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="actions-section">
            <h2>3. アクション</h2>
            <button
              onClick={handleUpdateSession}
              disabled={!sessionData || sessionState !== 'connected'}
              className="btn btn-secondary"
            >
              セッション更新
            </button>
            <button
              onClick={handleCloseSession}
              disabled={!sessionData}
              className="btn btn-danger"
            >
              セッション終了
            </button>
            <button
              onClick={() => {
                setSessionData(null);
                setSessionState('idle');
                setUploadedImageUrl(null);
                setLandmarksStr(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={sessionState === 'idle'}
              className="btn btn-secondary"
            >
              リセット
            </button>
          </div>
        </div>

        {/* 右側: ビデオストリーム */}
        <div className="video-section">
          <h2>4. ビデオストリーム</h2>
          {sessionData && sessionState === 'ready' ? (
            <AgoraVideoStream
              config={{
                appId: sessionData.app_id,
                channel: sessionData.channel_id,
                token: sessionData.front_rtc_token,
                uid: sessionData.front_user_id,
              }}
              autoJoin={true}
              autoPublish={true}
              onConnected={() => handleAgoraStateChange(true)}
              onDisconnected={() => handleAgoraStateChange(false)}
              onError={error => {
                console.error('Agora error:', error);
                setError(error.message);
                setSessionState('error');
              }}
            />
          ) : (
            <div className="video-placeholder">
              <p>
                {sessionState === 'idle' && '画像をアップロードしてください'}
                {sessionState === 'detecting' && '顔を検出中...'}
                {sessionState === 'creating' && 'セッションを作成中...'}
                {sessionState === 'error' && 'エラーが発生しました'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
