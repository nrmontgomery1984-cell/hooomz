import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { HardHat } from 'lucide-react'

export default function ContractorInput() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <HardHat size={40} className="text-primary-600 mr-4" />
          <div>
            <h1 className="text-3xl font-bold">Hooomz Pro™</h1>
            <p className="text-gray-600">Contractor Work Input</p>
          </div>
        </div>

        <Card>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Type
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option>Select work type</option>
                <option>Renovation</option>
                <option>Repair</option>
                <option>Installation</option>
                <option>Inspection</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="Describe the work performed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materials Used
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="List materials, brands, models..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600">Upload before/after photos</p>
              </div>
            </div>

            <Button className="w-full">Submit Work Report</Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
