'use client';

/**
 * NotificationsClient — Client component for /notifications page
 *
 * Features:
 * - Server-side paginated notification list
 * - Category + read/unread filters via TableFilter
 * - Selection mode with bulk actions (mark read, delete)
 * - Sticky bulk action bar above BottomNav
 * - EmptyState with Bell icon
 *
 * @see NOTIF-012
 */

import { useState, useEffect, useTransition, useCallback, useRef, useMemo } from 'react';
import { Bell, CheckCheck, ListChecks, RefreshCw, Trash2, EyeOff, FilterX } from 'lucide-react';
import { toast } from 'sonner';

import { NotificationItem } from '@/components/notifications/NotificationItem';
import type { NotificationData } from '@/components/notifications/NotificationItem';
import { NotificationDetailDialog } from '@/components/notifications/NotificationDetailDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { PullToRefresh } from '@/components/pwa';
import { TableSearch, TablePagination } from '@/components/ui/table-extras';
import { TableFilter, TableFilterBar } from '@/components/ui/table-filter';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils/cn';
import { useDisableShellPTR } from '@/lib/pwa/shellPullToRefresh';
import { NOTIFICATION_CATEGORIES, type NotificationType } from '@/config/notifications';

import {
  getNotifications,
  markAsRead,
  markManyAsRead,
  markManyAsUnread,
  deleteNotification,
  deleteNotifications,
} from '@/lib/actions/notifications';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const POLL_INTERVAL_MS = 30_000;

/** Category filter options derived from config */
const CATEGORY_OPTIONS = Object.values(NOTIFICATION_CATEGORIES).map((cat) => ({
  label: cat.label,
  value: cat.id,
}));

/** Read/unread filter options */
const STATUS_OPTIONS = [
  { label: 'Solo no leídas', value: 'unread' },
  { label: 'Solo leídas', value: 'read' },
];

// =============================================================================
// Component
// =============================================================================

