'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string;
  name: string;
  interest: string;
  budget: string;
  score: number;
  classification: string;
  status: string;
  source: string;
  createdAt: string;
};

export default function LeadDashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Array<{ id: string; leadId: string; customer: string; status: string; scheduledFor: string }>>([]);
  const [followUps, setFollowUps] = useState<Array<{ id: string; leadId: string; customer: string; status: string; scheduledFor: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const sessionResponse = await fetch('/api/finance/auth/session');
        const session = await sessionResponse.json() as { authenticated?: boolean };
        if (!session.authenticated) { router.replace('/finance/login'); return; }
        const [leadsResponse, appointmentsResponse, followUpsResponse] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/appointments'),
          fetch('/api/followups'),
        ]);

        if (!leadsResponse.ok || !appointmentsResponse.ok || !followUpsResponse.ok) throw new Error('Sales data is unavailable.');
        const leadsData = (await leadsResponse.json()) as { leads?: Lead[] };
        const appointmentsData = (await appointmentsResponse.json()) as { appointments?: Array<{ id: string; leadId: string; customer: string; status: string; scheduledFor: string }> };
        const followUpsData = (await followUpsResponse.json()) as { followUps?: Array<{ id: string; leadId: string; customer: string; status: string; scheduledFor: string }> };

        setLeads(leadsData.leads ?? []);
        setAppointments(appointmentsData.appointments ?? []);
        setFollowUps(followUpsData.followUps ?? []);
      } catch (_error) {
        setError('Sales data could not be loaded. Please sign in again and retry.');
        setLeads([]);
        setAppointments([]);
        setFollowUps([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const stats = [
    { label: 'Today\'s enquiries', value: leads.length },
    { label: 'Qualified leads', value: leads.filter((lead) => lead.classification !== 'COLD').length },
    { label: 'Hot leads', value: leads.filter((lead) => lead.classification === 'HOT').length },
    { label: 'Appointments', value: appointments.length },
    { label: 'Follow-ups', value: followUps.length },
  ];

  return (
    <main className="kh-container py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="kh-label">Dashboard</p>
          <h1 className="mt-3 text-4xl font-medium leading-[1.02] tracking-[-0.06em] md:text-6xl">Lead overview</h1>
        </div>
        <div className="flex gap-3"><a href="/lead-dashboard/conversations" className="rounded-full border border-kh-rule px-4 py-2 text-sm font-medium text-kh-green">Conversations</a><a href="/solutions/ai-sales" className="rounded-full border border-kh-rule px-4 py-2 text-sm font-medium text-kh-green">Open demo</a></div>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-kh-rule bg-kh-soft p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-kh-muted">{stat.label}</p>
            <p className="mt-3 text-3xl font-medium tracking-[-0.05em] text-kh-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="overflow-hidden rounded-[24px] border border-kh-rule bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-kh-soft text-kh-muted">
              <tr>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Name</th>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Interest</th>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Budget</th>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Score</th>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Status</th>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Source</th>
                <th className="px-5 py-4 font-mono text-[9px] uppercase tracking-[0.12em]">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-sm text-kh-muted">Loading leads...</td>
                </tr>
              )}

              {!isLoading && leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-sm text-kh-muted">No leads yet. The demo flow will populate this list.</td>
                </tr>
              )}

              {!isLoading && leads.map((lead) => (
                <tr key={lead.id} className="border-t border-kh-rule">
                  <td className="px-5 py-4 text-sm font-medium text-kh-ink">{lead.name}</td>
                  <td className="px-5 py-4 text-sm text-kh-muted">{lead.interest}</td>
                  <td className="px-5 py-4 text-sm text-kh-muted">{lead.budget || '—'}</td>
                  <td className="px-5 py-4 text-sm text-kh-ink">{lead.classification}</td>
                  <td className="px-5 py-4 text-sm text-kh-ink">{lead.status}</td>
                  <td className="px-5 py-4 text-sm text-kh-muted">{lead.source}</td>
                  <td className="px-5 py-4 text-sm text-kh-muted">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
