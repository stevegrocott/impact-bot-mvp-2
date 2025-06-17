/**
 * Guided Step Input Component
 * Handles different input types for theory of change guided creation
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';

interface GuidedStepData {
  title: string;
  question: string;
  field: string;
  guidance: string;
}

interface GuidedStepInputProps {
  stepData: GuidedStepData;
  existingData?: any;
  onComplete: (data: any) => void;
}

export const GuidedStepInput: React.FC<GuidedStepInputProps> = ({
  stepData,
  existingData,
  onComplete
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [listItems, setListItems] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  // Initialize with existing data
  useEffect(() => {
    if (existingData) {
      if (Array.isArray(existingData)) {
        setListItems(existingData);
        setIsValid(existingData.length > 0);
      } else if (typeof existingData === 'string') {
        setInputValue(existingData);
        setIsValid(existingData.trim().length > 0);
      }
    }
  }, [existingData]);

  // Validate input
  useEffect(() => {
    if (isListField()) {
      setIsValid(listItems.length > 0);
    } else {
      setIsValid(inputValue.trim().length > 10); // Minimum meaningful length
    }
  }, [inputValue, listItems]);

  // Determine if this field expects a list
  const isListField = () => {
    return ['activities', 'outputs', 'shortTermOutcomes', 'longTermOutcomes', 'impacts', 'assumptions', 'externalFactors'].includes(stepData.field);
  };

  // Handle adding item to list
  const handleAddItem = () => {
    if (inputValue.trim() && !listItems.includes(inputValue.trim())) {
      setListItems(prev => [...prev, inputValue.trim()]);
      setInputValue('');
    }
  };

  // Handle removing item from list
  const handleRemoveItem = (index: number) => {
    setListItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const data = isListField() ? listItems : inputValue.trim();
    onComplete(data);
  };

  // Handle key press for list items
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Get placeholder text based on field type
  const getPlaceholder = () => {
    switch (stepData.field) {
      case 'targetPopulation':
        return 'e.g., Low-income families with children under 5 in urban areas';
      case 'problemDefinition':
        return 'e.g., Limited access to affordable, nutritious food leading to childhood malnutrition';
      case 'activities':
        return 'e.g., Provide nutrition education workshops';
      case 'outputs':
        return 'e.g., 150 families trained in nutrition planning';
      case 'shortTermOutcomes':
        return 'e.g., Parents demonstrate improved knowledge of nutrition';
      case 'longTermOutcomes':
        return 'e.g., Children show improved growth indicators';
      case 'impacts':
        return 'e.g., Reduced rates of childhood malnutrition in the community';
      case 'assumptions':
        return 'e.g., Parents are motivated to change feeding practices';
      case 'externalFactors':
        return 'e.g., Local food availability and pricing';
      default:
        return 'Enter your response...';
    }
  };

  // Get helpful examples for this field
  const getExamples = () => {
    switch (stepData.field) {
      case 'activities':
        return [
          'Training workshops',
          'One-on-one counseling',
          'Community events',
          'Resource distribution'
        ];
      case 'outputs':
        return [
          'Number of people trained',
          'Materials distributed',
          'Services provided',
          'Events held'
        ];
      case 'shortTermOutcomes':
        return [
          'Increased knowledge',
          'Changed attitudes',
          'New skills acquired',
          'Behavior changes'
        ];
      case 'longTermOutcomes':
        return [
          'Improved health outcomes',
          'Better economic status',
          'Enhanced well-being',
          'Sustainable practices'
        ];
      default:
        return [];
    }
  };

  const examples = getExamples();

  if (isListField()) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input for new items */}
        <div className="space-y-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {inputValue.trim() && (
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </button>
          )}
        </div>

        {/* Display added items */}
        {listItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Added items:</h4>
            <div className="space-y-2">
              {listItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-900">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Examples */}
        {examples.length > 0 && listItems.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Examples:</h4>
            <div className="grid grid-cols-1 gap-1">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setInputValue(example)}
                  className="text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </form>
    );
  }

  // Single text input for non-list fields
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={getPlaceholder()}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {inputValue.length} characters (minimum 10)
        </span>
        
        <button
          type="submit"
          disabled={!isValid}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default GuidedStepInput;