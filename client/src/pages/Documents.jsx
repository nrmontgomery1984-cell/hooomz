import { useParams } from 'react-router-dom'
import { useDocuments } from '../hooks/useDocuments'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { PageHeader } from '../components/UI/PageHeader'
import { Plus, FileText, Download } from 'lucide-react'

export default function Documents() {
  const { homeId } = useParams()
  const { documents, loading, error } = useDocuments(homeId)

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Documents"
        subtitle="Upload warranties, manuals, receipts, and more"
        showBackButton={true}
        backTo={`/home/${homeId}`}
        actions={
          <Button>
            <Plus size={20} className="mr-2" />
            Upload Document
          </Button>
        }
      />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {documents.length === 0 ? (
          <Card className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Upload warranties, manuals, receipts, and more</p>
            <Button>Upload Your First Document</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <FileText size={24} className="text-primary-600" />
                  <Button variant="ghost" size="sm">
                    <Download size={16} />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mb-1">{doc.category}</h3>
                <p className="text-sm text-gray-600">{doc.file_url}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
