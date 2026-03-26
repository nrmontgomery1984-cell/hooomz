import { useState, useEffect } from 'react';
import { getTaskTemplates, getFlooringTypes, getMoistureThresholds } from '../../services/api/flooring';
import type { TaskTemplate, FlooringType, MoistureThreshold } from '../../types/database';

// ============================================================================
// TYPES
// ============================================================================

interface ChecklistItem {
  id: string;
  text: string;
  help_text?: string;
  critical?: boolean;
  requires_photo?: boolean;
  requires_value?: boolean;
}

interface FlooringSOPProps {
  flooringTypeCode?: string; // Filter by flooring type (e.g., 'LVT', 'TILE')
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FlooringSOP({ flooringTypeCode }: FlooringSOPProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [flooringTypes, setFlooringTypes] = useState<FlooringType[]>([]);
  const [thresholds, setThresholds] = useState<MoistureThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'types' | 'moisture'>('tasks');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(flooringTypeCode || '');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [templatesData, typesData, thresholdsData] = await Promise.all([
        getTaskTemplates(),
        getFlooringTypes(),
        getMoistureThresholds(),
      ]);
      setTemplates(templatesData);
      setFlooringTypes(typesData);
      setThresholds(thresholdsData);
    } catch (err) {
      console.error('Failed to load SOP data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Group templates by phase
  const groupedTemplates = templates.reduce((acc, template) => {
    const phase = (template as any).phase || template.category || 'other';
    if (!acc[phase]) acc[phase] = [];

    // Filter by flooring type if selected
    if (selectedType) {
      const flooringType = flooringTypes.find(t => t.code === selectedType);
      if (template.flooring_type_id && template.flooring_type_id !== flooringType?.id) {
        return acc;
      }
    }

    acc[phase].push(template);
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  // Phase display order and labels
  const phaseOrder = ['ASSESSMENT', 'PREP', 'MATERIAL', 'INSTALL', 'FINISH', 'QC', 'HANDOFF', 'prep', 'install', 'finish', 'qc', 'other'];
  const phaseLabels: Record<string, string> = {
    'ASSESSMENT': 'Site Assessment',
    'PREP': 'Preparation',
    'MATERIAL': 'Material Handling',
    'INSTALL': 'Installation',
    'FINISH': 'Finishing',
    'QC': 'Quality Control',
    'HANDOFF': 'Client Handoff',
    'prep': 'Preparation',
    'install': 'Installation',
    'finish': 'Finishing',
    'qc': 'Quality Control',
    'other': 'Other',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'tasks', label: 'Task Templates' },
          { id: 'types', label: 'Flooring Types' },
          { id: 'moisture', label: 'Moisture Limits' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Flooring Type Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types (Universal)</option>
              {flooringTypes.map((type) => (
                <option key={type.id} value={type.code}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Templates grouped by phase */}
          {phaseOrder.filter(phase => groupedTemplates[phase]?.length > 0).map((phase) => (
            <div key={phase} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2">
                <h3 className="font-semibold text-gray-800">
                  {phaseLabels[phase] || phase}
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {groupedTemplates[phase].map((template) => {
                  const checklist = (template.checklist_items || []) as ChecklistItem[];
                  const isExpanded = expandedTemplate === template.id;

                  return (
                    <div key={template.id} className="bg-white">
                      <button
                        onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{template.name}</p>
                          {template.sop_reference && (
                            <p className="text-xs text-gray-500">{template.sop_reference}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {checklist.length} items
                          </span>
                          <span className="text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </button>

                      {isExpanded && checklist.length > 0 && (
                        <div className="px-4 pb-4 bg-gray-50">
                          <ul className="space-y-2">
                            {checklist.map((item, idx) => (
                              <li key={item.id || idx} className="flex items-start gap-2">
                                <span className={`mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
                                  item.critical ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-300'
                                }`}>
                                  {item.critical && '!'}
                                </span>
                                <div className="flex-1">
                                  <p className={`text-sm ${item.critical ? 'text-red-800 font-medium' : 'text-gray-700'}`}>
                                    {item.text}
                                    {item.requires_photo && (
                                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 rounded">photo</span>
                                    )}
                                    {item.requires_value && (
                                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1 rounded">value</span>
                                    )}
                                  </p>
                                  {item.help_text && (
                                    <p className="text-xs text-gray-500 mt-0.5">{item.help_text}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(groupedTemplates).length === 0 && (
            <p className="text-center py-8 text-gray-500">No task templates found.</p>
          )}
        </div>
      )}

      {/* Flooring Types Tab */}
      {activeTab === 'types' && (
        <div className="space-y-3">
          {flooringTypes.map((type) => (
            <div key={type.id} className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{type.name}</h4>
                  <p className="text-sm text-gray-500">{type.code} • {type.category}</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {type.install_rate_sqft_per_hour} sqft/hr
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div className="bg-amber-50 p-3 rounded">
                  <p className="font-medium text-amber-800">Acclimation</p>
                  <p className="text-amber-700">{type.acclimation_hours} hours</p>
                  <p className="text-xs text-amber-600">
                    {type.acclimation_temp_min_f}°F - {type.acclimation_temp_max_f}°F
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-800">Waste Factors</p>
                  <p className="text-green-700">Standard: {((type.waste_factor_standard - 1) * 100).toFixed(0)}%</p>
                  <p className="text-xs text-green-600">
                    Diagonal: {((type.waste_factor_diagonal - 1) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moisture Thresholds Tab */}
      {activeTab === 'moisture' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Reference thresholds for moisture testing. Readings above these limits require mitigation or waiting.
          </p>

          {thresholds.map((threshold) => (
            <div key={threshold.id} className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {threshold.substrate_type.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {threshold.test_method.replace('_', ' ')}
                  </p>
                </div>
                {threshold.sop_reference && (
                  <span className="text-xs text-gray-400">{threshold.sop_reference}</span>
                )}
              </div>

              <div className="flex gap-4 mt-3">
                <div className="flex-1 bg-green-50 p-3 rounded text-center">
                  <p className="text-xs text-green-600 font-medium">PASS</p>
                  <p className="text-lg font-bold text-green-800">
                    ≤ {threshold.pass_max} {threshold.unit}
                  </p>
                </div>
                {threshold.mitigation_max && (
                  <div className="flex-1 bg-amber-50 p-3 rounded text-center">
                    <p className="text-xs text-amber-600 font-medium">WITH MITIGATION</p>
                    <p className="text-lg font-bold text-amber-800">
                      ≤ {threshold.mitigation_max} {threshold.unit}
                    </p>
                  </div>
                )}
                <div className="flex-1 bg-red-50 p-3 rounded text-center">
                  <p className="text-xs text-red-600 font-medium">FAIL</p>
                  <p className="text-lg font-bold text-red-800">
                    &gt; {threshold.mitigation_max || threshold.pass_max} {threshold.unit}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FlooringSOP;
