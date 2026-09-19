import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { ArrowUpRight, ArrowDownRight, ChevronRight, TrendingUp, Download } from 'lucide-react';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: ${p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: ${p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { activeCompany } = useOutletContext();
  const navigate = useNavigate();
  const companyId = activeCompany?.id;

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses', companyId],
    queryFn: () => companyId ? api.entities.Expense.filter({ company_id: companyId }) : [],
    initialData: [],
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => companyId ? api.entities.Invoice.filter({ company_id: companyId }) : [],
    initialData: [],
  });

  const isLoading = expLoading || invLoading;

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  // Build monthly chart data from real invoices & expenses
  const monthlyData = MONTHS.map((month, idx) => {
    const rev = invoices
      .filter(i => i.status === 'paid' && i.due_date && new Date(i.due_date).getMonth() === idx)
      .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
    const exp = expenses
      .filter(e => e.date && new Date(e.date).getMonth() === idx)
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { month, revenue: rev, expenses: exp };
  });

  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentYear = new Date().getFullYear();
  const [downloading, setDownloading] = useState(false);

  const downloadFinancialStatement = () => {
    setDownloading(true);
    const doc = new jsPDF();
    const companyName = activeCompany?.name || 'Company';
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Financial Statement — ${currentYear}`, 14, 28);
    doc.text(`Generated: ${today}`, pageW - 14, 28, { align: 'right' });

    // Summary section
    let y = 52;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 14, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    const yearExpenses = expenses
      .filter(e => e.date && new Date(e.date).getFullYear() === currentYear)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const yearRevenue = invoices
      .filter(i => i.status === 'paid' && i.due_date && new Date(i.due_date).getFullYear() === currentYear)
      .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
    const yearProfit = yearRevenue - yearExpenses;

    const summaryRows = [
      ['Total Revenue', `$${yearRevenue.toLocaleString()}`],
      ['Total Expenses', `$${yearExpenses.toLocaleString()}`],
      ['Net Profit / Loss', `$${yearProfit.toLocaleString()}`],
    ];

    summaryRows.forEach(([label, value], i) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(label, 14, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(yearProfit < 0 && label.includes('Net') ? 200 : 0, 0, 0);
      doc.text(value, pageW - 14, y, { align: 'right' });
      if (i < summaryRows.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(14, y + 3, pageW - 14, y + 3);
      }
      y += 12;
    });

    // Monthly breakdown
    y += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Breakdown', 14, y);
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 7;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Month', 14, y);
    doc.text('Revenue', 85, y, { align: 'right' });
    doc.text('Expenses', 140, y, { align: 'right' });
    doc.text('Profit', pageW - 14, y, { align: 'right' });
    y += 6;

    MONTHS.forEach((month, idx) => {
      const rev = invoices
        .filter(i => i.status === 'paid' && i.due_date && new Date(i.due_date).getMonth() === idx && new Date(i.due_date).getFullYear() === currentYear)
        .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);
      const exp = expenses
        .filter(e => e.date && new Date(e.date).getMonth() === idx && new Date(e.date).getFullYear() === currentYear)
        .reduce((s, e) => s + (e.amount || 0), 0);
      const profit = rev - exp;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text(month, 14, y);
      doc.text(`$${rev.toLocaleString()}`, 85, y, { align: 'right' });
      doc.text(`$${exp.toLocaleString()}`, 140, y, { align: 'right' });
      doc.setTextColor(profit >= 0 ? 30 : 200, profit >= 0 ? 130 : 0, profit >= 0 ? 60 : 0);
      doc.text(`$${profit.toLocaleString()}`, pageW - 14, y, { align: 'right' });
      doc.setDrawColor(240, 240, 240);
      doc.line(14, y + 2, pageW - 14, y + 2);
      y += 8;
    });

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(`${companyName} · Confidential Financial Statement · ${currentYear}`, pageW / 2, 290, { align: 'center' });

    doc.save(`${companyName}_Financial_Statement_${currentYear}.pdf`);
    setDownloading(false);
  };

  const metricCards = [
    { label: 'Monthly Revenue', value: `$${(totalRevenue / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: 6.1, positive: true },
    { label: 'Net Profit', value: `$${netProfit.toLocaleString()}`, change: netProfit >= 0 ? 8.4 : -4.2, positive: netProfit >= 0 },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-600">Executive overview</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {activeCompany ? `${activeCompany.name} Dashboard` : 'Ranvola Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">A clear view of your financial performance.</p>
        </div>
        <Button onClick={downloadFinancialStatement} disabled={downloading || !activeCompany} size="sm" className="h-10 gap-2 bg-slate-950 px-4 text-xs text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800">
          <Download className="w-3.5 h-3.5" />
          {downloading ? 'Generating...' : `Download ${currentYear} Statement`}
        </Button>
      </div>

      {/* Welcome + Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Welcome card */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-xl">
          <div className="relative z-10"><p className="text-xs text-slate-400">Welcome back</p>
          <h2 className="mt-1 truncate text-lg font-semibold">
            {activeCompany?.name || 'Your Company'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">Best performer this month</p>
          <div className="mt-4">
            <p className="text-3xl font-semibold tracking-tight">${totalExpenses.toLocaleString()}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <ArrowUpRight className="h-3 w-3 text-amber-300" /> +12% from last month
            </p>
          </div>
          <Button size="sm" variant="outline" className="mt-4 w-full border-white/15 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white" onClick={() => navigate('/invoices')}>
            View Invoices
          </Button>
          </div><div className="absolute -bottom-12 -right-10 h-36 w-36 rounded-full border-[18px] border-amber-300/10" />
        </div>

        {/* Metric cards */}
        {metricCards.map((m, i) => (
          <div key={i} className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <span className={`flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold ${m.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {m.positive ? '+' : ''}{m.change}%
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{m.value}</p>
            
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Total Revenue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">Total Revenue</h3>
              <p className="mt-1 text-xs text-muted-foreground">Income in the last 12 months</p>
            </div>
            <div className="flex gap-5 text-right text-xs">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Revenue</p>
                <p className="mt-1 text-sm font-semibold">${totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Expenses</p>
                <p className="mt-1 text-sm font-semibold">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barCategoryGap="30%" barGap={2}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--muted-foreground) / 0.4)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Returning Rate */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold">Profit Trend</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-semibold tracking-tight">${totalPaid.toLocaleString()}</p>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +2.5%
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomLineTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Activity</p><h3 className="mt-1 text-base font-semibold">Recent Invoices</h3></div>
          <button onClick={() => navigate('/invoices')} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {isLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No invoices yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Title</th>
                  <th className="text-left pb-2 font-medium hidden sm:table-cell">Recipient</th>
                  <th className="text-right pb-2 font-medium">Amount</th>
                  <th className="text-right pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="text-sm transition-colors hover:bg-muted/30">
                    <td className="py-2.5 font-medium">{inv.title}</td>
                    <td className="py-2.5 text-muted-foreground hidden sm:table-cell">{inv.recipient_name || '—'}</td>
                    <td className="py-2.5 text-right font-semibold">${(inv.total_amount || inv.amount || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'paid' ? 'bg-primary/10 text-primary' :
                        inv.status === 'overdue' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}