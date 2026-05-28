import { redirect } from "next/navigation";

export default async function QuestionBankPage() {
  redirect("/dashboard/question-bank/questions");
}
