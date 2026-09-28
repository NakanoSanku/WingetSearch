import React, { useMemo, useState } from 'react';
import { AlertCircle, Check, ListPlus } from 'lucide-react';
import type { RecommendationList, SelectedWingetPackage, WingetPackage } from '../types';
import { getPackageVersions, resolveRecommendations, selectRecommendations } from '../services/recommendationService';
import { Button } from './Button';
import { recommendationFieldClass } from './RecommendationEditor';

interface RecommendationPreviewProps {
  list: RecommendationList;
  packages: WingetPackage[];
  existingIds: ReadonlySet<string>;
  loading: boolean;
  indexError: string | null;
  onAdd: (packages: SelectedWingetPackage[]) => void;
}

export const RecommendationPreview: React.FC<RecommendationPreviewProps> = ({ list, packages, existingIds, loading, indexError, onAdd }) => {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [versionOverrides, setVersionOverrides] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const resolved = useMemo(() => resolveRecommendations(list, packages, versionOverrides), [list, packages, versionOverrides]);
  const existingKeys = useMemo(() => new Set(Array.from(existingIds, (id: string) => id.toLowerCase())), [existingIds]);
  const indexReady = !loading && !indexError;
  const eligible = resolved.filter(item => indexReady && item.status === 'available' && !existingKeys.has(item.entry.id.toLowerCase()));
  const chosen = indexReady ? selectRecommendations(resolved, checkedIds, existingIds) : [];

  const toggle = (id: string) => {
    setNotice('');
    setCheckedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{list.packages.length} recommended packages</span>
          {list.author && <span className="break-all">By {list.author}</span>}
          <span>Created {new Date(list.createdAt).toLocaleDateString()}</span>
        </div>
        {list.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{list.description}</p>}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">Choose the software you want, then add it to your installation list to generate a PowerShell command. Your existing selections and versions are kept.</p>
      {!indexReady && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{loading ? 'Loading the package index. You can read the list while packages are checked.' : 'The package index could not be loaded. Close this list and retry loading the index to select software.'}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold" aria-live="polite">{chosen.length} selected · {eligible.length} available to add</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={eligible.length === 0} onClick={() => { setCheckedIds(new Set(eligible.map(item => item.entry.id))); setNotice(''); }}>Select available</Button>
          <Button type="button" variant="ghost" size="sm" disabled={checkedIds.size === 0} onClick={() => { setCheckedIds(new Set()); setNotice(''); }}>Clear selection</Button>
        </div>
      </div>

      <div className="space-y-3">
        {resolved.map(({ entry, pkg, selectedVersion, status }, index) => {
          const alreadyAdded = existingKeys.has(entry.id.toLowerCase());
          const available = indexReady && status === 'available' && !alreadyAdded;
          const versions = pkg ? getPackageVersions(pkg) : [];
          const labelId = `recommendation-package-${index}`;
          return (
            <div key={entry.id} className={`rounded-xl border p-4 ${available && checkedIds.has(entry.id) ? 'border-accent bg-accent/5' : 'border-border bg-white'}`}>
              <div className="flex items-start gap-3">
                <input id={`${labelId}-checkbox`} type="checkbox" checked={available && checkedIds.has(entry.id)} disabled={!available}
                  onChange={() => toggle(entry.id)} aria-labelledby={labelId}
                  className="mt-1 h-4 w-4 shrink-0 accent-accent focus-visible:outline-accent" />
                <div className="min-w-0 flex-1">
                  <label id={labelId} htmlFor={`${labelId}-checkbox`} className="block break-words font-semibold">{pkg?.name || entry.name || entry.id}</label>
                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{pkg?.id || entry.id}</p>
                  {entry.reason && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{entry.reason}</p>}
                  {alreadyAdded ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" />Already in your installation list</p>
                  ) : pkg ? (
                    <label className="mt-3 block text-xs font-semibold">
                      Install version for {pkg.name || pkg.id}
                      <select value={selectedVersion} disabled={!indexReady}
                        onChange={event => { setVersionOverrides(current => ({ ...current, [entry.id]: event.target.value })); setNotice(''); }}
                        className={`${recommendationFieldClass} mt-2`}>
                        <option value="">Latest available · {pkg.version}</option>
                        {status === 'missing-version' && <option value={selectedVersion} disabled>{selectedVersion} (unavailable)</option>}
                        {versions.map(version => <option key={version} value={version}>{version}</option>)}
                      </select>
                    </label>
                  ) : null}
                  {indexReady && status !== 'available' && !alreadyAdded && (
                    <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-amber-800">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {status === 'missing-package' ? 'Not found in the current WinGet index. This package cannot be selected.' : 'The recommended version is unavailable. Choose Latest or another available version before selecting this package.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky -bottom-6 -mx-5 border-t border-border bg-white px-5 py-4 sm:-mx-6 sm:px-6">
        {notice && <p role="status" className="mb-3 text-sm text-emerald-700">{notice}</p>}
        <Button type="button" className="w-full" disabled={chosen.length === 0}
          icon={<ListPlus className="h-4 w-4" />} onClick={() => {
            onAdd(chosen);
            setNotice(`${chosen.length} package${chosen.length === 1 ? '' : 's'} added. Close this list to review and copy your installation command.`);
            setCheckedIds(new Set());
          }}>Add {chosen.length || 'selected'} to install list</Button>
      </div>
    </div>
  );
};
