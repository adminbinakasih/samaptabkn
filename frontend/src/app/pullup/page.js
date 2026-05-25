'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

function calcAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (mag === 0) return 0;
  return Math.acos(Math.min(Math.max(dot / mag, -1), 1)) * (180 / Math.PI);
}

export default function PullUpPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);

  // State machine: idle -> up (siku < 120) -> down (siku > 155) -> hitung rep
  const stateRef = useRef('idle');
  const countRef = useRef(0);
  const startedRef = useRef(false); // pakai ref agar tidak kena closure bug
  const minAngleRef = useRef(180); // sudut terkecil saat posisi naik

  const [count, setCount] = useState(0);
  const [feedback, setFeedback] = useState('Siap - Tekan Mulai');
  const [feedbackColor, setFeedbackColor] = useState('text-white/60');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveAngle, setLiveAngle] = useState(0);
  const startTimeRef = useRef(null);

  const drawSkeleton = (landmarks, ctx, w, h) => {
    const connections = [
      [11,12],[11,13],[13,15],[12,14],[14,16],
      [11,23],[12,24],[23,24]
    ];
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    connections.forEach(([a, b]) => {
      const pa = landmarks[a], pb = landmarks[b];
      if (pa && pb && pa.visibility > 0.3 && pb.visibility > 0.3) {
        ctx.beginPath();
        ctx.moveTo(pa.x * w, pa.y * h);
        ctx.lineTo(pb.x * w, pb.y * h);
        ctx.stroke();
      }
    });
    [11,12,13,14,15,16,23,24].forEach(idx => {
      const lm = landmarks[idx];
      if (lm && lm.visibility > 0.3) {
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(results.image, 0, 0, w, h);

    if (!results.poseLandmarks) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, h/2 - 20, w, 40);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Posisikan tubuh agar terlihat kamera', w/2, h/2 + 5);
      ctx.textAlign = 'left';
      return;
    }

    const lm = results.poseLandmarks;
    drawSkeleton(lm, ctx, w, h);

    // Ambil sudut dari kedua sisi, pakai rata-rata
    let leftAngle = 180, rightAngle = 180;
    if (lm[11].visibility > 0.3 && lm[13].visibility > 0.3 && lm[15].visibility > 0.3) {
      leftAngle = calcAngle(lm[11], lm[13], lm[15]);
    }
    if (lm[12].visibility > 0.3 && lm[14].visibility > 0.3 && lm[16].visibility > 0.3) {
      rightAngle = calcAngle(lm[12], lm[14], lm[16]);
    }
    // Pull up dari depan: pakai rata-rata kedua sisi
    const angle = (leftAngle + rightAngle) / 2;
    setLiveAngle(Math.round(angle));

    // Overlay sudut
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 140, 40);
    ctx.fillStyle = startedRef.current ? '#3b82f6' : '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Sudut: ' + Math.round(angle) + '\u00b0', 8, 26);

    // Counter overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(w - 90, 0, 90, 50);
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(countRef.current, w - 8, 40);
    ctx.textAlign = 'left';

    // State indicator
    const stateLabel = { idle: 'SIAP', up: 'ATAS \u2191', down: 'BAWAH \u2193' };
    const stateColor = { idle: '#ffffff', up: '#22c55e', down: '#3b82f6' };
    ctx.fillStyle = stateColor[stateRef.current] || '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(stateLabel[stateRef.current] || '', 8, h - 10);

    if (!startedRef.current) return;

    // ── LOGIKA DETEKSI PULL UP ──
    // Pull up dari depan: tangan di atas kepala memegang bar
    // Posisi NAIK: siku menekuk < 120° (dagu melewati bar)
    // Posisi TURUN: lengan lurus > 155° (gantung penuh)
    // Rep dihitung: naik dulu (< 120) LALU turun (> 155)

    if (stateRef.current === 'idle' || stateRef.current === 'down') {
      if (angle < 120) {
        stateRef.current = 'up';
        minAngleRef.current = angle;
        setFeedback('Posisi atas \u2713 - Turun sekarang!');
        setFeedbackColor('text-green-400');
      } else {
        setFeedback('Angkat badan (siku < 120\u00b0)');
        setFeedbackColor('text-yellow-400');
      }
    } else if (stateRef.current === 'up') {
      if (angle < minAngleRef.current) minAngleRef.current = angle;
      if (angle > 155) {
        stateRef.current = 'down';
        countRef.current += 1;
        setCount(countRef.current);
        setFeedback('Rep ' + countRef.current + ' \u2713 Lanjutkan!');
        setFeedbackColor('text-blue-400');
      } else {
        setFeedback('Turun penuh, luruskan lengan');
        setFeedbackColor('text-orange-400');
      }
    }
  };

  const [facingMode, setFacingMode] = useState('environment');

  const startCamera = async (facing = facingMode) => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setLoading(true);
    setError('');
    try {
      const { Pose } = await import('@mediapipe/pose');
      const pose = new Pose({
        locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/' + file,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onResults);
      poseRef.current = pose;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: 480, height: 640 },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      const processFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await pose.send({ image: videoRef.current });
        }
        cameraRef.current = { animId: requestAnimationFrame(processFrame), stream };
      };
      videoRef.current.onloadeddata = () => { processFrame(); };
      cameraRef.current = { stream };
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat AI. Pastikan koneksi internet aktif.');
      setLoading(false);
    }
  };

  const handleFlipCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (cameraRef.current) {
      if (cameraRef.current.animId) cancelAnimationFrame(cameraRef.current.animId);
      if (cameraRef.current.stream) cameraRef.current.stream.getTracks().forEach(t => t.stop());
      cameraRef.current = null;
    }
    await startCamera(newFacing);
  };

  const handleStart = () => {
    startTimeRef.current = Date.now();
    stateRef.current = 'idle';
    countRef.current = 0;
    minAngleRef.current = 180;
    setCount(0);
    startedRef.current = true;
    setStarted(true);
    setFeedback('Angkat badan (siku < 120\u00b0)');
    setFeedbackColor('text-yellow-400');
  };

  const handleStop = () => {
    startedRef.current = false;
    setStarted(false);
    setDone(true);
  };

  const handleSave = async () => {
    if (countRef.current === 0) { setError('Belum ada repetisi tercatat'); return; }
    setSaving(true);
    const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 60000 : 1;
    try {
      await api.post('/activity', {
        type: 'pullup',
        reps: countRef.current,
        duration: parseFloat(duration.toFixed(2)),
        distance: 0,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (cameraRef.current) {
        if (cameraRef.current.animId) cancelAnimationFrame(cameraRef.current.animId);
        if (cameraRef.current.stream) cameraRef.current.stream.getTracks().forEach(t => t.stop());
      }
      poseRef.current?.close();
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080c14]">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-4">
          <div className="mb-3">
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">Kesamaptaan</p>
            <h1 className="text-2xl font-black text-white">Pull Up - AI Counter</h1>
          </div>

          {error && <div className="mb-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-2xl">{error}</div>}

          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black mb-3" style={{aspectRatio:'3/4'}}>
            <video ref={videoRef} className="w-full h-full object-cover" style={{ display: 'none' }} playsInline />
            <canvas ref={canvasRef} width={480} height={640} className="w-full h-full object-cover" />
            <button
              onClick={handleFlipCamera}
              disabled={loading}
              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm transition-all disabled:opacity-50"
            >
              {facingMode === 'environment' ? 'Depan' : 'Belakang'}
            </button>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Memuat AI...</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Repetisi</p>
              <p className="text-3xl font-black text-blue-400">{count}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Sudut Siku</p>
              <p className="text-3xl font-black text-white">{liveAngle}°</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Status</p>
              <p className={'text-xs font-bold mt-1 ' + feedbackColor}>{feedback}</p>
            </div>
          </div>

          {!started && !done && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-3 mb-3 text-xs text-white/50">
              <p className="font-semibold text-white/70 mb-1">Cara penggunaan:</p>
              <p>1. Posisikan HP menghadap ke depan, jarak 2-3 meter</p>
              <p>2. Pastikan seluruh tubuh dan tangan di atas terlihat</p>
              <p>3. Rep dihitung: naik (siku &lt; 120°) lalu turun penuh (&gt; 155°)</p>
            </div>
          )}

          {!done ? (
            !started ? (
              <button onClick={handleStart} disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                Mulai Pull Up
              </button>
            ) : (
              <button onClick={handleStop}
                className="w-full py-4 rounded-2xl font-bold text-white bg-red-500/20 border border-red-500/30">
                Selesai
              </button>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                <p className="text-green-400 font-bold text-lg">{count} repetisi pull up</p>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="py-4 rounded-2xl font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                {saving ? 'Menyimpan...' : 'Simpan Aktivitas'}
              </button>
              <button onClick={() => { setDone(false); setCount(0); countRef.current = 0; startedRef.current = false; stateRef.current = 'idle'; setFeedback('Siap - Tekan Mulai'); }}
                className="py-3 rounded-2xl text-white/40 border border-white/5 text-sm">
                Ulangi
              </button>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
