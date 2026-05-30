'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 30000,      // 30 detik — cukup waktu untuk GPS lock pertama
    maximumAge: 5000,    // boleh pakai cache posisi sampai 5 detik
    ...options,
  };

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (isTracking) return;

    setError(null);
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        // Selalu update posisi untuk tampilan peta (termasuk akurasi rendah)
        // Filter ketat hanya dilakukan di level rekam rute (running page)
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date(pos.timestamp),
        });
        setError(null);
      },
      (err) => {
        let errorMessage = 'Unknown error occurred';
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMessage = 'Position unavailable';
        } else if (err.code === err.TIMEOUT) {
          errorMessage = 'Position request timeout';
        }
        setError(errorMessage);
        setIsTracking(false);
      },
      defaultOptions
    );
  }, [isTracking, defaultOptions]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentPos = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: new Date(pos.timestamp),
          };
          setPosition(currentPos);
          resolve(currentPos);
        },
        (err) => {
          let errorMessage = 'Unknown error occurred';
          if (err.code === err.PERMISSION_DENIED) {
            errorMessage = 'Location permission denied';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMessage = 'Position unavailable';
          } else if (err.code === err.TIMEOUT) {
            errorMessage = 'Position request timeout';
          }
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }, [defaultOptions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
