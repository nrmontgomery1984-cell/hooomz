import { useState, useEffect } from 'react';
import type { SubstrateType, TestMethod, MoistureThreshold } from '../../types/database';
import { getMoistureThresholds, createMoistureReading } from '../../services/api/flooring';

// ============================================================================
// TYPES
// ============================================================================

interface MoistureReadingFormProps {
  projectId: string;
  loopId?: string;
  floorPlanId?: string;
  pinX?: number;
  pinY?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormState {
  substrate_type: SubstrateType;
  test_method: TestMethod;
  reading_value: string;
  location_description: string;
  meter_model: string;
  notes: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUBSTRATE_OPTIONS: { value: SubstrateType; label: string }[] = [
  { value: 'wood', label: 'Wood Subfloor' },
  { value: 'plywood', label: 'Plywood' },
  { value: 'osb', label: 'OSB' },
  { value: 'concrete', label: 'Concrete' },
];

const TEST_METHOD_OPTIONS: { value: TestMethod; label: string; unit: string }[] = [
  { value: 'pin_meter', label: 'Pin Moisture Meter', unit: '%MC' },
  { value: 'calcium_chloride', label: 'Calcium Chloride Test', unit: 'lbs' },
  { value: 'rh_probe', label: 'RH Probe (In-Situ)', unit: '%RH' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function MoistureReadingForm({
  projectId,
  loopId,
  floorPlanId,
  pinX,
  pinY,
  onSuccess,
  onCancel,
}: MoistureReadingFormProps) {
  const [form, setForm] = useState<FormState>({
    substrate_type: 'wood',
    test_method: 'pin_meter',
    reading_value: '',
    location_description: '',
    meter_model: '',
    notes: '',
  });

  const [thresholds, setThresholds] = useState<MoistureThreshold[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load thresholds on mount
  useEffect(() => {
    getMoistureThresholds()
      .then(setThresholds)
      .catch(err => console.error('Failed to load thresholds:', err));
  }, []);

  // Get current threshold for selected substrate/method
  const currentThreshold = thresholds.find(
    t => t.substrate_type === form.substrate_type && t.test_method === form.test_method
  );

  // Get unit for selected test method
  const currentUnit = TEST_METHOD_OPTIONS.find(t => t.value === form.test_method)?.unit || '%';

  // Evaluate reading against threshold
  const readingValue = parseFloat(form.reading_value);
  const isValidReading = !isNaN(readingValue) && readingValue >= 0;

  let evaluation: 'pass' | 'warning' | 'fail' | null = null;
  if (isValidReading && currentThreshold) {
    if (readingValue <= currentThreshold.pass_max) {
      evaluation = 'pass';
    } else if (currentThreshold.mitigation_max && readingValue <= currentThreshold.mitigation_max) {
      evaluation = 'warning';
    } else {
      evaluation = 'fail';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidReading) {
      setError('Please enter a valid reading value');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createMoistureReading({
        project_id: projectId,
        loop_id: loopId || null,
        floor_plan_id: floorPlanId || null,
        pin_x: pinX || null,
        pin_y: pinY || null,
        substrate_type: form.substrate_type,
        test_method: form.test_method,
        reading_value: readingValue,
        reading_unit: currentUnit,
        location_description: form.location_description || null,
        meter_model: form.meter_model || null,
        notes: form.notes || null,
        passed: evaluation === 'pass',
        threshold_value: currentThreshold?.pass_max || null,
        taken_by: null, // Will be set by auth context in real usage
        photo_url: null,
        calibration_date: null,
      });

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reading');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Substrate Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Substrate Type
        </label>
        <select
          value={form.substrate_type}
          onChange={e => setForm({ ...form, substrate_type: e.target.value as SubstrateType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {SUBSTRATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Test Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Test Method
        </label>
        <select
          value={form.test_method}
          onChange={e => setForm({ ...form, test_method: e.target.value as TestMethod })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {TEST_METHOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Reading Value with Threshold Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reading Value ({currentUnit})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.reading_value}
            onChange={e => setForm({ ...form, reading_value: e.target.value })}
            placeholder={`Enter ${currentUnit} reading`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
            {currentUnit}
          </span>
        </div>

        {/* Threshold Reference */}
        {currentThreshold && (
          <p className="mt-1 text-sm text-gray-500">
            Pass: ≤{currentThreshold.pass_max} {currentUnit}
            {currentThreshold.mitigation_max && (
              <span> | With mitigation: ≤{currentThreshold.mitigation_max} {currentUnit}</span>
            )}
          </p>
        )}
      </div>

      {/* Real-time Evaluation Display */}
      {isValidReading && evaluation && (
        <div
          className={`p-4 rounded-lg ${
            evaluation === 'pass'
              ? 'bg-green-50 border border-green-200'
              : evaluation === 'warning'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {evaluation === 'pass' && (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium text-green-800">PASS</span>
              </>
            )}
            {evaluation === 'warning' && (
              <>
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium text-amber-800">WARNING - Requires Mitigation</span>
              </>
            )}
            {evaluation === 'fail' && (
              <>
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium text-red-800">FAIL - Do Not Proceed</span>
              </>
            )}
          </div>
          {evaluation === 'warning' && (
            <p className="mt-2 text-sm text-amber-700">
              Consider moisture barrier or extended drying time before installation.
            </p>
          )}
          {evaluation === 'fail' && (
            <p className="mt-2 text-sm text-red-700">
              Reading exceeds acceptable limits. Address moisture issue before proceeding.
            </p>
          )}
        </div>
      )}

      {/* Location Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location Description
        </label>
        <input
          type="text"
          value={form.location_description}
          onChange={e => setForm({ ...form, location_description: e.target.value })}
          placeholder="e.g., Kitchen - near sink"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Meter Model (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Meter Model <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={form.meter_model}
          onChange={e => setForm({ ...form, meter_model: e.target.value })}
          placeholder="e.g., Wagner Orion 950"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Notes (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Any additional observations..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !isValidReading}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors min-h-[48px]"
        >
          {isSubmitting ? 'Saving...' : 'Save Reading'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors min-h-[48px]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default MoistureReadingForm;
