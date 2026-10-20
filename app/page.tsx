import { redirect } from "next/navigation";

// The landing page will live here later; for now go straight to the app.
export default function Home() {
  redirect("/dashboard");
}
