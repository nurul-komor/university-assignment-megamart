import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (rawEmail: string, rawPassword: string) => {
    try {
      const normalizedEmail = rawEmail.trim().toLowerCase();
      if (!normalizedEmail || !rawPassword.trim()) {
        setError("Email and password are required");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError("Please enter a valid email address");
        return;
      }
      setSubmitting(true);
      setError("");
      await login({ email: normalizedEmail, password: rawPassword });
      navigate("/");
    } catch {
      setError("Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithDummyCredentials = async (dummyEmail: string) => {
    setEmail(dummyEmail);
    setPassword("password");
    await submitLogin(dummyEmail, "password");
  };

  return (
    <main className="grid min-h-[80vh] place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">Sign In</h1>
        <p className="text-slate-600 mt-2">
          New to Our Product?{" "}
          <Link to="/register" className="text-sky-600">
            Create an Account
          </Link>
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await submitLogin(email, password);
          }}
        >
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Enter Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              className="rounded-xl border border-slate-300 bg-slate-100 py-3 font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              type="button"
              disabled={submitting}
              onClick={() => loginWithDummyCredentials("admin@gmail.com")}
            >
              Login as Admin
            </button>
            <button
              className="rounded-xl border border-slate-300 bg-slate-100 py-3 font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              type="button"
              disabled={submitting}
              onClick={() => loginWithDummyCredentials("customer@gmail.com")}
            >
              Login as Customer
            </button>
          </div>
          <button
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-400"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        {error && <p className="text-rose-600 mt-3">{error}</p>}
      </div>
    </main>
  );
}
