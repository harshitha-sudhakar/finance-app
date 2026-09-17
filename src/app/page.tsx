"use client";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { user, ready, signIn, signUp, openDemo } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, router, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (mode === "signup") await signUp(name, email, password);
      else await signIn(email, password);
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(61,92,64,0.12),transparent_32%),linear-gradient(180deg,#f6f1e6,#efe6d4)]">
      <Button
        type="button"
        variant="outline"
        className="absolute left-4 top-4 bg-background/80 sm:left-6 sm:top-6"
        onClick={() => {
          openDemo();
          router.push("/dashboard");
        }}
      >
        Open demo
      </Button>
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="max-w-xl">
          <h1 className="font-heading text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Know how long your money will last.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Add your balances, income, and upcoming bills to see your projected cash flow over the next 30, 60, or 90 days.
          </p>
        </section>

        <Card className="bg-background/90">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Welcome to Runway</CardTitle>
            <CardDescription>Sign in to view and update your cash-flow forecast.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={submit} className="grid gap-3">
              {mode === "signup" ? (
                <Field label="Name">
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
                </Field>
              ) : null}
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                />
              </Field>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={pending}>
                {mode === "signup" ? "Create account" : "Sign in"}
                <ArrowRight className="size-4" />
              </Button>
              <button
                type="button"
                className="text-left text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setMode((current) => (current === "signin" ? "signup" : "signin"))}
              >
                {mode === "signin" ? "New to Runway? Create an account." : "Already have an account? Sign in."}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
