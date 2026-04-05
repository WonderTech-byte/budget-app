import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type {
  BudgetDetail,
  InflowDTO,
  BudgetCategoryDTO,
  TransactionDTO,
} from "@/lib/api"
import {
  createBudgetCategoryApi,
  createBudgetInflowApi,
  createBudgetTransactionApi,
  getBudgetByIdApi,
  updateBudgetCategoryApi,
  updateBudgetInflowApi,
  updateBudgetTransactionApi,
} from "@/lib/api"

const selectBaseClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80"

type ModalSize = "sm" | "md" | "lg"

const modalSizeClassName: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
}

function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: ModalSize
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-[2px] supports-[backdrop-filter]:bg-black/45"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full animate-in rounded-2xl bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10 duration-200 fade-in-0 zoom-in-95",
          modalSizeClassName[size]
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="grid gap-1">
            <h2 className="text-lg leading-none font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function getStatusBadgeClassName(status: string) {
  if (status === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
  }
  if (status === "DRAFT") {
    return "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
  }
  return "bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300"
}

function getTransactionTypeBadgeClassName(type: string) {
  if (type === "PLANNED") {
    return "bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-300"
  }
  return "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300"
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value)
  return currencyFormatter.format(
    Number.isFinite(numericValue) ? numericValue : 0
  )
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

