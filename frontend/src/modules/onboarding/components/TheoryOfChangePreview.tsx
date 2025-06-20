/**
 * Theory of Change Preview Component
 * Visual display of captured theory of change structure
 */

import React from 'react';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Target, 
  TrendingUp, 
  Sparkles,
  HelpCircle,
  ExternalLink,
  Edit
} from 'lucide-react';

interface TheoryOfChangeStructure {
  targetPopulation?: string;
  problemDefinition?: string;
  activities?: string[];
  outputs?: string[];
  shortTermOutcomes?: string[];
  longTermOutcomes?: string[];
  impacts?: string[];
  assumptions?: string[];
  externalFactors?: string[];
  interventionType?: string;
  sector?: string;
  geographicScope?: string;
}

interface TheoryOfChangePreviewProps {
  theoryData: Partial<TheoryOfChangeStructure>;
  isEditable?: boolean;
  onEdit?: (field: string) => void;
}

export const TheoryOfChangePreview: React.FC<TheoryOfChangePreviewProps> = ({
  theoryData,
  isEditable = false,
  onEdit
}) => {
  // Define the sections with their metadata
  const sections = [
    {
      key: 'targetPopulation',
      title: 'Target Population',
      icon: <Users className="w-5 h-5" />,
      description: 'Who you serve',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      key: 'problemDefinition',
      title: 'Problem Definition',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'The challenge you address',
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600'
    },
    {
      key: 'activities',
      title: 'Activities',
      icon: <Activity className="w-5 h-5" />,
      description: 'What you do',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      isList: true
    },
    {
      key: 'outputs',
      title: 'Outputs',
      icon: <FileText className="w-5 h-5" />,
      description: 'What you produce',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-600',
      isList: true
    },
    {
      key: 'shortTermOutcomes',
      title: 'Short-term Outcomes',
      icon: <Target className="w-5 h-5" />,
      description: 'Early changes (3-12 months)',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      isList: true
    },
    {
      key: 'longTermOutcomes',
      title: 'Long-term Outcomes',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Sustained changes (1-3 years)',
      color: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-600',
      isList: true
    },
    {
      key: 'impacts',
      title: 'Impacts',
      icon: <Sparkles className="w-5 h-5" />,
      description: 'Ultimate system-level changes',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600',
      isList: true
    },
    {
      key: 'assumptions',
      title: 'Key Assumptions',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'What must be true for success',
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600',
      isList: true
    },
    {
      key: 'externalFactors',
      title: 'External Factors',
      icon: <ExternalLink className="w-5 h-5" />,
      description: 'Conditions beyond your control',
      color: 'bg-slate-50 border-slate-200',
      iconColor: 'text-slate-600',
      isList: true
    }
  ];

  // Helper to render content based on type
  const renderContent = (section: any) => {
    const data = theoryData[section.key as keyof TheoryOfChangeStructure];
    
    if (!data) {
      return (
        <p className="text-gray-400 italic">
          Not specified yet
        </p>
      );
    }

    if (section.isList && Array.isArray(data)) {
      if (data.length === 0) {
        return (
          <p className="text-gray-400 italic">
            No items added yet
          </p>
        );
      }
      
      return (
        <ul className="space-y-2">
          {data.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span className="text-gray-700">
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    // Handle case where data might be an object instead of a string
    if (typeof data === 'object' && data !== null) {
      // If it's an object with main/details or similar structure, render appropriately
      if ('main' in data && 'details' in data) {
        return (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">{(data as any).main}</p>
            <p className="text-gray-600 text-sm">{(data as any).details}</p>
          </div>
        );
      }

      // Handle main/specifics structure (AI extracted data format)
      if ('main' in data && 'specifics' in data) {
        const specifics = (data as any).specifics;
        return (
          <div className="space-y-3">
            <p className="text-gray-700 font-medium leading-relaxed">{(data as any).main}</p>
            {Array.isArray(specifics) && specifics.length > 0 && (
              <div className="ml-4">
                <ul className="space-y-1">
                  {specifics.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2 mt-1">•</span>
                      <span className="text-gray-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      // Handle direct outputs format
      if ('direct' in data) {
        const directItems = (data as any).direct;
        return (
          <div className="space-y-2">
            {Array.isArray(directItems) && directItems.length > 0 && (
              <ul className="space-y-2">
                {directItems.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      }
      
      if ('primary' in data && 'secondary' in data) {
        return (
          <div className="space-y-2">
            <p className="text-gray-700 font-medium">{(data as any).primary}</p>
            <p className="text-gray-600 text-sm">{(data as any).secondary}</p>
          </div>
        );
      }
      
      // For any other object, convert to JSON string as fallback
      return (
        <p className="text-gray-700 leading-relaxed">
          {JSON.stringify(data)}
        </p>
      );
    }

    return (
      <p className="text-gray-700 leading-relaxed">
        {String(data)}
      </p>
    );
  };

  // Calculate completeness
  const completeness = sections.reduce((acc, section) => {
    const data = theoryData[section.key as keyof TheoryOfChangeStructure];
    if (data && (typeof data === 'string' ? data.trim() : data.length > 0)) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const completenessPercentage = Math.round((completeness / sections.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header with completeness */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Theory of Change
          </h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              {completeness} of {sections.length} sections
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Context information */}
        {(theoryData.sector || theoryData.interventionType || theoryData.geographicScope) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {theoryData.sector && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sector</span>
                <p className="text-sm text-gray-900 mt-1">{theoryData.sector}</p>
              </div>
            )}
            {theoryData.interventionType && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</span>
                <p className="text-sm text-gray-900 mt-1">{theoryData.interventionType}</p>
              </div>
            )}
            {theoryData.geographicScope && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Geography</span>
                <p className="text-sm text-gray-900 mt-1">{theoryData.geographicScope}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theory sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div 
            key={section.key}
            className={`border rounded-lg p-6 ${section.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`${section.iconColor} mr-3`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {section.description}
                  </p>
                </div>
              </div>
              
              {isEditable && onEdit && (
                <button
                  onClick={() => onEdit(section.key)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white/50"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="mt-4">
              {renderContent(section)}
            </div>
          </div>
        ))}
      </div>

      {/* Logic flow visualization (simplified) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Impact Logic Flow
        </h3>
        
        <div className="flex items-center justify-center space-x-4 overflow-x-auto">
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">Activities</p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-8 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">Outputs</p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-8 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">Short-term</p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-8 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">Long-term</p>
          </div>
          
          <div className="flex-shrink-0">
            <div className="w-8 h-0.5 bg-gray-300"></div>
          </div>
          
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-xs font-medium text-gray-700">Impact</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 text-center mt-4">
          Your activities lead to outputs, which create outcomes, ultimately achieving impact
        </p>
      </div>
    </div>
  );
};

export default TheoryOfChangePreview;