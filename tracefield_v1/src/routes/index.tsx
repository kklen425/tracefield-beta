import { createFileRoute } from "@tanstack/react-router";
import { FieldApp } from "@/components/trace/field-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <FieldApp />;
}
