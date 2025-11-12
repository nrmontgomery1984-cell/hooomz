import { FileText, Upload } from 'lucide-react'
import { Card } from '../../UI/Card'
import { Button } from '../../UI/Button'

const DocumentsModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-600 mt-1">Permits, contracts, plans, and change orders</p>
        </div>
        <Button variant="primary">
          <Upload size={18} className="mr-2" />
          Upload Document
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center text-gray-500">
          <FileText size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Documents Module</h3>
          <p className="mb-4">Coming soon: Document management and organization</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Permits</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Contracts</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Plans</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Change Orders</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Specifications</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DocumentsModule
