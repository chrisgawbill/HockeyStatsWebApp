import React from "react";
import { Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../Data/Context/ThemeContext";
import styles from "../style/PageHeader.module.css";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function normalizeNavPath(path: string): string {
  return path.split("?")[0];
}

export default function PageHeader() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isTeamSubPage = pathname.startsWith("/team/");
  const isGameSubPage = pathname.startsWith("/game/");
  const isSubPage = isTeamSubPage || isGameSubPage;
  const routeState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
    activeNavPath?: string;
  } | null;
  const sourcePath = routeState?.sourcePath ?? (isGameSubPage ? "/schedule" : "/teamList");
  const activePath = normalizeNavPath(
    isSubPage ? routeState?.activeNavPath ?? sourcePath : pathname,
  );

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate(routeState?.fallbackPath ?? sourcePath);
  };

  const navItems = [
    { label: "Home", path: "/", icon: <HomeIcon /> },
    { label: "Schedule", path: "/schedule", icon: <CalendarIcon /> },
    { label: "Standings", path: "/standings", icon: <BarChartIcon /> },
    { label: "Team List", path: "/teamList", icon: <UsersIcon /> },
  ];

  return (
    <div
      className={styles["nav-bar"]}
      style={isSubPage ? { marginBottom: 0 } : undefined}
    >
      <div className={styles["nav-back-col"]}>
        {isSubPage && (
          <button
            className={styles["nav-back-btn"]}
            onClick={handleBack}
            aria-label="Go back"
          >
            <BackIcon />
          </button>
        )}
      </div>
      {navItems.map(({ label, path, icon }) => (
        <div key={path} className={styles["nav-bar-item"]}>
          <Link to={path} style={{ width: "100%" }}>
            <Button
              className={cx(styles["nav-btn"], activePath === path && styles["active-page"])}
              aria-label={label}
            >
              <span className={styles["nav-btn__label"]}>{label}</span>
              <span className={styles["nav-btn__icon"]}>{icon}</span>
            </Button>
          </Link>
        </div>
      ))}
      <div className={styles["nav-theme-col"]}>
        <button
          className={styles["theme-toggle-btn"]}
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  );
}
