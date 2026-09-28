import React, { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import type { RecommendationList, RecommendationPackage, WingetPackage } from '../types';
import { getPackageVersions, RECOMMENDATION_LIMITS } from '../services/recommendationService';

export const recommendationFieldClass = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

interface RecommendationEditorProps {
  list: RecommendationList;
  packages: WingetPackage[];
  onChange: (list: RecommendationList) => void;
}

export const RecommendationEditor: React.FC<RecommendationEditorProps> = ({ list, packages, onChange }) => {
  const byId = useMemo(() => new Map(packages.map(pkg => [pkg.id.toLowerCase(), pkg])), [packages]);
  const updateEntry = (id: string, change: Partial<RecommendationPackage>) => {
    onChange({ ...list, packages: list.packages.map(entry => entry.id === id ? { ...entry, ...change } : entry) });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold sm:col-span-2">
          List title <span className="text-accent">*</span>
          <input autoFocus required value={list.title} maxLength={RECOMMENDATION_LIMITS.title}
            onChange={event => onChange({ ...list, title: event.target.value })}
            className={`${recommendationFieldClass} mt-2`} placeholder="My Windows essentials" />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          Author <span className="font-normal text-muted-foreground">(optional)</span>
          <input value={list.author ?? ''} maxLength={RECOMMENDATION_LIMITS.author}
            onChange={event => onChange({ ...list, author: event.target.value })}
            className={`${recommendationFieldClass} mt-2`} placeholder="Your name or community handle" />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea value={list.description ?? ''} maxLength={RECOMMENDATION_LIMITS.description} rows={2}
            onChange={event => onChange({ ...list, description: event.target.value })}
            className={`${recommendationFieldClass} mt-2 resize-y`} placeholder="Who is this list for?" />
        </label>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold">Recommended software</h3>
          <span className="text-xs text-muted-foreground">{list.packages.length} packages · Latest by default</span>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Add your own reasons, and pin a version only when it matters.</p>
        <div className="space-y-3">
          {list.packages.map(entry => {
            const pkg = byId.get(entry.id.toLowerCase());
            const versions = pkg ? getPackageVersions(pkg) : [];
            return (
              <div key={entry.id} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{pkg?.name || entry.name || entry.id}</p>
                    <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{entry.id}</p>
                  </div>
                  <button type="button" onClick={() => onChange({ ...list, packages: list.packages.filter(item => item.id !== entry.id) })}
                    aria-label={`Remove ${entry.name || entry.id} from recommendations`}
                    className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <label className="mt-4 block text-xs font-semibold">
                  Recommended version for {entry.name || entry.id}
                  <select value={entry.version ?? ''} onChange={event => updateEntry(entry.id, { version: event.target.value || undefined })}
                    className={`${recommendationFieldClass} mt-2`}>
                    <option value="">Latest available</option>
                    {entry.version && !versions.includes(entry.version) && <option value={entry.version}>{entry.version} (unavailable in index)</option>}
                    {versions.map(version => <option key={version} value={version}>{version}</option>)}
                  </select>
                </label>
                <label className="mt-3 block text-xs font-semibold">
                  Why recommend {entry.name || entry.id}? <span className="font-normal text-muted-foreground">(optional)</span>
                  <textarea value={entry.reason ?? ''} maxLength={RECOMMENDATION_LIMITS.reason} rows={2}
                    onChange={event => updateEntry(entry.id, { reason: event.target.value })}
                    className={`${recommendationFieldClass} mt-2 resize-y`} placeholder="What makes this software useful?" />
                </label>
              </div>
            );
          })}
          {list.packages.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No packages left. Close this editor and create a new list from your installation list.</p>}
        </div>
      </div>
    </div>
  );
};
