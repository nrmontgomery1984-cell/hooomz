import supabase from './src/utils/supabase.js'

/**
 * Script to check existing time entries in the database
 * This will help verify if Nishant's time entries exist
 */

async function checkTimeEntries() {
  try {
    console.log('🔍 Checking time entries in database...\n')

    // Get all time entries
    const { data: allEntries, error: allError } = await supabase
      .from('time_entries')
      .select('*')
      .order('start_time', { ascending: false })

    if (allError) {
      console.error('❌ Error fetching time entries:', allError)
      return
    }

    console.log(`📊 Total time entries found: ${allEntries?.length || 0}\n`)

    if (allEntries && allEntries.length > 0) {
      // Group by worker name
      const byWorker = {}
      let totalMinutes = 0

      allEntries.forEach(entry => {
        const worker = entry.worker_name || 'Unknown'
        if (!byWorker[worker]) {
          byWorker[worker] = {
            count: 0,
            totalMinutes: 0,
            entries: []
          }
        }
        byWorker[worker].count++
        byWorker[worker].totalMinutes += entry.duration_minutes || 0
        byWorker[worker].entries.push(entry)
        totalMinutes += entry.duration_minutes || 0
      })

      console.log('👥 Time entries by worker:')
      console.log('─'.repeat(60))

      Object.keys(byWorker).sort().forEach(worker => {
        const data = byWorker[worker]
        const hours = (data.totalMinutes / 60).toFixed(2)
        console.log(`\n${worker}:`)
        console.log(`  • Total entries: ${data.count}`)
        console.log(`  • Total hours: ${hours}h (${data.totalMinutes} minutes)`)
        console.log(`  • Latest entry: ${data.entries[0]?.start_time || 'N/A'}`)

        // Show if there are any completed entries
        const completed = data.entries.filter(e => e.end_time !== null)
        const active = data.entries.filter(e => e.end_time === null)
        console.log(`  • Completed: ${completed.length}, Active: ${active.length}`)
      })

      console.log('\n' + '─'.repeat(60))
      console.log(`\n💰 Grand Total: ${(totalMinutes / 60).toFixed(2)} hours across all workers\n`)

      // Check specifically for Nishant
      const nishantData = byWorker['Nishant'] || byWorker['nishant']
      if (nishantData) {
        console.log('✅ Nishant\'s time entries FOUND in database!')
        console.log(`   The bug was only in the display - all ${nishantData.count} entries are saved.\n`)
      } else {
        console.log('⚠️  No entries found for "Nishant" - check if name matches exactly\n')
        console.log('   Available worker names:', Object.keys(byWorker).join(', '))
      }

      // Check for entries with scope_item_id to verify structure
      const withScopeItem = allEntries.filter(e => e.scope_item_id)
      console.log(`\n🔗 Entries with scope_item_id: ${withScopeItem.length}/${allEntries.length}`)

      // Check for entries without end_time (still running)
      const activeEntries = allEntries.filter(e => !e.end_time)
      if (activeEntries.length > 0) {
        console.log(`\n⏱️  Active (running) timers: ${activeEntries.length}`)
        activeEntries.forEach(entry => {
          console.log(`   • ${entry.worker_name} started at ${entry.start_time}`)
        })
      }

    } else {
      console.log('⚠️  No time entries found in database')
      console.log('   This could mean:')
      console.log('   1. No one has used the time tracker yet')
      console.log('   2. There\'s a database connection issue')
      console.log('   3. The table name or structure is different\n')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the check
checkTimeEntries()
  .then(() => {
    console.log('✅ Check complete!')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })
