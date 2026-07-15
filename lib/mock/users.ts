import type { User } from "@/types";

export const mockUsers: Record<string, User> = {
  public: {
    id: "user-public",
    fullName: "Public Visitor",
    email: "",
    role: "public",
    organisationIds: [],
  },
  registered: {
    id: "user-001",
    fullName: "Fatima Bello",
    email: "fatima.bello@example.com",
    role: "registered",
    organisationIds: [],
  },
  contributor: {
    id: "user-002",
    fullName: "Ibrahim Suleiman",
    email: "ibrahim.suleiman@health.niger.gov.ng",
    role: "contributor",
    organisationIds: ["org-1"],
  },
  custodian: {
    id: "user-009",
    fullName: "Zainab Idris",
    email: "zainab.idris@nsphcda.gov.ng",
    role: "contributor",
    organisationIds: ["org-1"],
  },
  validator: {
    id: "user-010",
    fullName: "Emmanuel Okafor",
    email: "emmanuel.okafor@health.niger.gov.ng",
    role: "contributor",
    organisationIds: ["org-2"],
  },
  orgAdmin: {
    id: "user-003",
    fullName: "Dr. Amina Yusuf",
    email: "amina.yusuf@health.niger.gov.ng",
    role: "admin",
    organisationIds: ["org-1"],
  },
  repoAdmin: {
    id: "user-011",
    fullName: "Hajiya Maryam Danjuma",
    email: "maryam.danjuma@nsphcda.gov.ng",
    role: "admin",
    organisationIds: [],
  },
  ictAdmin: {
    id: "user-012",
    fullName: "Chukwuemeka Nwosu",
    email: "chukwuemeka.nwosu@nsphcda.gov.ng",
    role: "admin",
    organisationIds: [],
  },
  superAdmin: {
    id: "user-004",
    fullName: "Musa Abdullahi",
    email: "musa.abdullahi@niger.gov.ng",
    role: "super_admin",
    organisationIds: [],
  },
};
