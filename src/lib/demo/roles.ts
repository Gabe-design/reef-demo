import type { Employee, Role } from "./types";

export function homeFor(e: Employee) {
  return e.role === "worker" ? "/crew/" : e.role === "sales" ? "/sales/" : "/admin/";
}

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", manager: "Manager", worker: "Crew", sales: "Sales" };
