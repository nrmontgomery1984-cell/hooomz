import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import {
  ExternalLink,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Award,
  Book,
  X
} from 'lucide-react'

// Knowledge base for different system types
const SYSTEM_INFO = {
  'HVAC': {
    manualSearchUrl: (brand, model) =>
      `https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + model + ' owner manual PDF')}`,
    maintenance: [
      'Replace air filters monthly (or every 3 months for high-efficiency filters)',
      'Clean outdoor condenser coils annually in spring',
      'Clear debris around outdoor unit (maintain 2-foot clearance)',
      'Check and clean condensate drain line quarterly',
      'Schedule professional tune-up twice yearly (spring and fall)',
      'Check thermostat batteries annually'
    ],
    commonProblems: [
      {
        problem: 'System not cooling/heating',
        solutions: [
          'Check thermostat settings and batteries',
          'Verify circuit breaker hasn\'t tripped',
          'Replace dirty air filter',
          'Check outdoor unit for ice buildup or debris'
        ]
      },
      {
        problem: 'Unusual noises',
        solutions: [
          'Grinding: May indicate motor bearing issues',
          'Squealing: Often a belt problem',
          'Banging: Could be loose parts or ductwork',
          'Contact HVAC technician if persists'
        ]
      },
      {
        problem: 'Poor airflow',
        solutions: [
          'Replace clogged air filter',
          'Check that vents aren\'t blocked by furniture',
          'Inspect ductwork for leaks or disconnections',
          'Verify blower motor is functioning'
        ]
      }
    ],
    lifespanYears: '15-20',
    warningSign: 'Rising energy bills, frequent repairs, or system age over 15 years may indicate replacement needed'
  },
  'Furnace': {
    manualSearchUrl: (brand, model) =>
      `https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + model + ' furnace manual PDF')}`,
    maintenance: [
      'Replace air filter every 1-3 months during heating season',
      'Annual professional inspection before heating season',
      'Clean blower assembly annually',
      'Check and clean burners',
      'Inspect heat exchanger for cracks',
      'Test carbon monoxide detector monthly'
    ],
    commonProblems: [
      {
        problem: 'Furnace won\'t turn on',
        solutions: [
          'Check thermostat is set to "heat" and temperature is above room temp',
          'Verify circuit breaker and furnace power switch are on',
          'Check furnace door is completely closed',
          'Replace air filter if clogged'
        ]
      },
      {
        problem: 'Pilot light won\'t stay lit',
        solutions: [
          'Clean pilot opening with compressed air',
          'Check thermocouple positioning',
          'Verify gas supply is on',
          'Call technician if problem persists'
        ]
      }
    ],
    lifespanYears: '15-20',
    warningSign: 'Yellow pilot light flame (should be blue), frequent cycling, or visible rust/corrosion'
  },
  'Water Heater': {
    manualSearchUrl: (brand, model) =>
      `https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + model + ' water heater manual PDF')}`,
    maintenance: [
      'Flush tank annually to remove sediment',
      'Test temperature/pressure relief valve annually',
      'Check anode rod every 3-5 years (replace if needed)',
      'Inspect for leaks monthly',
      'Keep area around heater clear',
      'Set temperature to 120°F for safety and efficiency'
    ],
    commonProblems: [
      {
        problem: 'No hot water',
        solutions: [
          'Gas: Check pilot light, relight if out',
          'Electric: Check circuit breaker',
          'Verify thermostat setting (120°F recommended)',
          'Check for tripped high-temperature cutoff'
        ]
      },
      {
        problem: 'Water not hot enough',
        solutions: [
          'Increase thermostat setting (max 120°F for safety)',
          'Flush sediment from tank',
          'Check dip tube for breakage',
          'Insulate hot water pipes'
        ]
      },
      {
        problem: 'Leaking tank',
        solutions: [
          'Check temperature/pressure relief valve',
          'Inspect drain valve',
          'If tank itself is leaking, replacement needed immediately',
          'Turn off water supply and power/gas, call plumber'
        ]
      }
    ],
    lifespanYears: '8-12',
    warningSign: 'Rusty water, rumbling/banging noises, moisture around base, or age over 10 years'
  },
  'Electrical': {
    manualSearchUrl: (brand, model) =>
      `https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + model + ' electrical panel manual PDF')}`,
    maintenance: [
      'Inspect panel for signs of overheating or burning smells',
      'Test GFCI outlets monthly',
      'Test AFCI breakers monthly',
      'Professional inspection every 3-5 years',
      'Keep panel area clear and accessible',
      'Label all circuits clearly'
    ],
    commonProblems: [
      {
        problem: 'Breaker keeps tripping',
        solutions: [
          'Reduce load on circuit (unplug devices)',
          'Check for short circuit or ground fault',
          'Inspect for damaged cords or outlets',
          'Call electrician if problem persists - may need dedicated circuit'
        ]
      },
      {
        problem: 'Flickering lights',
        solutions: [
          'Check for loose bulbs',
          'Verify connections at switch and fixture',
          'May indicate loose wiring - call electrician',
          'Could signal voltage fluctuation issue'
        ]
      }
    ],
    lifespanYears: '25-40',
    warningSign: 'Frequent breaker trips, buzzing sounds, burning smell, or rust/corrosion on panel'
  },
  'Roof': {
    manualSearchUrl: (brand, model) =>
      `https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + model + ' roofing installation guide warranty')}`,
    maintenance: [
      'Inspect twice yearly (spring and fall) and after major storms',
      'Clean gutters and downspouts regularly',
      'Remove debris (leaves, branches) from roof surface',
      'Trim overhanging tree branches',
      'Check for damaged, curling, or missing shingles',
      'Inspect flashing around chimneys, vents, and skylights',
      'Remove moss growth with zinc strips or professional cleaning'
    ],
    commonProblems: [
      {
        problem: 'Leaks',
        solutions: [
          'Check attic after rain for water stains',
          'Inspect flashing around penetrations',
          'Look for damaged or missing shingles',
          'Check for ice dams in winter',
          'Call roofing professional for repairs'
        ]
      },
      {
        problem: 'Damaged shingles',
        solutions: [
          'Replace individual damaged shingles promptly',
          'Check for wind damage after storms',
          'Look for granule loss (shingles appear shiny)',
          'Curling edges indicate age/UV damage'
        ]
      },
      {
        problem: 'Poor ventilation',
        solutions: [
          'Ensure soffit vents are not blocked',
          'Check ridge vents are clear',
          'Install additional ventilation if needed',
          'Prevents ice dams and extends roof life'
        ]
      }
    ],
    lifespanYears: '20-30 (asphalt shingles)',
    warningSign: 'Widespread granule loss, curling shingles, daylight visible through roof boards, or age over 20 years'
  },
  'Garage Door': {
    manualSearchUrl: (brand, model) =>
      `https://www.google.com/search?q=${encodeURIComponent(brand + ' ' + model + ' garage door opener manual PDF')}`,
    maintenance: [
      'Lubricate rollers, hinges, and tracks every 6 months',
      'Test auto-reverse safety feature monthly',
      'Check door balance (should stay in place when half-open)',
      'Tighten hardware quarterly',
      'Clean photo-eye sensors',
      'Inspect cables for fraying (do not repair yourself - dangerous!)'
    ],
    commonProblems: [
      {
        problem: 'Door won\'t open/close',
        solutions: [
          'Check if opener is locked (vacation mode)',
          'Replace remote batteries',
          'Check photo-eye sensors are aligned and clean',
          'Verify door isn\'t manually locked',
          'Check circuit breaker'
        ]
      },
      {
        problem: 'Door reverses before closing',
        solutions: [
          'Clean photo-eye sensors',
          'Check for obstructions in door path',
          'Adjust close-force setting on opener',
          'Verify tracks are aligned properly'
        ]
      },
      {
        problem: 'Noisy operation',
        solutions: [
          'Lubricate all moving parts with garage door lubricant',
          'Tighten loose hardware',
          'Replace worn rollers',
          'Check for damaged or worn belt/chain'
        ]
      }
    ],
    lifespanYears: '10-15 (opener), 15-30 (door)',
    warningSign: 'Excessive noise, slow operation, sagging door, or frayed cables (call professional immediately)'
  }
}

export const SystemDetailsModal = ({ system, isOpen, onClose }) => {
  if (!system) return null

  const info = SYSTEM_INFO[system.type] || {}
  const manualUrl = info.manualSearchUrl ? info.manualSearchUrl(system.brand, system.model) : null

  const warrantyStatus = () => {
    if (!system.warranty_until) return null
    const warrantyDate = new Date(system.warranty_until)
    const today = new Date()
    const isActive = warrantyDate > today
    const daysRemaining = Math.ceil((warrantyDate - today) / (1000 * 60 * 60 * 24))

    return {
      isActive,
      daysRemaining,
      date: warrantyDate.toLocaleDateString()
    }
  }

  const warranty = warrantyStatus()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${system.type} Details`} size="large">
      <div className="space-y-6">
        {/* System Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">System Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Brand:</span>
              <p className="font-medium">{system.brand || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Model:</span>
              <p className="font-medium">{system.model || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Serial Number:</span>
              <p className="font-medium font-mono text-xs">{system.serial || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Installed:</span>
              <p className="font-medium">
                {system.install_date ? new Date(system.install_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          {system.notes && (
            <div className="mt-3 pt-3 border-t">
              <span className="text-gray-600 text-sm">Notes:</span>
              <p className="text-sm mt-1">{system.notes}</p>
            </div>
          )}
        </div>

        {/* Warranty Status */}
        {warranty && (
          <div className={`rounded-lg p-4 ${warranty.isActive ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {warranty.isActive ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <AlertTriangle size={20} className="text-red-600" />
              )}
              <h3 className="font-semibold">Warranty Status</h3>
            </div>
            <p className={`text-sm ${warranty.isActive ? 'text-green-800' : 'text-red-800'}`}>
              {warranty.isActive ? (
                <>
                  Active - Expires {warranty.date}
                  {warranty.daysRemaining < 90 && ` (${warranty.daysRemaining} days remaining)`}
                </>
              ) : (
                `Expired on ${warranty.date}`
              )}
            </p>
          </div>
        )}

        {/* Expected Lifespan */}
        {info.lifespanYears && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-blue-600" />
              <h3 className="font-semibold">Expected Lifespan</h3>
            </div>
            <p className="text-sm text-blue-800">{info.lifespanYears} years</p>
            {info.warningSign && (
              <p className="text-sm text-blue-700 mt-2">
                <strong>Replace if:</strong> {info.warningSign}
              </p>
            )}
          </div>
        )}

        {/* Owner's Manual */}
        {manualUrl && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Book size={20} className="text-primary-600" />
                <h3 className="font-semibold">Owner's Manual</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(manualUrl, '_blank')}
              >
                <ExternalLink size={16} className="mr-2" />
                Find Manual Online
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Search for your {system.brand} {system.model} owner's manual
            </p>
          </div>
        )}

        {/* Maintenance Best Practices */}
        {info.maintenance && info.maintenance.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={20} className="text-primary-600" />
              <h3 className="font-semibold">Maintenance Best Practices</h3>
            </div>
            <ul className="space-y-2">
              {info.maintenance.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Problems & Solutions */}
        {info.commonProblems && info.commonProblems.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-orange-600" />
              <h3 className="font-semibold">Common Problems & Solutions</h3>
            </div>
            <div className="space-y-4">
              {info.commonProblems.map((item, index) => (
                <div key={index} className="bg-orange-50 rounded-lg p-3">
                  <h4 className="font-medium text-sm text-orange-900 mb-2">
                    {item.problem}
                  </h4>
                  <ul className="space-y-1">
                    {item.solutions.map((solution, sIndex) => (
                      <li key={sIndex} className="text-sm text-orange-800 ml-4">
                        • {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            <X size={16} className="mr-2" />
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
