'use client';

/**
 * UserTable Component
 *
 * Admin table for user management following the dashboard pattern:
 * - Header + description outside card
 * - Filter bar with search, role filter, and action button
 * - Table in sidebar-colored container with integrated pagination
 *
 * @see CRUD-002
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Mail, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { TableColumn } from '@/components/ui/table';
import { TableFilter, TableFilterBar } from '@/components/ui/table-filter';
import { TableSearch } from '@/components/ui/table-extras';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/AlertDialog';
import {
  UserListItem,
  toggleUserStatus,
  hardDeleteUser,
  checkCanHardDelete,
} from '@/lib/actions/admin/user-admin';
import {
  getRoleStyle,
  getRoleDisplayName,
  isSuperAdmin,
  canInvite as canRoleInvite,
  ROLES,
} from '@/config/roles';
import { toast } from 'sonner';
import { InviteUserDialog } from './InviteUserDialog';
import { StatusToggle } from '@/components/common/StatusToggle';

// =============================================================================
// Types
// =============================================================================

interface UserTableProps {
  /** Users data from server */
  users: UserListItem[];
  /** Current user's role for permission checks */
  currentUserRole: string;
  /** Current user's ID (for self-delete prevention) */
  currentUserId: string;
  /** Whether email is configured (show invite button) */
  emailConfigured?: boolean;
}

// Master filter option definitions (labels, colors, order)
const ALL_ROLE_OPTIONS = [
  { value: ROLES.SUPER_ADMIN, label: 'Super Admin', dotClassName: 'bg-badge-purple-dot' },
  { value: ROLES.ADMIN, label: 'Administrador', dotClassName: 'bg-badge-blue-dot' },
  { value: ROLES.USER, label: 'Usuario', dotClassName: 'bg-badge-slate-dot' },
];

const ALL_STATUS_OPTIONS = [
  { value: 'active', label: 'Activos', dotClassName: 'bg-badge-emerald-dot' },
  { value: 'inactive', label: 'Inactivos', dotClassName: 'bg-badge-slate-dot' },
];

const defaultStatusFilter = ['active'];

