import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, TrendingDown, Award, Target, Users, Filter, Download, Share2, Eye, EyeOff } from 'lucide-react';

interface PeerData {
  id: string;
  organizationName: string;
  sector: string;
  region: string;
  size: 'small' | 'medium' | 'large';
  foundationMaturity: number;
  impactScore: number;
  indicators: {
    [key: string]: {
      value: number;
      target: number;
      progress: number;
    };
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  isAnonymized: boolean;
}

interface BenchmarkCategory {
  id: string;
  name: string;
  weight: number;
  subcategories: {
    id: string;
    name: string;
    description: string;
    benchmark: number;
    userValue: number;
    peerAverage: number;
    topPerformer: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

const PeerBenchmarkingDashboard: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'comparison' | 'performance' | 'insights'>('comparison');
  const [anonymizeData, setAnonymizeData] = useState(true);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkCategory[]>([]);
  const [peerData, setPeerData] = useState<PeerData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['impactScore', 'foundationMaturity']);

  // Mock data for demonstration
  useEffect(() => {
    const mockBenchmarkData: BenchmarkCategory[] = [
      {
        id: 'foundation',
        name: 'Foundation Strength',
        weight: 0.3,
        subcategories: [
          {
            id: 'governance',
            name: 'Governance Structure',
            description: 'Quality and maturity of organizational governance',
            benchmark: 85,
            userValue: 72,
            peerAverage: 78,
            topPerformer: 94,
            trend: 'up'
          },
          {
            id: 'strategy',
            name: 'Impact Strategy',
            description: 'Clarity and alignment of impact strategy',
            benchmark: 80,
            userValue: 88,
            peerAverage: 75,
            topPerformer: 96,
            trend: 'up'
          },
          {
            id: 'stakeholder',
            name: 'Stakeholder Engagement',
            description: 'Quality of stakeholder relationship management',
            benchmark: 75,
            userValue: 65,
            peerAverage: 72,
            topPerformer: 89,
            trend: 'stable'
          }
        ]
      },
      {
        id: 'measurement',
        name: 'Measurement & Reporting',
        weight: 0.25,
        subcategories: [
          {
            id: 'data_quality',
            name: 'Data Quality',
            description: 'Accuracy and reliability of impact data',
            benchmark: 85,
            userValue: 78,
            peerAverage: 73,
            topPerformer: 92,
            trend: 'up'
          },
          {
            id: 'reporting',
            name: 'Reporting Standards',
            description: 'Adherence to recognized reporting frameworks',
            benchmark: 80,
            userValue: 85,
            peerAverage: 76,
            topPerformer: 94,
            trend: 'stable'
          }
        ]
      },
      {
        id: 'impact',
        name: 'Impact Achievement',
        weight: 0.35,
        subcategories: [
          {
            id: 'outcomes',
            name: 'Outcome Achievement',
            description: 'Progress toward intended outcomes',
            benchmark: 75,
            userValue: 82,
            peerAverage: 71,
            topPerformer: 88,
            trend: 'up'
          },
          {
            id: 'innovation',
            name: 'Innovation Index',
            description: 'Novel approaches and adaptive practices',
            benchmark: 70,
            userValue: 76,
            peerAverage: 68,
            topPerformer: 85,
            trend: 'up'
          }
        ]
      },
      {
        id: 'sustainability',
        name: 'Sustainability & Growth',
        weight: 0.1,
        subcategories: [
          {
            id: 'financial',
            name: 'Financial Sustainability',
            description: 'Long-term financial viability',
            benchmark: 75,
            userValue: 69,
            peerAverage: 74,
            topPerformer: 87,
            trend: 'down'
          }
        ]
      }
    ];

    const mockPeerData: PeerData[] = [
      {
        id: 'peer1',
        organizationName: 'Healthcare Initiative Alpha',
        sector: 'Healthcare',
        region: 'North America',
        size: 'medium',
        foundationMaturity: 78,
        impactScore: 85,
        indicators: {
          'lives_improved': { value: 15000, target: 12000, progress: 125 },
          'programs_launched': { value: 8, target: 10, progress: 80 },
          'partnerships': { value: 25, target: 20, progress: 125 }
        },
        insights: {
          strengths: ['Strong outcome measurement', 'Excellent stakeholder engagement'],
          improvements: ['Data collection efficiency', 'Resource allocation'],
          recommendations: ['Implement automated data systems', 'Diversify funding sources']
        },
        isAnonymized: true
      },
      {
        id: 'peer2',
        organizationName: 'Education Foundation Beta',
        sector: 'Education',
        region: 'Europe',
        size: 'large',
        foundationMaturity: 92,
        impactScore: 91,
        indicators: {
          'students_reached': { value: 50000, target: 45000, progress: 111 },
          'schools_supported': { value: 120, target: 100, progress: 120 },
          'teacher_training': { value: 800, target: 750, progress: 107 }
        },
        insights: {
          strengths: ['Comprehensive measurement framework', 'Innovation in delivery'],
          improvements: ['Cost efficiency', 'Scalability planning'],
          recommendations: ['Optimize operational costs', 'Develop scaling strategy']
        },
        isAnonymized: true
      }
    ];

    setBenchmarkData(mockBenchmarkData);
    setPeerData(mockPeerData);
  }, []);

