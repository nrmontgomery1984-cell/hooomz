import { useState } from 'react'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import {
  ExternalLink,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  Circle,
  Package,
  ShoppingCart,
  Phone,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// Checklist-based knowledge following The Checklist Manifesto principles:
// - Short, simple, and to the point
// - Focused on critical steps
// - Pause points for verification
// - Clear action items
const MAINTENANCE_CHECKLISTS = {
  'Replace HVAC Filter': {
    difficulty: 'Easy',
    estimatedTime: '10-15 minutes',
    toolsChecklist: [
      { item: 'No tools required', required: true }
    ],
    materialsChecklist: [
      { item: 'Replacement HVAC filter (check current size)', required: true, tip: 'Common sizes: 16x25x1, 20x20x1, 20x25x1' },
      { item: 'Ladder (if filter location is high)', required: false }
    ],
    procedureChecklist: {
      preparation: [
        { step: 'Turn off HVAC system at thermostat', critical: true },
        { step: 'Locate filter compartment (return air duct or furnace)', critical: true },
        { step: 'Note arrow direction on current filter', critical: true }
      ],
      execution: [
        { step: 'Slide out old filter', critical: true },
        { step: 'Check filter size printed on frame', critical: true },
        { step: 'Verify new filter matches size', critical: true, pausePoint: 'PAUSE - Confirm filter size before proceeding' },
        { step: 'Insert new filter with arrow pointing correct direction', critical: true },
        { step: 'Close filter compartment securely', critical: true }
      ],
      verification: [
        { step: 'Turn HVAC system back on', critical: true },
        { step: 'Listen for normal operation', critical: false },
        { step: 'Set calendar reminder for next change (1-3 months)', critical: false }
      ]
    },
    safetyChecklist: [
      { item: 'System turned off before filter replacement', critical: true },
      { item: 'Arrow direction noted and followed', critical: true }
    ],
    purchaseLinks: [
      { name: 'Home Depot - HVAC Filters', url: 'https://www.homedepot.com/b/Heating-Venting-Cooling-Air-Filters-HVAC-Filters/N-5yc1vZc4m4' },
      { name: 'Amazon - Air Filters', url: 'https://www.amazon.com/s?k=hvac+air+filter' }
    ]
  },
  'Clean Gutters': {
    difficulty: 'Medium',
    estimatedTime: '1-3 hours',
    toolsChecklist: [
      { item: 'Sturdy ladder (extension ladder for 2-story)', required: true },
      { item: 'Work gloves', required: true },
      { item: 'Garden trowel or gutter scoop', required: true },
      { item: 'Bucket or tarp for debris', required: true },
      { item: 'Garden hose with spray nozzle', required: true }
    ],
    materialsChecklist: [
      { item: 'Safety glasses', required: true },
      { item: 'Garbage bags', required: true },
      { item: 'Work clothes', required: false }
    ],
    procedureChecklist: {
      preparation: [
        { step: 'Check weather forecast - choose dry, calm day', critical: true },
        { step: 'Inspect ladder for stability and damage', critical: true },
        { step: 'Position ladder on level, stable ground', critical: true, pausePoint: 'PAUSE - Verify ladder stability' },
        { step: 'Have spotter hold ladder if possible', critical: false }
      ],
      execution: [
        { step: 'Scoop debris from gutters into bucket', critical: true },
        { step: 'Work methodically around perimeter', critical: true },
        { step: 'Check downspout openings for clogs', critical: true },
        { step: 'Flush gutters with hose from high end', critical: true },
        { step: 'Verify water flows freely through downspouts', critical: true, pausePoint: 'PAUSE - Confirm proper drainage' }
      ],
      verification: [
        { step: 'Check for sagging or loose sections', critical: true },
        { step: 'Tighten any loose brackets', critical: false },
        { step: 'Note any repairs needed', critical: false }
      ]
    },
    safetyChecklist: [
      { item: 'Ladder on stable, level surface', critical: true },
      { item: 'Ladder NOT leaning against gutters', critical: true },
      { item: 'Stay away from power lines', critical: true },
      { item: 'Don\'t overreach - move ladder frequently', critical: true },
      { item: 'Wear safety glasses', critical: true }
    ],
    callAProIf: 'Roof is very steep, over 2 stories high, or you\'re uncomfortable with heights',
    proSearchUrl: 'https://www.google.com/search?q=gutter+cleaning+service+near+me'
  },
  'Test Smoke Detectors': {
    difficulty: 'Easy',
    estimatedTime: '15-30 minutes',
    toolsChecklist: [
      { item: 'Step ladder or step stool', required: true },
      { item: 'Vacuum with hose attachment (optional)', required: false }
    ],
    materialsChecklist: [
      { item: '9V batteries (if battery-powered units)', required: true },
      { item: 'Canned air for cleaning (optional)', required: false }
    ],
    procedureChecklist: {
      preparation: [
        { step: 'Locate all smoke detectors in home', critical: true },
        { step: 'Check detector ages (replace if 10+ years old)', critical: true }
      ],
      execution: [
        { step: 'Press and hold test button for 3-5 seconds', critical: true },
        { step: 'Verify loud alarm sounds', critical: true, pausePoint: 'PAUSE - If no alarm, replace battery' },
        { step: 'If weak alarm, replace battery', critical: true },
        { step: 'Vacuum detector vents gently', critical: false },
        { step: 'Test again after cleaning/battery replacement', critical: true }
      ],
      verification: [
        { step: 'All detectors tested and working', critical: true },
        { step: 'Record test date', critical: false },
        { step: 'Schedule next monthly test', critical: false }
      ]
    },
    safetyChecklist: [
      { item: 'Never disable detector due to false alarms', critical: true },
      { item: 'Detector in every bedroom', critical: true },
      { item: 'Detector on every level of home', critical: true }
    ],
    purchaseLinks: [
      { name: 'Home Depot - Smoke Detectors', url: 'https://www.homedepot.com/b/Electrical-Fire-Safety-Smoke-Detectors/N-5yc1vZc23b' },
      { name: 'Amazon - 9V Batteries', url: 'https://www.amazon.com/s?k=9v+batteries' }
    ]
  },
  'Inspect Roof': {
    difficulty: 'Call a Pro',
    estimatedTime: 'N/A - Professional service',
    toolsChecklist: [],
    materialsChecklist: [],
    procedureChecklist: {
      preparation: [
        { step: 'Research licensed, insured roofing contractors', critical: true },
        { step: 'Get 2-3 quotes for inspection', critical: false },
        { step: 'Verify contractor license and insurance', critical: true, pausePoint: 'PAUSE - Confirm credentials' }
      ],
      execution: [
        { step: 'Schedule inspection with chosen contractor', critical: true },
        { step: 'Request written inspection report', critical: true }
      ],
      verification: [
        { step: 'Review report with contractor', critical: true },
        { step: 'Get quotes for any needed repairs', critical: true },
        { step: 'Keep inspection records', critical: true }
      ]
    },
    safetyChecklist: [
      { item: 'DO NOT attempt to walk on roof yourself', critical: true },
      { item: 'Only hire licensed, insured professionals', critical: true }
    ],
    callAPro: true,
    proSearchUrl: 'https://www.google.com/search?q=roof+inspection+near+me'
  },
  'Service HVAC System': {
    difficulty: 'Call a Pro',
    estimatedTime: 'N/A - Professional service',
    toolsChecklist: [],
    materialsChecklist: [],
    procedureChecklist: {
      preparation: [
        { step: 'Research licensed HVAC contractors', critical: true },
        { step: 'Verify contractor license and certifications', critical: true, pausePoint: 'PAUSE - Confirm credentials' },
        { step: 'Gather system model/serial numbers', critical: false }
      ],
      execution: [
        { step: 'Schedule service appointment', critical: true },
        { step: 'Request full system inspection', critical: true },
        { step: 'Request written service report', critical: true }
      ],
      verification: [
        { step: 'Review findings with technician', critical: true },
        { step: 'Keep service records for warranty', critical: true },
        { step: 'Schedule next service (6-12 months)', critical: true }
      ]
    },
    safetyChecklist: [
      { item: 'Only licensed HVAC technicians', critical: true },
      { item: 'No DIY repairs on refrigerant systems', critical: true }
    ],
    callAPro: true,
    proSearchUrl: 'https://www.google.com/search?q=hvac+service+near+me'
  },
  'Flush Water Heater': {
    difficulty: 'Medium',
    estimatedTime: '45-60 minutes',
    toolsChecklist: [
      { item: 'Garden hose', required: true },
      { item: 'Bucket', required: true },
      { item: 'Work gloves', required: true },
      { item: 'Screwdriver (if needed for panels)', required: false }
    ],
    materialsChecklist: [
      { item: 'Towels or rags', required: true },
      { item: 'Safety glasses', required: true }
    ],
    procedureChecklist: {
      preparation: [
        { step: 'Turn off power (breaker) or gas (valve)', critical: true },
        { step: 'Turn off cold water supply to heater', critical: true },
        { step: 'Let water cool 1-2 hours', critical: true, pausePoint: 'PAUSE - Water must be cool before proceeding' },
        { step: 'Connect hose to drain valve', critical: true },
        { step: 'Run hose to drain or outside', critical: true }
      ],
      execution: [
        { step: 'Open hot water faucet in house (allows air in)', critical: true },
        { step: 'Open drain valve', critical: true },
        { step: 'Let water drain completely', critical: true },
        { step: 'Turn cold water on briefly to stir sediment', critical: true },
        { step: 'Drain until water runs clear', critical: true, pausePoint: 'PAUSE - Verify clear water' }
      ],
      verification: [
        { step: 'Close drain valve', critical: true },
        { step: 'Remove hose', critical: true },
        { step: 'Turn cold water supply back on', critical: true },
        { step: 'Wait for tank to refill', critical: true },
        { step: 'Turn power/gas back on', critical: true },
        { step: 'Check for leaks at drain valve', critical: true }
      ]
    },
    safetyChecklist: [
      { item: 'Water cooled before draining', critical: true },
      { item: 'Power/gas turned off', critical: true },
      { item: 'Hose drains to safe location', critical: true },
      { item: 'If gas smell detected, evacuate and call gas company', critical: true }
    ],
    purchaseLinks: [
      { name: 'Home Depot - Garden Hoses', url: 'https://www.homedepot.com/b/Outdoors-Garden-Center-Watering-Irrigation-Garden-Hoses/N-5yc1vZc8rn' }
    ]
  },
  'Seal Windows and Doors': {
    difficulty: 'Easy',
    estimatedTime: '2-4 hours',
    toolsChecklist: [
      { item: 'Caulk gun', required: true },
      { item: 'Utility knife (remove old caulk)', required: true },
      { item: 'Putty knife', required: true },
      { item: 'Scissors (for weatherstripping)', required: true }
    ],
    materialsChecklist: [
      { item: 'Exterior-grade caulk (silicone or polyurethane)', required: true },
      { item: 'Weatherstripping (foam, V-strip, or door sweep)', required: true },
      { item: 'Rubbing alcohol and rags', required: true },
      { item: 'Painter\'s tape (optional)', required: false }
    ],
    procedureChecklist: {
      preparation: [
        { step: 'Inspect all windows and doors for gaps', critical: true },
        { step: 'Remove old, damaged caulk with utility knife', critical: true },
        { step: 'Clean surfaces with rubbing alcohol', critical: true },
        { step: 'Let surfaces dry completely', critical: true, pausePoint: 'PAUSE - Surfaces must be clean and dry' }
      ],
      execution: [
        { step: 'Cut caulk tube tip at 45-degree angle', critical: true },
        { step: 'Apply steady bead along gaps', critical: true },
        { step: 'Smooth with wet finger or tool', critical: true },
        { step: 'Install weatherstripping around door frames', critical: true },
        { step: 'Add door sweep to exterior doors', critical: true }
      ],
      verification: [
        { step: 'Check door closure (should seal tightly)', critical: true },
        { step: 'Verify no gaps remain', critical: true },
        { step: 'Test on windy day for drafts', critical: false }
      ]
    },
    safetyChecklist: [
      { item: 'Use exterior-grade caulk outdoors', critical: true },
      { item: 'Good ventilation when using caulk', critical: true },
      { item: 'Don\'t seal weep holes in windows', critical: true }
    ],
    purchaseLinks: [
      { name: 'Home Depot - Caulk & Weatherstripping', url: 'https://www.homedepot.com/b/Paint-Paint-Applicators-Caulk-Caulk-Guns/N-5yc1vZapzs' },
      { name: 'Lowes - Weatherstripping', url: 'https://www.lowes.com/c/Weatherstripping-Weather-stripping-Doors-windows' }
    ]
  },
  'Test Garage Door Safety Features': {
    difficulty: 'Easy',
    estimatedTime: '15-20 minutes',
    toolsChecklist: [
      { item: '2x4 board or roll of paper towels (for testing)', required: true },
      { item: 'Step stool or ladder', required: false }
    ],
    materialsChecklist: [
      { item: 'Clean cloth (for sensors)', required: true }
    ],
    procedureChecklist: {
      preparation: [
        { step: 'Clear area under garage door', critical: true },
        { step: 'Ensure children and pets are clear', critical: true }
      ],
      execution: [
        { step: 'Test 1: Place 2x4 on ground where door closes', critical: true },
        { step: 'Press close button', critical: true },
        { step: 'Door must reverse when hitting obstruction', critical: true, pausePoint: 'PAUSE - If door doesn\'t reverse, STOP and call professional' },
        { step: 'Test 2: Start closing door', critical: true },
        { step: 'Wave object through photo-eye beam', critical: true },
        { step: 'Door must reverse immediately', critical: true, pausePoint: 'PAUSE - If door doesn\'t reverse, STOP and call professional' },
        { step: 'Clean photo-eye sensors with cloth', critical: true },
        { step: 'Verify sensor lights are solid (not blinking)', critical: true }
      ],
      verification: [
        { step: 'Both safety tests passed', critical: true },
        { step: 'Door opens and closes smoothly', critical: true },
        { step: 'Test emergency release and re-engage', critical: false }
      ]
    },
    safetyChecklist: [
      { item: 'If auto-reverse fails, call professional immediately', critical: true },
      { item: 'Never attempt spring/cable repairs', critical: true },
      { item: 'Keep hands away from door sections', critical: true },
      { item: 'Children not allowed to operate door', critical: true }
    ],
    callAProIf: 'Any safety feature fails to work',
    proSearchUrl: 'https://www.google.com/search?q=garage+door+repair+near+me'
  }
}

// Checklist item component
const ChecklistItem = ({ item, checked, onChange }) => (
  <div className="flex items-start gap-3 py-2 hover:bg-gray-50 px-2 rounded">
    <div className="pt-0.5 cursor-pointer" onClick={() => onChange(!checked)}>
      {checked ? (
        <CheckCircle size={20} className="text-green-600" />
      ) : (
        <Circle size={20} className="text-gray-400" />
      )}
    </div>
    <div className="flex-1">
      <span className={`text-sm ${checked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {item.item || item.step}
      </span>
      {item.tip && (
        <p className="text-xs text-gray-600 mt-1">{item.tip}</p>
      )}
      {item.pausePoint && (
        <div className="mt-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900 font-medium">
          ⚠️ {item.pausePoint}
        </div>
      )}
    </div>
    {item.critical && (
      <span className="text-xs font-medium text-red-600">CRITICAL</span>
    )}
    {item.required !== undefined && (
      <span className={`text-xs font-medium ${item.required ? 'text-red-600' : 'text-gray-500'}`}>
        {item.required ? 'REQUIRED' : 'Optional'}
      </span>
    )}
  </div>
)

// Collapsible section
const ChecklistSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 px-2 py-1 rounded"
      >
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-primary-600" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {isOpen && children}
    </div>
  )
}

// Difficulty badge
const DifficultyBadge = ({ difficulty }) => {
  const getColor = () => {
    if (difficulty === 'Easy') return 'bg-green-100 text-green-800'
    if (difficulty === 'Medium') return 'bg-yellow-100 text-yellow-800'
    if (difficulty.includes('Call a Pro')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColor()}`}>
      {difficulty}
    </span>
  )
}

