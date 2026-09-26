import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    teacherId: number | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      teacherId: number | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    teacherId: number | null;
  }
}