function formatPercentage(value: number) {
  return `${Math.round(Number.isFinite(value) ? value : 0)}%`
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
  tone?: "emerald" | "teal" | "amber" | "slate"
}) {
  const toneClasses = {
    emerald: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    teal: {
      badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
      icon: "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
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
    <Card className="rounded-[26px] border border-border/70 bg-card/95 py-0 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.55)]">
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

function ProgressStrip({
  label,
  value,
  percentage,
  tone = "teal",
}: {
  label: string
  value: string
  percentage: number
  tone?: "emerald" | "teal" | "amber" | "slate"
}) {
  const barClassName = {
    emerald: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    teal: "bg-gradient-to-r from-teal-600 to-cyan-500",
    amber: "bg-gradient-to-r from-amber-500 to-orange-400",
    slate: "bg-gradient-to-r from-slate-700 to-slate-500",
  }[tone]

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          {value}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-muted/80">
        <div
          className={cn("h-full rounded-full", barClassName)}
          style={{ width: `${clampPercentage(percentage)}%` }}
        />
      </div>
    </div>
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
    <div className="grid min-h-[240px] place-items-center rounded-[24px] border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
      <div className="grid max-w-sm justify-items-center gap-4">
        <div className="grid size-14 place-items-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border/70">
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

const budgetChartColors = {
  inflow: "#16a34a",
  planned: "#0f766e",
  actual: "#f97316",
  actualSoft: "#fdba74",
}

export function BudgetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [budget, setBudget] = useState<BudgetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddInflowModal, setShowAddInflowModal] = useState(false)
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [newInflowLabel, setNewInflowLabel] = useState("")
  const [newInflowAmount, setNewInflowAmount] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryAmount, setNewCategoryAmount] = useState("")
  const [newTransactionItemName, setNewTransactionItemName] = useState("")
  const [newTransactionAmount, setNewTransactionAmount] = useState("")
  const [newTransactionCategoryName, setNewTransactionCategoryName] =
    useState("")
  const [showTransactionSuccessModal, setShowTransactionSuccessModal] =
    useState(false)
  const [transactionSuccessMessage, setTransactionSuccessMessage] = useState("")
  const [showEditInflowModal, setShowEditInflowModal] = useState(false)
  const [showEditTransactionModal, setShowEditTransactionModal] =
    useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [selectedInflow, setSelectedInflow] = useState<InflowDTO | null>(null)
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDTO | null>(null)
  const [selectedCategory, setSelectedCategory] =
    useState<BudgetCategoryDTO | null>(null)
  const [editInflowLabel, setEditInflowLabel] = useState("")
  const [editInflowAmount, setEditInflowAmount] = useState("")
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryAmount, setEditCategoryAmount] = useState("")
  const [editTransactionItemName, setEditTransactionItemName] = useState("")
  const [editTransactionAmount, setEditTransactionAmount] = useState("")
  const [editTransactionDate, setEditTransactionDate] = useState("")
  const [editTransactionCategoryId, setEditTransactionCategoryId] = useState("")
  const [editTransactionType, setEditTransactionType] = useState<
    "PLANNED" | "UNPLANNED"
  >("UNPLANNED")
  const [detailMessage, setDetailMessage] = useState<string>("")
  const [detailError, setDetailError] = useState<string | null>(null)

  const selectedInflows = useMemo(
    () => budget?.inflows ?? [],
    [budget?.inflows]
  )
  const selectedCategories = useMemo(
    () => budget?.categories ?? [],
    [budget?.categories]
  )
  const selectedTransactions = useMemo(
    () => budget?.transactions ?? [],
    [budget?.transactions]
  )
  const matchingTransactionCategory = useMemo(() => {
    const categoryName = newTransactionCategoryName.trim().toLowerCase()
    const itemName = newTransactionItemName.trim().toLowerCase()
    return selectedCategories.find(
      (category) =>
        category.name.toLowerCase() === categoryName ||
        (!!itemName && category.name.toLowerCase() === itemName)
    )
  }, [newTransactionCategoryName, newTransactionItemName, selectedCategories])

  useEffect(() => {
    async function loadBudget() {
      if (!id) return
      setLoading(true)
      setError(null)

      try {
        const detail = await getBudgetByIdApi(id)
        setBudget(detail)
      } catch (err: any) {
        console.error(err)
        setError(err?.message || "Unable to load budget detail.")
      } finally {
        setLoading(false)
      }
    }

    loadBudget()
  }, [id])

  const refreshBudget = async () => {
    if (!id) return
    try {
      const detail = await getBudgetByIdApi(id)
      setBudget(detail)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddInflow = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDetailError(null)
    setDetailMessage("")

    if (!id) return
    if (!newInflowLabel.trim() || !newInflowAmount.trim()) {
      setDetailError("Label and amount are required for an inflow.")
      return
    }

    try {
      await createBudgetInflowApi(id, {
        label: newInflowLabel.trim(),
        amount: newInflowAmount.trim(),
      })
      setShowAddInflowModal(false)
      setNewInflowLabel("")
      setNewInflowAmount("")
      setDetailMessage("Inflow added successfully.")
      await refreshBudget()
    } catch (err: any) {
      // console.error(err);
      setDetailError(err?.message || "Unable to add inflow.")
    }
  }

  const handleAddTransaction = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setDetailError(null)
    setDetailMessage("")

    if (!id) return
    if (!newTransactionItemName.trim() || !newTransactionAmount.trim()) {
      setDetailError("Item name and amount are required for a transaction.")
      return
    }

    const matchedCategory = matchingTransactionCategory
    const categoryId = matchedCategory ? matchedCategory.id : undefined
    const createdType = matchedCategory ? "PLANNED" : "UNPLANNED"
    const now = new Date().toISOString()

    try {
      await createBudgetTransactionApi(id, {
        itemName: newTransactionItemName.trim(),
        amount: newTransactionAmount.trim(),
        date: now,
        type: createdType,
        categoryId,
      })

      setShowAddTransactionModal(false)
      setNewTransactionItemName("")
      setNewTransactionAmount("")
      setNewTransactionCategoryName("")
      setTransactionSuccessMessage(
        matchedCategory
          ? `Planned transaction added under ${matchedCategory.name}.`
          : "Unplanned transaction added successfully."
      )
      setShowTransactionSuccessModal(true)
      await refreshBudget()
    } catch (err: any) {
      console.error(err)
      setDetailError(err?.message || "Unable to add transaction.")
    }
  }

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDetailError(null)
    setDetailMessage("")

    if (!id) return
    if (!newCategoryName.trim() || !newCategoryAmount.trim()) {
      setDetailError("Name and amount are required for a category.")
      return
    }

    try {
      const createdCategory = await createBudgetCategoryApi(id, {
        name: newCategoryName.trim(),
        plannedAmount: newCategoryAmount.trim(),
      })

      setBudget((current) => {
        if (!current) return current
        const newCategory = {
          id: createdCategory.id || `temp-${Date.now()}`,
          name: createdCategory.name || newCategoryName.trim(),
          plannedAmount:
            createdCategory.plannedAmount || newCategoryAmount.trim(),
        }
        return {
          ...current,
          categories: [...current.categories, newCategory],
          totalPlanned: (
            Number(current.totalPlanned) + Number(newCategory.plannedAmount)
          ).toFixed(2),
        }
      })

      setShowAddCategoryModal(false)
      setNewCategoryName("")
      setNewCategoryAmount("")
      setDetailMessage("Category added successfully.")
    } catch (err: any) {
      console.error(err)
      setDetailError(err?.message || "Unable to add category.")
    }
  }

  const handleEditInflow = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDetailError(null)
    setDetailMessage("")

    if (!id || !selectedInflow) return
    if (!editInflowLabel.trim() || !editInflowAmount.trim()) {
      setDetailError("Label and amount are required for an inflow.")
      return
    }

    try {
      await updateBudgetInflowApi(id, selectedInflow.id, {
        label: editInflowLabel.trim(),
        amount: editInflowAmount.trim(),
      })
      setShowEditInflowModal(false)
      setSelectedInflow(null)
      setEditInflowLabel("")
      setEditInflowAmount("")
      setDetailMessage("Inflow updated successfully.")
      await refreshBudget()
    } catch (err: any) {
      console.error(err)
      setDetailError(err?.message || "Unable to update inflow.")
    }
  }

  const handleEditTransaction = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setDetailError(null)
    setDetailMessage("")

    if (!id || !selectedTransaction) return
    if (
      !editTransactionItemName.trim() ||
      !editTransactionAmount.trim() ||
      !editTransactionDate.trim()
    ) {
      setDetailError(
        "Item name, amount, and date are required for a transaction."
      )
      return
    }

    if (editTransactionType === "PLANNED" && !editTransactionCategoryId) {
      setDetailError("Select a category for planned transactions.")
      return
    }

    try {
      await updateBudgetTransactionApi(id, selectedTransaction.id, {
        itemName: editTransactionItemName.trim(),
        amount: editTransactionAmount.trim(),
        date: editTransactionDate,
        type: editTransactionType,
        categoryId:
          editTransactionType === "PLANNED"
            ? editTransactionCategoryId
            : undefined,
      })
      setShowEditTransactionModal(false)
      setSelectedTransaction(null)
      setEditTransactionItemName("")
      setEditTransactionAmount("")
      setEditTransactionDate("")
      setEditTransactionCategoryId("")
      setEditTransactionType("UNPLANNED")
      setDetailMessage("Transaction updated successfully.")
      await refreshBudget()
    } catch (err: any) {
      console.error(err)
      setDetailError(err?.message || "Unable to update transaction.")
    }
  }

  const handleEditCategory = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    setDetailError(null)
    setDetailMessage("")

    if (!id || !selectedCategory) return
    if (!editCategoryName.trim() || !editCategoryAmount.trim()) {
      setDetailError("Name and amount are required for a category.")
      return
    }

    try {
      const updatedCategory = await updateBudgetCategoryApi(
        id,
        selectedCategory.id,
        {
          name: editCategoryName.trim(),
          plannedAmount: editCategoryAmount.trim(),
        }
      )

      setBudget((current) => {
        if (!current) return current
        const updatedCategories = current.categories.map((cat) =>
          cat.id === selectedCategory.id
            ? {
                id: updatedCategory.id || cat.id,
                name: updatedCategory.name || editCategoryName.trim(),
                plannedAmount:
                  updatedCategory.plannedAmount || editCategoryAmount.trim(),
              }
            : cat
        )
        const oldAmount = Number(selectedCategory.plannedAmount)
        const newAmount = Number(editCategoryAmount.trim())
        const totalPlanned = (
          Number(current.totalPlanned) -
          oldAmount +
          newAmount
        ).toFixed(2)
        return {
          ...current,
          categories: updatedCategories,
          totalPlanned,
        }
      })

      setShowEditCategoryModal(false)
      setSelectedCategory(null)
      setEditCategoryName("")
      setEditCategoryAmount("")
      setDetailMessage("Category updated successfully.")
      await refreshBudget()
    } catch (err: any) {
      console.error(err)
      setDetailError(err?.message || "Unable to update category.")
    }
  }

  const openEditInflowModal = useCallback((inflow: InflowDTO) => {
    setSelectedInflow(inflow)
    setEditInflowLabel(inflow.label)
    setEditInflowAmount(inflow.amount)
    setShowEditInflowModal(true)
  }, [])

  const openEditTransactionModal = useCallback(
    (transaction: TransactionDTO) => {
      setSelectedTransaction(transaction)
      setEditTransactionItemName(transaction.itemName)
      setEditTransactionAmount(transaction.amount)
      setEditTransactionType(
        transaction.type === "PLANNED" ? "PLANNED" : "UNPLANNED"
      )
      // Parse the formattedDate to YYYY-MM-DD format for the date input
      try {
        const date = new Date(transaction.formattedDate)
        if (isNaN(date.getTime())) {
          setEditTransactionDate("") // Fallback to empty if invalid
        } else {
          const formattedDate = date.toISOString().split("T")[0]
          setEditTransactionDate(formattedDate)
        }
      } catch {
        setEditTransactionDate("")
      }
      setEditTransactionCategoryId(transaction.categoryId)
      setShowEditTransactionModal(true)
    },
    []
  )

  const openEditCategoryModal = useCallback((category: BudgetCategoryDTO) => {
    setSelectedCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryAmount(category.plannedAmount)
    setShowEditCategoryModal(true)
  }, [])

  const chartData = useMemo(() => {
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

  const totalTransactionAmount = useMemo(
    () =>
      selectedTransactions.reduce((sum, item) => sum + Number(item.amount), 0),
    [selectedTransactions]
  )

  const totalsComparisonChartData = useMemo(() => {
    if (!budget) return []
    return [
      {
        name: budget.title,
        inflow: Number(budget.totalInflow),
        planned: Number(budget.totalPlanned),
        actual: totalTransactionAmount,
      },
    ]
  }, [budget, totalTransactionAmount])

  const totalInflowValue = useMemo(
    () => Number(budget?.totalInflow ?? 0),
    [budget?.totalInflow]
  )
  const totalPlannedValue = useMemo(
    () => Number(budget?.totalPlanned ?? 0),
    [budget?.totalPlanned]
  )
  const remainingBalance = useMemo(
    () => totalInflowValue - totalTransactionAmount,
    [totalInflowValue, totalTransactionAmount]
  )
  const elapsedPercentage = useMemo(
    () =>
      budget?.totalDays ? (budget.daysElapsed / budget.totalDays) * 100 : 0,
    [budget?.daysElapsed, budget?.totalDays]
  )
  const plannedVsInflowPercentage = useMemo(
    () =>
      totalInflowValue > 0 ? (totalPlannedValue / totalInflowValue) * 100 : 0,
    [totalInflowValue, totalPlannedValue]
  )
  const actualVsPlannedPercentage = useMemo(
    () =>
      totalPlannedValue > 0
        ? (totalTransactionAmount / totalPlannedValue) * 100
        : 0,
    [totalPlannedValue, totalTransactionAmount]
  )
  const actualVsInflowPercentage = useMemo(
    () =>
      totalInflowValue > 0
        ? (totalTransactionAmount / totalInflowValue) * 100
        : 0,
    [totalInflowValue, totalTransactionAmount]
  )
  const budgetSummaryMessage = useMemo(() => {
    if (!budget) {
      return ""
    }

    if (budget.daysRemaining <= 0) {
      return `This budget window has ended with ${formatCurrency(
        remainingBalance
      )} remaining after ${selectedTransactions.length} recorded transactions.`
    }

    if (remainingBalance < 0) {
      return `${formatCurrency(
        Math.abs(remainingBalance)
      )} above inflow with ${budget.daysRemaining} day${
        budget.daysRemaining === 1 ? "" : "s"
      } still left in the cycle.`
    }

    return `${formatCurrency(remainingBalance)} available across the next ${
      budget.daysRemaining
    } day${budget.daysRemaining === 1 ? "" : "s"} in this budget cycle.`
  }, [budget, remainingBalance, selectedTransactions.length])

  const budgetPulseTitle =
    remainingBalance >= 0 ? "Healthy runway" : "Attention needed"
  const budgetPulseDescription =
    remainingBalance >= 0
      ? "Spending is still inside your cash runway. Use the progress bars below to compare timing, planned allocations, and real spend."
      : "Actual spend is ahead of available inflow. Review recent transactions and planned categories to rebalance this budget."

  return (
    <AppLayout>
      <div className="relative mx-auto w-full max-w-7xl space-y-6 pb-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%)]" />

        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Budget detail
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {budget?.title ?? "Budget detail"}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Review the full story of this budget at a glance, from inflow
              runway to category health and day-to-day spending.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>
          </div>
        </header>

        {loading ? (
          <Card className="rounded-[30px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
            <CardContent className="grid min-h-[260px] place-items-center p-8">
              <div className="grid justify-items-center gap-3 text-center">
                <div className="size-12 animate-pulse rounded-full bg-muted" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    Loading budget detail
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pulling together totals, categories, and transaction
                    activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="rounded-[30px] border border-destructive/30 bg-destructive/5 py-0 shadow-[0_24px_80px_-46px_rgba(127,29,29,0.28)]">
            <CardContent className="grid min-h-[220px] place-items-center p-8">
              <div className="grid max-w-md justify-items-center gap-3 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
                  <TrendingDown className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    We couldn&apos;t load this budget
                  </p>
                  <p className="text-sm leading-6 text-destructive">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : budget ? (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[32px] border border-slate-900/70 bg-[linear-gradient(135deg,#09111d_0%,#0f3d3e_56%,#14555f_100%)] text-white shadow-[0_30px_120px_-50px_rgba(15,23,42,0.62)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.18),transparent_28%)]" />
              <div className="relative grid gap-8 p-6 lg:grid-cols-[1.35fr_0.9fr] lg:p-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-white uppercase">
                        Budget pulse
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                          getStatusBadgeClassName(budget.status)
                        )}
                      >
                        {budget.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                        {budget.title}
                      </h2>
                      <p className="max-w-2xl text-sm leading-7 text-slate-200/90">
                        {budgetSummaryMessage}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[22px] border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl bg-white/12 text-teal-200">
                          <CalendarDays className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
                            Timeline
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {budget.formattedStartDate}
                          </p>
                          <p className="text-xs text-slate-300">
                            {budget.formattedEndDate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl bg-white/12 text-emerald-200">
                          <Target className="size-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
                            Budget window
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {budget.totalDays} day
                            {budget.totalDays === 1 ? "" : "s"}
                          </p>
                          <p className="text-xs text-slate-300">
                            {budget.daysElapsed} elapsed •{" "}
                            {budget.daysRemaining} remaining
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl bg-white/12 text-teal-200">
                          <PiggyBank className="size-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
                            Categories mapped
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {selectedCategories.length}
                          </p>
                          <p className="text-xs text-slate-300">
                            {formatCurrency(totalPlannedValue)} planned across
                            this budget
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 place-items-center rounded-2xl bg-white/12 text-amber-200">
                          <ReceiptText className="size-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
                            Transactions logged
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {selectedTransactions.length}
                          </p>
                          <p className="text-xs text-slate-300">
                            {formatCurrency(totalTransactionAmount)} spent so
                            far
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-white text-slate-900 hover:bg-white/90"
                      onClick={() => setShowAddTransactionModal(true)}
                    >
                      <ArrowUpRight className="size-4" />
                      Add transaction
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                      onClick={() => setShowAddCategoryModal(true)}
                    >
                      Add category
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                      onClick={() => setShowAddInflowModal(true)}
                    >
                      Add inflow
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
                    {budget.formattedCreatedAt ? (
                      <span>Created {budget.formattedCreatedAt}</span>
                    ) : null}
                    {budget.formattedCompletedAt ? (
                      <span>Completed {budget.formattedCompletedAt}</span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[28px] border border-teal-200/30 bg-[#f7fbf9] p-5 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-sm dark:border-teal-500/20 dark:bg-slate-950/85 dark:text-slate-100">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold tracking-[0.18em] text-teal-700 uppercase dark:text-teal-300">
                        Budget pulse
                      </p>
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        {budgetPulseTitle}
                      </h3>
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {budgetPulseDescription}
                      </p>
                    </div>

                    <div className="space-y-4 rounded-[24px] border border-teal-100 bg-white/85 p-4 shadow-sm dark:border-teal-500/10 dark:bg-slate-900/70">
                      <ProgressStrip
                        label="Time elapsed"
                        value={formatPercentage(elapsedPercentage)}
                        percentage={elapsedPercentage}
                        tone="teal"
                      />
                      <ProgressStrip
                        label="Actual vs planned"
                        value={formatPercentage(actualVsPlannedPercentage)}
                        percentage={actualVsPlannedPercentage}
                        tone={
                          actualVsPlannedPercentage > 100 ? "amber" : "emerald"
                        }
                      />
                      <ProgressStrip
                        label="Actual vs inflow"
                        value={formatPercentage(actualVsInflowPercentage)}
                        percentage={actualVsInflowPercentage}
                        tone={remainingBalance >= 0 ? "emerald" : "amber"}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[22px] border border-teal-100 bg-white/85 p-4 shadow-sm dark:border-teal-500/10 dark:bg-slate-900/70">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-teal-700 uppercase dark:text-teal-300">
                          Unassigned cash
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(totalInflowValue - totalPlannedValue)}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          What remains after planned allocations.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-amber-100 bg-white/85 p-4 shadow-sm dark:border-amber-500/10 dark:bg-slate-900/70">
                        <p className="text-[11px] font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300">
                          Activity logged
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                          {selectedTransactions.length} transaction
                          {selectedTransactions.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                          Across {selectedCategories.length} categor
                          {selectedCategories.length === 1
                            ? "y"
                            : "ies"} and {selectedInflows.length} inflow
                          {selectedInflows.length === 1 ? "" : "s"}.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {detailMessage ? (
              <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:text-emerald-300">
                {detailMessage}
              </div>
            ) : null}
            {detailError ? (
              <div className="rounded-[22px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-sm">
                {detailError}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total inflow"
                value={formatCurrency(totalInflowValue)}
                caption={`${selectedInflows.length} inflow source${
                  selectedInflows.length === 1 ? "" : "s"
                } feeding this budget.`}
                icon={<Wallet className="size-5" />}
                tone="emerald"
              />
              <SummaryCard
                label="Planned spend"
                value={formatCurrency(totalPlannedValue)}
                caption={`${formatPercentage(plannedVsInflowPercentage)} of inflow assigned across ${
                  selectedCategories.length
                } categor${selectedCategories.length === 1 ? "y" : "ies"}.`}
                icon={<PiggyBank className="size-5" />}
                tone="teal"
              />
              <SummaryCard
                label="Actual spend"
                value={formatCurrency(totalTransactionAmount)}
                caption={`${selectedTransactions.length} transaction${
                  selectedTransactions.length === 1 ? "" : "s"
                } recorded so far in this cycle.`}
                icon={<CreditCard className="size-5" />}
                tone={actualVsPlannedPercentage > 100 ? "amber" : "slate"}
              />
              <SummaryCard
                label={
                  remainingBalance >= 0 ? "Available balance" : "Overspend"
                }
                value={formatCurrency(
                  remainingBalance >= 0
                    ? remainingBalance
                    : Math.abs(remainingBalance)
                )}
                caption={
                  remainingBalance >= 0
                    ? budget.daysRemaining > 0
                      ? `${budget.daysRemaining} day${
                          budget.daysRemaining === 1 ? "" : "s"
                        } left with money still available in this cycle.`
                      : "Budget period ended with money left in the plan."
                    : "Actual spending is currently above available inflow."
                }
                icon={
                  remainingBalance >= 0 ? (
                    <TrendingUp className="size-5" />
                  ) : (
                    <TrendingDown className="size-5" />
                  )
                }
                tone={remainingBalance >= 0 ? "emerald" : "amber"}
              />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="rounded-[28px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
                <CardHeader className="border-b border-border/70 py-5">
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                      <Target className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Budget health</CardTitle>
                      <CardDescription>
                        Planned category allocations against actual category
                        spend.
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction className="flex items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        Spend used
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatPercentage(actualVsPlannedPercentage)}
                      </p>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  {chartData.length ? (
                    <div className="rounded-[24px] border border-teal-500/10 bg-teal-500/[0.05] p-2">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
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
                              formatter={(value) =>
                                formatCurrency(Number(value))
                              }
                              cursor={{ fill: "rgba(13, 148, 136, 0.08)" }}
                              contentStyle={{
                                borderRadius: 18,
                                border: "1px solid var(--border)",
                                background: "var(--card)",
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
                              fill={budgetChartColors.planned}
                              radius={[10, 10, 0, 0]}
                            />
                            <Bar
                              dataKey="spent"
                              name="Actual"
                              fill={budgetChartColors.actualSoft}
                              radius={[10, 10, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Target className="size-6" />}
                      title="No category chart yet"
                      description="Add categories and transactions to compare your plan against actual spending."
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
                <CardHeader className="border-b border-border/70 py-5">
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <CircleDollarSign className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Totals comparison
                      </CardTitle>
                      <CardDescription>
                        Inflow, planned spend, and actual spend side by side.
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction className="flex items-end gap-2">
                    <div className="text-right">
                      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        Live balance
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(remainingBalance)}
                      </p>
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  {totalsComparisonChartData.length ? (
                    <div className="rounded-[24px] border border-emerald-500/10 bg-emerald-500/[0.04] p-2">
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={totalsComparisonChartData}
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
                                return label.length > 14
                                  ? `${label.slice(0, 14)}...`
                                  : label
                              }}
                            />
                            <Tooltip
                              formatter={(value) =>
                                formatCurrency(Number(value))
                              }
                              cursor={{ fill: "rgba(22, 163, 74, 0.08)" }}
                              contentStyle={{
                                borderRadius: 18,
                                border: "1px solid var(--border)",
                                background: "var(--card)",
                                boxShadow:
                                  "0 18px 50px -28px rgba(15, 23, 42, 0.35)",
                              }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: 14, fontSize: 12 }}
                            />
                            <Bar
                              dataKey="inflow"
                              name="Inflow"
                              fill={budgetChartColors.inflow}
                              radius={[10, 10, 0, 0]}
                            />
                            <Bar
                              dataKey="planned"
                              name="Planned"
                              fill={budgetChartColors.planned}
                              radius={[10, 10, 0, 0]}
                            />
                            <Bar
                              dataKey="actual"
                              name="Actual"
                              fill={budgetChartColors.actual}
                              radius={[10, 10, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={<CircleDollarSign className="size-6" />}
                      title="Budget totals will appear here"
                      description="Add inflows, planned categories, and transactions to populate the totals comparison."
                    />
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-6">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card className="rounded-[28px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
                  <CardHeader className="border-b border-border/70 py-5">
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <Wallet className="size-5" />
                      </div>
                      <div>
                        <CardTitle>Inflow sources</CardTitle>
                        <CardDescription>
                          Income lines tracked for this budget.
                        </CardDescription>
                      </div>
                    </div>
                    <CardAction className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                          Total
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(totalInflowValue)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAddInflowModal(true)}
                      >
                        Add inflow
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="p-5 pt-4">
                    {selectedInflows.length ? (
                      <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background/80">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[520px] text-sm">
                            <thead className="bg-muted/30">
                              <tr className="text-left text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                <th className="px-4 py-3">Source</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                              {selectedInflows.map((inflow) => (
                                <tr
                                  key={inflow.id}
                                  className="transition-colors hover:bg-muted/40"
                                >
                                  <td className="px-4 py-3 font-medium text-foreground">
                                    {inflow.label}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                                    {formatCurrency(inflow.amount)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        openEditInflowModal(inflow)
                                      }
                                    >
                                      Edit
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={<Wallet className="size-6" />}
                        title="No inflows yet"
                        description="Add salary, business income, or any other source that funds this budget."
                        action={
                          <Button
                            size="sm"
                            onClick={() => setShowAddInflowModal(true)}
                          >
                            Add inflow
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
                  <CardHeader className="border-b border-border/70 py-5">
                    <div className="flex items-start gap-3">
                      <div className="grid size-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                        <PiggyBank className="size-5" />
                      </div>
                      <div>
                        <CardTitle>Budget categories</CardTitle>
                        <CardDescription>
                          Planned allocations for your budget.
                        </CardDescription>
                      </div>
                    </div>
                    <CardAction className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                          Planned
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(totalPlannedValue)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAddCategoryModal(true)}
                      >
                        Add category
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="p-5 pt-4">
                    {selectedCategories.length ? (
                      <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background/80">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[520px] text-sm">
                            <thead className="bg-muted/30">
                              <tr className="text-left text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">
                                  Planned
                                </th>
                                <th className="px-4 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                              {selectedCategories.map((category) => (
                                <tr
                                  key={category.id}
                                  className="transition-colors hover:bg-muted/40"
                                >
                                  <td className="px-4 py-3 font-medium text-foreground">
                                    {category.name}
                                  </td>
                                  <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                                    {formatCurrency(category.plannedAmount)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        openEditCategoryModal(category)
                                      }
                                    >
                                      Edit
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={<PiggyBank className="size-6" />}
                        title="No categories configured"
                        description="Create spending buckets so planned transactions can be measured against them."
                        action={
                          <Button
                            size="sm"
                            onClick={() => setShowAddCategoryModal(true)}
                          >
                            Add category
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-[28px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
                <CardHeader className="border-b border-border/70 py-5">
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <ReceiptText className="size-5" />
                    </div>
                    <div>
                      <CardTitle>Transactions</CardTitle>
                      <CardDescription>
                        Every spend recorded for this budget.
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        Actual spend
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(totalTransactionAmount)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowAddTransactionModal(true)}
                    >
                      Add transaction
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  {selectedTransactions.length ? (
                    <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background/80">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] text-sm">
                          <thead className="bg-muted/30">
                            <tr className="text-left text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                              <th className="px-4 py-3">Item</th>
                              <th className="px-4 py-3">Category</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3 text-right">Amount</th>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/70">
                            {selectedTransactions.map((transaction) => (
                              <tr
                                key={transaction.id}
                                className="transition-colors hover:bg-muted/40"
                              >
                                <td className="px-4 py-3 font-medium text-foreground">
                                  {transaction.itemName}
                                </td>
                                <td className="px-4 py-3">
                                  {transaction.categoryName ? (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                      {transaction.categoryName}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                      Unplanned
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                                      getTransactionTypeBadgeClassName(
                                        transaction.type
                                      )
                                    )}
                                  >
                                    {transaction.type}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                  {transaction.formattedDate}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openEditTransactionModal(transaction)
                                    }
                                  >
                                    Edit
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={<ReceiptText className="size-6" />}
                      title="No transactions recorded"
                      description="Start logging purchases and payments to compare real spend against the plan."
                      action={
                        <Button
                          size="sm"
                          onClick={() => setShowAddTransactionModal(true)}
                        >
                          Add transaction
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        ) : (
          <Card className="rounded-[30px] border border-border/70 bg-card/95 py-0 shadow-[0_24px_80px_-46px_rgba(15,23,42,0.45)]">
            <CardContent className="p-6">
              <EmptyState
                icon={<CircleDollarSign className="size-6" />}
                title="Budget not found"
                description="This budget may have been removed or is unavailable right now."
                action={
                  <Button
                    variant="outline"
                    onClick={() => navigate("/budgets")}
                  >
                    Back to budgets
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        open={showAddInflowModal}
        onClose={() => setShowAddInflowModal(false)}
        title="Add inflow"
        description="Create a new budget inflow source for this budget."
        size="sm"
      >
        <form onSubmit={handleAddInflow} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-new-inflow-label">Label</Label>
            <Input
              id="budget-new-inflow-label"
              value={newInflowLabel}
              onChange={(event) => setNewInflowLabel(event.target.value)}
              placeholder="e.g. Salary"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget-new-inflow-amount">Amount</Label>
            <Input
              id="budget-new-inflow-amount"
              type="number"
              min="0"
              step="0.01"
              value={newInflowAmount}
              onChange={(event) => setNewInflowAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAddInflowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save inflow</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add category"
        description="Add a budget category for this budget."
        size="sm"
      >
        <form onSubmit={handleAddCategory} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-new-category-name">Category name</Label>
            <Input
              id="budget-new-category-name"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="e.g. Groceries"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget-new-category-amount">Planned amount</Label>
            <Input
              id="budget-new-category-amount"
              type="number"
              min="0"
              step="0.01"
              value={newCategoryAmount}
              onChange={(event) => setNewCategoryAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAddCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save category</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showAddTransactionModal}
        onClose={() => setShowAddTransactionModal(false)}
        title="Add transaction"
        description="A transaction stays planned only when its category, or the item name itself, matches one of your existing budget categories."
        size="md"
      >
        <form onSubmit={handleAddTransaction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-new-transaction-item">Item name</Label>
            <Input
              id="budget-new-transaction-item"
              value={newTransactionItemName}
              onChange={(event) =>
                setNewTransactionItemName(event.target.value)
              }
              placeholder="e.g. Dinner"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget-new-transaction-amount">Amount</Label>
              <Input
                id="budget-new-transaction-amount"
                type="number"
                min="0"
                step="0.01"
                value={newTransactionAmount}
                onChange={(event) =>
                  setNewTransactionAmount(event.target.value)
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-new-transaction-category">Category</Label>
              <Input
                id="budget-new-transaction-category"
                list="budget-categories"
                value={newTransactionCategoryName}
                onChange={(event) =>
                  setNewTransactionCategoryName(event.target.value)
                }
                placeholder="Type an existing category to keep this planned"
              />
              <datalist id="budget-categories">
                {selectedCategories.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">
              Transaction status:{" "}
              {matchingTransactionCategory ? "Planned" : "Unplanned"}
            </p>
            <p className="mt-1 text-xs">
              If the category you enter, or the item name itself, matches an
              existing budget category, this transaction will be saved as
              planned under that category. Otherwise it will be saved as
              unplanned.
            </p>
            {matchingTransactionCategory ? (
              <p className="mt-2 text-xs text-foreground">
                Matched category:{" "}
                <span className="font-semibold">
                  {matchingTransactionCategory.name}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowAddTransactionModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save transaction</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showTransactionSuccessModal}
        onClose={() => setShowTransactionSuccessModal(false)}
        title="Transaction saved"
        description={
          transactionSuccessMessage ||
          "Your transaction was recorded successfully and will appear on the budget timeline."
        }
        size="sm"
      >
        <div className="grid justify-items-center gap-4 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            The new transaction has been added and the budget figures have
            refreshed.
          </p>
          <Button
            type="button"
            onClick={() => setShowTransactionSuccessModal(false)}
          >
            Got it
          </Button>
        </div>
      </Modal>

      <Modal
        open={showEditInflowModal && !!selectedInflow}
        onClose={() => setShowEditInflowModal(false)}
        title="Edit inflow"
        description="Update the inflow source details."
        size="sm"
      >
        <form onSubmit={handleEditInflow} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-edit-inflow-label">Label</Label>
            <Input
              id="budget-edit-inflow-label"
              value={editInflowLabel}
              onChange={(event) => setEditInflowLabel(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget-edit-inflow-amount">Amount</Label>
            <Input
              id="budget-edit-inflow-amount"
              type="number"
              min="0"
              step="0.01"
              value={editInflowAmount}
              onChange={(event) => setEditInflowAmount(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowEditInflowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update inflow</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showEditCategoryModal && !!selectedCategory}
        onClose={() => setShowEditCategoryModal(false)}
        title="Edit category"
        description="Update the budget category details."
        size="sm"
      >
        <form onSubmit={handleEditCategory} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="budget-edit-category-name">Name</Label>
            <Input
              id="budget-edit-category-name"
              value={editCategoryName}
              onChange={(event) => setEditCategoryName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget-edit-category-amount">Planned amount</Label>
            <Input
              id="budget-edit-category-amount"
              type="number"
              min="0"
              step="0.01"
              value={editCategoryAmount}
              onChange={(event) => setEditCategoryAmount(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowEditCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update category</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showEditTransactionModal && !!selectedTransaction}
        onClose={() => setShowEditTransactionModal(false)}
        title="Edit transaction"
        description="Update the transaction details."
        size="md"
      >
        <form onSubmit={handleEditTransaction} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget-edit-transaction-item">Item name</Label>
              <Input
                id="budget-edit-transaction-item"
                value={editTransactionItemName}
                onChange={(event) =>
                  setEditTransactionItemName(event.target.value)
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-edit-transaction-amount">Amount</Label>
              <Input
                id="budget-edit-transaction-amount"
                type="number"
                min="0"
                step="0.01"
                value={editTransactionAmount}
                onChange={(event) =>
                  setEditTransactionAmount(event.target.value)
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget-edit-transaction-date">Date</Label>
              <Input
                id="budget-edit-transaction-date"
                type="date"
                value={editTransactionDate}
                onChange={(event) => setEditTransactionDate(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-edit-transaction-type">Type</Label>
              <select
                id="budget-edit-transaction-type"
                value={editTransactionType}
                onChange={(event) =>
                  setEditTransactionType(
                    event.target.value as "PLANNED" | "UNPLANNED"
                  )
                }
                className={selectBaseClassName}
              >
                <option value="UNPLANNED">Unplanned</option>
                <option value="PLANNED">Planned</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="budget-edit-transaction-category">Category</Label>
            <select
              id="budget-edit-transaction-category"
              value={editTransactionCategoryId}
              onChange={(event) =>
                setEditTransactionCategoryId(event.target.value)
              }
              disabled={editTransactionType === "UNPLANNED"}
              required={editTransactionType === "PLANNED"}
              className={cn(
                selectBaseClassName,
                editTransactionType === "UNPLANNED" ? "bg-muted/40" : undefined
              )}
            >
              <option value="">Unplanned</option>
              {selectedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <p>
              Transaction type:{" "}
              <span className="font-semibold text-foreground">
                {editTransactionType}
              </span>
            </p>
            <p className="mt-1">
              Planned transactions must have a category. Unplanned transactions
              ignore the category.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowEditTransactionModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update transaction</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
