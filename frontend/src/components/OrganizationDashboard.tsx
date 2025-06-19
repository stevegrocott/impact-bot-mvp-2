import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { apiClient } from '../shared/services/apiClient';
import { MemberManagement } from './MemberManagement';
import { FoundationAssessment } from './FoundationAssessment';

interface OrganizationStats {
  memberCount: number;
  activeProjects: number;
  recentActivity: number;
  measurementProgress: number;
}

interface OrganizationData {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  memberCount: number;
  createdAt: string;
  settings: {
    allowPublicReports: boolean;
    notificationPreferences: Record<string, any>;
  };
}

interface Member {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  joinedAt: string;
  lastLoginAt?: string;
}

export const OrganizationDashboard: React.FC = () => {
  const { user, organization, hasPermission, isAuthenticated } = useAuth();
  const [orgData, setOrgData] = useState<OrganizationData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'foundation' | 'members' | 'settings'>('overview');
  const [showMemberManagement, setShowMemberManagement] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Please log in to access the organization dashboard');
      setLoading(false);
      return;
    }
    
    if (!organization) {
      setError('No organization found. Please contact your administrator.');
      setLoading(false);
      return;
    }
    
    loadOrganizationData();
  }, [organization, isAuthenticated]);

  const loadOrganizationData = async () => {
    if (!organization) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Load organization details
      const orgResponse = await apiClient.getOrganization(organization.id);
      if (orgResponse.success) {
        setOrgData(orgResponse.data.organization);
        
        // Calculate stats from organization data
        const statsData: OrganizationStats = {
          memberCount: orgResponse.data.organization.memberCount || 0,
          activeProjects: 0, // TODO: Implement when projects are added
          recentActivity: 5, // Mock data for now
          measurementProgress: 25 // Mock data for now
        };
        setStats(statsData);
      }

      // Load members if user has permission
      try {
        if (hasPermission && hasPermission('org:read')) {
          const membersResponse = await apiClient.getOrganizationMembers(organization.id);
          if (membersResponse.success) {
            setMembers(membersResponse.data.members || []);
          }
        }
      } catch (memberErr) {
        console.warn('Failed to load members:', memberErr);
        // Don't fail the whole component if members can't be loaded
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organization data');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadOrganizationData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">📊</div>
          <p className="text-gray-600">No organization data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{orgData.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {orgData.description || 'Organization Dashboard'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
                {orgData.industry && (
                  <span className="text-sm text-gray-500">{orgData.industry}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'foundation', name: 'Foundation', icon: '🏗️' },
              { id: 'members', name: 'Members', icon: '👥' },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">👥</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.memberCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">📈</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeProjects}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🎯</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Recent Activity</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.recentActivity}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">📊</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Progress</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.measurementProgress}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setShowMemberManagement(true)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="text-xl mb-2">👥</div>
                    <div className="font-medium text-gray-900">Manage Members</div>
                    <div className="text-sm text-gray-500">Invite and manage team members</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('foundation')}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="text-xl mb-2">🏗️</div>
                    <div className="font-medium text-gray-900">Foundation Assessment</div>
                    <div className="text-sm text-gray-500">Build your impact measurement foundation</div>
                  </button>
                  
                  <button className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="text-xl mb-2">📊</div>
                    <div className="font-medium text-gray-900">View Reports</div>
                    <div className="text-sm text-gray-500">Access impact reports and analytics</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Organization Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Industry</dt>
                    <dd className="mt-1 text-sm text-gray-900">{orgData.industry || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {orgData.website ? (
                        <a href={orgData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                          {orgData.website}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(orgData.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Members</dt>
                    <dd className="mt-1 text-sm text-gray-900">{orgData.memberCount}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'foundation' && (
          <FoundationAssessment />
        )}

        {activeTab === 'members' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
                <button 
                  onClick={() => setShowMemberManagement(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <span className="mr-2">👥</span>
                  Manage Members
                </button>
              </div>
              
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <li key={member.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(member.firstName?.charAt(0) || member.email.charAt(0)).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.firstName && member.lastName 
                              ? `${member.firstName} ${member.lastName}`
                              : member.email
                            }
                          </p>
                          <p className="text-sm text-gray-500 truncate">{member.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role.name)}`}>
                            {member.role.name.replace('_', ' ')}
                          </span>
                          <div className="text-sm text-gray-500">
                            Joined {formatDate(member.joinedAt)}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {members.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-xl mb-2">👥</div>
                    <p className="text-gray-500">No members found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {hasPermission('org:read') ? (
              <>
                {/* Organization Information */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Organization Information</h3>
                    
                    {hasPermission('org:update') ? (
                      <OrganizationInfoEditor 
                        orgData={orgData} 
                        onUpdate={loadOrganizationData} 
                      />
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Organization Name</label>
                          <p className="mt-1 text-sm text-gray-900">{orgData?.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Description</label>
                          <p className="mt-1 text-sm text-gray-900">{orgData?.description || 'No description provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Industry</label>
                          <p className="mt-1 text-sm text-gray-900">{orgData?.industry || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Website</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {orgData?.website ? (
                              <a href={orgData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                                {orgData.website}
                              </a>
                            ) : (
                              'Not specified'
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy & Security Settings */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Privacy & Security</h3>
                    
                    {hasPermission('org:update') ? (
                      <OrganizationPrivacySettings 
                        orgData={orgData} 
                        onUpdate={loadOrganizationData} 
                      />
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-base font-medium text-gray-900">Public Reports</label>
                              <p className="text-sm text-gray-500">Allow public access to organization reports</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              orgData?.settings?.allowPublicReports ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {orgData?.settings?.allowPublicReports ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Notification Preferences</h3>
                    
                    {hasPermission('org:update') ? (
                      <NotificationSettings 
                        orgData={orgData} 
                        onUpdate={loadOrganizationData} 
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">New Members</label>
                            <p className="text-xs text-gray-500">Notify when new members join</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            orgData?.settings?.notificationPreferences?.newMembers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {orgData?.settings?.notificationPreferences?.newMembers ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Report Updates</label>
                            <p className="text-xs text-gray-500">Notify when reports are updated</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            orgData?.settings?.notificationPreferences?.reportUpdates ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {orgData?.settings?.notificationPreferences?.reportUpdates ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">System Announcements</label>
                            <p className="text-xs text-gray-500">Notify about platform updates</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            orgData?.settings?.notificationPreferences?.systemAnnouncements ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {orgData?.settings?.notificationPreferences?.systemAnnouncements ? 'On' : 'Off'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danger Zone */}
                {hasPermission('org:delete') && (
                  <div className="bg-white shadow rounded-lg border-l-4 border-red-400">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-red-800 mb-4">⚠️ Danger Zone</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Deactivate Organization</h4>
                          <p className="text-sm text-gray-500 mb-3">
                            Temporarily disable access to the organization. Members will not be able to access data, but nothing will be deleted.
                          </p>
                          <button className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50">
                            Deactivate Organization
                          </button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900">Delete Organization</h4>
                          <p className="text-sm text-gray-500 mb-3">
                            Permanently delete this organization and all its data. This action cannot be undone.
                          </p>
                          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                            Delete Organization
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-xl mb-2">🔒</div>
                    <p className="text-gray-500">You don't have permission to view organization settings</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Management Modal */}
      {showMemberManagement && organization && (
        <MemberManagement
          organizationId={organization.id}
          onClose={() => setShowMemberManagement(false)}
          onMemberUpdated={loadOrganizationData}
        />
      )}
    </div>
  );
};

// Sub-components for organization settings

interface OrganizationInfoEditorProps {
  orgData: OrganizationData | null;
  onUpdate: () => void;
}

const OrganizationInfoEditor: React.FC<OrganizationInfoEditorProps> = ({ orgData, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: orgData?.name || '',
    description: orgData?.description || '',
    industry: orgData?.industry || '',
    website: orgData?.website || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgData) return;

    setLoading(true);
    try {
      const response = await apiClient.updateOrganization(orgData.id, formData);
      if (response.success) {
        setEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update organization:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Edit
          </button>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Organization Name</label>
          <p className="mt-1 text-sm text-gray-900">{orgData?.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <p className="mt-1 text-sm text-gray-900">{orgData?.description || 'No description provided'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Industry</label>
          <p className="mt-1 text-sm text-gray-900">{orgData?.industry || 'Not specified'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Website</label>
          <p className="mt-1 text-sm text-gray-900">
            {orgData?.website ? (
              <a href={orgData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                {orgData.website}
              </a>
            ) : (
              'Not specified'
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Organization Name
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
          Industry
        </label>
        <input
          type="text"
          id="industry"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website
        </label>
        <input
          type="url"
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

interface OrganizationPrivacySettingsProps {
  orgData: OrganizationData | null;
  onUpdate: () => void;
}

const OrganizationPrivacySettings: React.FC<OrganizationPrivacySettingsProps> = ({ orgData, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [allowPublicReports, setAllowPublicReports] = useState(orgData?.settings?.allowPublicReports || false);

  const handleTogglePublicReports = async () => {
    if (!orgData) return;

    setLoading(true);
    try {
      const response = await apiClient.updateOrganizationSettings(orgData.id, {
        allowPublicReports: !allowPublicReports
      });
      if (response.success) {
        setAllowPublicReports(!allowPublicReports);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-base font-medium text-gray-900">Public Reports</label>
            <p className="text-sm text-gray-500">Allow public access to organization reports</p>
          </div>
          <button
            onClick={handleTogglePublicReports}
            disabled={loading}
            className={`${
              allowPublicReports ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
          >
            <span
              className={`${
                allowPublicReports ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationSettingsProps {
  orgData: OrganizationData | null;
  onUpdate: () => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ orgData, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    newMembers: orgData?.settings?.notificationPreferences?.newMembers || false,
    reportUpdates: orgData?.settings?.notificationPreferences?.reportUpdates || false,
    systemAnnouncements: orgData?.settings?.notificationPreferences?.systemAnnouncements || false
  });

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    if (!orgData) return;

    setLoading(true);
    try {
      const newNotifications = { ...notifications, [key]: !notifications[key] };
      const response = await apiClient.updateOrganizationSettings(orgData.id, {
        notificationPreferences: newNotifications
      });
      if (response.success) {
        setNotifications(newNotifications);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const notificationItems = [
    {
      key: 'newMembers' as const,
      label: 'New Members',
      description: 'Notify when new members join'
    },
    {
      key: 'reportUpdates' as const,
      label: 'Report Updates',
      description: 'Notify when reports are updated'
    },
    {
      key: 'systemAnnouncements' as const,
      label: 'System Announcements',
      description: 'Notify about platform updates'
    }
  ];

  return (
    <div className="space-y-4">
      {notificationItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">{item.label}</label>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
          <button
            onClick={() => handleToggleNotification(item.key)}
            disabled={loading}
            className={`${
              notifications[item.key] ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
          >
            <span
              className={`${
                notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>
      ))}
    </div>
  );
};