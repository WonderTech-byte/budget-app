import { AppLayout } from "@/components/AppLayout"
import { useAuth } from "@/context/AuthContext"
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowRight,
  CalendarRange,
  CircleDollarSign,
  FolderKanban,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import type { BudgetDetail, BudgetSummary } from "@/lib/api"
import { createBudgetApi, getBudgetByIdApi, getBudgetsApi } from "@/lib/api"

type Budget = BudgetSummary

const budgetStats = (budgets: Budget[]) => {
  const active = budgets.filter((item) => item.status !== "COMPLETED").length
  const draft = budgets.filter((item) => item.status === "DRAFT").length
  const completed = budgets.filter((item) => item.status === "COMPLETED").length
  const totalRemaining = budgets.reduce(
    (sum, item) => sum + item.daysRemaining,
    0
  )
  return { active, draft, completed, totalRemaining }
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const chartColors = {
  inflow: "#16a34a",
  planned: "#7c3aed",
  actual: "#f97316",
  actualSoft: "#c4b5fd",
}

function formatCurrency(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value)
  return currencyFormatter.format(
    Number.isFinite(numericValue) ? numericValue : 0
  )
}

function getStatusBadgeClassName(status: string) {
  if (status === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
  }
  if (status === "DRAFT") {
    return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
  }
  return "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300"
}

function getTransactionBadgeClassName(type: string) {
  if (type === "PLANNED") {
    return "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300"
  }
  return "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300"
}

