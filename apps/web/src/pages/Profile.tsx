import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";

export function Profile() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gap: 24 }}>
          <section>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Profile</h1>
            <p style={{ marginTop: 12, color: "var(--muted-foreground)" }}>
              Account details and profile settings.
            </p>
          </section>

          <section
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Your account</h2>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>Username:</strong> {user?.username ?? "—"}
              </div>
              <div>
                <strong>Full name:</strong> {user?.fullName ?? "—"}
              </div>
              <div>
                <strong>Email:</strong> {user?.email ?? "—"}
              </div>
            </div>
          </section>
        </div>
    </AppLayout>
  );
}
