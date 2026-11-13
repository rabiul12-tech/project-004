'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import {
  EmploymentStatus,
  EmploymentType,
  LeaveType,
  RecruitmentStage,
  WorkLocationCategory,
} from '@/lib/types/hr';

export function QuickCreateDialog() {
  const {
    quickCreateModal,
    setQuickCreateModal,
    data,
    addEmployee,
    addDepartment,
    recordOrCorrectAttendance,
    createLeaveRequest,
    addJobOpening,
    addCandidate,
    createPerformanceReview,
  } = useHRStore();

  // Employee Form State
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empTitle, setEmpTitle] = useState('Senior Full-Stack Engineer');
  const [empDeptId, setEmpDeptId] = useState('dept-eng');
  const [empManagerId, setEmpManagerId] = useState('emp-002');
  const [empStatus, setEmpStatus] = useState<EmploymentStatus>('Active');
  const [empType, setEmpType] = useState<EmploymentType>('Full-Time');
  const [empLocation, setEmpLocation] = useState<WorkLocationCategory>('Hybrid');
  const [empCity, setEmpCity] = useState('San Francisco');
  const [empSalary, setEmpSalary] = useState(9500);

  // Department Form State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHeadId, setDeptHeadId] = useState('emp-001');
  const [deptLocation, setDeptLocation] = useState('San Francisco');
  const [deptDesc, setDeptDesc] = useState('');

  // Attendance Form State
  const [attEmpId, setAttEmpId] = useState('emp-004');
  const [attDate, setAttDate] = useState('2026-11-13');
  const [attCheckIn, setAttCheckIn] = useState('09:00');
  const [attCheckOut, setAttCheckOut] = useState('17:30');
  const [attNotes, setAttNotes] = useState('');

  // Leave Form State
  const [leaveEmpId, setLeaveEmpId] = useState('emp-004');
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [leaveStart, setLeaveStart] = useState('2026-11-18');
  const [leaveEnd, setLeaveEnd] = useState('2026-11-20');
  const [leaveReason, setLeaveReason] = useState('');

  // Job Opening Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDeptId, setJobDeptId] = useState('dept-eng');
  const [jobLocation, setJobLocation] = useState('San Francisco');
  const [jobMinSal, setJobMinSal] = useState(9000);
  const [jobMaxSal, setJobMaxSal] = useState(12000);

  // Candidate Form State
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candJobId, setCandJobId] = useState('job-01');
  const [candStage, setCandStage] = useState<RecruitmentStage>('Applied');
  const [candExp, setCandExp] = useState(5);

  // Performance Review Form State
  const [revEmpId, setRevEmpId] = useState('emp-010');
  const [revCycle, setRevCycle] = useState('H2 2026 Performance Cycle');
  const [revSelfScore, setRevSelfScore] = useState(4.2);
  const [revMgrScore, setRevMgrScore] = useState(4.5);
  const [revFeedback, setRevFeedback] = useState('');

  if (!quickCreateModal) return null;

  const activeEmployees = data.employees.filter((e) => !e.archived);
  const activeDepts = data.departments.filter((d) => !d.archived);

  const handleClose = () => setQuickCreateModal(null);

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFirstName.trim() || !empLastName.trim()) {
      toast.error('Please enter both first and last name.');
      return;
    }
    const res = addEmployee({
      firstName: empFirstName.trim(),
      lastName: empLastName.trim(),
      workEmail:
        empEmail.trim() ||
        `${empFirstName.toLowerCase()}.${empLastName.toLowerCase()}@peoplix.demo`,
      phone: '+1 (555) 390-8821',
      avatarColor: '#0D9488',
      departmentId: empDeptId,
      jobRoleId: 'role-04',
      jobTitle: empTitle.trim() || 'Software Engineer',
      managerId: empManagerId || null,
      employmentStatus: empStatus,
      employmentType: empType,
      workLocation: empLocation,
      locationCity: empCity,
      joinDate: '2026-11-13',
      birthDate: '1994-11-24',
      scheduleId: 'sched-standard',
      emergencyContactName: 'Jordan Vance',
      emergencyContactRelation: 'Spouse',
      bio: `${empFirstName} ${empLastName} joined as ${empTitle}.`,
      skills: ['Leadership', 'Collaboration', 'Execution'],
      baseSalary: Number(empSalary) || 8500,
    });
    if (!res.success) {
      toast.error(res.error || 'Could not create employee.');
      return;
    }
    toast.success(`Added employee ${res.employee?.fullName}`);
    setEmpFirstName('');
    setEmpLastName('');
    setEmpEmail('');
    handleClose();
  };

  const handleDepartmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) {
      toast.error('Department name and code are required.');
      return;
    }
    addDepartment({
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase(),
      headEmployeeId: deptHeadId || null,
      location: deptLocation,
      budgetCode: `CC-${Math.floor(100 + Math.random() * 899)}`,
      description: deptDesc.trim() || 'Cross-functional operational unit.',
    });
    toast.success(`Created department ${deptName}`);
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    handleClose();
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rec = recordOrCorrectAttendance({
      employeeId: attEmpId,
      date: attDate,
      checkIn: attCheckIn || null,
      checkOut: attCheckOut || null,
      notes: attNotes,
      isManualCorrection: true,
    });
    toast.success(`Recorded attendance (${rec.status}) for ${attDate}`);
    setAttNotes('');
    handleClose();
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createLeaveRequest({
      employeeId: leaveEmpId,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason.trim() || 'Personal time off request',
    });
    if (!res.success) {
      toast.error(res.error || 'Unable to submit leave request');
      return;
    }
    toast.success(`Submitted ${res.request?.workingDays}-day ${leaveType} leave request`);
    setLeaveReason('');
    handleClose();
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toast.error('Job title is required.');
      return;
    }
    addJobOpening({
      title: jobTitle.trim(),
      departmentId: jobDeptId,
      location: jobLocation,
      employmentType: 'Full-Time',
      workLocation: 'Hybrid',
      status: 'Open',
      headcountTarget: 1,
      salaryRangeMin: Number(jobMinSal),
      salaryRangeMax: Number(jobMaxSal),
      hiringManagerId: 'emp-002',
      postedDate: '2026-11-13',
      description: `Open role for ${jobTitle.trim()} in ${jobLocation}.`,
    });
    toast.success(`Created job opening: ${jobTitle}`);
    setJobTitle('');
    handleClose();
  };

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim()) {
      toast.error('Candidate full name is required.');
      return;
    }
    addCandidate({
      jobOpeningId: candJobId,
      fullName: candName.trim(),
      email: candEmail.trim() || `${candName.toLowerCase().replace(/\s+/g, '.')}@candidate.demo`,
      phone: '+1 (415) 890-3312',
      location: 'San Francisco',
      currentRole: 'Senior Specialist',
      experienceYears: Number(candExp) || 4,
      stage: candStage,
      offerStatus: 'None',
      hiringDecision: 'Undecided',
      interviewDate: '2026-11-20',
      expectedSalary: 9800,
      rating: 4,
      notes: 'Added via Quick Create.',
      appliedDate: '2026-11-13',
    });
    toast.success(`Added candidate ${candName}`);
    setCandName('');
    setCandEmail('');
    handleClose();
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overall = Number(((Number(revSelfScore) + Number(revMgrScore)) / 2).toFixed(1));
    createPerformanceReview({
      employeeId: revEmpId,
      reviewerId: 'emp-002',
      cycleName: revCycle,
      templateName: 'Core Competency & OKR Evaluation',
      status: 'In Review',
      selfAssessmentScore: Number(revSelfScore),
      managerScore: Number(revMgrScore),
      overallScore: overall,
      selfAssessmentNotes: 'Completed key milestones and cross-team initiatives.',
      managerFeedback: revFeedback.trim() || 'Strong delivery and consistent execution.',
      goals: [
        {
          id: `goal-qc-${Date.now()}`,
          title: 'Deliver quarterly departmental roadmap KPIs',
          weight: 100,
          completed: true,
          score: Math.round(overall),
        },
      ],
    });
    toast.success('Created performance review');
    setRevFeedback('');
    handleClose();
  };

  const modalTitles: Record<Exclude<typeof quickCreateModal, null>, string> = {
    employee: 'Add New Employee',
    department: 'Create Department',
    attendance: 'Record or Correct Attendance',
    leave: 'Submit Leave Request',
    job: 'Create Job Opening',
    candidate: 'Add Job Candidate',
    review: 'Create Performance Review',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={modalTitles[quickCreateModal]}
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#182535] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {modalTitles[quickCreateModal]}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {quickCreateModal === 'employee' && (
            <form onSubmit={handleEmployeeSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    required
                    value={empFirstName}
                    onChange={(e) => setEmpFirstName(e.target.value)}
                    placeholder="e.g. Clara"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    required
                    value={empLastName}
                    onChange={(e) => setEmpLastName(e.target.value)}
                    placeholder="e.g. Davenport"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="clara.d@peoplix.demo"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Job Title *
                  </label>
                  <input
                    required
                    value={empTitle}
                    onChange={(e) => setEmpTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={empDeptId}
                    onChange={(e) => setEmpDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {activeDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={empManagerId}
                    onChange={(e) => setEmpManagerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">No Manager (Root)</option>
                    {activeEmployees.slice(0, 25).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} — {m.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value as EmploymentStatus)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={empType}
                    onChange={(e) => setEmpType(e.target.value as EmploymentType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Monthly Base ($)
                  </label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Work Arrangement
                  </label>
                  <select
                    value={empLocation}
                    onChange={(e) => setEmpLocation(e.target.value as WorkLocationCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-Site">On-Site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    value={empCity}
                    onChange={(e) => setEmpCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Create Employee
                </button>
              </div>
            </form>
          )}

          {quickCreateModal === 'department' && (
            <form onSubmit={handleDepartmentSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department Name *
                  </label>
                  <input
                    required
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    placeholder="e.g. Data Science & AI"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    required
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    placeholder="e.g. DSA"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department Head
                  </label>
                  <select
                    value={deptHeadId}
                    onChange={(e) => setDeptHeadId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {activeEmployees.slice(0, 20).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    value={deptLocation}
                    onChange={(e) => setDeptLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Describe the department mandate and responsibilities..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Create Department
                </button>
              </div>
            </form>
          )}

          {quickCreateModal === 'attendance' && (
            <form onSubmit={handleAttendanceSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={attEmpId}
                  onChange={(e) => setAttEmpId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Work Date
                  </label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Check-In (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={attCheckIn}
                    onChange={(e) => setAttCheckIn(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Check-Out (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={attCheckOut}
                    onChange={(e) => setAttCheckOut(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Notes / Reason
                </label>
                <input
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  placeholder="Optional attendance log note"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          )}

          {quickCreateModal === 'leave' && (
            <form onSubmit={handleLeaveSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Employee
                  </label>
                  <select
                    value={leaveEmpId}
                    onChange={(e) => setLeaveEmpId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {activeEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide context for approver..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Submit Request
                </button>
              </div>
            </form>
          )}

          {quickCreateModal === 'job' && (
            <form onSubmit={handleJobSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Job Title *
                </label>
                <input
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Security Engineer"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={jobDeptId}
                    onChange={(e) => setJobDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {activeDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Min Monthly Salary ($)
                  </label>
                  <input
                    type="number"
                    value={jobMinSal}
                    onChange={(e) => setJobMinSal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Max Monthly Salary ($)
                  </label>
                  <input
                    type="number"
                    value={jobMaxSal}
                    onChange={(e) => setJobMaxSal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Create Opening
                </button>
              </div>
            </form>
          )}

          {quickCreateModal === 'candidate' && (
            <form onSubmit={handleCandidateSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    required
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    placeholder="maya@candidate.demo"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Job Opening
                  </label>
                  <select
                    value={candJobId}
                    onChange={(e) => setCandJobId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {data.jobOpenings.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={candStage}
                    onChange={(e) => setCandStage(e.target.value as RecruitmentStage)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Offer">Offer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={candExp}
                  onChange={(e) => setCandExp(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          )}

          {quickCreateModal === 'review' && (
            <form onSubmit={handleReviewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Employee
                </label>
                <select
                  value={revEmpId}
                  onChange={(e) => setRevEmpId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} — {e.jobTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Review Cycle
                </label>
                <input
                  value={revCycle}
                  onChange={(e) => setRevCycle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Self-Assessment Score (1–5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={revSelfScore}
                    onChange={(e) => setRevSelfScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Manager Rating (1–5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={revMgrScore}
                    onChange={(e) => setRevMgrScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Manager Evaluation Summary
                </label>
                <textarea
                  rows={3}
                  value={revFeedback}
                  onChange={(e) => setRevFeedback(e.target.value)}
                  placeholder="Summarize strengths, growth areas, and goal achievement..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Create Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
