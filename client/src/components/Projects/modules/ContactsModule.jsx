import { Users, UserPlus } from 'lucide-react'
import { Card } from '../../UI/Card'
import { Button } from '../../UI/Button'

const ContactsModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
          <p className="text-gray-600 mt-1">Team members, contractors, and professionals</p>
        </div>
        <Button variant="primary">
          <UserPlus size={18} className="mr-2" />
          Add Contact
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center text-gray-500">
          <Users size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Contacts Module</h3>
          <p className="mb-4">Coming soon: Comprehensive contact management</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Team Members</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Contractors</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Subcontractors</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Architects</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Engineers</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Vendors</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ContactsModule
