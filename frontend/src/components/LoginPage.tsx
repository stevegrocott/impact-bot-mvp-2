import React, { useState, useEffect } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@impact-bot.com');
  const [password, setPassword] = useState('AdminTest123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/foundation');
    }
  }, [isAuthenticated, navigate]);

  const testUsers = [
    { email: 'admin@impact-bot.com', password: 'AdminTest123!', role: 'Super Admin', org: 'Impact Bot Platform', description: 'Full system access' },
    { email: 'orgadmin@demo.org', password: 'OrgAdmin123!', role: 'Org Admin', org: 'Demo Foundation', description: 'Organization management' },
    { email: 'manager@demo.org', password: 'Manager123!', role: 'Impact Manager', org: 'Demo Foundation', description: 'Measurement & reporting' },
    { email: 'analyst@demo.org', password: 'Analyst123!', role: 'Impact Analyst', org: 'Demo Foundation', description: 'Create & edit measurements' },
    { email: 'viewer@demo.org', password: 'Viewer123!', role: 'Report Viewer', org: 'Demo Foundation', description: 'Read-only access' },
    { email: 'evaluator@external.com', password: 'Evaluator123!', role: 'External Evaluator', org: 'Independent Evaluation', description: 'Limited external access' }
  ];

  const handleTestUserClick = (testUser: typeof testUsers[0]) => {
    setEmail(testUser.email);
    setPassword(testUser.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/foundation');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Impact Bot v2
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Pitfall Prevention & Measurement Excellence
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-3">🧪 Development Test Users</h3>
            <p className="text-xs text-blue-600 mb-3">Click any user below to auto-fill login form:</p>
            
            <div className="space-y-2">
              {testUsers.map((user, index) => (
                <div 
                  key={index}
                  onClick={() => handleTestUserClick(user)}
                  className="cursor-pointer p-3 bg-white rounded border border-blue-200 hover:border-blue-300 hover:bg-blue-25 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{user.role}</p>
                      <p className="text-xs text-gray-600">{user.org}</p>
                      <p className="text-xs text-blue-700 mt-1">{user.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
              <p className="text-xs text-amber-700">
                💡 <strong>Current:</strong> {email} ({testUsers.find(u => u.email === email)?.role || 'Custom'})
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};