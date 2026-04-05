import { useEffect, useState, type ReactNode } from "react"
import SideBar from "@/components/SideBar"

type AppLayoutProps = {
  children: ReactNode
  topBar?: ReactNode
}

export function AppLayout({ children, topBar }: AppLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <SideBar isMobile={isMobile} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {topBar ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: isMobile ? "16px 18px" : "22px 32px",
              borderBottom: "1px solid var(--border)",
              backgroundColor: "#0b1224",
              boxShadow: "0 1px 0 rgba(148, 163, 184, 0.08)",
              zIndex: 10,
            }}
          >
            {topBar}
          </div>
        ) : null}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? 16 : 28,
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
