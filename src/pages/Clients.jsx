import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, CheckCircle2, DollarSign, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, Sparkles, Trash2, UserRound } from 'lucide-react';
import { api } from '@/api/apiClient';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CLIENT_STATUSES = ['New', 'Contacted', 'Viewing', 'Negotiating', 'Closed', 'Lost'];
const STATUS_STYLES = {
  New: 'bg-muted text-foreground',
  Contacted: 'bg-secondary text-foreground',
  Viewing: 'border border-border bg-background text-foreground',
  Negotiating: 'bg-foreground/10 text-foreground',
  Closed: 'bg-foreground text-background',
  Lost: 'bg-muted text-muted-foreground',
};
const emptyForm = { name: '', email: '', phone: '', budget: '', address: '', status: 'New', closed_date: '' };
const clientId = (client) => client.id || client._id;

export default function Clients() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id || activeCompany?._id;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: () => api.entities.Client.filter({ company_id: companyId }, '-created_date'),
    enabled: !!companyId,
    initialData: [],
    meta: { handledInComponent: true },
  });

  const visibleClients = clients.filter((client) => {
    const query = search.trim().toLowerCase();
    const matchesFilter = filter === 'All' || (client.status || 'New') === filter;
    const matchesSearch = !query || [client.name, client.email, client.phone, client.address]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((client) => !['Closed', 'Lost'].includes(client.status || 'New')).length,
    closed: clients.filter((client) => client.status === 'Closed').length,
    pipeline: clients.reduce((total, client) => total + Number(client.budget || 0), 0),
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? api.entities.Client.update(clientId(editing), data)
      : api.entities.Client.create({ ...data, company_id: companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      toast.success(editing ? 'Client updated' : 'Client created');
      closeDialog();
    },
    onError: (error) => toast.error(error.message || 'Unable to save client'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', companyId] });
      setDeleteTarget(null);
      toast.success('Client deleted');
    },
    onError: (error) => toast.error(error.message || 'Unable to delete client'),
  });

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      budget: client.budget ?? '',
      address: client.address || '',
      status: client.status || 'New',
      closed_date: client.closed_date ? client.closed_date.slice(0, 10) : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    saveMutation.mutate({ ...form, budget: form.budget === '' ? 0 : Number(form.budget) });
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="page-hero">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-background/55"><Sparkles className="h-3.5 w-3.5" /> Client pipeline</div><h1 className="font-display text-4xl tracking-tight sm:text-5xl">Clients</h1><p className="mt-2 max-w-lg text-sm leading-6 text-background/70">Keep every relationship moving from first contact to closing.</p></div><Button onClick={openAdd} variant="secondary" className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" /> Add client</Button></div>
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-background/10" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: 'Total clients', value: stats.total, icon: UserRound }, { label: 'Active pipeline', value: stats.active, icon: CheckCircle2 }, { label: 'Closed deals', value: stats.closed, icon: Sparkles }, { label: 'Pipeline budget', value: stats.pipeline.toLocaleString(), icon: DollarSign }].map(({ label, value, icon: Icon }) => <div key={label} className="stat-tile"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background"><Icon className="h-4 w-4" /></div><p className="text-xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, phone, or address" className="h-10 border-0 bg-muted/40 pl-9 shadow-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/10 sm:h-11" />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted/40 p-1 lg:pb-0">
          {['All', ...CLIENT_STATUSES].map((status) => (
            <Button key={status} size="sm" variant={filter === status ? 'default' : 'ghost'} onClick={() => setFilter(status)} className="whitespace-nowrap px-2.5">
              {status}
            </Button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <p className="mt-3 text-sm text-muted-foreground">Loading clients...</p>
        </div>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">Clients couldn’t load</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{error?.message || 'Check your connection and try again.'}</p>
          <Button onClick={() => refetch()} disabled={isFetching} variant="outline" className="mt-4 gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
      ) : visibleClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="h-5 w-5 text-muted-foreground/80" />
          </div>
          <p className="mt-3 text-sm font-medium">No clients found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters or add your first client.</p>
          <Button onClick={openAdd} variant="outline" className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Add your first client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleClients.map((client, i) => {
            const status = client.status || 'New';
            const initials = client.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CL';
            return (
              <article key={clientId(client)} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-semibold tracking-tight text-background shadow-sm ring-1 ring-background/20">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold leading-tight">{client.name}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">Client record</p>
                    </div>
                  </div>
                  <Badge className={`shrink-0 border-0 shadow-sm ${STATUS_STYLES[status]}`}>{status}</Badge>
                </div>
                <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                  {client.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </p>
                  )}
                  {client.address && (
                    <p className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </p>
                  )}
                </div>
                <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      {Number(client.budget || 0).toLocaleString()}
                    </p>
                    {client.closed_date && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        Closed {new Date(client.closed_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)} title="Edit client">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(client)} title="Delete client">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <div className="shrink-0 border-b border-background/10 bg-foreground px-5 py-5 text-background sm:px-7"><DialogHeader><div className="flex items-start gap-3 pr-8"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-foreground"><UserRound className="h-5 w-5" /></div><div><DialogTitle className="font-display text-2xl text-background">{editing ? 'Edit client' : 'Add a client'}</DialogTitle></div></div></DialogHeader></div>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-muted/30 px-5 py-5 sm:px-7">
            <section className="space-y-4"><div className="border-b border-border pb-3"><h3 className="text-sm font-semibold">Contact details</h3></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="client-name" className="text-xs font-semibold">Full name <span className="text-foreground">*</span></Label><Input className="h-11 bg-background" id="client-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client full name" /></div><div className="space-y-1.5"><Label htmlFor="client-email" className="text-xs font-semibold">Email</Label><Input className="h-11 bg-background" id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" /></div><div className="space-y-1.5"><Label htmlFor="client-phone" className="text-xs font-semibold">Phone number</Label><Input className="h-11 bg-background" id="client-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></div><div className="space-y-1.5 sm:col-span-2"><Label htmlFor="client-address" className="text-xs font-semibold">Address</Label><Input className="h-11 bg-background" id="client-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Client address" /></div></div></section>
            <section className="space-y-4 border-t border-border pt-5"><div className="border-b border-border pb-3"><h3 className="text-sm font-semibold">Deal profile</h3></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="space-y-1.5"><Label htmlFor="client-budget" className="text-xs font-semibold">Budget</Label><Input className="h-11 bg-background" id="client-budget" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0" /></div><div className="space-y-1.5"><Label className="text-xs font-semibold">Status</Label><Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}><SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger><SelectContent>{CLIENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="client-closed-date" className="text-xs font-semibold">Closed date</Label><Input className="h-11 bg-background" id="client-closed-date" type="date" value={form.closed_date} onChange={(e) => setForm({ ...form, closed_date: e.target.value })} /></div></div></section>
          </div><DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-5 py-4 sm:px-7 sm:space-x-0"><Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button><Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : editing ? 'Update client' : 'Create client'}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name || 'this client'}
        itemType="client"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(clientId(deleteTarget))}
      />
    </div>
  );
}