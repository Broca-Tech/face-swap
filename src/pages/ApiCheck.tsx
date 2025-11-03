import { useState, useRef } from 'react';
import '../App.css';
import { AkoolAPI } from '../api/akool';
import type {
  DetectResult,
  CreateSessionResponse,
  UpdateSessionResponse,
  CloseSessionResponse,
} from '../api/types';

function ApiCheck() {
  const [imageUrl, setImageUrl] = useState('https://urassh.dev/urassh.png');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [sessionResult, setSessionResult] =
    useState<CreateSessionResponse | null>(null);
  const [updateResult, setUpdateResult] =
    useState<UpdateSessionResponse | null>(null);
  const [closeResult, setCloseResult] = useState<CloseSessionResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setDetectResult(null);
    setSessionResult(null);
    setUpdateResult(null);
    setCloseResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64Image = e.target?.result as string;
        setUploadedImage(base64Image);

        console.log('=== File Upload Info ===');
        console.log('File name:', file.name);
        console.log('File type:', file.type);
        console.log('File size:', file.size, 'bytes');
        console.log('Base64 length:', base64Image.length);

        try {
          const data = await AkoolAPI.detectBase64(base64Image);
          setDetectResult(data);
        } catch (err) {
          console.error('=== Detect Error ===', err);
          setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('ファイルの読み込みに失敗しました');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setLoading(false);
    }
  };

  const handleDetect = async () => {
    setLoading(true);
    setError(null);
    setDetectResult(null);
    setSessionResult(null);
    setUpdateResult(null);
    setCloseResult(null);

    try {
      const data = await AkoolAPI.detect(imageUrl);
      setDetectResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!detectResult?.landmarks_str) {
      setError('先にDetectを実行してください');
      return;
    }

    setLoading(true);
    setError(null);
    setSessionResult(null);
    setUpdateResult(null);
    setCloseResult(null);

    try {
      // アップロードされた画像があればそれを使用、なければURLを使用
      const imageSource = uploadedImage || imageUrl;
      const data = await AkoolAPI.createSession(
        imageSource,
        detectResult.landmarks_str
      );
      setSessionResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async () => {
    if (!sessionResult?.data?._id) {
      setError('先にCreateSessionを実行してください');
      return;
    }

    if (!detectResult?.landmarks_str) {
      setError('先にDetectを実行してください');
      return;
    }

    setLoading(true);
    setError(null);
    setUpdateResult(null);

    try {
      // アップロードされた画像があればそれを使用、なければURLを使用
      const imageSource = uploadedImage || imageUrl;
      const data = await AkoolAPI.updateSession(
        sessionResult.data._id,
        imageSource,
        detectResult.landmarks_str
      );
      setUpdateResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!sessionResult?.data?._id) {
      setError('先にCreateSessionを実行してください');
      return;
    }

    setLoading(true);
    setError(null);
    setCloseResult(null);

    try {
      const data = await AkoolAPI.closeSession(sessionResult.data._id);
      setCloseResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Akool API テスト</h1>
      <div style={{ marginBottom: '20px' }}>
        <a
          href="/"
          style={{
            color: '#646cff',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          ← メインページに戻る
        </a>
      </div>
      <div className="card">
        <div style={{ marginBottom: '20px' }}>
          <label>
            画像URL:
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '8px',
                fontSize: '14px',
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>
            または、ファイルをアップロード (Base64でDetect実行):
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={loading}
              style={{
                display: 'block',
                padding: '8px',
                marginTop: '8px',
                fontSize: '14px',
              }}
            />
          </label>
          {uploadedImage && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={uploadedImage}
                alt="アップロード画像"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <button onClick={handleDetect} disabled={loading}>
            {loading ? '処理中...' : '1. Detect実行 (URL)'}
          </button>
          <button
            onClick={handleCreateSession}
            disabled={loading || !detectResult}
          >
            {loading ? '処理中...' : '2. CreateSession実行'}
          </button>
          <button
            onClick={handleUpdateSession}
            disabled={loading || !sessionResult || !detectResult}
          >
            {loading ? '処理中...' : '3. UpdateSession実行'}
          </button>
          <button
            onClick={handleCloseSession}
            disabled={loading || !sessionResult}
          >
            {loading ? '処理中...' : '4. CloseSession実行'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '20px', color: 'red' }}>
            <strong>エラー:</strong> {error}
          </div>
        )}

        {detectResult && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>Detect結果:</h3>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '15px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '200px',
                border: '1px solid #404040',
              }}
            >
              {JSON.stringify(detectResult, null, 2)}
            </pre>
          </div>
        )}

        {sessionResult && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>CreateSession結果:</h3>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '15px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '300px',
                border: '1px solid #404040',
              }}
            >
              {JSON.stringify(sessionResult, null, 2)}
            </pre>
          </div>
        )}

        {updateResult && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>UpdateSession結果:</h3>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '15px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '300px',
                border: '1px solid #404040',
              }}
            >
              {JSON.stringify(updateResult, null, 2)}
            </pre>
          </div>
        )}

        {closeResult && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>CloseSession結果:</h3>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '15px',
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '300px',
                border: '1px solid #404040',
              }}
            >
              {JSON.stringify(closeResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}

export default ApiCheck;
