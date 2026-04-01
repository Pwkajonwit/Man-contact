import { redirect } from "next/navigation";

export default function Home() {
  // Usually this would check for session, but for demonstration:
  redirect("/dashboard");
}
