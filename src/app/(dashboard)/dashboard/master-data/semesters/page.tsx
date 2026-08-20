import { redirect } from "next/navigation";

export default function SemestersRedirectPage() {
  redirect("/dashboard/master-data/academic-years");
}

