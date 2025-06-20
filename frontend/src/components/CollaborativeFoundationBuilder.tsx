/**
 * Collaborative Foundation Builder
 * Real-time collaborative foundation building with role-based guidance
 * Context: Support teams working together on impact measurement foundations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  UserPlus,
  ArrowRight,
  Edit3,
  Calendar,
  Target
} from 'lucide-react';
import { logger } from '../utils/logger';
// import { apiClient } from '../shared/services/apiClient'; // TODO: Add collaboration endpoints

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'me_professional' | 'program_manager' | 'stakeholder';
  status: 'active' | 'pending' | 'offline';
  lastActive: string;
  contributions: number;
}

interface FoundationSession {
  id: string;
  name: string;
  status: 'planning' | 'building' | 'review' | 'complete';
  progress: number;
  currentFocus: string;
  nextMilestone: string;
  activeMembers: string[];
  createdAt: string;
  estimatedCompletion: string;
}

interface CollaborationActivity {
  id: string;
  type: 'comment' | 'edit' | 'approval' | 'suggestion';
  member: TeamMember;
  content: string;
  timestamp: string;
  section: string;
}

interface CollaborativeFoundationBuilderProps {
  sessionId?: string;
  onCreateSession?: () => void;
  mode: 'facilitator' | 'participant' | 'observer';
}

const CollaborativeFoundationBuilder: React.FC<CollaborativeFoundationBuilderProps> = ({
  sessionId,
  onCreateSession,
  mode = 'participant'
}) => {
  const [session, setSession] = useState<FoundationSession | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  const loadCollaborationSession = useCallback(async () => {
    try {
      setLoading(true);
      
      // Note: Collaboration API endpoints are not yet implemented in apiClient
      // These would need to be added to the apiClient first
      // For now, showing structure but these calls will fail
      
      // TODO: Add collaboration endpoints to apiClient
      // const sessionData = await apiClient.getCollaborationSession(sessionId!);
      // setSession(sessionData.data);
      
      // const membersData = await apiClient.getCollaborationMembers(sessionId!);
      // setTeamMembers(membersData.data);
      
      // const activitiesData = await apiClient.getCollaborationActivities(sessionId!);
      // setActivities(activitiesData.data);
      
      // Placeholder data for now
      setSession({
        id: sessionId || 'placeholder',
        name: 'Foundation Building Session',
        status: 'building',
        progress: 35,
        currentFocus: 'Theory of Change',
        nextMilestone: 'Complete impact logic',
        activeMembers: ['user1', 'user2'],
        createdAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      setTeamMembers([
        {
          id: 'user1',
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'founder',
          status: 'active',
          lastActive: new Date().toISOString(),
          contributions: 5
        }
      ]);
      
      setActivities([]);

    } catch (error) {
      logger.error('Error loading collaboration session:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadCollaborationSession();
    }
  }, [sessionId, loadCollaborationSession]);

  const addComment = async () => {
    if (!newComment.trim() || !sessionId) return;

    try {
      // TODO: Add collaboration comment endpoint to apiClient
      // await apiClient.addCollaborationComment(sessionId, {
      //   content: newComment,
      //   section: session?.currentFocus || 'general'
      // });
      
      // For now, just clear the comment and simulate success
      setNewComment('');
      logger.info('Comment added (simulated)');
      // loadCollaborationSession(); // Refresh activities
    } catch (error) {
      logger.error('Error adding comment:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'founder': return '👑';
      case 'me_professional': return '📊';
      case 'program_manager': return '📋';
      case 'stakeholder': return '🎯';
      default: return '👤';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'building': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Collaborative Foundation Building
          </h3>
          <p className="text-gray-600 mb-6">
            Work together with your team to build a comprehensive impact measurement foundation.
          </p>
          <button
            onClick={onCreateSession}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Collaboration Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{session.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session?.status || 'planning')}`}>
                {session?.status?.charAt(0)?.toUpperCase() + session?.status?.slice(1)}
              </span>
              <span className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                {session.progress}% complete
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Est. completion: {session.estimatedCompletion}
              </span>
            </div>
          </div>
          {mode === 'facilitator' && (
            <button
              onClick={() => {
                // Implement proper invite modal functionality
                logger.warn('Invite functionality not yet implemented');
              }}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${session.progress}%` }}
          />
        </div>

        {/* Current Focus */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Current Focus</h4>
          <p className="text-blue-800 mb-2">{session.currentFocus}</p>
          <div className="text-sm text-blue-700">
            <strong>Next milestone:</strong> {session.nextMilestone}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Team Members</h4>
            <span className="text-sm text-gray-600">{teamMembers.length} members</span>
          </div>

          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                      {getRoleIcon(member.role)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      member.status === 'active' ? 'bg-green-500' :
                      member.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{member.name}</div>
                    <div className="text-xs text-gray-600 capitalize">{member?.role?.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(member.status)}`}>
                    {member.status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {member.contributions} contributions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Recent Activity</h4>
            <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {activities?.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {getRoleIcon(activity?.member?.role || 'stakeholder')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{activity?.member?.name}</span>
                    <span className="text-xs text-gray-500">{activity?.timestamp}</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                      {activity.section}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{activity?.content}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    {activity.type === 'comment' && <MessageSquare className="w-3 h-3 text-gray-400" />}
                    {activity.type === 'edit' && <Edit3 className="w-3 h-3 text-gray-400" />}
                    {activity.type === 'approval' && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {activity.type === 'suggestion' && <Clock className="w-3 h-3 text-yellow-500" />}
                    <span className="text-xs text-gray-500 capitalize">{activity?.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          {mode !== 'observer' && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                  👤
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e?.target?.value || '')}
                    placeholder="Add a comment about the current focus area..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Comment will be added to: {session.currentFocus}
                    </span>
                    <button
                      onClick={addComment}
                      disabled={!newComment.trim()}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        newComment.trim()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Add Comment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeFoundationBuilder;