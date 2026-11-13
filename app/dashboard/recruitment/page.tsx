'use client';

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  Briefcase,
  Plus,
  Search,
  Star,
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { Candidate, RecruitmentStage } from '@/lib/types/hr';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';

const STAGES: RecruitmentStage[] = [
  'Applied',
  'Screening',
  'Interview',
  'Assessment',
  'Offer',
  'Hired',
  'Rejected',
];

function KanbanColumn({
  stage,
  candidates,
  jobMap,
  onSelectCandidate,
  onMoveStage,
}: {
  stage: RecruitmentStage;
  candidates: Candidate[];
  jobMap: Map<string, string>;
  onSelectCandidate: (c: Candidate) => void;
  onMoveStage: (candidateId: string, nextStage: RecruitmentStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-xl border p-3 flex flex-col gap-3 min-h-[520px] transition-colors ${
        isOver
          ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500'
          : 'bg-slate-100/70 dark:bg-[#121D2B] border-[#E7EAF0] dark:border-[#304154]'
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          {stage}
        </span>
        <span className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
          {candidates.length}
        </span>
      </div>

      <div className="space-y-2.5 flex-1">
        {candidates.map((cand) => (
          <CandidateCard
            key={cand.id}
            candidate={cand}
            jobTitle={jobMap.get(cand.jobOpeningId) ?? 'Open Role'}
            onSelect={() => onSelectCandidate(cand)}
            onMoveStage={onMoveStage}
          />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  jobTitle,
  onSelect,
  onMoveStage,
}: {
  candidate: Candidate;
  jobTitle: string;
  onSelect: () => void;
  onMoveStage: (candidateId: string, nextStage: RecruitmentStage) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: candidate.id,
    });

  const stageIndex = STAGES.indexOf(candidate.stage);
  const prevStage = stageIndex > 0 ? STAGES[stageIndex - 1] : null;
  const nextStage = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5 text-xs ${
        isDragging ? 'opacity-60 ring-2 ring-teal-500 z-30' : ''
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex items-start justify-between gap-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <EmployeeAvatar name={candidate.fullName} size="xs" />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white truncate">
              {candidate.fullName}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{jobTitle}</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-0.5 text-amber-500 font-mono text-[11px] shrink-0">
          <Star className="w-3 h-3 fill-amber-400" />
          {candidate.rating}
        </span>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between">
        <span>{candidate.experienceYears} yrs exp</span>
        <span>Decision: {candidate.hiringDecision}</span>
      </div>

      {candidate.interviewDate && (
        <div className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1 font-mono tabular-nums">
          <Calendar className="w-3 h-3" />
          Interview: {candidate.interviewDate}
        </div>
      )}

      {/* Accessible Keyboard & Touch Stage Controls */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onSelect}
          className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Details & Notes
        </button>

        <div className="flex items-center gap-1">
          {prevStage && (
            <button
              type="button"
              onClick={() => onMoveStage(candidate.id, prevStage)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title={`Move back to ${prevStage}`}
              aria-label={`Move ${candidate.fullName} to ${prevStage}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {nextStage && (
            <button
              type="button"
              onClick={() => onMoveStage(candidate.id, nextStage)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title={`Advance to ${nextStage}`}
              aria-label={`Move ${candidate.fullName} to ${nextStage}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecruitmentPage() {
  const {
    data,
    setQuickCreateModal,
    moveCandidateStage,
    updateCandidate,
    archiveCandidate,
  } = useHRStore();

  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const jobMap = useMemo(
    () => new Map(data.jobOpenings.map((j) => [j.id, j.title])),
    [data.jobOpenings]
  );

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.candidates.filter((c) => {
      if (c.archived) return false;
      if (jobFilter !== 'All' && c.jobOpeningId !== jobFilter) return false;
      if (q) {
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.currentRole.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.candidates, jobFilter, search]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const candidateId = String(active.id);
    const targetStage = String(over.id) as RecruitmentStage;
    if (STAGES.includes(targetStage)) {
      moveCandidateStage(candidateId, targetStage);
      toast.success(`Moved candidate to ${targetStage}`);
    }
  };

  const handleMoveStage = (candidateId: string, nextStage: RecruitmentStage) => {
    moveCandidateStage(candidateId, nextStage);
    toast.success(`Moved candidate to ${nextStage}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Recruitment Pipeline & Applicant Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Drag and drop candidates across 7 hiring stages or use accessible keyboard stage controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQuickCreateModal('job')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 text-xs font-medium hover:border-teal-500"
          >
            <Briefcase className="w-3.5 h-3.5 text-teal-600" />
            <span>New Job Opening</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickCreateModal('candidate')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Open Job Positions Strip */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.jobOpenings.slice(0, 4).map((job) => {
          const count = data.candidates.filter(
            (c) => !c.archived && c.jobOpeningId === job.id
          ).length;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() =>
                setJobFilter((prev) => (prev === job.id ? 'All' : job.id))
              }
              className={`p-4 rounded-xl text-left border transition-colors ${
                jobFilter === job.id
                  ? 'bg-[#E8F7F4] dark:bg-teal-950/40 border-teal-500'
                  : 'bg-white dark:bg-[#182535] border-[#E7EAF0] dark:border-[#304154]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {job.title}
                </span>
                <span className="font-mono text-teal-600 shrink-0">{job.status}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>
                  {job.location} ({job.workLocation})
                </span>
                <span className="font-mono tabular-nums">{count} candidates</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Job Filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#182535] border border-[#E7EAF0] dark:border-[#304154] flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, role, or location..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          aria-label="Filter candidates by job opening"
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
        >
          <option value="All">All Job Openings ({data.jobOpenings.length})</option>
          {data.jobOpenings.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>

      {/* 7-Stage Kanban Board */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              candidates={filteredCandidates.filter((c) => c.stage === stage)}
              jobMap={jobMap}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              onMoveStage={handleMoveStage}
            />
          ))}
        </div>
      </DndContext>

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-[#182535] h-full border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Candidate Evaluation Drawer
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedCandidate.fullName}
                </h3>
                <p className="text-slate-500">
                  Applying for: {jobMap.get(selectedCandidate.jobOpeningId)}
                </p>
                <p className="text-slate-400 mt-0.5">
                  {selectedCandidate.email} · {selectedCandidate.phone} ·{' '}
                  {selectedCandidate.location}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Pipeline Stage</label>
                  <select
                    value={selectedCandidate.stage}
                    onChange={(e) => {
                      const nextStage = e.target.value as RecruitmentStage;
                      moveCandidateStage(selectedCandidate.id, nextStage);
                      setSelectedCandidate({
                        ...selectedCandidate,
                        stage: nextStage,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-1">Hiring Decision</label>
                  <select
                    value={selectedCandidate.hiringDecision}
                    onChange={(e) => {
                      const hiringDecision =
                        e.target.value as Candidate['hiringDecision'];
                      updateCandidate(selectedCandidate.id, { hiringDecision });
                      setSelectedCandidate({
                        ...selectedCandidate,
                        hiringDecision,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="Undecided">Undecided</option>
                    <option value="Strong Hire">Strong Hire</option>
                    <option value="Hire">Hire</option>
                    <option value="No Hire">No Hire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Offer Simulation</label>
                  <select
                    value={selectedCandidate.offerStatus}
                    onChange={(e) => {
                      const offerStatus = e.target.value as Candidate['offerStatus'];
                      updateCandidate(selectedCandidate.id, { offerStatus });
                      setSelectedCandidate({
                        ...selectedCandidate,
                        offerStatus,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="None">None</option>
                    <option value="Drafting">Drafting</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={selectedCandidate.interviewDate ?? ''}
                    onChange={(e) => {
                      const interviewDate = e.target.value || null;
                      updateCandidate(selectedCandidate.id, { interviewDate });
                      setSelectedCandidate({
                        ...selectedCandidate,
                        interviewDate,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Interview Panel Notes</label>
                <textarea
                  rows={4}
                  value={selectedCandidate.notes}
                  onChange={(e) => {
                    const notes = e.target.value;
                    updateCandidate(selectedCandidate.id, { notes });
                    setSelectedCandidate({ ...selectedCandidate, notes });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  archiveCandidate(selectedCandidate.id);
                  setSelectedCandidate(null);
                  toast.success(`Archived candidate ${selectedCandidate.fullName}`);
                }}
                className="inline-flex items-center gap-1.5 text-rose-600 hover:underline"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidate(null);
                  toast.success('Saved candidate updates');
                }}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
