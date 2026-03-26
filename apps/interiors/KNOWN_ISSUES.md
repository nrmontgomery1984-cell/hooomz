# Known Issues & Limitations

Current limitations and planned improvements for the Hooomz web app.

## Features Not Yet Implemented

### Authentication
- [ ] Magic link auth (partially implemented)
- [ ] Protected routes
- [ ] Session persistence
- [ ] User profile management

### Estimating
- [ ] Calculate estimate from quantities
- [ ] Apply cost codes to imported walls
- [ ] Generate estimate PDF
- [ ] Estimate approval workflow

### Time Tracking
- [ ] Clock in/out functionality
- [ ] Time entry per task
- [ ] Time reports
- [ ] Labor cost tracking

### Change Orders
- [ ] Create change orders
- [ ] Link to floor plan elements
- [ ] Client approval workflow
- [ ] Cost impact calculation

### Photos
- [ ] Photo upload to Supabase storage
- [ ] Photo compression/optimization
- [ ] Floor plan photo pins
- [ ] Photo gallery view

### Offline Mode
- [ ] Full offline data persistence
- [ ] Sync queue for offline changes
- [ ] Conflict resolution
- [ ] Offline indicator

### WebGL Sphere
- [ ] 3D WebGL sphere renderer
- [ ] Custom shaders
- [ ] Smooth transitions between renderers
- [ ] Device capability detection

## Known Bugs

### Floor Plan
- **Pinch zoom on iOS Safari** - Sometimes requires two attempts to start zooming
- **Element highlight persistence** - Highlight may persist after closing modal on fast taps

### Import
- **Large file handling** - Files over 5MB may timeout on slow connections
- **Duplicate import** - No deduplication if same file imported twice

### Real-time
- **Initial connection delay** - First subscription may take 2-3 seconds
- **Reconnection after sleep** - Device wake from sleep may require page refresh

### Mobile
- **Keyboard overlap** - Comment input may be partially covered on some Android devices
- **Safe area** - Bottom nav may overlap home indicator on iPhone X+

## Workarounds

### "Import seems stuck"
- Check browser console for errors
- Verify JSON file is valid (try opening in text editor)
- Try smaller file first to verify setup

### "Real-time not updating"
- Check Supabase dashboard for realtime status
- Verify project_id matches in filter
- Refresh page to re-establish subscription

### "Client portal shows 'Access Denied'"
- Verify access code in URL matches project metadata
- Try without access code for demo projects
- Check project.metadata.client_access_code value

## Performance Notes

### Current Performance
- Floor plan: ~500ms initial render
- Status update: ~200ms optimistic UI
- Import: ~2-5 seconds depending on wall count

### Known Bottlenecks
- SVG parsing is synchronous
- Activity feed re-renders on every new event
- No pagination on tasks list

## pyRevit / Revit Export

### Current Limitations
- SVG export only supports walls (doors/windows coming soon)
- Curved walls export as straight line approximations
- Wall thickness may not scale correctly in all cases
- Requires floor plan view (not 3D or section views)

### Fallback Process (If pyRevit Export Fails)

If the pyRevit SVG export doesn't work:

1. **Export PDF from Revit**
   - File > Export > PDF
   - Select the floor plan view
   - Save PDF

2. **Convert PDF to SVG**
   - Use online converter: cloudconvert.com or convertio.co
   - Upload PDF, download SVG

3. **Add Hooomz attributes manually**
   - Open SVG in text editor
   - Find wall elements (usually `<path>` or `<line>`)
   - Add attributes to each wall:
   ```xml
   data-revit-id="12345"
   data-cost-code="WALL-EXT-2X6"
   data-element-type="wall"
   ```

4. **Import to Hooomz**
   - Use the modified SVG file
   - Elements without revit-id will be skipped

## Browser Support

### Tested
- Chrome 90+ (recommended)
- Safari 15+ (iOS and macOS)
- Firefox 90+
- Edge 90+

### Known Issues
- Safari: WebP images not supported in some versions
- Firefox: Some CSS animations slightly different

## Next Priorities (Post Home Show)

### Immediate (Week 1-2)
1. Fix pinch zoom on iOS Safari
2. Add photo upload
3. Implement basic auth

### Short Term (Month 1)
1. Estimating calculation
2. Full offline mode
3. WebGL sphere renderer

### Medium Term (Month 2-3)
1. Time tracking
2. Change orders
3. Push notifications

## Reporting Issues

For new issues found during the Home Show:
1. Note the exact steps to reproduce
2. Capture screenshots/screen recording if possible
3. Note device and browser version
4. Add to this document after the show

## Version

- App Version: 0.1.0 (Home Show)
- Build Date: January 2026
- Last Updated: 2026-01-26
