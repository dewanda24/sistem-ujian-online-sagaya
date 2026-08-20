import { redirect } from "next/navigation";

export default function TeacherAssignmentsRedirectPage() {
  redirect("/dashboard/master-data/teachers");
}

