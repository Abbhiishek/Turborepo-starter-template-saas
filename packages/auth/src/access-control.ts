import {
  createAccessControl,
  type AccessControl,
  type Role,
  type Statements,
} from "better-auth/plugins/access";
import {
  defaultRoles as organizationDefaultRoles,
  defaultStatements,
} from "better-auth/plugins/organization/access";

type WorkspaceRoleName = "owner" | "admin" | "member";
type MergeStatements<TAppStatement extends Statements> =
  typeof defaultStatements & TAppStatement;
type RoleStatements<TStatement extends Statements> = Partial<{
  [Resource in keyof TStatement]: TStatement[Resource][number][];
}>;

export type WorkspaceRoles = Record<WorkspaceRoleName, Role> &
  Record<string, Role>;

export type WorkspaceRoleStatements<
  TStatement extends Statements = MergeStatements<typeof defaultAppStatement>,
> = Partial<Record<WorkspaceRoleName, RoleStatements<TStatement>>>;

export type CreateWorkspaceRolesContext<
  TStatement extends Statements = MergeStatements<typeof defaultAppStatement>,
> = {
  ac: AccessControl<TStatement>;
  defaultRoles: WorkspaceRoles;
  statement: TStatement;
};

export type CreateWorkspaceAccessControlOptions<
  TAppStatement extends Statements = typeof defaultAppStatement,
> = {
  roleStatements?: WorkspaceRoleStatements<MergeStatements<TAppStatement>>;
  roles?: (
    context: CreateWorkspaceRolesContext<MergeStatements<TAppStatement>>,
  ) => WorkspaceRoles;
  statement?: TAppStatement;
};

export const organizationStatement = defaultStatements;

export const defaultAppStatement = {
  project: ["create", "read", "update", "delete"],
  billing: ["read", "update"],
  auditLog: ["read"],
} as const;

export const defaultAppRoleStatements = {
  owner: {
    project: ["create", "read", "update", "delete"],
    billing: ["read", "update"],
    auditLog: ["read"],
  },
  admin: {
    project: ["create", "read", "update", "delete"],
    billing: ["read"],
    auditLog: ["read"],
  },
  member: {
    project: ["read"],
    billing: [],
    auditLog: [],
  },
} satisfies WorkspaceRoleStatements<
  MergeStatements<typeof defaultAppStatement>
>;

export function createWorkspaceAccessControl<
  const TAppStatement extends Statements = typeof defaultAppStatement,
>(options: CreateWorkspaceAccessControlOptions<TAppStatement> = {}) {
  const statement = {
    ...defaultStatements,
    ...(options.statement ?? defaultAppStatement),
  } as MergeStatements<TAppStatement>;

  const ac = createAccessControl(statement);
  type RoleInput = Parameters<typeof ac.newRole>[0];
  const roleStatements =
    options.roleStatements ??
    (options.statement
      ? {}
      : (defaultAppRoleStatements as WorkspaceRoleStatements<
          MergeStatements<TAppStatement>
        >));

  const defaultRoles = {
    owner: ac.newRole({
      ...organizationDefaultRoles.owner.statements,
      ...roleStatements.owner,
    } as RoleInput),
    admin: ac.newRole({
      ...organizationDefaultRoles.admin.statements,
      ...roleStatements.admin,
    } as RoleInput),
    member: ac.newRole({
      ...organizationDefaultRoles.member.statements,
      ...roleStatements.member,
    } as RoleInput),
  };

  const roles =
    options.roles?.({
      ac,
      defaultRoles,
      statement,
    }) ?? defaultRoles;

  return {
    ac,
    admin: roles.admin,
    member: roles.member,
    owner: roles.owner,
    roles,
    statement,
  };
}

export const defaultWorkspaceAccessControl = createWorkspaceAccessControl();

export const { ac, admin, member, owner, roles, statement } =
  defaultWorkspaceAccessControl;
