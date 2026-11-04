"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

// "Super Admin" is special-cased in requireAdminSession() to bypass every
// permission check regardless of its RolePermission rows — its access can't
// be limited through this UI, so edits to it are rejected rather than
// silently accepted and ignored.
const SUPER_ADMIN_ROLE_NAME = "Super Admin";

export async function createRole(name: string, description: string, permissionKeys: string[]) {
  const session = await requireAdminSession("roles.manage");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Enter a name for this permission level.");
  if (trimmedName === SUPER_ADMIN_ROLE_NAME) throw new Error("That name is reserved.");

  const existing = await db.role.findUnique({ where: { name: trimmedName } });
  if (existing) throw new Error("A permission level with this name already exists.");

  const permissions = permissionKeys.length
    ? await db.permission.findMany({ where: { key: { in: permissionKeys } } })
    : [];

  const role = await db.role.create({
    data: {
      name: trimmedName,
      description: description.trim() || null,
      permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) }
    }
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "ADMIN",
    action: "admin_create_role",
    outcome: "SUCCESS",
    metadata: { roleId: role.id, roleName: role.name, permissions: permissions.map((p) => p.key) }
  });

  revalidatePath("/admin/(portal)/roles", "page");
  revalidatePath("/admin/(portal)/users/new", "page");
  return role.id;
}

export async function updateRolePermissions(roleId: string, formData: FormData) {
  const session = await requireAdminSession("roles.manage");

  const role = await db.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Permission level not found.");
  if (role.name === SUPER_ADMIN_ROLE_NAME) {
    throw new Error("Super Admin always has every permission — it can't be edited here.");
  }

  const allPermissions = await db.permission.findMany();
  const checkedKeys = new Set(formData.getAll("permissions").map(String));

  await db.$transaction(
    allPermissions.map((permission) =>
      checkedKeys.has(permission.key)
        ? db.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
            update: {},
            create: { roleId: role.id, permissionId: permission.id }
          })
        : db.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: permission.id } })
    )
  );

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "ADMIN",
    action: "admin_update_role_permissions",
    outcome: "SUCCESS",
    metadata: { roleId: role.id, roleName: role.name, permissions: Array.from(checkedKeys) }
  });

  revalidatePath("/admin/(portal)/roles", "page");
}
