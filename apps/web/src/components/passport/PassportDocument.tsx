'use client';

/**
 * PassportDocument — Full Property Passport compositor.
 * Renders cover + nav + job history + care section.
 * Used by all three routes (operator, owner, portal).
 */

import { PassportCover } from './PassportCover';
import { PassportJobEntry } from './PassportJobEntry';
import type { PassportMaterial, PassportTrade, PassportCrew } from './PassportJobEntry';
import { PassportCareSection } from './PassportCareSection';
import { PassportNav } from './PassportNav';

export interface PassportJobData {
  jobNumber: string;
  title: string;
  completedDate: string;
  scopeSummary: string;
  rooms: string[];
  materials: PassportMaterial[];
  trades: PassportTrade[];
  crew: PassportCrew[];
}

interface PassportDocumentProps {
  address: string;
  city: string;
  homeownerName: string;
  propertyType?: string;
  photoUrl?: string;
  firstJobDate?: string;
  lastUpdated?: string;
  jobs: PassportJobData[];
  showPublish?: boolean;
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function PassportDocument({
  address,
  city,
  homeownerName,
  propertyType,
  photoUrl,
  firstJobDate,
  lastUpdated,
  jobs,
  showPublish,
  onPublish,
  isPublishing,
}: PassportDocumentProps) {
  // Collect all material names for care section
  const allMaterialNames = jobs.flatMap((j) => j.materials.map((m) => m.name));

  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* Cover */}
      <PassportCover
        address={address}
        city={city}
        homeownerName={homeownerName}
        propertyType={propertyType}
        jobCount={jobs.length}
        firstJobDate={firstJobDate}
        lastUpdated={lastUpdated}
        photoUrl={photoUrl}
      />

      {/* Sticky Nav */}
      <PassportNav
        showPublish={showPublish}
        onPublish={onPublish}
        isPublishing={isPublishing}
      />

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-12 py-12">
        {/* Job History */}
        <div id="history">
          <div className="flex items-center gap-4 mb-6 pb-3" style={{ borderBottom: '2px solid var(--charcoal)' }}>
            <span className="text-lg font-bold" style={{ color: 'var(--charcoal)' }}>Job History</span>
            <span
              className="text-[10px] uppercase tracking-[0.1em] ml-auto"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
            >
              {jobs.length} completed job{jobs.length !== 1 ? 's' : ''} — newest first
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="py-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No completed jobs on this property yet.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <PassportJobEntry
                key={job.jobNumber}
                jobNumber={job.jobNumber}
                title={job.title}
                completedDate={job.completedDate}
                scopeSummary={job.scopeSummary}
                rooms={job.rooms}
                materials={job.materials}
                trades={job.trades}
                crew={job.crew}
              />
            ))
          )}
        </div>

        {/* Care & Maintenance */}
        <PassportCareSection materialNames={allMaterialNames} />

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}