export function NotificationsClient() {
  // Page owns its own client state (items, filters, pagination, facets) and
  // refetches via getNotifications(); router.refresh() would not update it.
  // Silence the shell-wide PTR while this screen is mounted so the per-screen
  // wrapper below is the only handler for the gesture.
  useDisableShellPTR();

  // ── State ─────────────────────────────────────────────────────────────────
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<NotificationData[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cascading filter facets from server
  const [facets, setFacets] = useState<{ categories: string[]; statuses: string[] }>({
    categories: Object.values(NOTIFICATION_CATEGORIES).map((c) => c.id),
    statuses: ['unread', 'read'],
  });

  // Detail dialog
  const [detailNotif, setDetailNotif] = useState<NotificationData | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Confirm dialog
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    ids: string[];
    message: string;
  }>({ open: false, ids: [], message: '' });

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchData = useCallback(
    (targetPage: number) => {
      startTransition(async () => {
        const result = await getNotifications({
          page: targetPage,
          pageSize,
          category: category || undefined,
          unread: statusFilter === 'unread' ? true : statusFilter === 'read' ? false : undefined,
          search: debouncedSearch || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });

        if (result.error || !result.data) return;

        const { data } = result;

        setItems(
          data.items.map((item) => ({
            id: item.id,
            title: item.title,
            body: item.body ?? '',
            type: (item.type as NotificationType) ?? 'info',
            category: item.category,
            url: item.url,
            read: item.read,
            createdAt:
              item.createdAt instanceof Date
                ? item.createdAt.toISOString()
                : String(item.createdAt),
          }))
        );
        setTotalPages(data.totalPages);
        setTotalItems(data.total);
        setPage(data.page);

        // Update cascading facets
        if (data.facets) {
          setFacets(data.facets);
        }
      });
    },
    [category, statusFilter, debouncedSearch, dateFrom, dateTo, pageSize]
  );

  // Fetch on mount + filter/page change
  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, statusFilter, debouncedSearch, dateFrom, dateTo, pageSize]);

  // Background polling — keeps the page list fresh while visible.
  // Mirrors NotificationBell's useNotifications cadence (30s, visibility-aware)
  // so the page doesn't go stale just because the user kept it open.
  // `page` and `isPending` are read via refs so the interval is not torn
  // down on every page click or in-flight mutation.
  const pageRef = useRef(page);
  const pendingRef = useRef(isPending);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    pendingRef.current = isPending;
  }, [isPending]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (pendingRef.current) return;
      fetchData(pageRef.current);
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── Filter handlers ───────────────────────────────────────────────────────
  const handleCategoryChange = (value: string | string[]) => {
    setCategory(typeof value === 'string' ? value : '');
    setPage(1);
  };

  const handleStatusChange = (value: string | string[]) => {
    setStatusFilter(typeof value === 'string' ? value : '');
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    fetchData(1);
  };

  // ── Action handlers ─────────────────────────────────────────────────────────────────
  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      await markAsRead({ id });
      fetchData(page);
      window.dispatchEvent(new CustomEvent('notifications:invalidate'));
    });
  };

  const handleDeleteSingle = (id: string) => {
    setConfirmDelete({
      open: true,
      ids: [id],
      message: '¿Eliminar esta notificación?',
    });
  };

  const handleConfirmDelete = () => {
    const { ids } = confirmDelete;
    // Start fade-out animation
    setDeletingIds(new Set(ids));
    setConfirmDelete({ open: false, ids: [], message: '' });

    // After animation, do the actual delete
    setTimeout(() => {
      startTransition(async () => {
        if (ids.length === 1) {
          await deleteNotification({ id: ids[0] });
        } else {
          await deleteNotifications({ ids });
        }
        setDeletingIds(new Set());
        setSelectedIds(new Set());
        fetchData(page);
        toast.success(
          ids.length === 1
            ? 'Notificación eliminada'
            : `${ids.length} notificación(es) eliminada(s)`
        );
      });
    }, 300);
  };

  // ── Selection handlers ─────────────────────────────────────────────────
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((n) => n.id)));
    }
  };

  const handleBulkMarkRead = () => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      await markManyAsRead({ ids });
      setSelectedIds(new Set());
      fetchData(page);
      window.dispatchEvent(new CustomEvent('notifications:invalidate'));
      toast.success(`${ids.length} notificación(es) marcada(s) como leída(s)`);
    });
  };

  const handleBulkMarkUnread = () => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      await markManyAsUnread({ ids });
      setSelectedIds(new Set());
      fetchData(page);
      window.dispatchEvent(new CustomEvent('notifications:invalidate'));
      toast.success(`${ids.length} notificación(es) marcada(s) como no leída(s)`);
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    setConfirmDelete({
      open: true,
      ids,
      message: `¿Eliminar ${ids.length} notificación(es)?`,
    });
  };

  // Clear selection on filter/page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [category, statusFilter, debouncedSearch, dateFrom, dateTo, page]);

  const hasSelection = selectedIds.size > 0;
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  // ── Active filter count (for mobile badge) ──────────────────────────────
  const activeFilterCount =
    (category ? 1 : 0) + (statusFilter ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  // Clear all filters to defaults
  const handleClearFilters = useCallback(() => {
    setCategory('');
    setStatusFilter('');
    setSearch('');
    setDebouncedSearch('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  // Cascading filter options — filtered by server-side facets
  const categoryOptions = useMemo(
    () => CATEGORY_OPTIONS.filter((opt) => facets.categories.includes(opt.value)),
    [facets.categories]
  );

  const readStatusOptions = useMemo(
    () => STATUS_OPTIONS.filter((opt) => facets.statuses.includes(opt.value)),
    [facets.statuses]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PullToRefresh onRefresh={() => fetchData(page)}>
      <div className="flex flex-col gap-4">
        {/* ── Search + Filters + Actions ────────────────────────────────── */}
        <TableFilterBar
          search={
            <TableSearch
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar..."
              className="w-full sm:w-auto sm:min-w-72"
            />
          }
          filters={
            <>
              {/* Category + Status */}
              <TableFilter
                label="Categoría"
                options={categoryOptions}
                value={category}
                onChange={handleCategoryChange}
              />
              <TableFilter
                label="Estado"
                options={readStatusOptions}
                value={statusFilter}
                onChange={handleStatusChange}
              />

              {/* Date range — separate elements for proper grid sizing */}
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="neo-inset-sm bg-background text-foreground focus:neo-inset w-full rounded-xl border-0 px-3 py-2 text-sm focus:outline-none"
                  aria-label="Desde fecha"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="neo-inset-sm bg-background text-foreground focus:neo-inset w-full rounded-xl border-0 px-3 py-2 text-sm focus:outline-none"
                  aria-label="Hasta fecha"
                />
              </div>
            </>
          }
          actions={
            <div className="flex items-center gap-2">
              {/* Refresh — accessible alternative to mobile pull-to-refresh */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => fetchData(page)}
                disabled={isPending}
                title="Actualizar"
                aria-label="Actualizar notificaciones"
                className="shrink-0"
              >
                <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
              </Button>

              {/* Select all */}
              {items.length > 0 && (
                <Button
                  type="button"
                  variant={allSelected ? 'default' : 'secondary'}
                  size="icon"
                  onClick={handleSelectAll}
                  title={allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
                  className="shrink-0"
                >
                  <ListChecks className="h-4 w-4" />
                </Button>
              )}

              {/* Mark read */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleBulkMarkRead}
                disabled={!hasSelection || isPending}
                title={
                  hasSelection
                    ? `Marcar ${selectedIds.size} como leídas`
                    : 'Selecciona para marcar como leídas'
                }
                className="shrink-0"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>

              {/* Mark unread */}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleBulkMarkUnread}
                disabled={!hasSelection || isPending}
                title={
                  hasSelection
                    ? `Marcar ${selectedIds.size} como no leídas`
                    : 'Selecciona para marcar como no leídas'
                }
                className="shrink-0"
              >
                <EyeOff className="h-4 w-4" />
              </Button>

              {/* Delete */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleBulkDelete}
                disabled={!hasSelection || isPending}
                title={
                  hasSelection
                    ? `Eliminar ${selectedIds.size} notificación(es)`
                    : 'Selecciona para eliminar'
                }
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          }
          activeFilterCount={activeFilterCount}
          filterActions={
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
              title="Limpiar filtros"
              className="shrink-0"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          }
          collapseBreakpoint="always"
        />

        {/* ── Notification List ──────────────────────────────────────────── */}
        {items.length > 0 ? (
          <div className={`flex flex-col gap-3 ${isPending ? 'opacity-60' : ''}`}>
            {items.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  'transition-all duration-300',
                  deletingIds.has(notif.id) && 'scale-95 opacity-0'
                )}
              >
                <NotificationItem
                  notification={notif}
                  variant="full"
                  onClick={(n) => {
                    if (!n.read) handleMarkAsRead(n.id);
                    setDetailNotif({ ...n, read: true });
                  }}
                  onRead={handleMarkAsRead}
                  onDelete={handleDeleteSingle}
                  selectable
                  selected={selectedIds.has(notif.id)}
                  onSelect={handleToggleSelect}
                />
              </div>
            ))}
          </div>
        ) : (
          /* ── Empty State ──────────────────────────────────────────────── */
          <EmptyState
            icon={Bell}
            title="No tienes notificaciones"
            description={
              category || statusFilter
                ? 'Intenta cambiar los filtros para ver más resultados.'
                : 'Cuando recibas notificaciones aparecerán aquí.'
            }
          />
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {totalPages > 0 && items.length > 0 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            className="rounded-xl"
          />
        )}

        {/* ── Notification Detail Dialog ──────────────────────────────────── */}
        <NotificationDetailDialog
          notification={detailNotif}
          onClose={() => setDetailNotif(null)}
          onRead={(id) => {
            handleMarkAsRead(id);
            setDetailNotif(null);
          }}
          onDelete={(id) => {
            handleDeleteSingle(id);
            setDetailNotif(null);
          }}
        />

        {/* ── Confirm Delete Dialog ────────────────────────────────────────── */}
        <ConfirmDialog
          open={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, ids: [], message: '' })}
          onConfirm={handleConfirmDelete}
          title="Confirmar eliminación"
          description={confirmDelete.message}
          confirmText="Eliminar"
          variant="danger"
          isLoading={isPending}
        />
      </div>
    </PullToRefresh>
  );
}
