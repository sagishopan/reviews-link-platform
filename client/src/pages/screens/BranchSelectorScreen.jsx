import React, { useEffect, useState, useCallback } from 'react';
import Screen from '../../components/Screen.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';

const BRANCHES_METADATA = {
  1: { city: 'תל אביב', lat: 32.0751, lng: 34.7627 },
  2: { city: 'רמת השרון', lat: 32.1505, lng: 34.8272 },
  3: { city: 'גני תקווה', lat: 32.3065, lng: 34.8734 },
};

const GEOLOCATION_RADIUS_M = 300;

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BranchSelectorScreen({ branches, onSelect }) {
  const { t } = useI18n();
  const [nearbyBranchId, setNearbyBranchId] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        for (const branch of branches) {
          const meta = BRANCHES_METADATA[branch.id];
          if (!meta) continue;
          const dist = getDistance(latitude, longitude, meta.lat, meta.lng);
          if (dist <= GEOLOCATION_RADIUS_M) {
            setNearbyBranchId(branch.id);
            break;
          }
        }
      },
      () => {}
    );
  }, [branches]);

  const handleSelect = useCallback((branch) => {
    const method = branch.id === nearbyBranchId ? 'geo' : 'manual';
    localStorage.setItem(
      'selectedBranch',
      JSON.stringify({
        id: branch.id,
        slug: branch.slug,
        method,
        timestamp: Date.now(),
      })
    );
    onSelect(branch, method);
  }, [nearbyBranchId, onSelect]);

  if (!branches || branches.length === 0) {
    return (
      <Screen className="min-h-screen flex items-center justify-center text-body">
        {t.common.loading}
      </Screen>
    );
  }

  return (
    <Screen
      className="min-h-screen flex flex-col bg-white"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      }}
    >
      <div className="px-5 pb-8">
        <h1 className="font-extrabold text-heading" style={{ fontSize: 28, marginBottom: 12 }}>
          {t.picker.title}
        </h1>
        <p className="text-body text-right" style={{ fontSize: 13, lineHeight: 1.5, color: '#666' }}>
          {t.picker.location_hint}
        </p>
      </div>

      <div className="flex-1 px-5 flex flex-col gap-3">
        {branches.map((branch) => {
          const isNearby = branch.id === nearbyBranchId;
          const meta = BRANCHES_METADATA[branch.id];
          const city = meta?.city || '';
          const branchCopy = { ...branch };
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => handleSelect(branchCopy)}
              className="flex items-center justify-between p-4 rounded-md border border-gray-200 bg-white hover:border-accent active:border-accent transition-colors tap-target text-right"
              style={{ height: 82 }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" />
              </svg>
              <div className="flex-1 text-right mr-3">
                <div className="font-bold text-heading" style={{ fontSize: 18, marginBottom: 4 }}>
                  {branch.name}
                </div>
                <div className="text-body" style={{ fontSize: 14, color: '#999' }}>
                  {city}
                </div>
              </div>
              {isNearby && (
                <div
                  className="px-2 py-1 rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: 'var(--color-accent, #F97316)' }}
                >
                  {t.picker.probably_here}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}
