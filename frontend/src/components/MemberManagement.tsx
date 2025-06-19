import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { apiClient } from '../shared/services/apiClient';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Member {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  joinedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

interface MemberManagementProps {
  organizationId: string;
  onClose: () => void;
  onMemberUpdated?: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  organizationId,
  onClose,
  onMemberUpdated
}) => {
  const { hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'invite'>('list');
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load members
      const membersResponse = await apiClient.getOrganizationMembers(organizationId);
      if (membersResponse.success) {
        setMembers(membersResponse.data.members || []);
      }

      // Load available roles (from system roles)
      const availableRoles: Role[] = [
        { id: 'org_admin', name: 'org_admin', description: 'Organization administrator with full organization management' },
        { id: 'impact_manager', name: 'impact_manager', description: 'Impact measurement manager with full measurement access' },
        { id: 'impact_analyst', name: 'impact_analyst', description: 'Impact analyst with measurement creation and editing access' },
        { id: 'report_viewer', name: 'report_viewer', description: 'Read-only access to reports and measurements' },
        { id: 'evaluator', name: 'evaluator', description: 'External evaluator with limited access to assigned reports' }
      ];
      setRoles(availableRoles);
      
      if (availableRoles.length > 0) {
        setInviteRoleId(availableRoles[2].id); // Default to impact_analyst
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load member data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setError('');
    setInviteSuccess('');

    try {
      const response = await apiClient.inviteOrganizationMember(organizationId, {
        email: inviteEmail,
        roleId: inviteRoleId,
        message: inviteMessage || undefined
      });

      if (response.success) {
        setInviteSuccess(`Invitation sent to ${inviteEmail} successfully!`);
        setInviteEmail('');
        setInviteMessage('');
        
        // Reload members list
        await loadData();
        
        // Switch back to list tab
        setTimeout(() => {
          setActiveTab('list');
          setInviteSuccess('');
        }, 2000);

        // Notify parent component
        if (onMemberUpdated) {
          onMemberUpdated();
        }
      } else {
        setError(response.message || 'Failed to send invitation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRoleId: string) => {
    try {
      const response = await apiClient.updateMemberRole(organizationId, memberId, {
        roleId: newRoleId
      });

      if (response.success) {
        // Update local state
        setMembers(prev => prev.map(member => 
          member.id === memberId 
            ? { ...member, role: { ...member.role, id: newRoleId, name: newRoleId } }
            : member
        ));

        // Notify parent component
        if (onMemberUpdated) {
          onMemberUpdated();
        }
      } else {
        setError(response.message || 'Failed to update member role');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the organization?`)) {
      return;
    }

    try {
      const response = await apiClient.removeMember(organizationId, memberId);
      
      if (response.success) {
        // Update local state
        setMembers(prev => prev.filter(member => member.id !== memberId));

        // Notify parent component
        if (onMemberUpdated) {
          onMemberUpdated();
        }
      } else {
        setError(response.message || 'Failed to remove member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800',
      org_admin: 'bg-blue-100 text-blue-800',
      impact_manager: 'bg-green-100 text-green-800',
      impact_analyst: 'bg-yellow-100 text-yellow-800',
      report_viewer: 'bg-gray-100 text-gray-800',
      evaluator: 'bg-orange-100 text-orange-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const formatRoleName = (roleName: string) => {
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Member Management</h3>
            <p className="text-sm text-gray-500">Manage team members and their roles</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>👥</span>
              <span>Members ({members.length})</span>
            </button>
            
            {hasPermission('org:invite') && (
              <button
                onClick={() => setActiveTab('invite')}
                className={`${
                  activeTab === 'invite'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>📧</span>
                <span>Invite</span>
              </button>
            )}
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Success Display */}
        {inviteSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-600 text-sm">{inviteSuccess}</div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        ) : (
          <>
            {/* Members List Tab */}
            {activeTab === 'list' && (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {(member.firstName?.charAt(0) || member.email.charAt(0)).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {member.firstName && member.lastName 
                            ? `${member.firstName} ${member.lastName}`
                            : member.email
                          }
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined {formatDate(member.joinedAt)}
                          {member.lastLoginAt && ` • Last login ${formatDate(member.lastLoginAt)}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Role Selector */}
                      {hasPermission('org:manage_members') ? (
                        <select
                          value={member.role.id}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {formatRoleName(role.name)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role.name)}`}>
                          {formatRoleName(member.role.name)}
                        </span>
                      )}

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>

                      {/* Remove Button */}
                      {hasPermission('org:manage_members') && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.email)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          title="Remove member"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-xl mb-2">👥</div>
                    <p className="text-gray-500">No members found</p>
                  </div>
                )}
              </div>
            )}

            {/* Invite Tab */}
            {activeTab === 'invite' && hasPermission('org:invite') && (
              <form onSubmit={handleInviteMember} className="space-y-6">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="colleague@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="inviteRole"
                    required
                    value={inviteRoleId}
                    onChange={(e) => setInviteRoleId(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {formatRoleName(role.name)} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="inviteMessage" className="block text-sm font-medium text-gray-700">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="inviteMessage"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Welcome to our team! We're excited to collaborate with you on our impact measurement initiatives."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};