function SummaryCard({
  label,
  value,
  caption,
  icon,
  tone = "slate",
}: {
  label: string
  value: string
  caption: string
  icon: ReactNode
  tone?: "emerald" | "violet" | "amber" | "slate"
}) {
  const toneClasses = {
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    violet: {
      badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
      icon: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    },
    amber: {
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      icon: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    slate: {
      badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
      icon: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    },
  }[tone]

  return (
    <Card className="rounded-[26px] border border-slate-200/80 bg-white py-0 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.28)]">
      <CardContent className="flex h-full flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "grid size-12 place-items-center rounded-2xl border shadow-sm",
              toneClasses.icon
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase",
              toneClasses.badge
            )}
          >
            {label}
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-[24px] border border-dashed border-slate-200 bg-[#F7F6F2] px-6 py-10 text-center">
      <div className="grid max-w-sm justify-items-center gap-4">
        <div className="grid size-14 place-items-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-slate-200">
          {icon}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudget, setSelectedBudget] = useState<BudgetDetail | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newStartDate, setNewStartDate] = useState("")
  const [newEndDate, setNewEndDate] = useState("")
  const [newInflows, setNewInflows] = useState<
    { label: string; amount: string }[]
  >([])
  const [newCategories, setNewCategories] = useState<
    { name: string; plannedAmount: string }[]
  >([])
  const [newInflowLabel, setNewInflowLabel] = useState("")
  const [newInflowAmount, setNewInflowAmount] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryAmount, setNewCategoryAmount] = useState("")
  const [filterTitle, setFilterTitle] = useState("")
  const [filterDaysRemaining, setFilterDaysRemaining] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [apiMessage, setApiMessage] = useState("")

  const { active, draft, totalRemaining } = budgetStats(budgets)

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesTitle = budget.title
        .toLowerCase()
        .includes(filterTitle.trim().toLowerCase())
      const matchesDaysRemaining =
        !filterDaysRemaining ||
        budget.daysRemaining >= Number(filterDaysRemaining)
      return matchesTitle && matchesDaysRemaining
    })
  }, [budgets, filterTitle, filterDaysRemaining])

  const selectedInflows = selectedBudget?.inflows ?? []
  const selectedCategories = selectedBudget?.categories ?? []
  const selectedTransactions = selectedBudget?.transactions ?? []
  const inflowCount = selectedInflows.length
  const categoryCount = selectedCategories.length
  const transactionCount = selectedTransactions.length
  const transactionTotal = useMemo(
    () =>
      selectedTransactions.reduce((sum, item) => sum + Number(item.amount), 0),
    [selectedTransactions]
  )
  const totalInflowValue = Number(selectedBudget?.totalInflow ?? 0)
  const totalPlannedValue = Number(selectedBudget?.totalPlanned ?? 0)
  const availableBalance = totalInflowValue - transactionTotal
  const budgetProgress = selectedBudget?.totalDays
    ? (selectedBudget.daysElapsed / selectedBudget.totalDays) * 100
    : 0
  const recentTransactions = selectedTransactions.slice(0, 4)

  const newInflowTotal = useMemo(
    () => newInflows.reduce((sum, inflow) => sum + Number(inflow.amount), 0),
    [newInflows]
  )
  const newCategoryTotal = useMemo(
    () =>
      newCategories.reduce(
        (sum, category) => sum + Number(category.plannedAmount),
        0
      ),
    [newCategories]
  )

  const budgetCategoryChartData = useMemo(() => {
    if (!selectedCategories.length && !selectedTransactions.length) return []

    if (selectedCategories.length) {
      return selectedCategories.map((category) => {
        const spent = selectedTransactions
          .filter((transaction) => transaction.categoryId === category.id)
          .reduce((sum, item) => sum + Number(item.amount), 0)

        return {
          name: category.name,
          planned: Number(category.plannedAmount),
          spent,
        }
      })
    }

    const grouped: Record<
      string,
      { name: string; planned: number; spent: number }
    > = {}
    selectedTransactions.forEach((transaction) => {
      grouped[transaction.categoryName] = grouped[transaction.categoryName] || {
        name: transaction.categoryName,
        planned: 0,
        spent: 0,
      }
      grouped[transaction.categoryName].spent += Number(transaction.amount)
    })
    return Object.values(grouped)
  }, [selectedCategories, selectedTransactions])

  const handleCreateBudget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setApiMessage("")

    if (!newTitle.trim() || !newStartDate || !newEndDate) {
      setFormError("Title, start date, and end date are required.")
      return
    }

    try {
      const created = await createBudgetApi({
        title: newTitle.trim(),
        startDate: newStartDate,
        endDate: newEndDate,
        status: "ACTIVE",
        inflows: newInflows,
        categories: newCategories,
      })

      try {
        const detail = await getBudgetByIdApi(created.id)
        setBudgets((current) => [created, ...current])
        setSelectedBudget(detail)
      } catch (detailError) {
        console.error("Error fetching budget detail:", detailError)
        setBudgets((current) => [created, ...current])
        setSelectedBudget(null)
      }

      setNewTitle("")
      setNewStartDate("")
      setNewEndDate("")
      setNewInflows([])
      setNewCategories([])
      setNewInflowLabel("")
      setNewInflowAmount("")
      setNewCategoryName("")
      setNewCategoryAmount("")
      setCreateOpen(false)
      setApiMessage("Budget created successfully.")
    } catch (err) {
      console.error(err)
      setFormError("Unable to create budget. Please try again.")
    }
  }

  const handleBudgetClick = async (budget: Budget) => {
    setPreviewLoading(true)
    try {
      const detail = await getBudgetByIdApi(budget.id)
      setSelectedBudget(detail)
    } catch (err) {
      console.error("Failed to load budget details:", err)
    } finally {
      setPreviewLoading(false)
    }
  }

  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true)
        setError(null)

        const data = await getBudgetsApi()
        const normalizedBudgets = Array.isArray(data) ? data : [data]
        setBudgets(normalizedBudgets)

        if (normalizedBudgets.length > 0) {
          try {
            const detail = await getBudgetByIdApi(normalizedBudgets[0].id)
            setSelectedBudget((current) => current ?? detail)
          } catch (detailError) {
            console.error("Error fetching initial budget detail:", detailError)
            setSelectedBudget(null)
          }
        } else {
          setSelectedBudget(null)
        }
      } catch (err: any) {
        console.error("Error fetching budget data:", err)
        setError(err?.message || "Unable to load dashboard data.")
      } finally {
        setLoading(false)
      }
    }

    loadBudgets()
  }, [user])

  return (
    <AppLayout>
      <div className="mx-auto min-h-screen w-full max-w-7xl space-y-6 bg-[#F7F6F2] px-4 pt-2 pb-8 sm:px-6">
        <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.28)] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full bg-[#7c3aed]/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-[#7c3aed] uppercase">
                  Dashboard
                </span>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
                    Budgets, simplified
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-500">
                    Keep your budgets in one calm workspace with the same soft
                    cream, white, navy, and violet feel as the landing page.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                  onClick={() => setCreateOpen((current) => !current)}
                >
                  <Plus className="size-4" />
                  {createOpen ? "Close creator" : "Create budget"}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-200 bg-white text-[#0f172a] hover:bg-[#F7F6F2]"
                  onClick={() => navigate("/budgets")}
                >
                  Browse budgets
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-[#F7F6F2] p-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Active
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#0f172a]">
                  {active}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-[#F7F6F2] p-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Draft
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#0f172a]">
                  {draft}
                </p>
              </div>
              <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-700 uppercase">
                  Days left
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#0f172a]">
                  {totalRemaining}
                </p>
              </div>
            </div>
          </div>
        </section>

        {apiMessage ? (
          <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:text-emerald-300">
            {apiMessage}
          </div>
        ) : null}

        {createOpen ? (
          <Card className="rounded-[30px] border border-slate-200/80 bg-white py-0 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.3)]">
            <CardHeader className="border-b border-slate-200/80 py-5">
              <div>
                <CardTitle className="text-xl text-[#0f172a]">
                  Create new budget
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Add your budget window, then seed it with inflows and planned
                  categories before you start tracking.
                </CardDescription>
              </div>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="border-slate-200 bg-white text-[#0f172a] hover:bg-[#F7F6F2]"
                  onClick={() => setCreateOpen(false)}
                >
                  <X className="size-4" />
                  Close
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateBudget} className="grid gap-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Label className="grid gap-2">
                    <span className="text-sm font-medium">Budget title</span>
                    <Input
                      type="text"
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      placeholder="April household budget"
                    />
                  </Label>
                  <Label className="grid gap-2">
                    <span className="text-sm font-medium">Start date</span>
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(event) => setNewStartDate(event.target.value)}
                    />
                  </Label>
                  <Label className="grid gap-2">
                    <span className="text-sm font-medium">End date</span>
                    <Input
                      type="date"
                      value={newEndDate}
                      onChange={(event) => setNewEndDate(event.target.value)}
                    />
                  </Label>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-[#F7F6F2] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#0f172a]">
                          Budget inflows
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Add salary, business income, or any source that funds
                          this plan.
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-slate-700 uppercase shadow-sm ring-1 ring-slate-200">
                        {newInflows.length} row
                        {newInflows.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {newInflows.length ? (
                        <div className="grid gap-2">
                          {newInflows.map((inflow, index) => (
                            <div
                              key={`${inflow.label}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {inflow.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(inflow.amount)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setNewInflows((current) =>
                                    current.filter(
                                      (_, itemIndex) => itemIndex !== index
                                    )
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm text-muted-foreground">
                          No inflow rows yet.
                        </div>
                      )}

                      <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            type="text"
                            value={newInflowLabel}
                            onChange={(event) =>
                              setNewInflowLabel(event.target.value)
                            }
                            placeholder="Inflow label"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newInflowAmount}
                            onChange={(event) =>
                              setNewInflowAmount(event.target.value)
                            }
                            placeholder="Amount"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                            Current inflow total:{" "}
                            {formatCurrency(newInflowTotal)}
                          </p>
                          <Button
                            type="button"
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b]"
                            onClick={() => {
                              if (
                                !newInflowLabel.trim() ||
                                !newInflowAmount.trim()
                              )
                                return
                              setNewInflows((current) => [
                                ...current,
                                {
                                  label: newInflowLabel.trim(),
                                  amount: newInflowAmount.trim(),
                                },
                              ])
                              setNewInflowLabel("")
                              setNewInflowAmount("")
                            }}
                          >
                            <Plus className="size-4" />
                            Add inflow row
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-violet-200 bg-violet-50/80 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#0f172a]">
                          Budget categories
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Break spending into categories so planned vs actual
                          performance becomes clearer later.
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-violet-700 uppercase shadow-sm ring-1 ring-violet-200">
                        {newCategories.length} row
                        {newCategories.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {newCategories.length ? (
                        <div className="grid gap-2">
                          {newCategories.map((category, index) => (
                            <div
                              key={`${category.name}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200/70 bg-white px-4 py-3 shadow-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {category.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(category.plannedAmount)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setNewCategories((current) =>
                                    current.filter(
                                      (_, itemIndex) => itemIndex !== index
                                    )
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-violet-300/60 bg-white/80 px-4 py-5 text-sm text-muted-foreground">
                          No category rows yet.
                        </div>
                      )}

                      <div className="grid gap-3 rounded-[22px] border border-violet-200/70 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            type="text"
                            value={newCategoryName}
                            onChange={(event) =>
                              setNewCategoryName(event.target.value)
                            }
                            placeholder="Category name"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newCategoryAmount}
                            onChange={(event) =>
                              setNewCategoryAmount(event.target.value)
                            }
                            placeholder="Planned amount"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                            Current planned total:{" "}
                            {formatCurrency(newCategoryTotal)}
                          </p>
                          <Button
                            type="button"
                            className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                            onClick={() => {
                              if (
                                !newCategoryName.trim() ||
                                !newCategoryAmount.trim()
                              )
                                return
                              setNewCategories((current) => [
                                ...current,
                                {
                                  name: newCategoryName.trim(),
                                  plannedAmount: newCategoryAmount.trim(),
                                },
                              ])
                              setNewCategoryName("")
                              setNewCategoryAmount("")
                            }}
                          >
                            <Plus className="size-4" />
                            Add category row
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {formError ? (
                  <div className="rounded-[20px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {formError}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Required: title, start date, and end date. Inflows and
                    categories are optional but helpful.
                  </p>
                  <Button
                    type="submit"
                    className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                  >
                    <Sparkles className="size-4" />
                    Save budget
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Budgets"
            value={String(budgets.length)}
            caption="All budgets currently available in your workspace."
            icon={<FolderKanban className="size-5" />}
            tone="slate"
          />
          <SummaryCard
            label="Active"
            value={String(active)}
            caption="Budgets still in motion and worth checking regularly."
            icon={<TrendingUp className="size-5" />}
            tone="violet"
          />
          <SummaryCard
            label="Drafts"
            value={String(draft)}
            caption="Plans that still need finishing touches before execution."
            icon={<Sparkles className="size-5" />}
            tone="amber"
          />
          <SummaryCard
            label="Days left"
            value={String(totalRemaining)}
            caption="Combined remaining days across all tracked budgets."
            icon={<CalendarRange className="size-5" />}
            tone="violet"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Card className="rounded-[30px] border border-slate-200/80 bg-white py-0 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.3)]">
            <CardHeader className="border-b border-slate-200/80 py-5">
              <div>
                <CardTitle className="text-xl text-[#0f172a]">
                  Recent transactions
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Quick review of the latest activity for the selected budget.
                </CardDescription>
              </div>
              <CardAction>
                {selectedBudget ? (
                  <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {transactionCount} total
                  </span>
                ) : null}
              </CardAction>
            </CardHeader>
            <CardContent className="p-5">
              {selectedBudget && recentTransactions.length ? (
                <div className="grid gap-3 lg:max-h-[340px] lg:overflow-auto lg:pr-1">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-[22px] border border-slate-200 bg-[#F7F6F2] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {transaction.itemName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                                getTransactionBadgeClassName(transaction.type)
                              )}
                            >
                              {transaction.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {transaction.categoryName || "Unplanned"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(transaction.amount)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {transaction.formattedDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<ReceiptText className="size-6" />}
                  title="No recent transactions"
                  description="Pick a budget with transaction activity to see its latest spending here."
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-slate-200/80 bg-white py-0 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.3)]">
            <CardHeader className="border-b border-slate-200/80 py-5">
              <div>
                <CardTitle className="text-xl text-[#0f172a]">
                  Category spend view
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Compare planned allocations against actual spend for the
                  selected budget.
                </CardDescription>
              </div>
              <CardAction>
                {selectedBudget ? (
                  <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {selectedBudget.title}
                  </span>
                ) : null}
              </CardAction>
            </CardHeader>
            <CardContent className="p-5">
              {selectedBudget && budgetCategoryChartData.length ? (
                <div className="rounded-[24px] border border-violet-200 bg-[#F8F5FF] p-2">
                  <div className="h-[240px] w-full sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={budgetCategoryChartData}
                        margin={{ top: 10, right: 6, left: -16, bottom: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                          tickFormatter={(value) => {
                            const label = String(value)
                            return label.length > 12
                              ? `${label.slice(0, 12)}...`
                              : label
                          }}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value))}
                          cursor={{ fill: "rgba(124, 58, 237, 0.08)" }}
                          contentStyle={{
                            borderRadius: 18,
                            border: "1px solid rgba(196, 181, 253, 0.65)",
                            background: "#ffffff",
                            boxShadow:
                              "0 18px 50px -28px rgba(15, 23, 42, 0.35)",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: 14, fontSize: 12 }}
                        />
                        <Bar
                          dataKey="planned"
                          name="Planned"
                          fill={chartColors.planned}
                          radius={[10, 10, 0, 0]}
                        />
                        <Bar
                          dataKey="spent"
                          name="Actual"
                          fill={chartColors.actualSoft}
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<PiggyBank className="size-6" />}
                  title="No category chart available"
                  description="Choose a budget with categories or transactions to see the spend comparison chart."
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:items-start">
          <Card className="rounded-[30px] border border-slate-200/80 bg-white py-0 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.3)] xl:h-[calc(100vh-13.5rem)]">
            <CardHeader className="border-b border-slate-200/80 py-5">
              <div>
                <CardTitle className="text-xl text-[#0f172a]">
                  Budget performance
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Filter your budgets, compare timelines, and select one for a
                  richer preview on the right.
                </CardDescription>
              </div>
              <CardAction className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white text-[#0f172a] hover:bg-[#F7F6F2]"
                  onClick={() => {
                    setFilterTitle("")
                    setFilterDaysRemaining("")
                  }}
                >
                  Reset filters
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 p-6 xl:min-h-0 xl:flex-1">
              <div className="grid gap-4 md:grid-cols-2">
                <Label className="grid gap-2">
                  <span className="text-sm font-medium">Search budgets</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      className="pl-9"
                      value={filterTitle}
                      onChange={(event) => setFilterTitle(event.target.value)}
                      placeholder="Search by budget title"
                    />
                  </div>
                </Label>
                <Label className="grid gap-2">
                  <span className="text-sm font-medium">
                    Minimum remaining days
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={filterDaysRemaining}
                    onChange={(event) =>
                      setFilterDaysRemaining(event.target.value)
                    }
                    placeholder="0"
                  />
                </Label>
              </div>

              <div className="xl:min-h-0 xl:flex-1">
                {loading ? (
                  <EmptyState
                    icon={<FolderKanban className="size-6" />}
                    title="Loading budgets"
                    description="Pulling together all budget summaries for the dashboard."
                  />
                ) : error ? (
                  <EmptyState
                    icon={<TrendingDown className="size-6" />}
                    title="We couldn't load the dashboard"
                    description={error}
                  />
                ) : filteredBudgets.length ? (
                  <>
                    <div className="grid gap-3 md:hidden">
                      {filteredBudgets.map((budget) => (
                        <div
                          key={budget.id}
                          className={cn(
                            "rounded-[24px] border p-4 shadow-sm transition-colors",
                            selectedBudget?.id === budget.id
                              ? "border-violet-200 bg-violet-50"
                              : "border-slate-200 bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <p className="truncate text-base font-semibold text-[#0f172a]">
                                {budget.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {budget.formattedStartDate} -{" "}
                                {budget.formattedEndDate}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                                getStatusBadgeClassName(budget.status)
                              )}
                            >
                              {budget.status}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-[#F7F6F2] p-3">
                              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                Elapsed
                              </p>
                              <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                                {budget.daysElapsed}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[#F7F6F2] p-3">
                              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                Remaining
                              </p>
                              <p className="mt-1 text-lg font-semibold text-[#0f172a]">
                                {budget.daysRemaining}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0f172a] hover:bg-[#F7F6F2]"
                              onClick={() => handleBudgetClick(budget)}
                            >
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-200 bg-white text-[#0f172a] hover:bg-[#F7F6F2]"
                              onClick={() => navigate(`/budgets/${budget.id}`)}
                            >
                              Open
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.28)] md:block xl:h-full">
                      <div className="max-h-[540px] overflow-auto xl:h-full xl:max-h-none">
                        <table className="w-full min-w-[780px] text-sm">
                          <thead>
                            <tr className="text-left text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                              <th className="sticky top-0 z-10 bg-[#F8F5FF] px-4 py-3 backdrop-blur">
                                Budget
                              </th>
                              <th className="sticky top-0 z-10 bg-[#F8F5FF] px-4 py-3 backdrop-blur">
                                Status
                              </th>
                              <th className="sticky top-0 z-10 bg-[#F8F5FF] px-4 py-3 backdrop-blur">
                                Period
                              </th>
                              <th className="sticky top-0 z-10 bg-[#F8F5FF] px-4 py-3 text-right backdrop-blur">
                                Elapsed
                              </th>
                              <th className="sticky top-0 z-10 bg-[#F8F5FF] px-4 py-3 text-right backdrop-blur">
                                Remaining
                              </th>
                              <th className="sticky top-0 z-10 bg-[#F8F5FF] px-4 py-3 text-right backdrop-blur">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {filteredBudgets.map((budget) => (
                              <tr
                                key={budget.id}
                                className={cn(
                                  "cursor-pointer transition-colors hover:bg-[#F8F5FF]",
                                  selectedBudget?.id === budget.id
                                    ? "bg-violet-500/[0.08]"
                                    : "bg-transparent"
                                )}
                                onClick={() => handleBudgetClick(budget)}
                              >
                                <td className="px-4 py-4">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-foreground">
                                      {budget.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {budget.totalDays} day
                                      {budget.totalDays === 1 ? "" : "s"} total
                                    </p>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                                      getStatusBadgeClassName(budget.status)
                                    )}
                                  >
                                    {budget.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">
                                  {budget.formattedStartDate} -{" "}
                                  {budget.formattedEndDate}
                                </td>
                                <td className="px-4 py-4 text-right font-semibold text-foreground tabular-nums">
                                  {budget.daysElapsed}
                                </td>
                                <td className="px-4 py-4 text-right font-semibold text-foreground tabular-nums">
                                  {budget.daysRemaining}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[#0f172a] hover:bg-[#F7F6F2]"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleBudgetClick(budget)
                                      }}
                                    >
                                      Preview
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-slate-200 bg-white text-[#0f172a] hover:bg-[#F7F6F2]"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        navigate(`/budgets/${budget.id}`)
                                      }}
                                    >
                                      Open
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={<Search className="size-6" />}
                    title={
                      budgets.length
                        ? "No budgets match these filters"
                        : "No budgets yet"
                    }
                    description={
                      budgets.length
                        ? "Try a different title or lower the remaining-day filter."
                        : "Create your first budget to start tracking inflows, categories, and spend."
                    }
                    action={
                      budgets.length ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFilterTitle("")
                            setFilterDaysRemaining("")
                          }}
                        >
                          Reset filters
                        </Button>
                      ) : (
                        <Button onClick={() => setCreateOpen(true)}>
                          <Plus className="size-4" />
                          Create budget
                        </Button>
                      )
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[30px] border border-slate-200/80 bg-white py-0 shadow-[0_24px_80px_-58px_rgba(15,23,42,0.3)] lg:min-w-0">
            <CardHeader className="border-b border-slate-200/80 py-5">
              <div>
                <CardTitle className="text-xl text-[#0f172a]">
                  {selectedBudget?.title ?? "Selected budget"}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {selectedBudget
                    ? "A quick preview of the budget you are currently focused on."
                    : "Choose a budget from the table to unlock charts, metrics, and recent activity."}
                </CardDescription>
              </div>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 bg-white text-[#0f172a] hover:bg-[#F7F6F2]"
                  disabled={!selectedBudget}
                  onClick={() =>
                    selectedBudget &&
                    navigate(`/budgets/${selectedBudget.id}`)
                  }
                >
                  View full detail
                  <ArrowRight className="size-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-5">
              {previewLoading ? (
                <EmptyState
                  icon={<CircleDollarSign className="size-6" />}
                  title="Loading preview"
                  description="Refreshing totals, categories, and transactions for the selected budget."
                />
              ) : selectedBudget ? (
                <div className="space-y-5">
                  <div className="rounded-[26px] border border-[#0f172a] bg-[linear-gradient(135deg,#0f172a_0%,#1e1b4b_52%,#7c3aed_135%)] p-5 text-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.58)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-[0.16em] text-violet-200 uppercase">
                          Focus view
                        </p>
                        <h3 className="text-2xl font-semibold tracking-tight">
                          {selectedBudget.title}
                        </h3>
                        <p className="text-sm leading-6 text-slate-200/90">
                          {selectedBudget.formattedStartDate} -{" "}
                          {selectedBudget.formattedEndDate}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                          getStatusBadgeClassName(selectedBudget.status)
                        )}
                      >
                        {selectedBudget.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          Time progress
                        </p>
                        <span className="text-xs font-semibold tracking-[0.16em] text-violet-200 uppercase">
                          {Math.round(budgetProgress)}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-white/12">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-300 to-white"
                          style={{
                            width: `${Math.min(100, Math.max(0, budgetProgress))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-slate-200 bg-[#F7F6F2] p-4">
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-700 uppercase">
                        Inflows
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {inflowCount}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(totalInflowValue)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-violet-200 bg-violet-50 p-4">
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-violet-700 uppercase">
                        Categories
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {categoryCount}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(totalPlannedValue)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-amber-500/15 bg-amber-500/[0.05] p-4">
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300">
                        Transactions
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {transactionCount}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(transactionTotal)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-slate-500/15 bg-slate-500/[0.05] p-4">
                      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-700 uppercase dark:text-slate-300">
                        Balance
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {formatCurrency(availableBalance)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedBudget.daysRemaining} day
                        {selectedBudget.daysRemaining === 1 ? "" : "s"}{" "}
                        remaining
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span>
                      Created{" "}
                      {selectedBudget.formattedCreatedAt ?? "Not available"}
                    </span>
                    <span>
                      {selectedBudget.formattedCompletedAt
                        ? `Completed ${selectedBudget.formattedCompletedAt}`
                        : "Still in progress"}
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Target className="size-6" />}
                  title="No budget selected"
                  description="Pick a budget from the performance table to preview how it is performing."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
