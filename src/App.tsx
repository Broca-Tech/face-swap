import './App.css';

function App() {
  return (
    <>
      <h1>Akool Face Swap with Agora</h1>
      <div className="card">
        <p>Agora連携によるリアルタイム顔交換アプリケーション</p>

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <a
            href="/face-swap-live"
            style={{
              color: '#646cff',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            🎥 Live Face Swap（メイン機能）
          </a>
          <a
            href="/api-check"
            style={{
              color: '#646cff',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            🔧 API接続テストページ
          </a>
        </div>

        <div style={{ marginTop: '40px', textAlign: 'left' }}>
          <h3>実装済み機能:</h3>
          <ul>
            <li>✅ Agora SDK の統合</li>
            <li>✅ ビデオストリームの取得</li>
            <li>✅ 顔検出とAkool連携</li>
            <li>✅ リアルタイムプレビュー</li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;
