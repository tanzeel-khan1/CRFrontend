import React, { useMemo } from "react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  BarChart2,
  Download,
} from "lucide-react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import jsPDF from "jspdf";

export default function OverviewSection({
  currentUser,
  companies,
  allInvoices,
  allExpenses,
}) {
  const totalRevenue = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  const totalExpensesAmt = allExpenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + (e.amount || 0), 0);

  const netProfit = totalRevenue - totalExpensesAmt;
  const profitMargin =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const pendingRevenue = allInvoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + (i.total_amount || i.amount || 0), 0);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const rev = allInvoices
        .filter(
          (inv) =>
            inv.status === "paid" &&
            isWithinInterval(new Date(inv.created_date), { start, end })
        )
        .reduce((s, invoice) => s + (invoice.total_amount || invoice.amount || 0), 0);

      const exp = allExpenses
        .filter(
          (expense) =>
            expense.status === "approved" &&
            isWithinInterval(new Date(expense.created_date), { start, end })
        )
        .reduce((s, expense) => s + (expense.amount || 0), 0);

      return {
        month: format(date, "MMM"),
        Revenue: rev,
        Expenses: exp,
      };
    });
  }, [allInvoices, allExpenses]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Financial Report", 20, 20);

    const rows = [
      ["Total Revenue", `$${totalRevenue.toLocaleString()}`],
      ["Total Expenses", `$${totalExpensesAmt.toLocaleString()}`],
      ["Net Profit", `$${netProfit.toLocaleString()}`],
      ["Profit Margin", `${profitMargin}%`],
      ["Pending Revenue", `$${pendingRevenue.toLocaleString()}`],
    ];

    let y = 40;
    rows.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, y);
      y += 10;
    });

    doc.save("financial-report.pdf");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
      </div>

      <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 rounded-lg border px-3 py-2"
      >
        <Download size={14} /> Export PDF
      </button>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<DollarSign />}
          label="Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingDown />}
          label="Expenses"
          value={`$${totalExpensesAmt.toLocaleString()}`}
        />
        <StatCard
          icon={<TrendingUp />}
          label="Profit"
          value={`$${netProfit.toLocaleString()}`}
        />
        <StatCard
          icon={<BarChart2 />}
          label="Margin"
          value={`${profitMargin}%`}
        />
      </div>

      <div className="rounded-xl border p-5">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area dataKey="Revenue" stroke="#22c55e" fill="#22c55e33" />
            <Area dataKey="Expenses" stroke="#ef4444" fill="#ef444433" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">Companies</h2>
        {companies.map((company) => {
          const revenue = allInvoices
            .filter(
              (invoice) =>
                invoice.status === "paid" && invoice.company_id === company.id
            )
            .reduce((sum, invoice) => sum + (invoice.total_amount || invoice.amount || 0), 0);
          const expenses = allExpenses
            .filter(
              (expense) =>
                expense.status === "approved" && expense.company_id === company.id
            )
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);

          return (
            <div key={company.id} className="flex justify-between py-2">
              <span>{company.name}</span>
              <span>${(revenue - expenses).toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
