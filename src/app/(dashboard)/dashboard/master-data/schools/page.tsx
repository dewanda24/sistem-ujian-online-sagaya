import { redirect } from "next/navigation";

export default function LegacyMasterDataSchoolsPage() {
  redirect("/dashboard/super-admin/schools");
}
