'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useHRStore } from '@/lib/stores/useHRStore';
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar';

export default function DemoTeamRolesPage() {
  const { data, ui, setActiveDemoRole, setDrawerEmployeeId } = useHRStore();

  const deptMap = new Map(data.departments.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Demo Team Roles & Workspace Perspective Switcher
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Switch between HR Admin, HR Manager, Department Manager, and Employee self-service personas.
        </p>
      </div>

      {/* Honest Security & Architecture Notice */}
      <div className="p-4 rounded-xl bg-[#E8F7F4]/70 dark:bg-teal-950/30 border border-teal-500/30 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-teal-950 dark:text-teal-200 leading-relaxed">
          <strong>Browser-Local Role Demonstration Notice:</strong> Because PEOPLIX HR runs 100% locally in your browser without a backend server or external authentication provider, role switching is an interactive UX preview rather than cryptographic access control. No passwords or real credentials are stored.
        </div>
      </div>

      {/* 4 Demo Persona Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {data.demoTeamMembers.map((member) => {
          const emp = data.employees.find((e) => e.id === member.employeeId);
          const isCurrent = ui.activeDemoRole === member.role;

          return (
            <div
              key={member.id}
              className={`p-6 rounded-xl bg-white dark:bg-[#182535] border transition-all flex flex-col justify-between gap-5 ${
                isCurrent
                  ? 'border-[#0D9488] ring-2 ring-teal-500/25'
                  : 'border-[#E7EAF0] dark:border-[#304154]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar
                      name={member.name}
                      color={emp?.avatarColor}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {member.role}
                        </h2>
                        {isCurrent && (
                          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                            · Active Persona
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => emp && setDrawerEmployeeId(emp.id)}
                        className="text-xs text-slate-600 dark:text-slate-300 hover:text-teal-600"
                      >
                        {member.name} — {member.jobTitle} ({deptMap.get(member.departmentId)})
                      </button>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-400">
                    Workspace Capabilities & Perspective
                  </div>
                  {member.permissionsSummary.map((perm) => (
                    <div
                      key={perm}
                      className="flex items-start gap-2 text-slate-600 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">{member.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDemoRole(member.role, member.employeeId);
                    toast.success(`Switched workspace persona to ${member.role} (${member.name})`);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      : 'bg-[#0D9488] hover:bg-[#0F766E] text-white'
                  }`}
                >
                  {isCurrent ? 'Currently Active' : `Preview as ${member.role}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