/** Get user status key */
function getUserStatus(user: UserListItem): string {
  return user.deletedAt === null ? 'active' : 'inactive';
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// =============================================================================
// Component
// =============================================================================

export function UserTable({
  users,
  currentUserRole,
  currentUserId,
  emailConfigured = false,
}: UserTableProps) {
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const showInviteButton = emailConfigured || canRoleInvite(currentUserRole);
  const [hardDeleteUserId, setHardDeleteUserId] = useState<string | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [hardDeleteEligible, setHardDeleteEligible] = useState(false);

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>(defaultStatusFilter);

  // Apply filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          (user.name?.toLowerCase().includes(searchLower) ?? false) ||
          user.email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (roleFilter.length > 0 && !roleFilter.includes(user.role)) {
        return false;
      }
      if (statusFilter.length > 0) {
        const status = getUserStatus(user);
        if (!statusFilter.includes(status)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Cascading filter options: each filter shows only values present in data
  // filtered by ALL OTHER active filters (not allData)
  const roleOptions = useMemo(() => {
    // Apply search + status filters, but NOT role filter
    const subset = users.filter((user) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !(user.name?.toLowerCase().includes(searchLower) ?? false) &&
          !user.email.toLowerCase().includes(searchLower)
        )
          return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(getUserStatus(user))) {
        return false;
      }
      return true;
    });
    const presentRoles = new Set(subset.map((u) => u.role));
    return ALL_ROLE_OPTIONS.filter((opt) => presentRoles.has(opt.value));
  }, [users, search, statusFilter]);

  const statusOptions = useMemo(() => {
    // Apply search + role filters, but NOT status filter
    const subset = users.filter((user) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !(user.name?.toLowerCase().includes(searchLower) ?? false) &&
          !user.email.toLowerCase().includes(searchLower)
        )
          return false;
      }
      if (roleFilter.length > 0 && !roleFilter.includes(user.role)) {
        return false;
      }
      return true;
    });
    const presentStatuses = new Set(subset.map((u) => getUserStatus(u)));
    return ALL_STATUS_OPTIONS.filter((opt) => presentStatuses.has(opt.value));
  }, [users, search, roleFilter]);

  // Active filter count (for badge + clear button)
  const activeFilterCount = useMemo(
    () =>
      roleFilter.length +
      (statusFilter.length !== defaultStatusFilter.length ||
      statusFilter.some((v, i) => v !== defaultStatusFilter[i])
        ? statusFilter.length
        : 0),
    [roleFilter, statusFilter]
  );

  // Clear all filters to defaults
  const handleClearFilters = useCallback(() => {
    setSearch('');
    setRoleFilter([]);
    setStatusFilter(defaultStatusFilter);
  }, []);

  // Handle status toggle
  const handleToggle = useCallback(async (userId: string) => {
    const result = await toggleUserStatus(userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.data?.isActive ? 'Usuario reactivado' : 'Usuario desactivado');
    }
  }, []);

  // Handle hard delete
  async function handleHardDeleteClick(userId: string) {
    setHardDeleteUserId(userId);
    // Check eligibility in real-time
    try {
      const result = await checkCanHardDelete(userId);
      setHardDeleteEligible(result.canDelete);
      if (!result.canDelete) {
        toast.error(result.reason || 'No se puede eliminar permanentemente');
        setHardDeleteUserId(null);
      }
    } catch (error) {
      console.error('[UserTable] Hard delete eligibility check failed:', error);
      toast.error('Error al verificar elegibilidad');
      setHardDeleteUserId(null);
    }
  }

  async function handleHardDeleteConfirm() {
    if (!hardDeleteUserId) return;

    setIsHardDeleting(true);
    try {
      const result = await hardDeleteUser(hardDeleteUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Usuario eliminado permanentemente');
      }
    } catch (error) {
      console.error('[UserTable] Hard delete failed:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setIsHardDeleting(false);
      setHardDeleteUserId(null);
      setHardDeleteEligible(false);
    }
  }

  // Table columns
  const columns: TableColumn<UserListItem>[] = [
    {
      id: 'name',
      header: 'Usuario',
      sortable: true,
      accessor: (user: UserListItem) => {
        const isInactive = user.deletedAt !== null;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={user.image}
              name={user.name || user.email}
              size="sm"
              className={isInactive ? 'opacity-50' : ''}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={`truncate font-medium ${
                    isInactive ? 'text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {user.name || '—'}
                </p>
                {isInactive && (
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'role',
      header: 'Rol',
      sortable: true,
      className: 'hidden md:table-cell',
      accessor: (user: UserListItem) => {
        const style = getRoleStyle(user.role);
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {getRoleDisplayName(user.role)}
          </span>
        );
      },
    },
    {
      id: 'createdAt',
      header: 'Fecha',
      sortable: true,
      className: 'hidden lg:table-cell text-muted-foreground',
      accessor: (user: UserListItem) => formatDate(user.createdAt),
    },
    {
      id: 'status',
      header: 'Estado',
      className: 'w-16',
      accessor: (user: UserListItem) => {
        const isSelf = user.id === currentUserId;
        const isTargetSuperAdmin = isSuperAdmin(user.role);
        const toggleDisabled = isSelf || isTargetSuperAdmin;
        const disabledReason = isSelf
          ? 'No puedes desactivarte a ti mismo'
          : isTargetSuperAdmin
            ? 'SUPER_ADMIN no puede ser desactivado'
            : undefined;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <StatusToggle
              entityName={user.name || user.email}
              isActive={user.deletedAt === null}
              onToggle={() => handleToggle(user.id)}
              disabled={toggleDisabled}
              disabledReason={disabledReason}
            />
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      className: 'text-right',
      accessor: (user: UserListItem) => {
        const isSelf = user.id === currentUserId;
        const isTargetSuperAdmin = isSuperAdmin(user.role);
        const isInactive = user.deletedAt !== null;
        const canHardDel = isInactive && !isSelf && !isTargetSuperAdmin;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Editar"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/settings/users/${user.humanId}`);
              }}
            >
              <Pencil className="text-muted-foreground h-4 w-4" />
            </Button>
            {canHardDel ? (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Eliminar permanentemente"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHardDeleteClick(user.id);
                }}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            ) : (
              <span className="inline-block w-7" />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <TableFilterBar
        search={<TableSearch value={search} onChange={setSearch} placeholder="Nombre, email..." />}
        filters={
          <>
            {/* Role Filter (Multi) */}
            <TableFilter
              label="Rol"
              options={roleOptions}
              value={roleFilter}
              onChange={(v) => setRoleFilter(v as string[])}
              mode="multi"
              placeholder="Todos los roles"
            />

            {/* Status Filter */}
            <TableFilter
              label="Estado"
              options={statusOptions}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as string[])}
              mode="multi"
              placeholder="Todos"
            />
          </>
        }
        actions={
          <div className="flex items-end gap-2">
            {showInviteButton && (
              <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
                <Mail className="h-4 w-4" />
                Invitar
              </Button>
            )}
            <Button onClick={() => router.push('/settings/users/nuevo')}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        }
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
        activeFilterCount={activeFilterCount}
        collapseBreakpoint="md"
      />

      {/* Table - DataTable owns its own neumorphic styling */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        keyExtractor={(user) => user.id}
        pageSize={20}
        showSearch={false}
        showPagination={true}
        alwaysShowPagination={true}
        emptyMessage="No hay usuarios para mostrar"
        onRowClick={(user) => router.push(`/settings/users/${user.humanId}`)}
      />

      {/* Invite Dialog */}
      <InviteUserDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        currentUserRole={currentUserRole}
      />

      {/* Hard Delete Confirmation Dialog */}
      <AlertDialog
        open={!!hardDeleteUserId && hardDeleteEligible}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setHardDeleteUserId(null);
            setHardDeleteEligible(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                {hardDeleteUserId
                  ? `"${users.find((u) => u.id === hardDeleteUserId)?.name || 'Este usuario'}" será eliminado permanentemente del sistema.`
                  : 'El usuario será eliminado permanentemente.'}
              </span>
              <span className="text-destructive block font-semibold">
                Esta acción es irreversible.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isHardDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDeleteConfirm}
              disabled={isHardDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isHardDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
