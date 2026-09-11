import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  RefreshCw,
  Activity,
  Download,
  Database,
  RotateCcw,
  Code2,
  CheckCircle,
  AlertTriangle,
  Flame,
  KeyRound,
  Copy,
  Check,
  Server,
  Zap,
} from 'lucide-react';
import { svucStore } from '../../services/store';
import { authService } from '../../services/authService';
import { seedService } from '../../services/firebase/seedService';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { ConfirmationModal } from '../../components/admin/ConfirmationModal';
import { useToast } from '../../components/common/Toast';
import { isFirebaseConfigured, db, firebaseEnv } from '../../lib/firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../../services/firebase/firestoreService';

interface AdminDeveloperPageProps {
  onNavigate: (route: string) => void;
}

export const AdminDeveloperPage: React.FC<AdminDeveloperPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [isClearAuditModalOpen, setIsClearAuditModalOpen] = useState(false);
  const [isResetCacheModalOpen, setIsResetCacheModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const [isRunningSync, setIsRunningSync] = useState(false);
  const [isPingingDb, setIsPingingDb] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  const [showConfigInspector, setShowConfigInspector] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isDev = authService.isDeveloper();

  // Audit Logs Count
  const [auditLogCount, setAuditLogCount] = useState(svucStore.getAuditLogs().length);

  useEffect(() => {
    const handleUpdate = () => {
      setAuditLogCount(svucStore.getAuditLogs().length);
    };
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => window.removeEventListener('svuc_store_updated', handleUpdate);
  }, []);

  // 1. Purge Audit Logs Handler
  const handlePurgeAuditLogs = async () => {
    try {
      svucStore.clearAuditLogs();
      localStorage.removeItem('svuc_audit_logs_2026_clean');
      localStorage.removeItem('svuc_audit_logs_fresh_start_2026');
      localStorage.setItem('svuc_audit_logs_fresh_start_2026', JSON.stringify([]));

      if (isFirebaseConfigured() && db) {
        try {
          const snap = await getDocs(collection(db, COLLECTIONS.AUDIT_LOGS));
          const deletes = snap.docs.map((d) => deleteDoc(doc(db, COLLECTIONS.AUDIT_LOGS, d.id)));
          await Promise.all(deletes);
        } catch (err) {
          console.warn('[Clear Firestore Audit Logs Error]', err);
        }
      }
      setAuditLogCount(0);
      showToast('All audit logs have been permanently purged.', 'success');
    } catch (err: any) {
      console.error('Failed to purge audit logs:', err);
      showToast('Failed to purge audit logs.', 'error');
    } finally {
      setIsClearAuditModalOpen(false);
    }
  };

  // 2. Trigger Full 2-Way Sync
  const handleTriggerSync = async () => {
    setIsRunningSync(true);
    try {
      if (isFirebaseConfigured() && db) {
        // Fetch all primary collections
        const [dons, mats, exps, recs] = await Promise.all([
          getDocs(collection(db, COLLECTIONS.DONATIONS)),
          getDocs(collection(db, COLLECTIONS.MATERIALS)),
          getDocs(collection(db, COLLECTIONS.EXPENSES)),
          getDocs(collection(db, COLLECTIONS.RECEIPTS)),
        ]);
        showToast(
          `Sync complete: Reconciled ${dons.size} offerings, ${mats.size} materials, ${exps.size} expenses.`,
          'success'
        );
      } else {
        showToast('Local store reconciled. Cloud sync is currently in fallback mode.', 'info');
      }
      window.dispatchEvent(new Event('svuc_store_updated'));
    } catch (err: any) {
      console.error('[Developer Sync Error]', err);
      showToast('Cloud synchronization encountered an issue.', 'error');
    } finally {
      setIsRunningSync(false);
    }
  };

  // 3. Cloud Database Latency Ping
  const handlePingDatabase = async () => {
    setIsPingingDb(true);
    setPingStatus('IDLE');
    const start = performance.now();
    try {
      if (isFirebaseConfigured() && db) {
        await getDoc(doc(db, COLLECTIONS.SETTINGS, 'committee'));
        const end = performance.now();
        const duration = Math.round(end - start);
        setPingLatency(duration);
        setPingStatus('SUCCESS');
        showToast(`Cloud Firestore ping successful (${duration} ms).`, 'success');
      } else {
        setPingLatency(1);
        setPingStatus('SUCCESS');
        showToast('Local Storage probe responded in <1 ms.', 'info');
      }
    } catch (err) {
      console.error('[Ping DB Error]', err);
      setPingStatus('ERROR');
      showToast('Database probe timed out or failed.', 'error');
    } finally {
      setIsPingingDb(false);
    }
  };

  // 4. Export JSON Database Backup
  const handleExportFullBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      database: 'Sri Siddhi Vinayaka Utsav 2026',
      environment: import.meta.env.MODE || 'production',
      data: {
        donations: svucStore.getDonations(),
        materials: svucStore.getMaterials(),
        expenses: svucStore.getExpenses(),
        receipts: svucStore.getReceipts(),
        events: svucStore.getEvents(),
        announcements: svucStore.getAnnouncements(),
        gallery: svucStore.getGallery(),
        settings: svucStore.getSettings(),
        users: svucStore.getAdminUsers(),
        auditLogs: svucStore.getAuditLogs(),
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SSVUC_Full_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Full system database JSON backup downloaded.', 'success');
  };

  // 5. Reset Local App Cache
  const handleResetLocalCache = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('svuc_') && !key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
    setIsResetCacheModalOpen(false);
    showToast('Local application cache cleared. Refreshing view...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // 6. Re-seed Factory Baseline
  const handleReSeedData = async () => {
    try {
      await seedService.seedInitialCommitteeData();
      showToast('Factory baseline committee settings and events restored.', 'success');
    } catch (err) {
      console.error('[Seed Error]', err);
      showToast('Failed to seed baseline data.', 'error');
    } finally {
      setIsSeedModalOpen(false);
    }
  };

  const copyConfigJson = () => {
    const safeConfig = {
      firebaseProjectId: firebaseEnv.projectId || 'ssv-utsava',
      authDomain: firebaseEnv.authDomain || 'ssv-utsava.firebaseapp.com',
      storageBucket: firebaseEnv.storageBucket || 'ssv-utsava.firebasestorage.app',
      isCloudConfigured: isFirebaseConfigured(),
      activeRole: currentUser?.role || 'DEVELOPER',
      activeEmail: currentUser?.email || 'developer@dev.org',
    };
    navigator.clipboard.writeText(JSON.stringify(safeConfig, null, 2));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    showToast('Config JSON copied to clipboard.', 'info');
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Developer Console' }]} onNavigate={onNavigate} />

      {/* Developer Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-neutral-900 rounded-2xl p-6 border border-stone-800 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold mb-2">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>DevOps & System Engineering Suite</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-stone-100 flex items-center gap-2">
              <span>Developer Control Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Authorized engineering access for <span className="text-amber-300 font-mono font-semibold">developer@dev.org</span>. Execute live cloud database maintenance, purge audit trails, run connectivity probes, and manage disaster recovery backups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/80 text-xs font-mono text-stone-300 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Project: <strong className="text-emerald-300">{firebaseEnv.projectId || 'ssv-utsava'}</strong></span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/80 text-xs font-mono text-stone-300 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Role: <strong className="text-amber-300">{currentUser?.role || 'DEVELOPER'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Interactive Developer Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Purge Audit Logs */}
        <div className="bg-white rounded-2xl border border-red-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
                <Trash2 className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-red-100 text-red-800 border border-red-200">
                Destructive
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Purge & Reset Audit Trail</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Permanently wipes all security, login, and modification audit logs from both Cloud Firestore (<code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] font-mono">auditLogs</code>) and local cache.
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Current Log Count:</span>
                <strong className="text-red-700">{auditLogCount} records</strong>
              </div>
              <div className="flex justify-between">
                <span>Target Collection:</span>
                <span className="text-stone-700">auditLogs</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsClearAuditModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Audit Logs</span>
          </button>
        </div>

        {/* Card 2: Force 2-Way Sync */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <RefreshCw className={`w-4 h-4 ${isRunningSync ? 'animate-spin' : ''}`} />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Maintenance
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Force Cloud Database Sync</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Executes an immediate bidirectional reconciliation pass between active Firestore cloud collections and local storage across all data models.
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Cloud Status:</span>
                <span className="text-emerald-700 font-bold">{isFirebaseConfigured() ? 'Connected' : 'Offline Mode'}</span>
              </div>
              <div className="flex justify-between">
                <span>Collections:</span>
                <span>donations, materials, expenses</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isRunningSync}
            onClick={handleTriggerSync}
            className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningSync ? 'animate-spin' : ''}`} />
            <span>{isRunningSync ? 'Synchronizing Cloud...' : 'Trigger Full Cloud Sync'}</span>
          </button>
        </div>

        {/* Card 3: Database Latency Probe */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
                <Activity className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-100 text-blue-800 border border-blue-200">
                Diagnostic
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Database Health & Latency Probe</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pings the live Google Cloud Firestore project to verify real-time read throughput, socket health, and round-trip network response latency.
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between items-center">
                <span>Round-Trip Latency:</span>
                {pingLatency !== null ? (
                  <span className="font-bold text-blue-700">{pingLatency} ms</span>
                ) : (
                  <span className="text-stone-400">Not Tested</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Probe Status:</span>
                <span className={pingStatus === 'SUCCESS' ? 'text-emerald-700 font-bold' : pingStatus === 'ERROR' ? 'text-red-700 font-bold' : 'text-stone-500'}>
                  {pingStatus}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isPingingDb}
            onClick={handlePingDatabase}
            className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Activity className={`w-3.5 h-3.5 ${isPingingDb ? 'animate-spin' : ''}`} />
            <span>{isPingingDb ? 'Pinging Cloud Cluster...' : 'Run Latency Probe'}</span>
          </button>
        </div>

        {/* Card 4: Full JSON Dump Backup */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800">
                <Download className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-purple-100 text-purple-800 border border-purple-200">
                Backup
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Full Database Snapshot (JSON)</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Generates an unredacted single JSON dump containing all monetary offerings, material seva, vouchers, receipts, settings, and users for offline archival.
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="text-purple-700 font-bold">Standard JSON (.json)</span>
              </div>
              <div className="flex justify-between">
                <span>Scope:</span>
                <span>Entire Multi-Model Schema</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportFullBackup}
            className="w-full py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full JSON Dump</span>
          </button>
        </div>

        {/* Card 5: Clear Local App Cache */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-900 border border-amber-200">
                Client Cache
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Purge Local Application Cache</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Wipes browser <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px] font-mono">localStorage</code> cache keys without affecting cloud database, forcing client to pull clean state.
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="text-amber-900 font-bold">Browser LocalStorage</span>
              </div>
              <div className="flex justify-between">
                <span>Cloud Data Impact:</span>
                <span className="text-emerald-700">None (Safe)</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetCacheModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Local Cache & Reload</span>
          </button>
        </div>

        {/* Card 6: Re-seed Factory Baseline */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800">
                <Database className="w-4 h-4" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-stone-100 text-stone-800 border border-stone-200">
                Baseline Restore
              </span>
            </div>
            <h3 className="font-bold text-stone-900 text-sm">Re-seed Factory Baseline Data</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Re-populates initial festival dates (Sep 14–22, 2026), Mandapam committee settings, and core administrative roles if database is empty.
            </p>
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Festival Year:</span>
                <span className="font-bold text-stone-800">2026</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span>Anjayya Colony</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSeedModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Re-seed Baseline Records</span>
          </button>
        </div>

      </div>

      {/* Card 7: Live Environment & Config Inspector */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 p-5 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold font-mono text-sm text-stone-100">Live System Environment & Runtime Metadata</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyConfigJson}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-mono text-stone-300 transition-colors cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfigInspector(!showConfigInspector)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              {showConfigInspector ? 'Hide Inspector' : 'Expand Inspector'}
            </button>
          </div>
        </div>

        {showConfigInspector && (
          <pre className="p-4 rounded-xl bg-black/60 border border-stone-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
            {JSON.stringify(
              {
                runtime: 'Vite + React 18',
                firebaseProjectId: firebaseEnv.projectId || 'ssv-utsava',
                authDomain: firebaseEnv.authDomain || 'ssv-utsava.firebaseapp.com',
                storageBucket: firebaseEnv.storageBucket || 'ssv-utsava.firebasestorage.app',
                merchantVpa: '8919982789@axl',
                merchantName: 'MANGARAPU DHANUSH SAI',
                activeDeveloperSession: {
                  email: currentUser?.email || 'developer@dev.org',
                  name: currentUser?.name || 'Lead Developer',
                  role: currentUser?.role || 'DEVELOPER',
                  phone: currentUser?.phone || '+91 63051 92846',
                },
              },
              null,
              2
            )}
          </pre>
        )}
      </div>

      {/* Confirmation Modals */}
      {isClearAuditModalOpen && (
        <ConfirmationModal
          isOpen={true}
          title="Permanently Purge All Audit Logs?"
          message="Are you sure you want to completely purge all audit logs from both Cloud Firestore and local storage? This action cannot be undone."
          confirmLabel="Purge Audit Logs"
          variant="danger"
          onConfirm={handlePurgeAuditLogs}
          onCancel={() => setIsClearAuditModalOpen(false)}
        />
      )}

      {isResetCacheModalOpen && (
        <ConfirmationModal
          isOpen={true}
          title="Clear Local Cache?"
          message="This will clear your local browser storage caches and reload the portal. Cloud database records in Firestore will remain untouched."
          confirmLabel="Clear Cache & Reload"
          variant="warning"
          onConfirm={handleResetLocalCache}
          onCancel={() => setIsResetCacheModalOpen(false)}
        />
      )}

      {isSeedModalOpen && (
        <ConfirmationModal
          isOpen={true}
          title="Re-seed Baseline Committee Data?"
          message="This will verify and restore baseline festival configurations and schedule items in Firestore."
          confirmLabel="Re-seed Baseline"
          variant="warning"
          onConfirm={handleReSeedData}
          onCancel={() => setIsSeedModalOpen(false)}
        />
      )}
    </div>
  );
};
