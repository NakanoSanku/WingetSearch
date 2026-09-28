import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Download, FileJson, FolderOpen, Pencil, Share2, Upload, X } from 'lucide-react';
import type { RecommendationList, SelectedWingetPackage, WingetPackage } from '../types';
import {
  createRecommendationList, MAX_RECOMMENDATION_BYTES, MAX_RECOMMENDATION_PACKAGES,
  parseRecommendationList, recommendationFileName, serializeRecommendationList,
} from '../services/recommendationService';
import { Button } from './Button';
import { RecommendationEditor, recommendationFieldClass } from './RecommendationEditor';
import { RecommendationPreview } from './RecommendationPreview';

export interface RecommendationListsHandle {
  createFromSelection: () => void;
}

interface RecommendationListsProps {
  ref?: React.Ref<RecommendationListsHandle>;
  packages: WingetPackage[];
  selectedPackages: SelectedWingetPackage[];
  selectedIds: ReadonlySet<string>;
  loading: boolean;
  indexError: string | null;
  onOpen: () => void;
  onAdd: (packages: SelectedWingetPackage[]) => void;
}

export const RecommendationLists: React.FC<RecommendationListsProps> = ({ ref, packages, selectedPackages, selectedIds, loading, indexError, onOpen, onAdd }) => {
  const [mode, setMode] = useState<'edit' | 'view' | 'import' | null>(null);
  const [list, setList] = useState<RecommendationList | null>(null);
  const [editable, setEditable] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pastedJson, setPastedJson] = useState('');
  const [reading, setReading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const importSequence = useRef(0);
  const canCreate = selectedPackages.length > 0 && selectedPackages.length <= MAX_RECOMMENDATION_PACKAGES;

  const open = (nextMode: typeof mode) => {
    importSequence.current += 1;
    setReading(false);
    setError('');
    setNotice('');
    setMode(nextMode);
    onOpen();
  };
  const close = () => {
    importSequence.current += 1;
    setReading(false);
    setMode(null);
  };
  const beginCreate = () => {
    if (!canCreate) return;
    setList(createRecommendationList(selectedPackages));
    setEditable(true);
    setWarnings([]);
    open('edit');
  };
  useImperativeHandle(ref, () => ({ createFromSelection: beginCreate }));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mode) {
      dialog?.close();
      return;
    }
    if (dialog && !dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mode]);

  const importJson = (json: string) => {
    const imported = parseRecommendationList(json);
    setList(imported.list);
    setWarnings(imported.warnings);
    setEditable(false);
    setError('');
    setNotice('');
    setPastedJson('');
    setMode('view');
  };

  const readFile = async (file: File) => {
    const sequence = ++importSequence.current;
    setReading(true);
    setError('');
    try {
      if (file.size > MAX_RECOMMENDATION_BYTES) throw new Error('This file is too large. Choose a JSON file up to 1 MB.');
      const json = await file.text();
      if (sequence === importSequence.current) importJson(json);
    } catch (err) {
      if (sequence === importSequence.current) setError(err instanceof Error ? err.message : 'The file could not be read. Please try again.');
    } finally {
      if (sequence === importSequence.current) setReading(false);
    }
  };

  const exportList = () => {
    if (!list) return;
    setError('');
    try {
      const json = serializeRecommendationList(list);
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = recommendationFileName(list.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('JSON exported. Share this file with your community so others can import it here.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The list could not be exported.');
    }
  };

  const preview = () => {
    if (!list) return;
    try {
      setList(parseRecommendationList(serializeRecommendationList(list)).list);
      setError('');
      setNotice('');
      setMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please check your list.');
    }
  };

  return (
    <>
      <section aria-labelledby="community-lists-title" className="mb-8 rounded-2xl border border-accent/20 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Share2 className="h-5 w-5" /></span>
            <div>
              <h2 id="community-lists-title" className="font-display text-xl">Community lists</h2>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">Share your software picks and why you recommend them. Import a list and choose what to install.</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => open('import')} icon={<Upload className="h-4 w-4" />}>Import list</Button>
            <Button type="button" size="sm" disabled={!canCreate} onClick={beginCreate} icon={<Share2 className="h-4 w-4" />}>Create list{selectedPackages.length > 0 ? ` (${selectedPackages.length})` : ''}</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>{selectedPackages.length > MAX_RECOMMENDATION_PACKAGES ? `Choose up to ${MAX_RECOMMENDATION_PACKAGES} packages to create a list.` : 'Add software to your installation list to create a recommendation file. JSON · up to 200 packages.'}</p>
          {list && <button type="button" onClick={() => open(editable ? 'edit' : 'view')} className="inline-flex items-center gap-1.5 rounded-md p-1 font-semibold text-accent hover:underline focus-visible:outline-accent"><FolderOpen className="h-3.5 w-3.5" />Reopen {editable ? 'draft' : 'imported list'}</button>}
        </div>
      </section>

      <dialog ref={dialogRef} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setMode(null)}
        aria-labelledby="recommendation-dialog-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white p-0 text-foreground shadow-2xl backdrop:bg-slate-950/50 open:flex">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5 sm:px-6">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-accent">Community lists</p>
            <h2 id="recommendation-dialog-title" className="break-words text-xl font-bold">{mode === 'import' ? 'Import recommendations' : mode === 'edit' ? 'Create a recommendation list' : list?.title}</h2>
          </div>
          <button type="button" onClick={close} aria-label="Close recommendation list" className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
          {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          {mode === 'import' ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-6 text-center">
                <FileJson className="mx-auto mb-3 h-8 w-8 text-accent" />
                <p className="mb-1 font-semibold">Open a recommendation file</p>
                <p className="mb-4 text-sm text-muted-foreground">Choose a JSON file exported by Winget Search. Up to 1 MB.</p>
                <input ref={fileRef} type="file" accept=".json,application/json" aria-label="Recommendation JSON file" className="sr-only" disabled={reading}
                  onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void readFile(file); }} />
                <Button type="button" isLoading={reading} onClick={() => fileRef.current?.click()} icon={<Upload className="h-4 w-4" />}>Choose JSON file</Button>
              </div>
              <details className="rounded-xl border border-border p-4">
                <summary className="cursor-pointer text-sm font-semibold">Or paste recommendation JSON</summary>
                <label className="mt-4 block text-xs font-semibold">Recommendation JSON
                  <textarea value={pastedJson} onChange={event => setPastedJson(event.target.value)} rows={6} maxLength={MAX_RECOMMENDATION_BYTES}
                    className={`${recommendationFieldClass} mt-2 font-mono text-xs`} placeholder={'{ "format": "winget-search-recommendations", ... }'} />
                </label>
                <Button type="button" size="sm" className="mt-3" disabled={!pastedJson.trim() || reading} onClick={() => {
                  try { importJson(pastedJson); } catch (err) { setError(err instanceof Error ? err.message : 'The JSON could not be read.'); }
                }}>Read list</Button>
              </details>
              <p className="text-xs leading-relaxed text-muted-foreground">Your file is read in this browser. Importing opens a preview; choose packages before adding them to your installation list.</p>
            </div>
          ) : list && (
            <>
              {warnings.length > 0 && <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{warnings.map((warning, index) => <p key={index} className="break-words">{warning}</p>)}</div>}
              {mode === 'edit' ? <RecommendationEditor list={list} packages={packages} onChange={next => { setList(next); setError(''); setNotice(''); }} />
                : <RecommendationPreview list={list} packages={packages} existingIds={selectedIds} loading={loading} indexError={indexError} onAdd={onAdd} />}
            </>
          )}
        </div>

        {mode && mode !== 'import' && list && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
          {mode === 'edit' ? <Button type="button" variant="secondary" size="sm" disabled={!list.title.trim() || list.packages.length === 0} onClick={preview}>Preview list</Button>
            : editable && <Button type="button" variant="secondary" size="sm" onClick={() => setMode('edit')} icon={<Pencil className="h-4 w-4" />}>Edit list</Button>}
          <Button type="button" variant={mode === 'edit' ? 'primary' : 'secondary'} size="sm" disabled={!list.title.trim() || list.packages.length === 0} onClick={exportList} icon={<Download className="h-4 w-4" />}>Export JSON</Button>
        </div>}
      </dialog>
    </>
  );
};
