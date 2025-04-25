'use client';

import Image from 'next/image';
import { DATABASE_TYPES, DatabaseType } from '@/utils/databaseTypes';

export function getDatabaseLogo(dbType: DatabaseType, className = 'w-6 h-6') {
  const dbMeta = DATABASE_TYPES.find((db) => db.id === dbType);

  if (!dbMeta) {
    return (
      <div className={`bg-gray-700 text-white text-xs flex items-center justify-center rounded ${className}`}>
        ?
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src={dbMeta.logo}
        alt={`${dbMeta.name} logo`}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 48px"
      />
    </div>
  );
}
