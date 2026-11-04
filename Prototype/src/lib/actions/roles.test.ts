import { createRole, updateRolePermissions } from "./roles";
import { db } from "@/lib/db";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/admin", () => ({ requireAdminSession: jest.fn().mockResolvedValue({ user: { id: "admin", email: "admin@safarinexa.test" } }) }));
jest.mock("@/lib/db", () => ({
  db: {
    $transaction: jest.fn(),
    role: { findUnique: jest.fn(), create: jest.fn() },
    permission: { findMany: jest.fn() },
    rolePermission: { upsert: jest.fn(), deleteMany: jest.fn() },
    auditLog: { create: jest.fn() }
  }
}));

const mock = db as unknown as {
  $transaction: jest.Mock;
  role: Record<string, jest.Mock>;
  permission: Record<string, jest.Mock>;
  rolePermission: Record<string, jest.Mock>;
  auditLog: Record<string, jest.Mock>;
};

beforeEach(() => {
  jest.clearAllMocks();
  mock.$transaction.mockImplementation((ops) => Promise.all(ops));
});

describe("createRole", () => {
  test("rejects a blank name", async () => {
    await expect(createRole("  ", "", [])).rejects.toThrow("Enter a name");
  });

  test("rejects the reserved Super Admin name", async () => {
    await expect(createRole("Super Admin", "", [])).rejects.toThrow("reserved");
  });

  test("rejects a duplicate name", async () => {
    mock.role.findUnique.mockResolvedValue({ id: "existing" });
    await expect(createRole("Support Agent", "", [])).rejects.toThrow("already exists");
  });

  test("creates the role with exactly the requested permissions", async () => {
    mock.role.findUnique.mockResolvedValue(null);
    mock.permission.findMany.mockResolvedValue([{ id: "p1", key: "support.manage" }]);
    mock.role.create.mockResolvedValue({ id: "role-new", name: "Listings Reviewer" });

    await createRole("Listings Reviewer", "Reviews listings", ["support.manage"]);

    expect(mock.role.create).toHaveBeenCalledWith({
      data: {
        name: "Listings Reviewer",
        description: "Reviews listings",
        permissions: { create: [{ permissionId: "p1" }] }
      }
    });
    expect(mock.auditLog.create).toHaveBeenCalled();
  });
});

describe("updateRolePermissions", () => {
  test("refuses to edit Super Admin", async () => {
    mock.role.findUnique.mockResolvedValue({ id: "sa", name: "Super Admin" });
    const form = new FormData();
    await expect(updateRolePermissions("sa", form)).rejects.toThrow("can't be edited here");
    expect(mock.rolePermission.upsert).not.toHaveBeenCalled();
  });

  test("grants checked permissions and revokes unchecked ones", async () => {
    mock.role.findUnique.mockResolvedValue({ id: "role-support", name: "Support Agent" });
    mock.permission.findMany.mockResolvedValue([
      { id: "p1", key: "support.manage" },
      { id: "p2", key: "payments.manage" }
    ]);

    const form = new FormData();
    form.append("permissions", "support.manage");
    await updateRolePermissions("role-support", form);

    expect(mock.rolePermission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { roleId: "role-support", permissionId: "p1" } })
    );
    expect(mock.rolePermission.deleteMany).toHaveBeenCalledWith({
      where: { roleId: "role-support", permissionId: "p2" }
    });
    expect(mock.auditLog.create).toHaveBeenCalled();
  });
});
