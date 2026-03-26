import { useState, useEffect } from 'react';
import type { FlooringType, TaskTemplate } from '../../types/database';
import { getFlooringTypes, getTaskTemplatesForFlooringType } from '../../services/api/flooring';

// ============================================================================
// TYPES
// ============================================================================

interface FlooringProjectSetupProps {
  onComplete: (setup: FlooringProjectConfig) => void;
  onCancel?: () => void;
}

export interface FlooringProjectConfig {
  projectName: string;
  clientName: string;
  rooms: RoomConfig[];
  flooringTypeId: string;
  tasks: TaskTemplate[];
  totalArea: number;
}

interface RoomConfig {
  id: string;
  name: string;
  areaSqft: number;
  perimeterLf: number;
  layout: 'standard' | 'diagonal' | 'herringbone';
  includeBaseMolding: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FlooringProjectSetup({ onComplete, onCancel }: FlooringProjectSetupProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [flooringTypes, setFlooringTypes] = useState<FlooringType[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedFlooringTypeId, setSelectedFlooringTypeId] = useState('');
  const [rooms, setRooms] = useState<RoomConfig[]>([
    { id: '1', name: '', areaSqft: 0, perimeterLf: 0, layout: 'standard', includeBaseMolding: true },
  ]);

  // Load flooring types on mount
  useEffect(() => {
    getFlooringTypes()
      .then(types => {
        setFlooringTypes(types);
        if (types.length > 0) {
          setSelectedFlooringTypeId(types[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Load task templates when flooring type changes
  useEffect(() => {
    if (selectedFlooringTypeId) {
      getTaskTemplatesForFlooringType(selectedFlooringTypeId)
        .then(setTaskTemplates)
        .catch(console.error);
    }
  }, [selectedFlooringTypeId]);

  const selectedFlooringType = flooringTypes.find(t => t.id === selectedFlooringTypeId);
  const totalArea = rooms.reduce((sum, r) => sum + (r.areaSqft || 0), 0);

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: Date.now().toString(),
        name: '',
        areaSqft: 0,
        perimeterLf: 0,
        layout: 'standard',
        includeBaseMolding: true,
      },
    ]);
  };

  const updateRoom = (id: string, updates: Partial<RoomConfig>) => {
    setRooms(rooms.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRoom = (id: string) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const handleComplete = () => {
    onComplete({
      projectName,
      clientName,
      rooms,
      flooringTypeId: selectedFlooringTypeId,
      tasks: taskTemplates,
      totalArea,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return projectName.trim().length > 0 && clientName.trim().length > 0;
      case 2:
        return selectedFlooringTypeId.length > 0;
      case 3:
        return rooms.length > 0 && rooms.every(r => r.name.trim().length > 0 && r.areaSqft > 0);
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s < step
                  ? 'bg-green-500 text-white'
                  : s === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 4 && <div className={`w-16 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Project Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
            <p className="text-gray-600 mt-1">Basic information about the flooring job</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="e.g., Smith Residence - Main Floor"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Flooring Type */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Flooring Type</h2>
            <p className="text-gray-600 mt-1">Select the type of flooring for this project</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {flooringTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedFlooringTypeId(type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedFlooringTypeId === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">{type.name}</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">{type.category}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {type.acclimation_hours}h acclimation required
                </p>
              </button>
            ))}
          </div>

          {selectedFlooringType && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800">Requirements</h4>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>Acclimation: {selectedFlooringType.acclimation_hours} hours</li>
                <li>
                  Temperature: {selectedFlooringType.acclimation_temp_min_f}°F -{' '}
                  {selectedFlooringType.acclimation_temp_max_f}°F
                </li>
                {selectedFlooringType.acclimation_rh_min && selectedFlooringType.acclimation_rh_max && (
                  <li>
                    Humidity: {selectedFlooringType.acclimation_rh_min}% -{' '}
                    {selectedFlooringType.acclimation_rh_max}% RH
                  </li>
                )}
                <li>Standard waste: {((selectedFlooringType.waste_factor_standard - 1) * 100).toFixed(0)}%</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Rooms */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rooms & Areas</h2>
            <p className="text-gray-600 mt-1">Add rooms and their measurements</p>
          </div>

          <div className="space-y-4">
            {rooms.map((room, index) => (
              <div key={room.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Room {index + 1}</span>
                  {rooms.length > 1 && (
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={room.name}
                      onChange={e => updateRoom(room.id, { name: e.target.value })}
                      placeholder="Room name (e.g., Living Room)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={room.areaSqft || ''}
                      onChange={e => updateRoom(room.id, { areaSqft: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Perimeter (lf)</label>
                    <input
                      type="number"
                      min="0"
                      value={room.perimeterLf || ''}
                      onChange={e => updateRoom(room.id, { perimeterLf: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Layout</label>
                    <select
                      value={room.layout}
                      onChange={e => updateRoom(room.id, { layout: e.target.value as RoomConfig['layout'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="diagonal">Diagonal</option>
                      <option value="herringbone">Herringbone</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={room.includeBaseMolding}
                        onChange={e => updateRoom(room.id, { includeBaseMolding: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Base molding</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addRoom}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Another Room
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total Area:</strong> {totalArea.toLocaleString()} sqft
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review & Create</h2>
            <p className="text-gray-600 mt-1">Confirm project details before creating</p>
          </div>

          <div className="space-y-4">
            {/* Project Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-medium text-gray-800">Project</h3>
              <p className="text-gray-600">{projectName}</p>
              <p className="text-sm text-gray-500">Client: {clientName}</p>
            </div>

            {/* Flooring Type */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-medium text-gray-800">Flooring Type</h3>
              <p className="text-gray-600">{selectedFlooringType?.name}</p>
              <p className="text-sm text-gray-500">
                {selectedFlooringType?.acclimation_hours}h acclimation required
              </p>
            </div>

            {/* Rooms */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-medium text-gray-800">Rooms ({rooms.length})</h3>
              {rooms.map(room => (
                <div key={room.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{room.name}</span>
                  <span className="text-gray-500">{room.areaSqft} sqft • {room.layout}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200">
                <strong className="text-gray-800">Total: {totalArea.toLocaleString()} sqft</strong>
              </div>
            </div>

            {/* Tasks */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-medium text-gray-800">Tasks ({taskTemplates.length})</h3>
              <div className="max-h-40 overflow-y-auto">
                {taskTemplates.map((task, i) => (
                  <p key={task.id} className="text-sm text-gray-600">
                    {i + 1}. {task.name}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
        {onCancel && step === 1 && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors min-h-[48px]"
          >
            Cancel
          </button>
        )}
        {step > 1 && (
          <button
            onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors min-h-[48px]"
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (step === 4) {
              handleComplete();
            } else {
              setStep((step + 1) as 1 | 2 | 3 | 4);
            }
          }}
          disabled={!canProceed()}
          className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors min-h-[48px]"
        >
          {step === 4 ? 'Create Project' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default FlooringProjectSetup;
