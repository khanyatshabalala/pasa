import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FundaLogo } from "@/components/layout/Logo";
import { BarefootLoader } from "@/components/shared/Loader";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

const signUpSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(50),
  last_name:  z.string().trim().min(1, "Enter your last name").max(50),
  email:      z.string().trim().email().max(255),
  password:   z.string().min(6, "Password must be at least 6 characters").max(72),
  location:   z.string().trim().max(150).optional(),
});

export function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, onSignIn } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !loading) navigate({ to: "/app" });
  }, [user, authLoading, loading, navigate]);

  const onSignInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    try {
      const resp = await api.post<{ token: string; userId: string; role: string; schoolId?: string }>(
        "/api/v1/auth/parent/signin",
        parsed.data,
        { skipAuth: true }
      );
      await onSignIn(resp);
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message ?? "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const onSignUpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      first_name: fd.get("first_name"),
      last_name:  fd.get("last_name"),
      email:      fd.get("email"),
      password:   fd.get("password"),
      location:   fd.get("location") || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    try {
      const resp = await api.post<{ token: string; userId: string; role: string }>(
        "/api/v1/auth/parent/register",
        {
          email:     parsed.data.email,
          password:  parsed.data.password,
          firstName: parsed.data.first_name,
          lastName:  parsed.data.last_name,
          city:      parsed.data.location ?? null,
        },
        { skipAuth: true }
      );
      await onSignIn(resp);
      toast.success("Account created! Welcome to PASA.");
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not create account. The email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <FundaLogo light />
        <div className="relative flex flex-col items-center gap-8">
          <BarefootLoader size={140} theme="dark" />
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Every school. <br /><span className="text-accent">Every parent.</span> One app.
            </h2>
            <p className="mt-4 text-primary-foreground/70 max-w-sm">
              Marks, attendance, discipline and transfers — all in one place.
            </p>
          </div>
        </div>
        <div className="text-xs text-primary-foreground/50">© PASA · Made for South Africa</div>
      </div>

      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="p-8 w-full max-w-md">
          <div className="lg:hidden mb-6"><FundaLogo /></div>
          <div className="mb-4">
            <h1 className="text-xl font-semibold">For parents</h1>
            <p className="text-xs text-muted-foreground mt-1">
              School staff: <a href="/school/auth" className="text-accent hover:underline">sign in here</a>
            </p>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={onSignInSubmit} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="si-pw">Password</Label>
                  <Input id="si-pw" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {loading ? <BarefootLoader size={22} theme="light" /> : "Sign in"}
                </Button>
                <div className="text-center">
                  <Link to="/reset-password" className="text-xs text-muted-foreground hover:text-accent transition-colors">
                    Forgot your password?
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignUpSubmit} className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="su-fn">First name</Label>
                    <Input id="su-fn" name="first_name" required autoComplete="given-name" placeholder="Sipho" />
                  </div>
                  <div>
                    <Label htmlFor="su-ln">Last name</Label>
                    <Input id="su-ln" name="last_name" required autoComplete="family-name" placeholder="Dlamini" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div>
                  <Label htmlFor="su-pw">Password</Label>
                  <Input id="su-pw" name="password" type="password" required autoComplete="new-password" minLength={6} />
                </div>
                <div>
                  <Label htmlFor="su-location">
                    Location <span className="text-muted-foreground/60 font-normal text-xs">(optional)</span>
                  </Label>
                  <Input id="su-location" name="location" placeholder="e.g. Soweto, Gauteng" autoComplete="address-level2" maxLength={150} />
                </div>
                <Button disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
