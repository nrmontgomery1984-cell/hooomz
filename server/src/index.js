// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'

// Import routes
import homesRouter from './routes/homes.js'
import roomsRouter from './routes/rooms.js'
import materialsRouter from './routes/materials.js'
import systemsRouter from './routes/systems.js'
import documentsRouter from './routes/documents.js'
import maintenanceRouter from './routes/maintenance.js'
import contractorsRouter from './routes/contractors.js'
import realtorsRouter from './routes/realtors.js'
import projectsRouter from './routes/projects.js'
import employeesRouter from './routes/employees.js'
import contactsRouter from './routes/contacts.js'
import expensesRouter from './routes/expenses.js'
import payPeriodsRouter from './routes/payPeriods.js'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 8080

// CORS middleware - must be before routes
// Allow both localhost and network access for mobile devices
const allowedOrigins = [
  'http://localhost:5173',
  'http://10.0.0.77:5173',
  'http://172.30.3.78:5173',
  'https://hooomz-client-8l77.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log(`⚠️  CORS blocked origin: ${origin}`)
      callback(null, true) // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization']
}))

// JSON body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Handle preflight requests explicitly
app.options('*', cors())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Hooomz Profile API'
  })
})

// API routes - IMPORTANT: Specific routes MUST come before generic /api mounts
app.use('/api/homes', homesRouter)
app.use('/api/contractors', contractorsRouter)
app.use('/api/realtors', realtorsRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/employees', employeesRouter)
app.use('/api/contacts', contactsRouter)
app.use('/api/expenses', expensesRouter)  // Expense tracking with receipt upload
app.use('/api/pay-periods', payPeriodsRouter)  // Pay period management for time tracking
// Generic /api mounts for nested home resources (must come AFTER specific routes)
app.use('/api', roomsRouter)  // Mount at /api so routes can be /api/homes/:homeId/rooms
app.use('/api', materialsRouter)  // Mount at /api so routes can be /api/homes/:homeId/materials
app.use('/api', systemsRouter)  // Mount at /api so routes can be /api/homes/:homeId/systems
app.use('/api', documentsRouter)  // Mount at /api so routes can be /api/homes/:homeId/documents
app.use('/api', maintenanceRouter)  // Mount at /api so routes can be /api/homes/:homeId/maintenance

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling middleware
app.use(errorHandler)

// Start server - listen on all network interfaces for mobile access
// Only start the server if not running in Vercel serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏠 Hooomz Profile API server running on port ${PORT}`)
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
    console.log(`✅ Server ready at http://localhost:${PORT}`)
    console.log(`📱 Network access: http://172.30.3.78:${PORT}`)
  })
}

// Export the Express app for Vercel serverless functions
export default app

