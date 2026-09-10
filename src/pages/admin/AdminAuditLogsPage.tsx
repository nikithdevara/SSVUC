import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Download,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import { AuditLog } from '../../types';
import { svucStore } from '../../services/store';
import { reportService } from '../../services/adminService';
import { AdminBreadcrumbs } from '../../components/admin/AdminBreadcrumbs';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import { AdminTable, Column } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';

interface AdminAuditLogsPageProps {
  onNavigate: (route: string) => void;
  selectedId?: string;
}

export const AdminAuditLogsPage: React.FC<AdminAuditLogsPageProps> = ({ onNavigate, selectedId }) => {
  const [logs, setLogs] = useState<AuditLog[]>(svucStore.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [detailModalLog, setDetailModalLog] = useState<AuditLog | null>(null);

  const refreshList = () => {
    setLogs(svucStore.getAuditLogs());
  };

  useEffect(() => {
    const handleUpdate = () => refreshList();
    window.addEventListener('svuc_store_updated', handleUpdate);
    return () => window.removeEventListener('svuc_store_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (selectedId) {
      const match = logs.find((l) => l.id === selectedId);
      if (match) setDetailModalLog(match);
    }
  }, [selectedId, logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        log.performedBy.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q) ||
        (log.auditReason && log.auditReason.toLowerCase().includes(q));

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;

      return matchesQuery && matchesAction && matchesEntity;
    });
  }, [logs, searchQuery, actionFilter, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleExportCSV = () => {
    const rows = filteredLogs.map((l) => ({
      'Log ID': l.id,
      'Timestamp': l.timestamp,
      'Performed By': l.performedBy,
      'Role': l.userRole,
      'Action': l.action,
      'Entity': l.entity,
      'Record ID': l.recordId,
      'Details': l.details,
      'Audit Reason': l.auditReason || '',
    }));
    reportService.exportCSV('SSV_Security_Audit_Trail_2026', rows);
  };

  const renderActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'APPROVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            APPROVE
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
            REJECT
          </span>
        );
      case 'CREATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
            UPDATE
          </span>
        );
      case 'ARCHIVE':
      case 'DELETE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-800">
            {action}
          </span>
        );
      case 'LOGIN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
            LOGIN
          </span>
        );
      default:
        return <span>{action}</span>;
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (l) => (
        <div>
          <span className="font-mono text-xs text-stone-800 block">
            {l.timestamp.split('T')[0]}
          </span>
          <span className="font-mono text-[10px] text-stone-400">
            {l.timestamp.split('T')[1]?.split('.')[0] || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Actor & Role',
      render: (l) => (
        <div>
          <span className="font-bold text-stone-900 block text-xs">{l.performedBy}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
            {l.userRole}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Event Action',
      render: (l) => renderActionBadge(l.action),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (l) => (
        <div>
          <span className="font-semibold text-stone-800 text-xs block">{l.entity}</span>
          <span className="font-mono text-[10px] text-stone-400 truncate max-w-[120px] block">
            {l.recordId}
          </span>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Audit Description & Justification',
      render: (l) => (
        <div className="max-w-md">
          <p className="text-xs text-stone-700 leading-snug line-clamp-1">{l.details}</p>
          {l.auditReason && (
            <span className="text-[11px] text-amber-800 font-medium italic block mt-0.5">
              Reason: "{l.auditReason}"
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (l) => (
        <button
          onClick={() => setDetailModalLog(l)}
          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          title="View Event Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Audit Trail' }]} onNavigate={onNavigate} />

      <AdminPageHeader
        title="Immutable Security & Financial Audit Trail"
        subtitle="Permanent chronological record of every financial alteration, user action, and approval event"
        actions={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export Audit Log</span>
          </button>
        }
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search audit events by user, reason, or record ID..."
        totalResults={filteredLogs.length}
        activeFilterCount={(actionFilter !== 'ALL' ? 1 : 0) + (entityFilter !== 'ALL' ? 1 : 0)}
        onClearFilters={() => {
          setActionFilter('ALL');
          setEntityFilter('ALL');
          setSearchQuery('');
        }}
        filters={
          <>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
            >
              <option value="ALL">All Actions</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="ARCHIVE">ARCHIVE</option>
              <option value="LOGIN">LOGIN</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs rounded-lg border border-stone-300 bg-white py-2 px-2.5 outline-hidden focus:border-[#7F1D1D]"
            >
              <option value="ALL">All Entities</option>
              <option value="Donation">Offerings</option>
              <option value="Expense">Expenses</option>
              <option value="Material">Material Seva</option>
              <option value="Event">Events</option>
              <option value="Announcement">Announcements</option>
              <option value="Settings">Committee Settings</option>
              <option value="User">User Management</option>
            </select>
          </>
        }
      />

      <AdminTable
        data={paginatedData}
        columns={columns}
        keyExtractor={(l) => l.id}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        renderMobileCard={(l) => (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-stone-900 text-xs">{l.performedBy}</span>
                <span className="text-[10px] text-stone-400 block">{l.timestamp}</span>
              </div>
              <div>{renderActionBadge(l.action)}</div>
            </div>

            <div className="text-xs text-stone-700">{l.details}</div>
            {l.auditReason && (
              <div className="text-[11px] text-amber-800 italic">Reason: {l.auditReason}</div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-[10px] text-stone-400">
              <span>
                {l.entity} • {l.recordId}
              </span>
              <button
                onClick={() => setDetailModalLog(l)}
                className="text-stone-700 underline font-medium"
              >
                Inspect
              </button>
            </div>
          </div>
        )}
      />

      {/* Audit Detail Modal */}
      {detailModalLog && (
        <AdminModal
          isOpen={true}
          onClose={() => setDetailModalLog(null)}
          title={`Audit Event: ${detailModalLog.id}`}
          subtitle={`Recorded on ${new Date(detailModalLog.timestamp).toLocaleString('en-IN')}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Actor</span>
                <span className="font-bold text-stone-900">{detailModalLog.performedBy}</span>
                <span className="text-stone-500 block text-[11px]">Role: {detailModalLog.userRole}</span>
              </div>
              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Event Action</span>
                <div>{renderActionBadge(detailModalLog.action)}</div>
              </div>
              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Target Entity</span>
                <span className="font-bold text-stone-900">{detailModalLog.entity}</span>
              </div>
              <div>
                <span className="text-stone-400 font-semibold block uppercase text-[10px]">Record ID</span>
                <span className="font-mono text-stone-700 text-[11px]">{detailModalLog.recordId}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Details / Event Summary</label>
              <div className="p-3 bg-white border border-stone-200 rounded-lg text-stone-800 leading-relaxed">
                {detailModalLog.details}
              </div>
            </div>

            {detailModalLog.auditReason && (
              <div>
                <label className="block font-semibold text-amber-900 mb-1">
                  Official Justification Provided by Actor
                </label>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-amber-900 font-medium italic">
                  "{detailModalLog.auditReason}"
                </div>
              </div>
            )}

            {detailModalLog.diff && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Diff / Modification Breakdown</label>
                <pre className="p-3 bg-stone-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(detailModalLog.diff, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setDetailModalLog(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 text-white hover:bg-stone-900"
              >
                Close Audit Inspector
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
};
