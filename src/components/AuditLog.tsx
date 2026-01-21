'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  Shield, 
  Upload, 
  Download, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Settings,
  FileText,
  Key,
  LogIn,
  Filter,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { getAuditLogs, AuditLog as AuditLogType, AuditAction } from '@/lib/firebase/enterprise';

interface AuditLogProps {
  orgId: string;
  teamId?: string;
}

const ACTION_CONFIG: Record<AuditAction, { icon: React.ElementType; label: string; color: string }> = {
  'user.login': { icon: LogIn, label: 'User Login', color: 'text-blue-400' },
  'user.logout': { icon: LogIn, label: 'User Logout', color: 'text-neutral-400' },
  'user.sso_login': { icon: Shield, label: 'SSO Login', color: 'text-blue-400' },
  'team.created': { icon: UserPlus, label: 'Team Created', color: 'text-emerald-400' },
  'team.updated': { icon: Settings, label: 'Team Updated', color: 'text-amber-400' },
  'team.deleted': { icon: Trash2, label: 'Team Deleted', color: 'text-red-400' },
  'member.invited': { icon: UserPlus, label: 'Member Invited', color: 'text-blue-400' },
  'member.joined': { icon: UserPlus, label: 'Member Joined', color: 'text-emerald-400' },
  'member.removed': { icon: UserMinus, label: 'Member Removed', color: 'text-red-400' },
  'member.role_changed': { icon: Shield, label: 'Role Changed', color: 'text-amber-400' },
  'role.created': { icon: Shield, label: 'Role Created', color: 'text-emerald-400' },
  'role.updated': { icon: Shield, label: 'Role Updated', color: 'text-amber-400' },
  'role.deleted': { icon: Shield, label: 'Role Deleted', color: 'text-red-400' },
  'data.uploaded': { icon: Upload, label: 'Data Uploaded', color: 'text-emerald-400' },
  'data.deleted': { icon: Trash2, label: 'Data Deleted', color: 'text-red-400' },
  'data.exported': { icon: Download, label: 'Data Exported', color: 'text-blue-400' },
  'report.generated': { icon: FileText, label: 'Report Generated', color: 'text-emerald-400' },
  'report.downloaded': { icon: Download, label: 'Report Downloaded', color: 'text-blue-400' },
  'report.shared': { icon: FileText, label: 'Report Shared', color: 'text-amber-400' },
  'settings.updated': { icon: Settings, label: 'Settings Updated', color: 'text-amber-400' },
  'integration.connected': { icon: Settings, label: 'Integration Connected', color: 'text-emerald-400' },
  'integration.disconnected': { icon: Settings, label: 'Integration Disconnected', color: 'text-red-400' },
  'api_key.created': { icon: Key, label: 'API Key Created', color: 'text-emerald-400' },
  'api_key.revoked': { icon: Key, label: 'API Key Revoked', color: 'text-red-400' },
};

export function AuditLogPanel({ orgId, teamId }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{
    action?: AuditAction;
    userId?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [orgId, teamId, filter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const fetchedLogs = await getAuditLogs(orgId, {
        teamId,
        ...filter,
        limit: 100,
      });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionConfig = (action: AuditAction) => {
    return ACTION_CONFIG[action] || { icon: Clock, label: action, color: 'text-neutral-400' };
  };

  const actionCategories = [
    { label: 'All Actions', value: undefined },
    { label: 'User Actions', actions: ['user.login', 'user.logout', 'user.sso_login'] },
    { label: 'Team Actions', actions: ['team.created', 'team.updated', 'team.deleted'] },
    { label: 'Member Actions', actions: ['member.invited', 'member.joined', 'member.removed', 'member.role_changed'] },
    { label: 'Data Actions', actions: ['data.uploaded', 'data.deleted', 'data.exported'] },
    { label: 'Report Actions', actions: ['report.generated', 'report.downloaded', 'report.shared'] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Audit Log</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs border transition-colors ${
              showFilters ? 'bg-amber-950 border-amber-800 text-amber-400' : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="p-1.5 text-neutral-500 hover:text-neutral-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-neutral-900 border border-neutral-800 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-500 uppercase mb-1 block">Action Type</label>
              <select
                className="input text-sm w-full"
                value={filter.action || ''}
                onChange={(e) => setFilter({ ...filter, action: e.target.value as AuditAction || undefined })}
              >
                <option value="">All Actions</option>
                {Object.entries(ACTION_CONFIG).map(([action, config]) => (
                  <option key={action} value={action}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-neutral-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-neutral-500">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No audit logs found</p>
          </div>
        ) : (
          logs.map((log) => {
            const config = getActionConfig(log.action);
            const Icon = config.icon;
            
            return (
              <div key={log.id} className="p-3 hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 bg-neutral-800 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      <span className="text-neutral-300">{log.userEmail}</span>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <span className="text-neutral-500">
                          {' • '}
                          {Object.entries(log.details)
                            .filter(([key]) => key !== 'provider')
                            .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
                            .join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
