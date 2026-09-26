import { auth } from "@/auth";
import { ChangePasswordForm } from "@/app/_account/change-password-form";

export default async function AccountPage() {
  const session = await auth();
  return <ChangePasswordForm name={session?.user?.name} email={session?.user?.email} />;
}
