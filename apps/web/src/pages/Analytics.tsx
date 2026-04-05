import { AppLayout } from "@/components/AppLayout";
import { MyChart } from "@/components/MyChart";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export function Analytics() {

  const {user} = useAuth()

  useEffect(() => {
    console.log("User in Analytics:", user);
  }, [user]);

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gap: 24 }}>
          <section>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Analytics</h1>
            <p style={{ marginTop: 12, color: "var(--muted-foreground)" }}>
              View your spending trends and compare performance over the last 6 months.
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
            <MyChart />
          </section>
        </div>
    </AppLayout>
  );
}
