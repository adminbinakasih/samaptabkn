'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

export function useRouteTracking(activityId, options = {}) {
  // savedPoints = confirmed saved to server; localPoints = all points including unsaved buffer
  const [savedPoints, setSavedPoints] = useState([]);
  const [localPoints, setLocalPoints] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [stats, setStats] = useState(null);

  const bufferRef = useRef([]);
  const timerRef = useRef(null);
  const isFlushingRef = useRef(false);

  const defaultOptions = {
    batchSize: 10,
    batchInterval: 30000, // 30 seconds
    ...options,
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const flushPoints = useCallback(async () => {
    if (bufferRef.current.length === 0 || isFlushingRef.current) {
      return;
    }

    isFlushingRef.current = true;
    setIsSaving(true);
    setSaveError(null);

    const pointsToSave = [...bufferRef.current];
    bufferRef.current = [];

    try {
      if (pointsToSave.length === 0) {
        setIsSaving(false);
        isFlushingRef.current = false;
        return;
      }

      const endpoint =
        pointsToSave.length === 1
          ? `${apiUrl}/activity/${activityId}/route-points`
          : `${apiUrl}/activity/${activityId}/route-points/batch`;

      const payload =
        pointsToSave.length === 1
          ? pointsToSave[0]
          : { points: pointsToSave };

      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setSavedPoints((prev) => [...prev, ...pointsToSave]);
      } else {
        throw new Error(response.data.message || 'Failed to save route points');
      }
    } catch (error) {
      console.error('Error flushing route points:', error);
      setSaveError(error.message || 'Failed to save route points');
      // Re-add points to buffer on error
      bufferRef.current = [...pointsToSave, ...bufferRef.current];
    } finally {
      setIsSaving(false);
      isFlushingRef.current = false;
    }
  }, [activityId, apiUrl, token]);

  const addPoint = useCallback(
    (point) => {
      bufferRef.current.push(point);
      // Immediately add to local display points so map updates in real-time
      setLocalPoints((prev) => [...prev, point]);

      // Flush if buffer reaches batch size
      if (bufferRef.current.length >= defaultOptions.batchSize) {
        flushPoints();
      }
    },
    [defaultOptions.batchSize, flushPoints]
  );

  const fetchRouteStats = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/activity/${activityId}/route-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch route stats');
      }
    } catch (error) {
      console.error('Error fetching route stats:', error);
      setSaveError(error.message || 'Failed to fetch route stats');
      throw error;
    }
  }, [activityId, apiUrl, token]);

  // Set up interval to flush points periodically
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (bufferRef.current.length > 0) {
        flushPoints();
      }
    }, defaultOptions.batchInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [defaultOptions.batchInterval, flushPoints]);

  return {
    routePoints: localPoints,  // use localPoints for real-time map display
    savedPoints,               // confirmed saved to server
    isSaving,
    saveError,
    stats,
    addPoint,
    flushPoints,
    fetchRouteStats,
  };
}
