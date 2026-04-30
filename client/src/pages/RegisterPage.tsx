import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <main className="grid min-h-[80vh] place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold">Create Account</h1>
        <p className="text-slate-600 mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-600">
            Sign In
          </Link>
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const normalizedName = name.trim();
              const normalizedEmail = email.trim().toLowerCase();

              if (!normalizedName || !normalizedEmail || !password.trim()) {
                setError("All fields are required");
                return;
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                setError("Please enter a valid email address");
                return;
              }
              if (password.length < 6) {
                setError("Password must be at least 6 characters");
                return;
              }
              if (password !== confirmPassword) {
                setError("Passwords do not match");
                return;
              }
              setSubmitting(true);
              await register({ name: normalizedName, email: normalizedEmail, password });
              navigate("/");
            } catch {
              setError("Registration failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <input className="w-full rounded-xl border px-4 py-3" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
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
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-400"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </form>
        {error && <p className="text-rose-600 mt-3">{error}</p>}
      </div>
    </main>
  );
}
