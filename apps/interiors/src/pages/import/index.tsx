import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../hooks';
import {
  importRevitBundle,
  generateImportPreview,
  parseJsonFile,
  isJsonFile,
  isSvgFile,
  validateSvgContent,
  parseSvgFile,
} from '../../services/import';
import type { ImportPreview } from '../../types/revit';
import { Button, Card, LoadingSpinner } from '../../components/ui';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEMO_COMPANY_ID = '11111111-1111-1111-1111-111111111111'; // Brisso Construction from seed

// ============================================================================
// IMPORT PAGE COMPONENT
// ============================================================================

export default function ImportPage() {
  const navigate = useNavigate();
  const { company, profile, isLoading: companyLoading } = useCompany();
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);

  // JSON State
  const [isJsonDragging, setIsJsonDragging] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  // SVG State
  const [isSvgDragging, setIsSvgDragging] = useState(false);
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [svgElementCount, setSvgElementCount] = useState<number>(0);

  // General State
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Handle JSON file selection
  const handleJsonSelect = useCallback(async (file: File) => {
    setImportError(null);

    if (!isJsonFile(file)) {
      setImportError('Please select a JSON file');
      return;
    }

    try {
      const json = await parseJsonFile(file);
      const importPreview = generateImportPreview(json);

      setJsonFile(file);
      setPreview(importPreview);

      if (!importPreview.isValid) {
        setImportError(`Invalid file: ${importPreview.validationErrors.join(', ')}`);
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to parse file');
      setJsonFile(null);
      setPreview(null);
    }
  }, []);

  // Handle SVG file selection
  const handleSvgSelect = useCallback(async (file: File) => {
    setImportError(null);

    if (!isSvgFile(file)) {
      setImportError('Please select an SVG file');
      return;
    }

    try {
      const content = await parseSvgFile(file);
      const validation = validateSvgContent(content);

      if (!validation.isValid) {
        setImportError(`Invalid SVG: ${validation.error}`);
        return;
      }

      setSvgFile(file);
      setSvgElementCount(validation.elementCount);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to parse SVG');
      setSvgFile(null);
      setSvgElementCount(0);
    }
  }, []);

  // JSON Drag and drop handlers
  const handleJsonDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsJsonDragging(true);
  }, []);

  const handleJsonDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsJsonDragging(false);
  }, []);

  const handleJsonDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsJsonDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleJsonSelect(files[0]);
    }
  }, [handleJsonSelect]);

  // SVG Drag and drop handlers
  const handleSvgDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsSvgDragging(true);
  }, []);

  const handleSvgDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsSvgDragging(false);
  }, []);

  const handleSvgDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsSvgDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleSvgSelect(files[0]);
    }
  }, [handleSvgSelect]);

  // File input change handlers
  const handleJsonInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleJsonSelect(files[0]);
    }
  }, [handleJsonSelect]);

  const handleSvgInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleSvgSelect(files[0]);
    }
  }, [handleSvgSelect]);

  // Click to browse
  const handleJsonBrowseClick = useCallback(() => {
    jsonInputRef.current?.click();
  }, []);

  const handleSvgBrowseClick = useCallback(() => {
    svgInputRef.current?.click();
  }, []);

  // Clear selection
  const handleClear = useCallback(() => {
    setJsonFile(null);
    setPreview(null);
    setSvgFile(null);
    setSvgElementCount(0);
    setImportError(null);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
    if (svgInputRef.current) svgInputRef.current.value = '';
  }, []);

  // Clear SVG only
  const handleClearSvg = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSvgFile(null);
    setSvgElementCount(0);
    if (svgInputRef.current) svgInputRef.current.value = '';
  }, []);

  // Import handler
  const handleImport = useCallback(async () => {
    if (!jsonFile || !preview?.isValid) return;

    const companyId = company?.id || DEMO_COMPANY_ID;
    const userId = profile?.id || '';

    setIsImporting(true);
    setImportError(null);

    try {
      const result = await importRevitBundle(
        companyId,
        userId,
        jsonFile,
        svgFile || undefined
      );

      navigate(`/project/${result.projectId}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
      setIsImporting(false);
    }
  }, [jsonFile, svgFile, preview, company, profile, navigate]);

  // Render loading state
  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Import Project</h1>
        <p className="text-gray-600 mt-1">Import from Revit JSON + SVG floor plan</p>
      </header>

      {/* Demo mode warning */}
      {!company && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <strong>Demo Mode:</strong> Not logged in. Project will be imported to Brisso Construction demo company.
        </div>
      )}

      <main className="max-w-2xl">
        {/* JSON Drop Zone */}
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Quantities (JSON) <span className="text-red-500">*</span>
          </h3>
          <div
            onDragOver={handleJsonDragOver}
            onDragLeave={handleJsonDragLeave}
            onDrop={handleJsonDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isJsonDragging
                ? 'border-blue-500 bg-blue-50'
                : jsonFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onClick={handleJsonBrowseClick}
          >
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleJsonInputChange}
              className="hidden"
            />

            {jsonFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="text-green-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{jsonFile.name}</p>
                  <p className="text-sm text-gray-500">{(jsonFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-2">
                  <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-medium text-gray-700">
                  {isJsonDragging ? 'Drop JSON here' : 'Drop Revit JSON export'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or <span className="text-blue-600 underline">browse</span>
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* SVG Drop Zone (Optional) */}
        <Card className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Floor Plan (SVG) <span className="text-gray-400">optional</span>
          </h3>
          <div
            onDragOver={handleSvgDragOver}
            onDragLeave={handleSvgDragLeave}
            onDrop={handleSvgDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isSvgDragging
                ? 'border-purple-500 bg-purple-50'
                : svgFile
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onClick={handleSvgBrowseClick}
          >
            <input
              ref={svgInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleSvgInputChange}
              className="hidden"
            />

            {svgFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="text-purple-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">{svgFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {svgElementCount} linkable elements
                  </p>
                </div>
                <button
                  onClick={handleClearSvg}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Remove SVG"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-2">
                  <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-700">
                  {isSvgDragging ? 'Drop SVG here' : 'Drop floor plan SVG'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or <span className="text-blue-600 underline">browse</span>
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {importError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <strong>Error:</strong> {importError}
          </div>
        )}

        {/* Preview */}
        {preview && preview.isValid && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Import Preview</h2>
              {svgFile && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Floor plan included
                </span>
              )}
            </div>

            <div className="space-y-4">
              {/* Project Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Name</label>
                  <p className="text-gray-900">{preview.projectName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Number</label>
                  <p className="text-gray-900">{preview.projectNumber || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-gray-900">{preview.clientName || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{preview.address || '—'}</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Counts */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">{preview.wallCount}</p>
                  <p className="text-sm text-gray-500">Walls</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">{preview.levels.length}</p>
                  <p className="text-sm text-gray-500">Levels</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-blue-600">{preview.wallTypes.length}</p>
                  <p className="text-sm text-gray-500">Wall Types</p>
                </div>
              </div>

              {/* Levels */}
              <div>
                <label className="text-sm font-medium text-gray-500">Levels</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preview.levels.map((level) => (
                    <span
                      key={level}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </div>

              {/* Wall Types */}
              <div>
                <label className="text-sm font-medium text-gray-500">Wall Types</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {preview.wallTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {(jsonFile || svgFile) && (
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={isImporting}
            >
              Clear All
            </Button>
          )}

          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!preview?.isValid || isImporting}
            className="flex-1"
          >
            {isImporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Importing...
              </>
            ) : (
              `Import Project${svgFile ? ' + Floor Plan' : ''}`
            )}
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-6 text-sm text-gray-500">
          Export JSON and SVG from Revit using the Hooomz pyRevit buttons.
          The project will be created with all walls as trackable tasks.
          {!svgFile && ' Add an SVG for interactive floor plan navigation.'}
        </p>
      </main>
    </div>
  );
}
