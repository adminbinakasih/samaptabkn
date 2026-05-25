'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouteTracking } from '@/hooks/useRouteTracking';
import ProtectedRoute from '@/components/ProtectedRoute';

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false });

function RunningPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams.get('id');

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  const {
    position: currentPosition,
    error: gpsError,
    startTracking,
    stopTracking,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  });

  const {
    routePoints,
    isSaving,
    saveError,
    stats,
    addPoint,
    flushPoints,
    fetchRouteStats,
  } = useRouteTracking(activityId);

  useEffect(() => {
    if (isRunning && !isPaused && currentPosition) {
      addPoint({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        altitude: currentPosition.altitude,
        accuracy: currentPosition.accuracy,
        speed: currentPosition.speed,
        timestamp: currentPosition.timestamp.toISOString(),
      });
    }
  }, [currentPosition, isRunning, isPaused, addPoint]);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current + pausedTimeRef.current);
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused]);

  const handleBack = async () => {
    if (isRunning) {
      const confirm = window.confirm('Sesi lari sedang berjalan. Batalkan dan hapus aktivitas ini?');
      if (!confirm) return;
      stopTracking();
    }
    // Delete the empty/cancelled activity
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/activity/${activityId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      // Ignore delete error, just navigate back
    }
    router.push('/dashboard');
  };

  const handleStart = async () => {
    try {
      setError(null);
      setIsRunning(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      startTracking();
    } catch (err) {
      setError('Failed to start tracking: ' + err.message);
      setIsRunning(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    stopTracking();
  };

  const handleResume = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
    startTracking();
  };

  const handleFinish = async () => {
    try {
      setIsLoading(true);
      setError(null);

      stopTracking();
      await flushPoints();

      const finalStats = await fetchRouteStats();

      const durationMinutes = elapsedTime / 60000;
      const pace = finalStats.totalDistance > 0 ? durationMinutes / finalStats.totalDistance : 0;

      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/activity/${activityId}`,
        {
          distance: finalStats.totalDistance,
          duration: durationMinutes,
          pace: pace,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsRunning(false);
      setIsPaused(false);
      setElapsedTime(0);

      router.push('/history');
    } catch (err) {
      setError('Failed to finish activity: ' + err.message);
      console.error('Error finishing activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDistance = (km) => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)}m`;
    }
    return `${km.toFixed(2)}km`;
  };

  const formatPace = (durationMinutes, distance) => {
    if (distance === 0) return '0:00';
    const paceMinutes = durationMinutes / distance;
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.floor((paceMinutes - minutes) * 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const formatSpeed = (ms) => {
    if (ms === null || ms === undefined) return '0.0';
    return (ms * 3.6).toFixed(1);
  };

  if (!activityId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Activity ID not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col pb-20">
      <div className="px-4 pt-4 pb-2 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
            title="Kembali"
          >
            &#8592;
          </button>
          <div>
            <h1 className="text-3xl font-bold">Lari</h1>
            <p className="text-white/60 text-sm">Track your running activity with GPS</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm max-w-6xl mx-auto w-full">
          {error}
        </div>
      )}

      {gpsError && (
        <div className="mx-4 mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm max-w-6xl mx-auto w-full">
          GPS Error: {gpsError}
        </div>
      )}

      {saveError && (
        <div className="mx-4 mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-sm max-w-6xl mx-auto w-full">
          Save Error: {saveError}
        </div>
      )}

      <div className="flex-1 px-4 mb-6 max-w-6xl mx-auto w-full">
        <div className="h-96 rounded-2xl overflow-hidden border-2 border-orange-500/30 shadow-2xl">
          <RouteMap
            routePoints={routePoints}
            currentPosition={currentPosition}
            isTracking={isRunning && !isPaused}
          />
        </div>
      </div>

      <div className="px-4 mb-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-300/60 text-xs uppercase tracking-wide mb-2">Waktu</p>
            <p className="text-2xl md:text-3xl font-bold">{formatTime(elapsedTime)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
            <p className="text-green-300/60 text-xs uppercase tracking-wide mb-2">Jarak</p>
            <p className="text-2xl md:text-3xl font-bold">
              {stats ? formatDistance(stats.totalDistance) : '0m'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-4">
            <p className="text-orange-300/60 text-xs uppercase tracking-wide mb-2">Kecepatan</p>
            <p className="text-2xl md:text-3xl font-bold">
              {currentPosition ? formatSpeed(currentPosition.speed) : '0.0'} km/h
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
            <p className="text-purple-300/60 text-xs uppercase tracking-wide mb-2">Pace</p>
            <p className="text-2xl md:text-3xl font-bold">
              {stats && stats.totalDistance > 0
                ? formatPace(elapsedTime / 60000, stats.totalDistance)
                : '0:00'}
              /km
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-xl p-4">
            <p className="text-pink-300/60 text-xs uppercase tracking-wide mb-2">GPS Points</p>
            <p className="text-2xl md:text-3xl font-bold">{stats?.pointCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-cyan-300/60 text-xs uppercase tracking-wide mb-2">Status</p>
            <p className="text-2xl md:text-3xl font-bold">
              {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
            </p>
          </div>
        </div>
      </div>

      {isSaving && (
        <div className="mx-4 mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-200 text-sm max-w-6xl mx-auto w-full">
          💾 Menyimpan data GPS...
        </div>
      )}

      <div className="px-4 max-w-6xl mx-auto w-full">
        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-500/50 disabled:to-orange-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 text-lg"
            >
              {isLoading ? 'Loading...' : 'Mulai Lari'}
            </button>
          ) : isPaused ? (
            <>
              <button
                onClick={handleResume}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-500/50 disabled:to-green-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/30 text-lg"
              >
                {isLoading ? 'Loading...' : 'Lanjutkan'}
              </button>
              <button
                onClick={handleFinish}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-500/50 disabled:to-red-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/30 text-lg"
              >
                {isLoading ? 'Loading...' : 'Selesai'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePause}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-yellow-500/50 disabled:to-yellow-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-yellow-500/30 text-lg"
              >
                {isLoading ? 'Loading...' : 'Pause'}
              </button>
              <button
                onClick={handleFinish}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-500/50 disabled:to-red-600/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-500/30 text-lg"
              >
                {isLoading ? 'Loading...' : 'Selesai'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RunningPage() {
  return (
    <ProtectedRoute>
      <RunningPageContent />
    </ProtectedRoute>
  );
}

export default RunningPage;
