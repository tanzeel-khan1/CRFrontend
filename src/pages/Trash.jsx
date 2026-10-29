import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Building2, FileText, FolderOpen, Folder, KeyRound, Lightbulb,
  MessageSquare, Receipt, RefreshCw, RotateCcw, StickyNote, Trash2,
  UserSquare2, Users,
} from 'lucide-react';
import { api } from '@/api/apiClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog';
import TableSkeleton from '@/components/ui/TableSkeleton';

const RESOURCE_META = {
  companies: { label: 'Company', icon: Building2 },
  expenses: { label: 'Expense', icon: Receipt },
  invoices: { label: 'Invoice', icon: FileText },
  investors: { label: 'Investor', icon: Users },
  employees: { label: 'Employee', icon: UserSquare2 },
  notes: { label: 'Note', icon: StickyNote },
  ideas: { label: 'Idea', icon: Lightbulb },
  'idea-comments': { label: 'Idea Comment', icon: MessageSquare },
  documents: { label: 'Document', icon: FolderOpen },
  'doc-sections': { label: 'Document Section', icon: Folder },
  passwords: { label: 'Password', icon: KeyRound },
  chat: { label: 'Chat Message', icon: MessageSquare },
};

export default function Trash() {
  const queryClient = useQueryClient();
  const [purgeTarget, setPurgeTarget] = useState(null);

  const { data: items = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['trash'],
    queryFn: () => api.trash.list(),
    initialData: [],
  });

  const invalidateAll = () => queryClient.invalidateQueries();

  const restoreMutation = useMutation({
    mutationFn: ({ resource, id }) => api.trash.restore(resource, id),
    onSuccess: () => {
      invalidateAll();
      toast.success('Item restored');
    },
    onError: (err) => toast.error(err.message || 'Unable to restore item'),
  });

  const purgeMutation = useMutation({
    mutationFn: ({ resource, id }) => api.trash.purge(resource, id),
    onSuccess: () => {
      invalidateAll();
      setPurgeTarget(null);
      toast.success('Item permanently deleted');
    },
    onError: (err) => toast.error(err.message || 'Unable to delete item'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Trash2 className="h-5 w-5" />
            Trash
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleted items stay here until you restore or permanently delete them.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">{error?.message || 'Unable to load trash.'}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Trash is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">Items you delete will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {items.map((item) => {
              const meta = RESOURCE_META[item.resource] || { label: item.resource, icon: FileText };
              const Icon = meta.icon;
              const busy = restoreMutation.isPending || purgeMutation.isPending;

              return (
                <div key={`${item.resource}-${item.id}`} className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted">
                    <Icon className="h-4 w-4 text-foreground/70" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                      <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Deleted
                      {item.deleted_by ? ` by ${item.deleted_by}` : ''}
                      {item.deleted_at ? ` · ${format(new Date(item.deleted_at), 'MMM d, yyyy · h:mm a')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => restoreMutation.mutate({ resource: item.resource, id: item.id })}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      disabled={busy}
                      title="Delete permanently"
                      onClick={() => setPurgeTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!purgeTarget}
        itemName={purgeTarget?.label || 'this item'}
        itemType="item permanently"
        onCancel={() => setPurgeTarget(null)}
        onConfirm={() => purgeTarget && purgeMutation.mutate({ resource: purgeTarget.resource, id: purgeTarget.id })}
      />
    </div>
  );
}