export const MaintenanceDetailsModal = ({ task, isOpen, onClose }) => {
  const [toolsChecked, setToolsChecked] = useState({})
  const [materialsChecked, setMaterialsChecked] = useState({})
  const [procedureChecked, setProcedureChecked] = useState({})
  const [safetyChecked, setSafetyChecked] = useState({})

  if (!task) return null

  const checklist = MAINTENANCE_CHECKLISTS[task.name] || {}

  const handleReset = () => {
    setToolsChecked({})
    setMaterialsChecked({})
    setProcedureChecked({})
    setSafetyChecked({})
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.name} size="large">
      <div className="space-y-6">
        {/* Task Overview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="text-gray-600">Frequency:</span>
              <p className="font-medium capitalize">{task.frequency}</p>
            </div>
            <div>
              <span className="text-gray-600">Next Due:</span>
              <p className="font-medium">
                {task.next_due ? new Date(task.next_due).toLocaleDateString() : 'Not scheduled'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <DifficultyBadge difficulty={checklist.difficulty || 'Unknown'} />
            </div>
            {checklist.estimatedTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>{checklist.estimatedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Call a Pro Alert */}
        {checklist.callAPro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={20} className="text-red-600" />
              <h3 className="font-semibold text-red-900">Professional Service Required</h3>
            </div>
            <p className="text-sm text-red-800 mb-3">
              This task requires specialized knowledge, tools, and safety equipment.
              It should only be performed by a licensed professional.
            </p>
            <Button
              variant="primary"
              onClick={() => window.open(checklist.proSearchUrl, '_blank')}
            >
              <ExternalLink size={16} className="mr-2" />
              Find Professional Near Me
            </Button>
          </div>
        )}

        {/* Tools Checklist */}
        {checklist.toolsChecklist && checklist.toolsChecklist.length > 0 && (
          <ChecklistSection title="Required Tools" icon={Wrench}>
            <div className="space-y-1">
              {checklist.toolsChecklist.map((tool, index) => (
                <ChecklistItem
                  key={index}
                  item={tool}
                  checked={toolsChecked[index]}
                  onChange={(val) => setToolsChecked({ ...toolsChecked, [index]: val })}
                />
              ))}
            </div>
          </ChecklistSection>
        )}

        {/* Materials Checklist */}
        {checklist.materialsChecklist && checklist.materialsChecklist.length > 0 && (
          <ChecklistSection title="Materials & Supplies" icon={Package}>
            <div className="space-y-1">
              {checklist.materialsChecklist.map((material, index) => (
                <ChecklistItem
                  key={index}
                  item={material}
                  checked={materialsChecked[index]}
                  onChange={(val) => setMaterialsChecked({ ...materialsChecked, [index]: val })}
                />
              ))}
            </div>
            {checklist.purchaseLinks && checklist.purchaseLinks.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-600 mb-2">Purchase supplies:</p>
                <div className="grid grid-cols-2 gap-2">
                  {checklist.purchaseLinks.map((link, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink size={14} className="mr-1" />
                      {link.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </ChecklistSection>
        )}

        {/* Safety Checklist - ALWAYS VISIBLE */}
        {checklist.safetyChecklist && checklist.safetyChecklist.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-red-600" />
              <h3 className="font-semibold text-red-900">Safety Checklist - DO NOT SKIP</h3>
            </div>
            <div className="space-y-1">
              {checklist.safetyChecklist.map((item, index) => (
                <ChecklistItem
                  key={index}
                  item={item}
                  checked={safetyChecked[index]}
                  onChange={(val) => setSafetyChecked({ ...safetyChecked, [index]: val })}
                />
              ))}
            </div>
            {checklist.callAProIf && (
              <div className="mt-3 pt-3 border-t border-red-300">
                <p className="text-sm font-medium text-red-900 mb-2">Call a Professional If:</p>
                <p className="text-sm text-red-800">{checklist.callAProIf}</p>
                {checklist.proSearchUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(checklist.proSearchUrl, '_blank')}
                  >
                    <ExternalLink size={14} className="mr-2" />
                    Find Professional Near Me
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Procedure Checklist */}
        {checklist.procedureChecklist && (
          <ChecklistSection title="Step-by-Step Procedure" icon={CheckCircle}>
            {checklist.procedureChecklist.preparation && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Preparation</h4>
                <div className="space-y-1">
                  {checklist.procedureChecklist.preparation.map((step, index) => (
                    <ChecklistItem
                      key={`prep-${index}`}
                      item={step}
                      checked={procedureChecked[`prep-${index}`]}
                      onChange={(val) => setProcedureChecked({ ...procedureChecked, [`prep-${index}`]: val })}
                    />
                  ))}
                </div>
              </div>
            )}
            {checklist.procedureChecklist.execution && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Execution</h4>
                <div className="space-y-1">
                  {checklist.procedureChecklist.execution.map((step, index) => (
                    <ChecklistItem
                      key={`exec-${index}`}
                      item={step}
                      checked={procedureChecked[`exec-${index}`]}
                      onChange={(val) => setProcedureChecked({ ...procedureChecked, [`exec-${index}`]: val })}
                    />
                  ))}
                </div>
              </div>
            )}
            {checklist.procedureChecklist.verification && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Verification</h4>
                <div className="space-y-1">
                  {checklist.procedureChecklist.verification.map((step, index) => (
                    <ChecklistItem
                      key={`verify-${index}`}
                      item={step}
                      checked={procedureChecked[`verify-${index}`]}
                      onChange={(val) => setProcedureChecked({ ...procedureChecked, [`verify-${index}`]: val })}
                    />
                  ))}
                </div>
              </div>
            )}
          </ChecklistSection>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleReset}>
            Reset Checklists
          </Button>
          <Button variant="secondary" onClick={onClose}>
            <X size={16} className="mr-2" />
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
