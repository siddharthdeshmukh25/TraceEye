import { notFound } from "next/navigation";
import AuthForm from "../../../components/auth-form";

export default function AuthPage({ params }: { params: { mode: string } }) {
  if (params.mode !== "login" && params.mode !== "signup") notFound();
  return <AuthForm mode={params.mode} />;
}
