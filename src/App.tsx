import { useState } from 'react';
import './App.css';
import { AkoolAPI } from './api/akool';
import type { DetectResult, CreateSessionResponse } from './api/types';

function App() {
  const [imageUrl, setImageUrl] = useState('https://urassh.dev/urassh.png');
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null);
  const [sessionResult, setSessionResult] =
    useState<CreateSessionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetect = async () => {
    setLoading(true);
    setError(null);
    setDetectResult(null);
    setSessionResult(null);

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

    try {
      const data = await AkoolAPI.createSession(
        imageUrl,
        detectResult.landmarks_str
      );
      setSessionResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Akool API テスト</h1>
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

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={handleDetect} disabled={loading}>
            {loading ? '処理中...' : '1. Detect実行'}
          </button>
          <button
            onClick={handleCreateSession}
            disabled={loading || !detectResult}
          >
            {loading ? '処理中...' : '2. CreateSession実行'}
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
      </div>
    </>
  );
}

export default App;
