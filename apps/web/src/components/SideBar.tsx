import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: "M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4z",
  },
  {
    label: "Budgets",
    path: "/budgets",
    icon: "M5 5h14v2H5V5zm0 6h10v2H5v-2zm0 6h6v2H5v-2z",
  },
  {
    label: "Analytics",
    path: "/analytics",
    icon: "M5 17h4V7H5v10zm6 0h4V3h-4v14zm6 0h4V11h-4v6z",
  },
  {
    label: "Profile",
    path: "/profile",
    icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  },
]

const toolItems = [
  {
    label: "Notifications",
    icon: "M12 2a7 7 0 0 1 7 7v4.5l1.7 1.7a1 1 0 0 1-.7 1.7H4a1 1 0 0 1-.7-1.7L5 13.5V9a7 7 0 0 1 7-7z",
  },
  { label: "Reports", icon: "M4 5h16v2H4V5zm0 6h10v2H4v-2zm0 6h16v2H4v-2z" },
]

type SideBarProps = {
  isMobile?: boolean
}

function SideBar({ isMobile = false }: SideBarProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) {
      setMenuOpen(false)
    }
  }, [isMobile])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate("/login", { replace: true })
  }

  const renderBrand = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          background: "#7c3aed",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: 18,
          boxShadow: "0 18px 60px rgba(124, 58, 237, 0.24)",
        }}
      >
        B
      </div>
      <div>
        <p
          style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}
        >
          Budget
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
          Financial workspace
        </p>
      </div>
    </div>
  )

  const renderNavigation = (closeOnNavigate: boolean) => (
    <nav style={{ display: "grid", gap: 10 }}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => {
            if (closeOnNavigate) setMenuOpen(false)
          }}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderRadius: 18,
            textDecoration: "none",
            color: isActive ? "#ffffff" : "#6b7280",
            background: isActive ? "#7c3aed" : "transparent",
            fontWeight: 600,
            transition: "all 150ms ease",
          })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={item.icon} fill="currentColor" />
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )

  const renderSidebarSections = (closeOnNavigate: boolean) => (
    <>
      <div>
        <div style={{ marginBottom: 32 }}>{renderBrand()}</div>
        {renderNavigation(closeOnNavigate)}
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#6b7280",
            }}
          >
            Tools
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {toolItems.map((item) => (
              <button
                key={item.label}
                type="button"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 16,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  color: "#6b7280",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 150ms ease",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={item.icon} fill="currentColor" />
                </svg>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderRadius: 18,
            background: "#f0f4ff",
            color: "#111827",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#7c3aed",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 700,
            }}
          >
            A
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Admin
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              Signed in
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "transparent",
            color: "#6b7280",
            textAlign: "left",
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 150ms ease",
          }}
        >
          Log out
        </button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "16px 18px",
            background: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          {renderBrand()}
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setMenuOpen(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: "1px solid #e9d5ff",
              background: "#faf5ff",
              display: "grid",
              placeItems: "center",
              color: "#7c3aed",
              cursor: "pointer",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div
          aria-hidden={!menuOpen}
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.38)",
            opacity: menuOpen ? 1 : 0,
            pointerEvents: menuOpen ? "auto" : "none",
            transition: "opacity 180ms ease",
            zIndex: 40,
          }}
        />

        <aside
          style={{
            width: "min(86vw, 320px)",
            height: "100vh",
            padding: 20,
            background: "#ffffff",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 24,
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 50,
            overflowY: "auto",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            transform: menuOpen
              ? "translateX(0)"
              : "translateX(calc(-100% - 16px))",
            transition: "transform 180ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: -8,
            }}
          >
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMenuOpen(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                display: "grid",
                placeItems: "center",
                color: "#475569",
                cursor: "pointer",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {renderSidebarSections(true)}
        </aside>
      </>
    )
  }

  return (
    <aside
      style={{
        width: 260,
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        overflowY: "auto",
        padding: 24,
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 24,
      }}
    >
      {renderSidebarSections(false)}
    </aside>
  )
}

export default SideBar
