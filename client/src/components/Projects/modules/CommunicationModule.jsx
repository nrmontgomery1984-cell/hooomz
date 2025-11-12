import { MessageSquare, Send } from 'lucide-react'
import { Card } from '../../UI/Card'
import { Button } from '../../UI/Button'

const CommunicationModule = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
          <p className="text-gray-600 mt-1">Messages, updates, and notifications</p>
        </div>
        <Button variant="primary">
          <Send size={18} className="mr-2" />
          New Message
        </Button>
      </div>

      <Card className="p-12">
        <div className="text-center text-gray-500">
          <MessageSquare size={64} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Communication Module</h3>
          <p className="mb-4">Coming soon: Team messaging and client updates</p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">Team Chat</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Client Updates</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Notifications</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Email Integration</span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">Comments</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CommunicationModule