  const filteredPeerData = peerData.filter(peer => {
    return (selectedSector === 'all' || peer.sector === selectedSector) &&
           (selectedRegion === 'all' || peer.region === selectedRegion) &&
           (selectedSize === 'all' || peer.size === selectedSize);
  });

  const getPerformanceColor = (value: number, benchmark: number) => {
    if (value >= benchmark * 1.1) return '#22c55e'; // Green
    if (value >= benchmark * 0.9) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const renderComparisonView = () => (
    <div className="space-y-6">
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {benchmarkData.map(category => {
          const userAvg = category.subcategories.reduce((sum, sub) => sum + sub.userValue, 0) / category.subcategories.length;
          const peerAvg = category.subcategories.reduce((sum, sub) => sum + sub.peerAverage, 0) / category.subcategories.length;
          const trend = userAvg > peerAvg ? 'up' : userAvg < peerAvg ? 'down' : 'stable';
          
          return (
            <div key={category.id} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm text-gray-700">{category.name}</h3>
                {trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> : 
                 trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> : 
                 <div className="h-4 w-4 bg-gray-400 rounded-full"></div>}
              </div>
              <div className="text-2xl font-bold" style={{ color: getPerformanceColor(userAvg, peerAvg) }}>
                {userAvg.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">
                Peer Avg: {peerAvg.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Benchmark Comparison */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Detailed Performance Comparison</h3>
        <div className="space-y-4">
          {benchmarkData.map(category => (
            <div key={category.id} className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-3">{category.name}</h4>
              <div className="grid gap-3">
                {category.subcategories.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{sub.name}</span>
                        <div className="flex space-x-4 text-xs">
                          <span className="font-medium" style={{ color: getPerformanceColor(sub.userValue, sub.benchmark) }}>
                            You: {sub.userValue}
                          </span>
                          <span className="text-gray-600">Peers: {sub.peerAverage}</span>
                          <span className="text-blue-600">Top: {sub.topPerformer}</span>
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full">
                        <div 
                          className="absolute h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${(sub.benchmark / 100) * 100}%` }}
                        ></div>
                        <div 
                          className="absolute h-2 rounded-full" 
                          style={{ 
                            width: `${(sub.userValue / 100) * 100}%`,
                            backgroundColor: getPerformanceColor(sub.userValue, sub.benchmark)
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPerformanceView = () => {
    const chartData = benchmarkData.flatMap(category =>
      category.subcategories.map(sub => ({
        name: sub.name,
        category: category.name,
        userValue: sub.userValue,
        peerAverage: sub.peerAverage,
        benchmark: sub.benchmark,
        topPerformer: sub.topPerformer
      }))
    );

    const radarData = benchmarkData.map(category => {
      const avgUser = category.subcategories.reduce((sum, sub) => sum + sub.userValue, 0) / category.subcategories.length;
      const avgPeer = category.subcategories.reduce((sum, sub) => sum + sub.peerAverage, 0) / category.subcategories.length;
      
      return {
        category: category.name,
        user: avgUser,
        peer: avgPeer,
        fullMark: 100
      };
    });

    return (
      <div className="space-y-6">
        {/* Performance Radar Chart */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Performance Radar</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Your Performance" dataKey="user" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Radar name="Peer Average" dataKey="peer" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Performance Chart */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Detailed Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="userValue" fill="#3b82f6" name="Your Performance" />
              <Bar dataKey="peerAverage" fill="#64748b" name="Peer Average" />
              <Bar dataKey="topPerformer" fill="#22c55e" name="Top Performer" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderInsightsView = () => (
    <div className="space-y-6">
      {/* AI-Generated Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <div className="flex items-center mb-4">
          <Award className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-800">AI Performance Insights</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border">
            <h4 className="font-medium text-green-700 mb-2">Your Strengths</h4>
            <ul className="text-sm space-y-1">
              <li>• Impact Strategy (88/80 benchmark)</li>
              <li>• Data Quality (78/85 - improving)</li>
              <li>• Outcome Achievement (82/75)</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-medium text-orange-700 mb-2">Improvement Areas</h4>
            <ul className="text-sm space-y-1">
              <li>• Governance Structure (72/85)</li>
              <li>• Stakeholder Engagement (65/75)</li>
              <li>• Financial Sustainability (69/75)</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded border">
            <h4 className="font-medium text-blue-700 mb-2">Priority Actions</h4>
            <ul className="text-sm space-y-1">
              <li>• Strengthen board oversight</li>
              <li>• Enhance stakeholder communication</li>
              <li>• Diversify funding sources</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Peer Learning Opportunities */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Learning from Peers</h3>
        <div className="space-y-4">
          {filteredPeerData.map(peer => (
            <div key={peer.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  {anonymizeData ? `${peer.sector} Organization ${peer.id.slice(-1)}` : peer.organizationName}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    Impact Score: {peer.impactScore}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    {peer.sector}
                  </span>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-green-700 mb-1">Strengths</h5>
                  <ul className="text-gray-600 space-y-1">
                    {peer.insights.strengths.map((strength, idx) => (
                      <li key={idx}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-orange-700 mb-1">Focus Areas</h5>
                  <ul className="text-gray-600 space-y-1">
                    {peer.insights.improvements.map((improvement, idx) => (
                      <li key={idx}>• {improvement}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-700 mb-1">Recommendations</h5>
                  <ul className="text-gray-600 space-y-1">
                    {peer.insights.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Peer Benchmarking Dashboard</h1>
        <p className="text-gray-600">Compare your impact performance with similar organizations and discover improvement opportunities.</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={selectedSector} 
                onChange={(e) => setSelectedSector(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Sectors</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Environment">Environment</option>
              </select>
            </div>
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Regions</option>
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia">Asia</option>
            </select>
            <select 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Sizes</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAnonymizeData(!anonymizeData)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {anonymizeData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{anonymizeData ? 'Show Names' : 'Anonymize'}</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-1 px-3 py-1 border rounded text-sm hover:bg-gray-50">
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'comparison', label: 'Comparison', icon: Target },
          { key: 'performance', label: 'Performance', icon: TrendingUp },
          { key: 'insights', label: 'Insights', icon: Award }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setViewMode(key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === key 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'comparison' && renderComparisonView()}
      {viewMode === 'performance' && renderPerformanceView()}
      {viewMode === 'insights' && renderInsightsView()}
    </div>
  );
};

export default PeerBenchmarkingDashboard;