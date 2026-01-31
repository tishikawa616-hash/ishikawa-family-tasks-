"use client";

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const CURRENT_VERSION = '2026-02-01-v1'; // Increment manually or via script

export function ClientVersion() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Check if the stored version matches the current version
    const storedVersion = localStorage.getItem('app-version');
    
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
       setTimeout(() => setShowUpdate(true), 0);
    } else {
       localStorage.setItem('app-version', CURRENT_VERSION);
    }
  }, []);

  const handleUpdate = () => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Update stored version
    localStorage.setItem('app-version', CURRENT_VERSION);
    
    // Force reload
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-enter-up">
      <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-bold text-sm">新しいバージョンが利用可能です</span>
          <span className="text-xs text-blue-100">最新機能を使うには更新してください</span>
        </div>
        <button 
          onClick={handleUpdate}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          更新
        </button>
      </div>
    </div>
  );
}
