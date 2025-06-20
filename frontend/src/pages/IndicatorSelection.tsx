/**
 * Indicator Selection Page
 * Demonstrates pitfall prevention during indicator selection process
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Check, 
  AlertTriangle,
  Info,
  BarChart3,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import PitfallWarningSystem from '../modules/indicators/components/PitfallWarningSystem';
import { apiClient } from '../shared/services/apiClient';

// Types
interface IrisIndicator {
  id: string;
  name: string;
  description: string;
  category: string;
  theme: string;
  type: 'output' | 'outcome' | 'impact';
  unit: string;
  tags: string[];
}

interface RealTimeWarning {
  id: string;
  type: 'activity_vs_impact' | 'proxy_metric' | 'over_engineering' | 'portfolio_imbalance' | 'foundation_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  explanation: string;
  recommendations: string[];
  actionRequired: boolean;
  dismissible: boolean;
  metadata: Record<string, any>;
}

// Mock data for demonstration
const mockIndicators: IrisIndicator[] = [
  {
    id: '1',
    name: 'Number of training sessions delivered',
    description: 'Count of educational or capacity-building sessions provided to beneficiaries',
    category: 'Employment',
    theme: 'Workforce Development',
    type: 'output',
    unit: 'Count',
    tags: ['training', 'capacity building', 'education']
  },
  {
    id: '2',
    name: 'Number of individuals trained',
    description: 'Total count of unique individuals who completed training programs',
    category: 'Employment',
    theme: 'Workforce Development',
    type: 'output',
    unit: 'Count',
    tags: ['participants', 'training', 'completion']
  },
  {
    id: '3',
    name: 'Percentage of trainees demonstrating improved skills',
    description: 'Proportion of participants showing measurable skill improvement after training',
    category: 'Employment',
    theme: 'Workforce Development',
    type: 'outcome',
    unit: 'Percentage',
    tags: ['skills', 'improvement', 'assessment']
  },
  {
    id: '4',
    name: 'Employment rate of program graduates',
    description: 'Percentage of training completers who gain employment within 6 months',
    category: 'Employment',
    theme: 'Workforce Development',
    type: 'outcome',
    unit: 'Percentage',
    tags: ['employment', 'job placement', 'success rate']
  },
  {
    id: '5',
    name: 'Average income increase of employed graduates',
    description: 'Mean change in income for graduates who gained employment',
    category: 'Employment',
    theme: 'Economic Empowerment',
    type: 'outcome',
    unit: 'Currency',
    tags: ['income', 'economic impact', 'wages']
  }
];

// Component
export const IndicatorSelection: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<IrisIndicator[]>([]);
  const [warnings, setWarnings] = useState<RealTimeWarning[]>([]);
  const [shouldBlock, setShouldBlock] = useState(false);
  const [allowContinue, setAllowContinue] = useState(true);
  const [contextualGuidance, setContextualGuidance] = useState<string>('');
  const [isLoadingWarnings, setIsLoadingWarnings] = useState(false);

  // Filter indicators based on search
  const filteredIndicators = mockIndicators.filter(indicator =>
    indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    indicator.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle indicator selection
  const handleIndicatorToggle = (indicator: IrisIndicator) => {
    let newSelection;
    if (selectedIndicators.find(i => i.id === indicator.id)) {
      newSelection = selectedIndicators.filter(i => i.id !== indicator.id);
    } else {
      newSelection = [...selectedIndicators, indicator];
    }
    
    setSelectedIndicators(newSelection);
    
    // Generate warnings for new selection
    if (newSelection.length > 0) {
      generateWarnings(newSelection);
    } else {
      setWarnings([]);
    }
  };

  // Generate real-time warnings
  const generateWarnings = async (indicators: IrisIndicator[]) => {
    setIsLoadingWarnings(true);
    
    try {
      const result = await apiClient.getWarningPreview('indicator_selection', {
        currentStep: 'indicator_selection',
        indicators,
        foundationLevel: 'basic'
      });

      setWarnings(result.data.warnings || []);
      setShouldBlock(result.data.shouldBlock || false);
      setAllowContinue(result.data.allowContinue !== false);
      setContextualGuidance(result.data.contextualGuidance || '');
    } catch (error) {
      console.warn('Warning API not available, using mock warnings:', error);
      // Generate mock warnings for demonstration
      generateMockWarnings(indicators);
    } finally {
      setIsLoadingWarnings(false);
    }
  };

  // Generate mock warnings for demonstration
  const generateMockWarnings = (indicators: IrisIndicator[]) => {
    const mockWarnings: RealTimeWarning[] = [];
    
    // Check for activity vs impact issues
    const outputCount = indicators.filter(i => i.type === 'output').length;
    const outcomeCount = indicators.filter(i => i.type === 'outcome').length;
    
    if (outputCount > 0 && outcomeCount === 0) {
      mockWarnings.push({
        id: 'activity-warning-1',
        type: 'activity_vs_impact',
        severity: 'high',
        title: 'Activity vs Impact Warning',
        message: 'Your selection focuses on outputs (what you do) rather than outcomes (what changes)',
        explanation: 'Output indicators like "number of training sessions" measure your activities but don\'t tell you if you\'re making a difference. Outcome indicators measure changes in your beneficiaries\' knowledge, skills, or circumstances.',
        recommendations: [
          'Add outcome indicators that measure changes in participant knowledge or skills',
          'Consider indicators that track behavior change or improved circumstances',
          'Ask: "What changes in people\'s lives because of our training?"'
        ],
        actionRequired: false,
        dismissible: true,
        metadata: {
          suggestedOutcomes: [
            {
              name: 'Percentage of trainees demonstrating improved skills',
              reasoning: 'Measures actual learning rather than just participation'
            },
            {
              name: 'Employment rate of program graduates',
              reasoning: 'Tracks the ultimate goal of your training programs'
            }
          ]
        }
      });
    }
    
    if (outputCount > outcomeCount * 2 && outcomeCount > 0) {
      mockWarnings.push({
        id: 'portfolio-balance-1',
        type: 'portfolio_imbalance',
        severity: 'medium',
        title: 'Portfolio Imbalance',
        message: 'Your indicator portfolio is heavily weighted toward outputs',
        explanation: `${Math.round((outputCount / indicators.length) * 100)}% of your indicators measure outputs. A balanced portfolio typically includes more outcome indicators to demonstrate impact.`,
        recommendations: [
          'Add more outcome indicators to balance your portfolio',
          'Consider long-term outcome indicators',
          'Include qualitative measures alongside quantitative ones'
        ],
        actionRequired: false,
        dismissible: true,
        metadata: {
          outputPercentage: Math.round((outputCount / indicators.length) * 100),
          outcomePercentage: Math.round((outcomeCount / indicators.length) * 100)
        }
      });
    }
    
    if (indicators.length > 5) {
      mockWarnings.push({
        id: 'over-engineering-1',
        type: 'over_engineering',
        severity: 'medium',
        title: 'Over-Engineering Warning',
        message: `${indicators.length} indicators may be too many for effective measurement`,
        explanation: 'Having too many indicators can lead to measurement burden, reduced data quality, and difficulty focusing on what matters most. Consider which indicators are truly essential for your decisions.',
        recommendations: [
          'Prioritize indicators that directly inform key decisions',
          'Consider consolidating similar indicators',
          'Start with 3-5 core indicators and expand gradually',
          'Ask: "What would happen if we didn\'t measure this?"'
        ],
        actionRequired: false,
        dismissible: true,
        metadata: {
          indicatorCount: indicators.length,
          recommendedMax: 5
        }
      });
    }
    
    setWarnings(mockWarnings);
    setShouldBlock(false);
    setAllowContinue(true);
    
    if (mockWarnings.length > 0) {
      setContextualGuidance('Several measurement pitfalls detected. Review the warnings below to improve your indicator selection.');
    } else {
      setContextualGuidance('Your measurement approach looks good! Continue with your indicator selection.');
    }
  };

  // Handle warning actions
  const handleWarningAction = async (warningId: string, action: 'dismissed' | 'acted_upon' | 'ignored') => {
    try {
      await apiClient.recordWarningInteraction(warningId, action);
      console.log(`Warning ${warningId} ${action}`);
    } catch (error) {
      console.warn('Warning interaction tracking failed:', error);
      // Still log locally for demo purposes
      console.log(`Warning ${warningId} ${action} (offline)`);
    }
  };

  // Get indicator type styling
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'output':
        return {
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200',
          icon: <Activity className="w-4 h-4" />
        };
      case 'outcome':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: <Target className="w-4 h-4" />
        };
      case 'impact':
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: <TrendingUp className="w-4 h-4" />
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: <BarChart3 className="w-4 h-4" />
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Indicator Selection
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover and select IRIS+ indicators with real-time pitfall prevention. 
          Our AI will warn you about measurement mistakes before they happen.
        </p>
      </div>

      {/* Search and filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search indicators by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Selected indicators summary */}
        {selectedIndicators.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">
                  {selectedIndicators.length} Indicators Selected
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedIndicators.filter(i => i.type === 'output').length} outputs, {' '}
                  {selectedIndicators.filter(i => i.type === 'outcome').length} outcomes, {' '}
                  {selectedIndicators.filter(i => i.type === 'impact').length} impacts
                </p>
              </div>
              {isLoadingWarnings && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-blue-700">Analyzing selection...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pitfall warning system */}
      {selectedIndicators.length > 0 && (
        <PitfallWarningSystem
          warnings={warnings}
          shouldBlock={shouldBlock}
          allowContinue={allowContinue}
          contextualGuidance={contextualGuidance}
          onWarningAction={handleWarningAction}
          onContinue={() => navigate('/measurement-planning')}
        />
      )}

      {/* Indicator grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Available Indicators
        </h2>
        
        <div className="grid gap-4">
          {filteredIndicators.map((indicator) => {
            const isSelected = selectedIndicators.find(i => i.id === indicator.id);
            const typeStyle = getTypeStyle(indicator.type);
            
            return (
              <div
                key={indicator.id}
                onClick={() => handleIndicatorToggle(indicator)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {indicator.name}
                      </h3>
                      
                      <div className={`ml-3 px-2 py-1 rounded-full border text-xs font-medium flex items-center ${typeStyle.bgColor} ${typeStyle.textColor} ${typeStyle.borderColor}`}>
                        {typeStyle.icon}
                        <span className="ml-1 capitalize">{indicator.type}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">
                      {indicator.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Category: {indicator.category}</span>
                      <span>Theme: {indicator.theme}</span>
                      <span>Unit: {indicator.unit}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {indicator.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {isSelected ? (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredIndicators.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No indicators found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find relevant indicators.
            </p>
          </div>
        )}
      </div>

      {/* Next steps */}
      {selectedIndicators.length > 0 && allowContinue && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Ready to Continue?
              </h3>
              <p className="text-gray-600">
                Review your selection and proceed to measurement planning.
              </p>
            </div>
            <button 
              onClick={() => navigate('/measurement-planning')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Proceed to Planning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorSelection;