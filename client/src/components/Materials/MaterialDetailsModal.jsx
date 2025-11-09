import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import { RelatedItemsSection } from '../UI/RelatedItemsSection'
import {
  ExternalLink,
  Package,
  ShoppingCart,
  Sparkles,
  AlertTriangle,
  Info,
  X
} from 'lucide-react'

// Knowledge base for different material types
const MATERIAL_INFO = {
  'Flooring': {
    purchaseLocations: [
      { name: 'Home Depot', url: 'https://www.homedepot.com/b/Flooring/N-5yc1vZaq7f' },
      { name: 'Lowes', url: 'https://www.lowes.com/c/Flooring-Flooring' },
      { name: 'Floor & Decor', url: 'https://www.flooranddecor.com/' },
      { name: 'Lumber Liquidators', url: 'https://www.lumberliquidators.com/' }
    ],
    cleaningProducts: [
      'Bona Hardwood Floor Cleaner (for hardwood)',
      'Black Diamond Stoneworks Floor Cleaner (for tile/stone)',
      'Bissell CrossWave (for vinyl/laminate)',
      'Microfiber mop and warm water (general maintenance)'
    ],
    cleaningTechniques: [
      'Sweep or vacuum regularly to remove dirt and grit',
      'Use doormats to reduce tracked-in debris',
      'Wipe spills immediately to prevent staining',
      'Avoid excessive water - use damp (not wet) mop',
      'Follow manufacturer\'s specific cleaning recommendations',
      'Use felt pads under furniture legs to prevent scratches'
    ],
    maintenanceTips: [
      'Hardwood: Refinish every 7-10 years as needed',
      'Tile: Re-grout every 5-10 years',
      'Vinyl: Avoid rubber-backed rugs (can cause yellowing)',
      'Laminate: Never use steam cleaners',
      'All types: Maintain consistent humidity (30-50%)'
    ],
    commonIssues: [
      {
        problem: 'Scratches and scuffs',
        solutions: [
          'Minor scratches: Use manufacturer\'s touch-up kit',
          'Deep scratches in hardwood: May require professional sanding',
          'Laminate: Use laminate floor repair markers',
          'Tile: Replace individual damaged tiles'
        ]
      },
      {
        problem: 'Water damage or staining',
        solutions: [
          'Act quickly - blot spills immediately',
          'Hardwood: Sand and refinish affected area',
          'Tile: Clean grout with baking soda paste',
          'Vinyl: Use manufacturer-approved stain remover'
        ]
      }
    ]
  },
  'Paint': {
    purchaseLocations: [
      { name: 'Sherwin-Williams', url: 'https://www.sherwin-williams.com/' },
      { name: 'Benjamin Moore', url: 'https://www.benjaminmoore.com/' },
      { name: 'Home Depot (Behr)', url: 'https://www.homedepot.com/b/Paint/N-5yc1vZar7h' },
      { name: 'Lowes (Valspar)', url: 'https://www.lowes.com/c/Paint-Paint' }
    ],
    cleaningProducts: [
      'Mild dish soap and warm water (for most paint)',
      'Mr. Clean Magic Eraser (for scuff marks)',
      'TSP (Trisodium Phosphate) for deep cleaning',
      'Soft microfiber cloths or sponges'
    ],
    cleaningTechniques: [
      'Dust walls regularly with microfiber duster',
      'For spot cleaning: Use damp cloth with mild soap',
      'Always test in inconspicuous area first',
      'Blot stains gently - don\'t scrub aggressively',
      'Rinse with clean water after cleaning',
      'Semi-gloss/satin finishes are more washable than flat/matte'
    ],
    maintenanceTips: [
      'Keep paint formula/color codes for touch-ups',
      'Touch up scuffs and marks as they occur',
      'Full room repaint typically needed every 5-7 years',
      'High-traffic areas may need repainting more frequently',
      'Store leftover paint properly (sealed, room temperature)'
    ],
    commonIssues: [
      {
        problem: 'Scuff marks and fingerprints',
        solutions: [
          'Magic Eraser works well on most painted surfaces',
          'Mild soap and water for gentle cleaning',
          'Touch up with original paint if cleaning doesn\'t work',
          'Consider switching to semi-gloss in high-traffic areas'
        ]
      },
      {
        problem: 'Fading or discoloration',
        solutions: [
          'UV exposure causes fading - use window treatments',
          'Smoke/cooking can cause yellowing',
          'Touch up or repaint affected areas',
          'Use paint with UV protection for sunny rooms'
        ]
      }
    ]
  },
  'Countertop': {
    purchaseLocations: [
      { name: 'Home Depot', url: 'https://www.homedepot.com/b/Kitchen-Countertops/N-5yc1vZar30' },
      { name: 'Lowes', url: 'https://www.lowes.com/c/Countertops-Kitchen' },
      { name: 'Ikea', url: 'https://www.ikea.com/us/en/cat/countertops-24264/' },
      { name: 'Local fabricators (for stone)' }
    ],
    cleaningProducts: [
      'Granite/Marble: pH-neutral stone cleaner',
      'Quartz: Mild dish soap and water',
      'Laminate: All-purpose cleaner',
      'Butcher block: Mineral oil and wood cleaner',
      'Avoid: Bleach, acidic cleaners (lemon, vinegar) on stone'
    ],
    cleaningTechniques: [
      'Wipe up spills immediately, especially acidic substances',
      'Use cutting boards - never cut directly on countertop',
      'Hot pads/trivets for hot pots and pans',
      'Daily cleaning: Damp microfiber cloth',
      'Disinfecting: Use approved products for your material',
      'Granite/Marble: Re-seal annually'
    ],
    maintenanceTips: [
      'Granite/Marble: Seal once or twice yearly',
      'Quartz: No sealing needed (non-porous)',
      'Butcher block: Oil monthly with food-safe mineral oil',
      'Laminate: Repair chips promptly to prevent water damage',
      'All types: Use trivets and cutting boards consistently'
    ],
    commonIssues: [
      {
        problem: 'Stains',
        solutions: [
          'Stone: Poultice treatment for deep stains',
          'Quartz: Baking soda paste for stubborn spots',
          'Laminate: Magic Eraser for surface stains',
          'Prevention: Wipe spills immediately, especially wine, coffee, oils'
        ]
      },
      {
        problem: 'Scratches or chips',
        solutions: [
          'Granite: Professional repair for chips',
          'Quartz: Contact manufacturer for repair kit',
          'Laminate: Laminate repair paste or markers',
          'Prevention: Always use cutting boards'
        ]
      }
    ]
  },
  'Tile': {
    purchaseLocations: [
      { name: 'Floor & Decor', url: 'https://www.flooranddecor.com/tile' },
      { name: 'The Tile Shop', url: 'https://www.tileshop.com/' },
      { name: 'Home Depot', url: 'https://www.homedepot.com/b/Flooring-Tile/N-5yc1vZaq3l' },
      { name: 'Lowes', url: 'https://www.lowes.com/c/Tile-Tile-Tile-accessories' }
    ],
    cleaningProducts: [
      'Mild dish soap and water (daily cleaning)',
      'Grout cleaner (e.g., Grout-EEZ, OxiClean)',
      'Tile and grout brush',
      'Avoid: Acidic cleaners on natural stone tile',
      'Steam cleaner (for deep cleaning ceramic/porcelain)'
    ],
    cleaningTechniques: [
      'Sweep or vacuum regularly to prevent grit scratching',
      'Mop with mild soap solution weekly',
      'Clean grout lines with brush and grout cleaner monthly',
      'Seal grout lines every 1-2 years',
      'For soap scum (bathroom): Squeegee after each shower',
      'Natural stone: Use pH-neutral cleaners only'
    ],
    maintenanceTips: [
      'Re-seal grout annually in wet areas (bathrooms, kitchens)',
      'Re-caulk around tubs/showers every 2-3 years',
      'Replace cracked tiles promptly to prevent water damage',
      'Natural stone tile: Seal according to manufacturer specs',
      'Keep spare tiles for future repairs'
    ],
    commonIssues: [
      {
        problem: 'Dirty or moldy grout',
        solutions: [
          'Scrub with baking soda and hydrogen peroxide paste',
          'Use grout brush or old toothbrush',
          'Commercial grout cleaner for tough stains',
          'For severe mold: Diluted bleach solution (test first)',
          'Re-seal grout after deep cleaning'
        ]
      },
      {
        problem: 'Cracked or loose tiles',
        solutions: [
          'Remove damaged tile and clean substrate',
          'Apply fresh thinset mortar',
          'Replace with matching tile (from spare stash)',
          'Re-grout around replacement',
          'For extensive damage: Consult professional'
        ]
      }
    ]
  },
  'Fixture': {
    purchaseLocations: [
      { name: 'Home Depot', url: 'https://www.homedepot.com/b/Bath/N-5yc1vZbzb3' },
      { name: 'Lowes', url: 'https://www.lowes.com/c/Bathroom-fixtures-Bath' },
      { name: 'Ferguson', url: 'https://www.ferguson.com/' },
      { name: 'Wayfair', url: 'https://www.wayfair.com/home-improvement/sb0/bathroom-fixtures-c215386.html' }
    ],
    cleaningProducts: [
      'Mild dish soap and water (safest for all finishes)',
      'White vinegar solution for mineral deposits',
      'Soft microfiber cloths',
      'Avoid: Abrasive cleaners, steel wool',
      'Chrome/Stainless: Stainless steel cleaner',
      'Brass/Bronze: Brass polish (for unlacquered finishes)'
    ],
    cleaningTechniques: [
      'Wipe down weekly with damp cloth and mild soap',
      'Dry thoroughly to prevent water spots',
      'For mineral buildup: Soak with vinegar, then scrub gently',
      'Clean aerators monthly to maintain water flow',
      'Polish chrome/stainless with appropriate cleaner',
      'Never use abrasive scrubbers on plated finishes'
    ],
    maintenanceTips: [
      'Check for leaks monthly around connections',
      'Replace worn washers/cartridges as needed',
      'Clean aerators to maintain water pressure',
      'Tighten loose handles or connections',
      'For finishes: Follow manufacturer care instructions',
      'Keep product manuals and warranty info'
    ],
    commonIssues: [
      {
        problem: 'Dripping faucet',
        solutions: [
          'Usually caused by worn washer or O-ring',
          'Turn off water supply before disassembling',
          'Replace cartridge or repair kit (specific to brand)',
          'Consider calling plumber if unfamiliar with repair'
        ]
      },
      {
        problem: 'Water spots or mineral buildup',
        solutions: [
          'Soak with white vinegar solution (50/50)',
          'Use soft cloth or old toothbrush to scrub',
          'For stubborn deposits: CLR or Lime-Away',
          'Prevention: Dry fixtures after each use'
        ]
      }
    ]
  }
}

// Material to system/maintenance mapping
const MATERIAL_RELATED_SYSTEMS = {
  'Flooring': ['HVAC'],
  'Paint': [],
  'Countertop': [],
  'Tile': [],
  'Fixture': ['Water Heater']
}

const MATERIAL_RELATED_MAINTENANCE = {
  'Flooring': ['Replace HVAC Filter', 'Clean Gutters'],
  'Paint': ['Seal Windows and Doors'],
  'Countertop': [],
  'Tile': ['Clean Gutters'],
  'Fixture': ['Flush Water Heater', 'Test Smoke Detectors']
}

export const MaterialDetailsModal = ({ material, isOpen, onClose, homeId, relatedSystems = [], relatedMaintenance = [], relatedDocuments = [] }) => {
  if (!material) return null

  const info = MATERIAL_INFO[material.category] || {}

  // Filter related items based on material category
  const suggestedSystems = MATERIAL_RELATED_SYSTEMS[material.category] || []
  const suggestedMaintenance = MATERIAL_RELATED_MAINTENANCE[material.category] || []

  const filteredSystems = relatedSystems.filter(s =>
    suggestedSystems.includes(s.type)
  )

  const filteredMaintenance = relatedMaintenance.filter(m =>
    suggestedMaintenance.includes(m.name)
  )

  // Filter documents related to this material (Warranty, Manual, etc.)
  const filteredDocuments = relatedDocuments.filter(d =>
    d.category === 'Warranty' || d.category === 'Manual'
  ).slice(0, 3)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${material.category} Details`} size="large">
      <div className="space-y-6">
        {/* Material Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Material Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Category:</span>
              <p className="font-medium capitalize">{material.category}</p>
            </div>
            {material.brand && (
              <div>
                <span className="text-gray-600">Brand:</span>
                <p className="font-medium">{material.brand}</p>
              </div>
            )}
            {material.model && (
              <div>
                <span className="text-gray-600">Model:</span>
                <p className="font-medium">{material.model}</p>
              </div>
            )}
            {material.color && (
              <div>
                <span className="text-gray-600">Color:</span>
                <p className="font-medium">{material.color}</p>
              </div>
            )}
            {material.supplier && (
              <div>
                <span className="text-gray-600">Supplier:</span>
                <p className="font-medium">{material.supplier}</p>
              </div>
            )}
            {material.purchase_price && (
              <div>
                <span className="text-gray-600">Purchase Price:</span>
                <p className="font-medium text-green-700">
                  ${material.purchase_price.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          {material.notes && (
            <div className="mt-3 pt-3 border-t">
              <span className="text-gray-600 text-sm">Notes:</span>
              <p className="text-sm mt-1">{material.notes}</p>
            </div>
          )}
        </div>

        {/* Where to Purchase */}
        {info.purchaseLocations && info.purchaseLocations.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={20} className="text-primary-600" />
              <h3 className="font-semibold">Where to Purchase</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {info.purchaseLocations.map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => window.open(location.url, '_blank')}
                >
                  <ExternalLink size={16} className="mr-2" />
                  {location.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Cleaning Products */}
        {info.cleaningProducts && info.cleaningProducts.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} className="text-primary-600" />
              <h3 className="font-semibold">Recommended Cleaning Products</h3>
            </div>
            <ul className="space-y-2">
              {info.cleaningProducts.map((product, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Package size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{product}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cleaning Techniques */}
        {info.cleaningTechniques && info.cleaningTechniques.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={20} className="text-blue-600" />
              <h3 className="font-semibold">Cleaning Techniques & Best Practices</h3>
            </div>
            <ul className="space-y-2">
              {info.cleaningTechniques.map((technique, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{technique}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Maintenance Tips */}
        {info.maintenanceTips && info.maintenanceTips.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Package size={20} className="text-purple-600" />
              <h3 className="font-semibold">Maintenance Tips</h3>
            </div>
            <ul className="space-y-2">
              {info.maintenanceTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Info size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Issues & Solutions */}
        {info.commonIssues && info.commonIssues.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-orange-600" />
              <h3 className="font-semibold">Common Issues & Solutions</h3>
            </div>
            <div className="space-y-4">
              {info.commonIssues.map((item, index) => (
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

        {/* Related Items & Navigation */}
        <RelatedItemsSection
          homeId={homeId}
          systems={filteredSystems}
          maintenance={filteredMaintenance}
          documents={filteredDocuments}
          onNavigate={onClose}
        />

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
