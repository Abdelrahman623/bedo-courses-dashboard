import type { Project, ProjectRole } from '../types';
export type { ProjectRole };


export interface RoleConfig {
  key: ProjectRole;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export const ROLE_CONFIGS: Record<ProjectRole, RoleConfig> = {
  owner: {
    key: 'owner',
    label: 'Owner',
    shortLabel: 'Owner',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    dotClass: 'bg-amber-400',
    description: 'Full access to project settings, members, milestones, and actions',
  },
  super_admin: {
    key: 'super_admin',
    label: 'Super Admin',
    shortLabel: 'Super Admin',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
    dotClass: 'bg-purple-400',
    description: 'Can invite members and manage all milestones and actions',
  },
  admin: {
    key: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    dotClass: 'bg-blue-400',
    description: 'Can add, edit, and delete milestones and actions',
  },
  partner: {
    key: 'partner',
    label: 'Partner',
    shortLabel: 'Partner',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dotClass: 'bg-emerald-400',
    description: 'Can preview project and toggle actions done or not',
  },
};

/**
 * Determine a user's role on a given project.
 */
export function getProjectRole(project: Project, userId?: string | null): ProjectRole {
  if (!project.isShared && (project.user_id === userId || !project.user_id)) {
    return 'owner';
  }
  return project.currentUserRole || 'partner';
}

/**
 * Owner: Full access (delete project, edit project metadata, etc.)
 */
export function canManageProject(role: ProjectRole): boolean {
  return role === 'owner';
}

/**
 * Super Admin & Owner: Can invite members
 */
export function canInviteMembers(role: ProjectRole): boolean {
  return role === 'owner' || role === 'super_admin';
}

/**
 * Super Admin & Owner: Can manage members (remove, change roles)
 */
export function canManageMembers(role: ProjectRole): boolean {
  return role === 'owner' || role === 'super_admin';
}

/**
 * Owner, Super Admin, and Admin: Can add, edit, and delete milestones and actions
 */
export function canManageMilestones(role: ProjectRole): boolean {
  return role === 'owner' || role === 'super_admin' || role === 'admin';
}

/**
 * All roles (including Partner) can toggle action items done/not done
 */
export function canToggleActions(_role: ProjectRole): boolean {
  return true;
}
