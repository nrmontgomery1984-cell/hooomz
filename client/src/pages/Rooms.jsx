import { useParams } from 'react-router-dom'
import { useRooms } from '../hooks/useRooms'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { PageHeader } from '../components/UI/PageHeader'
import { Plus, DoorOpen } from 'lucide-react'

export default function Rooms() {
  const { homeId } = useParams()
  const { rooms, loading, error } = useRooms(homeId)

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Rooms"
        subtitle="Document and organize your home's rooms"
        showBackButton={true}
        backTo={`/home/${homeId}`}
        actions={
          <Button>
            <Plus size={20} className="mr-2" />
            Add Room
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {rooms.length === 0 ? (
          <Card className="text-center py-12">
            <DoorOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No rooms yet</h3>
            <p className="text-gray-600 mb-6">Start documenting your home's rooms</p>
            <Button>Add Your First Room</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                <p className="text-sm text-gray-600">Floor: {room.floor || 'N/A'}</p>
                {room.notes && <p className="text-sm text-gray-600 mt-2">{room.notes}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
