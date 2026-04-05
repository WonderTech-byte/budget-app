import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Card, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card";
import type { BudgetSummary, BudgetCreatePayload } from "@/lib/api";
import { createBudgetApi, getBudgetsApi } from "@/lib/api";

const budgetStats = (budgets: BudgetSummary[]) => {
  const active = budgets.filter((budget) => budget.status !== "COMPLETED").length;
  const drafts = budgets.filter((budget) => budget.status === "DRAFT").length;
  const completed = budgets.filter((budget) => budget.status === "COMPLETED").length;
  const totalRemaining = budgets.reduce((sum, budget) => sum + budget.daysRemaining, 0);
  return { active, drafts, completed, totalRemaining };
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  display: "grid",
  placeItems: "center",
  padding: 24,
  zIndex: 50,
};

const modalStyle: React.CSSProperties = {
  width: "min(680px, 100%)",
  background: "#ffffff",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 32px 120px rgba(15, 23, 42, 0.14)",
};

export function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const { active, drafts, completed, totalRemaining } = budgetStats(budgets);

  const filteredBudgets = useMemo(
    () =>
      budgets.filter((budget) =>
        budget.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ),
    [budgets, searchTerm]
  );

  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true);
        const data = await getBudgetsApi();
        setBudgets(Array.isArray(data) ? data : [data]);
      } catch (err: any) {
        setError(err?.message || "Unable to load budgets.");
      } finally {
        setLoading(false);
      }
    }

    loadBudgets();
  }, []);

  const handleCreateBudget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage("");

    if (!title.trim() || !startDate || !endDate) {
      setFormError("Title, start date, and end date are required.");
      return;
    }

    const payload: BudgetCreatePayload = {
      title: title.trim(),
      startDate,
      endDate,
      status: "ACTIVE",
    };

    try {
      const created = await createBudgetApi(payload);
      setBudgets((current) => [created, ...current]);
      setTitle("");
      setStartDate("");
      setEndDate("");
      setCreateOpen(false);
      setSuccessMessage("Budget created successfully.");
      navigate(`/budgets/${created.id}`);
    } catch (err: any) {
      setFormError(err?.message || "Unable to create budget.");
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>Budgets</h1>
                <p style={{ marginTop: 12, color: "#475569", maxWidth: 680 }}>
                  Track your active budgets, review progress, and create new plans for upcoming months.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Button variant="secondary" onClick={() => setCreateOpen((current) => !current)}>
                  {createOpen ? "Close form" : "New budget"}
                </Button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <Card className="p-6" style={{ minHeight: 140 }}>
                <CardTitle>Total budgets</CardTitle>
                <CardDescription style={{ marginTop: 8, fontSize: 32, fontWeight: 800 }}>{budgets.length}</CardDescription>
                <CardContent style={{ marginTop: 12, color: "#64748b" }}>
                  {active} active • {drafts} draft • {completed} completed
                </CardContent>
              </Card>

              <Card className="p-6" style={{ minHeight: 140 }}>
                <CardTitle>Active budgets</CardTitle>
                <CardDescription style={{ marginTop: 8, fontSize: 32, fontWeight: 800 }}>{active}</CardDescription>
                <CardContent style={{ marginTop: 12, color: "#64748b" }}>
                  Budgets currently tracking spend and cash flow.
                </CardContent>
              </Card>

              <Card className="p-6" style={{ minHeight: 140 }}>
                <CardTitle>Total remaining days</CardTitle>
                <CardDescription style={{ marginTop: 8, fontSize: 32, fontWeight: 800 }}>{totalRemaining}</CardDescription>
                <CardContent style={{ marginTop: 12, color: "#64748b" }}>
                  Remaining days across all budgets.
                </CardContent>
              </Card>
            </div>
          </section>

          {createOpen && (
            <div style={overlayStyle} onClick={() => setCreateOpen(false)}>
              <div style={modalStyle} onClick={(event) => event.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Create a new budget</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>
                      Add a budget with a start and end date to begin tracking your planned cash flow.
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setCreateOpen(false)}>
                    Close
                  </Button>
                </div>

                <form onSubmit={handleCreateBudget} style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "grid", gap: 8 }}>
                    <Label htmlFor="budget-title">Title</Label>
                    <Input
                      id="budget-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. June budget"
                    />
                  </div>

                  <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    <div style={{ display: "grid", gap: 8 }}>
                      <Label htmlFor="budget-start">Start date</Label>
                      <Input
                        id="budget-start"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <Label htmlFor="budget-end">End date</Label>
                      <Input
                        id="budget-end"
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                      />
                    </div>
                  </div>

                  {formError && <p style={{ color: "#b91c1c", margin: 0 }}>{formError}</p>}
                  {successMessage && <p style={{ color: "#047857", margin: 0 }}>{successMessage}</p>}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>
                    <Button variant="destructive" type="button" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create budget</Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <section style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: "1 1 280px" }}>
                <Label htmlFor="budget-search">Search budgets</Label>
                <Input
                  id="budget-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by title"
                />
              </div>
              <div>
                <Button variant="outline" onClick={() => setSearchTerm("")}>Clear</Button>
              </div>
            </div>

            {loading ? (
              <Card className="p-6">
                <CardTitle>Loading budgets…</CardTitle>
              </Card>
            ) : error ? (
              <Card className="p-6">
                <CardTitle>Error</CardTitle>
                <CardDescription style={{ marginTop: 8, color: "#ef4444" }}>{error}</CardDescription>
              </Card>
            ) : filteredBudgets.length === 0 ? (
              <Card className="p-6">
                <CardTitle>No budgets found</CardTitle>
                <CardDescription style={{ marginTop: 8 }}>
                  {budgets.length === 0
                    ? "You don't have any budgets yet. Create one to get started."
                    : "Try a different search term."}
                </CardDescription>
              </Card>
            ) : (
              <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
                {filteredBudgets.map((budget) => (
                  <Card
                    key={budget.id}
                    className="p-6"
                    style={{ cursor: "pointer", transition: "transform 150ms ease", minHeight: 200 }}
                    onClick={() => navigate(`/budgets/${budget.id}`)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <CardTitle>{budget.title}</CardTitle>
                      <div style={{ color: budget.status === "COMPLETED" ? "#059669" : "#7c3aed", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {budget.status}
                      </div>
                    </div>
                    <CardDescription style={{ marginTop: 8 }}>
                      {budget.formattedStartDate} → {budget.formattedEndDate}
                    </CardDescription>
                    <CardContent style={{ marginTop: 20, display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                        <span>Days elapsed</span>
                        <span>{budget.daysElapsed}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}>
                        <span>Days remaining</span>
                        <span>{budget.daysRemaining}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
      </div>
    </AppLayout>
  );
}
