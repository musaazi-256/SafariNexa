import { inviteAdmin, updateAdminUserRole } from "./admin";
import { db } from "@/lib/db";

jest.mock("next/navigation", () => ({ redirect: jest.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/admin", () => ({ requireAdminSession: jest.fn().mockResolvedValue({ user: { id: "admin", email: "admin@safarinexa.test" } }) }));
jest.mock("@/auth", () => ({ auth: jest.fn().mockResolvedValue({ user: { id: "admin", isAdmin: true, email: "admin@safarinexa.test" } }) }));
jest.mock("@/lib/email", () => ({
  emailConfigured: jest.fn().mockReturnValue(true),
  applicationOrigin: jest.fn().mockReturnValue("http://localhost:3000"),
  sendAccountEmail: jest.fn()
}));
jest.mock("@/lib/db", () => ({
  db: {
    $transaction: jest.fn(),
    role: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    adminUser: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    verificationToken: { deleteMany: jest.fn(), create: jest.fn() },
    auditLog: { create: jest.fn() }
  }
}));

const mock = db as unknown as {
  $transaction: jest.Mock;
  role: Record<string, jest.Mock>;
  user: Record<string, jest.Mock>;
  adminUser: Record<string, jest.Mock>;
  verificationToken: Record<string, jest.Mock>;
  auditLog: Record<string, jest.Mock>;
};

beforeEach(() => {
  jest.clearAllMocks();
  // inviteAdmin uses both the callback form (user/adminUser creation) and the
  // array/batch form (verification-token swap) in the same function.
  mock.$transaction.mockImplementation((arg) => (typeof arg === "function" ? arg(mock) : Promise.all(arg)));
});

describe("inviteAdmin", () => {
  test("rejects an invalid permission level", async () => {
    mock.role.findUnique.mockResolvedValue(null);
    await expect(inviteAdmin("new.admin@safarinexa.test", "bogus-role-id")).rejects.toThrow("valid permission level");
  });

  test("grants the chosen role rather than a hardcoded one", async () => {
    mock.role.findUnique.mockResolvedValue({ id: "role-support", name: "Support Agent" });
    mock.user.findUnique.mockResolvedValue(null);
    mock.user.create.mockResolvedValue({ id: "new-user", email: "new.admin@safarinexa.test" });
    mock.adminUser.findUnique.mockResolvedValue(null);
    mock.adminUser.findFirst.mockResolvedValue({ id: "admin-user-1" });

    await inviteAdmin("new.admin@safarinexa.test", "role-support");

    expect(mock.adminUser.create).toHaveBeenCalledWith({
      data: { userId: "new-user", roleId: "role-support", status: "INVITED" }
    });
    expect(mock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "admin_invite_user" }) })
    );
  });
});

describe("updateAdminUserRole", () => {
  test("an admin cannot change their own permission level", async () => {
    mock.adminUser.findUnique.mockResolvedValue({ id: "target", userId: "admin", roleId: "role-a", user: {}, role: { name: "Support Agent" } });
    const form = new FormData();
    form.set("roleId", "role-b");
    await expect(updateAdminUserRole("target", form)).rejects.toThrow("cannot change your own permission level");
    expect(mock.adminUser.update).not.toHaveBeenCalled();
  });

  test("rejects a permission level that doesn't exist", async () => {
    mock.adminUser.findUnique.mockResolvedValue({ id: "target", userId: "someone-else", roleId: "role-a", user: {}, role: { name: "Support Agent" } });
    mock.role.findUnique.mockResolvedValue(null);
    const form = new FormData();
    form.set("roleId", "bogus");
    await expect(updateAdminUserRole("target", form)).rejects.toThrow("valid permission level");
  });

  test("updates the role and logs who changed what", async () => {
    mock.adminUser.findUnique.mockResolvedValue({
      id: "target",
      userId: "someone-else",
      roleId: "role-a",
      user: { email: "support@safarinexa.test" },
      role: { name: "Support Agent" }
    });
    mock.role.findUnique.mockResolvedValue({ id: "role-b", name: "Finance Manager" });

    const form = new FormData();
    form.set("roleId", "role-b");
    await updateAdminUserRole("target", form);

    expect(mock.adminUser.update).toHaveBeenCalledWith({ where: { id: "target" }, data: { roleId: "role-b" } });
    expect(mock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "admin_change_user_role",
          metadata: expect.objectContaining({ previousRoleName: "Support Agent", newRoleName: "Finance Manager" })
        })
      })
    );
  });
});
