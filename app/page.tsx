import { redirect } from "next/navigation";

export default function HomePage() {
  // Intro page is currently unused.
  // Immediately redirect to the input screen.
  redirect("/analyze");
}
