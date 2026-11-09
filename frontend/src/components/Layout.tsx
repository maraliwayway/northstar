import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { onSlow } from "../lib/api";
import { useUser } from "../lib/auth";
import { Star } from "./ui";

const NAV = [
  { group: "Direction", items: [
    { to: "/", label: "Overview" },
    { to: "/north-star", label: "North Star & goals" },
    { to: "/reset", label: "12-week reset" },
  ] },
  { group: "Cash flow", items: [
    { to: "/spending", label: "Spending audit" },
    { to: "/paycheque", label: "Paycheque plan" },
    { to: "/income", label: "Income experiments" },
  ] },
  { group: "Wealth", items: [
    { to: "/net-worth", label: "Net worth & safety net" },
    { to: "/debt", label: "Debt payoff" },
    { to: "/investing", label: "Investing" },
  ] },
  { group: "Habits", items: [
    { to: "/review", label: "Quarterly review" },
    { to: "/settings", label: "Settings" },
  ] },
];

export default function Layout() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [slow, setSlow] = useState(false);
  const location = useLocation();

  useEffect(() => onSlow(setSlow), []);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <span className="brand">
          <Star size={20} /> Northstar
        </span>
        <button className="menu-button" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <nav id="site-nav" className={`sidebar ${open ? "open" : ""}`} aria-label="Main">
        <span className="brand brand-desktop">
          <Star size={22} /> Northstar
        </span>
        {NAV.map((section) => (
          <div className="nav-group" key={section.group}>
            <p className="nav-heading">{section.group}</p>
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
        <p className="nav-user">Signed in as {user.name || user.email}</p>
      </nav>

      <main id="main" className="content">
        {slow && (
          <p className="wake-banner" role="status">
            Waking up the server. The first request after a quiet spell can take up to a minute.
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
