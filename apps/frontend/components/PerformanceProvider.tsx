/**
 * Performance Provider Component for German Code Zero AI
 * 
 * Initializes performance monitoring, lazy loading, and optimization
 * utilities across the application.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  initializePerformance, 
  PerformanceMonitor, 
  LazyLoader, 
  PerformanceAuditor,
  PERFORMANCE_BUDGETS 
} from '../lib/performance';

interface PerformanceContextValue {
  monitor: PerformanceMonitor | null;
  lazyLoader: LazyLoader | null;
  auditor: PerformanceAuditor | null;
  isInitialized: boolean;
}

const PerformanceContext = createContext<PerformanceContextValue>({
  monitor: null,
  lazyLoader: null,
  auditor: null,
  isInitialized: false,
});

interface PerformanceProviderProps {
  children: React.ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [performanceUtils, setPerformanceUtils] = useState<{
    monitor: PerformanceMonitor;
    lazyLoader: LazyLoader;
    auditor: PerformanceAuditor;
  } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize performance utilities
    const utils = initializePerformance();
    setPerformanceUtils(utils);
    setIsInitialized(true);

    // Cleanup function
    return () => {
      utils.monitor.destroy();
      utils.lazyLoader.destroy();
    };
  }, []);

  const contextValue: PerformanceContextValue = {
    monitor: performanceUtils?.monitor || null,
    lazyLoader: performanceUtils?.lazyLoader || null,
    auditor: performanceUtils?.auditor || null,
    isInitialized,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to use performance utilities
 */
export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const { monitor, isInitialized } = usePerformance();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!monitor || !isInitialized) return;

    const updateMetrics = () => {
      const currentMetrics = monitor.getMetrics();
      const coreWebVitals = monitor.checkCoreWebVitals();
      setMetrics({ ...currentMetrics, coreWebVitals });
    };

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [monitor, isInitialized]);

  return metrics;
}

/**
 * Component for performance debugging (development only)
 */
export function PerformanceDebugger() {
  const metrics = usePerformanceMonitoring();
  const { auditor, isInitialized } = usePerformance();
  const [auditResults, setAuditResults] = useState<any>(null);

  useEffect(() => {
    if (!auditor || !isInitialized || process.env.NODE_ENV !== 'development') return;

    const runAudit = async () => {
      try {
        const results = await auditor.runAudit();
        setAuditResults(results);
      } catch (error) {
        console.error('Performance audit failed:', error);
      }
    };

    // Run audit after a delay
    const timeout = setTimeout(runAudit, 3000);
    return () => clearTimeout(timeout);
  }, [auditor, isInitialized]);

  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        border: '1px solid #FFD700',
      }}
    >
      <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>
        Performance Debug
      </h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Core Web Vitals:</strong>
      </div>
      
      {metrics.coreWebVitals && (
        <div style={{ marginBottom: '10px', fontSize: '11px' }}>
          <div>
            LCP: {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
            <span style={{ 
              color: metrics.coreWebVitals.lcp?.status === 'good' ? '#4ade80' : 
                     metrics.coreWebVitals.lcp?.status === 'needs-improvement' ? '#fbbf24' : '#ef4444' 
            }}>
              ({metrics.coreWebVitals.lcp?.status || 'unknown'})
            </span>
          </div>
          <div>
            FID: {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
            <span style={{ 
              color: metrics.coreWebVitals.fid?.status === 'good' ? '#4ade80' : 
                     metrics.coreWebVitals.fid?.status === 'needs-improvement' ? '#fbbf24' : '#ef4444' 
            }}>
              ({metrics.coreWebVitals.fid?.status || 'unknown'})
            </span>
          </div>
          <div>
            CLS: {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
            <span style={{ 
              color: metrics.coreWebVitals.cls?.status === 'good' ? '#4ade80' : 
                     metrics.coreWebVitals.cls?.status === 'needs-improvement' ? '#fbbf24' : '#ef4444' 
            }}>
              ({metrics.coreWebVitals.cls?.status || 'unknown'})
            </span>
          </div>
        </div>
      )}

      {auditResults && (
        <div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Bundle Analysis:</strong>
          </div>
          <div style={{ fontSize: '11px', marginBottom: '5px' }}>
            JS: {Math.round(auditResults.bundle.jsSize / 1000)}KB / {PERFORMANCE_BUDGETS.initialJS / 1000}KB
          </div>
          <div style={{ fontSize: '11px', marginBottom: '5px' }}>
            Total: {Math.round(auditResults.bundle.totalSize / 1000)}KB / {PERFORMANCE_BUDGETS.totalBundle / 1000}KB
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: auditResults.compliance.budgetCompliance ? '#4ade80' : '#ef4444' 
          }}>
            Budget: {auditResults.compliance.budgetCompliance ? '✓' : '✗'}
          </div>
        </div>
      )}
    </div>
  );
}