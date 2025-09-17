'use client';

import React, { useEffect } from 'react';
import { initializeMonitoring } from '../../lib/monitoring';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  useEffect(() => {
    // Initialize monitoring on client-side only
    initializeMonitoring();
  }, []);

  return <>{children}</>;
}