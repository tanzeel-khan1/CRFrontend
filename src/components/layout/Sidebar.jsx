import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Receipt, FileText,
  FolderOpen, Settings, ChevronDown, Plus,
  LogOut, BarChart2, Lightbulb, NotebookPen, UserSquare2, Home, KeyRound, MessageSquare, BookMarked, ScrollText,
  User
} from "lucide-react";
import { api } from "@/api/apiClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/expenses", label: "Expenses", icon: Receipt },
  { path: "/invoices", label: "Invoices", icon: FileText },
  { path: "/documents", label: "Documents", icon: FolderOpen },
  // { path: "/analytics", label: "Analytics", icon: BarChart2 },
  { path: "/ideas", label: "Ideas & Tickets", icon: Lightbulb },
  { path: "/notepad", label: "Notepad", icon: NotebookPen },
  { path: "/employees", label: "Employees", icon: UserSquare2 },
  // { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/business-plan", label: "Business Plan", icon: BookMarked },
  // { path: "/aichat", label: "AI Chat", icon: MessageSquare },

];

export default function Sidebar({
  companies,
  activeCompany,
  setActiveCompany,
  onCreateCompany,
  collapsed,
  setCollapsed,
  currentUser,
  onNavClick,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isOwner =
    activeCompany?.created_by?.toLowerCase() === currentUser?.email?.toLowerCase();

  const allNavItems = [
    ...navItems,
    ...(isOwner ? [{ path: "/contracts", label: "Contracts", icon: ScrollText }] : []),
  ];

  return (
    <aside
      style={{ width: collapsed ? 72 : 240 }}
      className="h-screen bg-sidebar text-sidebar-foreground flex flex-col fixed left-0 top-0 z-40 transition-all duration-200 border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden w-full">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-xs">T</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm tracking-tight whitespace-nowrap text-sidebar-foreground">
             Tynvora OS
            </span>
          )}
        </div>
      </div>

      {/* Workspace Switcher */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border flex-shrink-0">
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-1">
            Workspace
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
                <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-sidebar-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate leading-tight">
                    {activeCompany?.name || "Select Company"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                    {activeCompany?.industry || "No Industry"}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {companies.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => setActiveCompany(c)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  {c.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreateCompany}>
                <Plus className="w-4 h-4 mr-2" />
                New Company
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/personal")}>
                <User className="w-4 h-4 mr-2" />
                Go to Persnal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-2">
            Menu
          </p>
        )}
        <nav className="space-y-0.5">
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                onClick={onNavClick}
              >
                <div
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors
                    ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        {!collapsed && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest mb-2 px-2">
              General
            </p>
          </div>
        )}
        <Link
          to="/settings"
          title={collapsed ? "Settings" : undefined}
          onClick={onNavClick}
        >
          <div
            className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors
            ${
              location.pathname === "/settings"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </div>
        </Link>
      </div>

      {/* User Profile at Bottom */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        {collapsed ? (
          /* Collapsed: avatar + toggle stacked and centered */
          <div className="flex flex-col items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-semibold text-sidebar-foreground">
                {currentUser?.full_name?.[0] ||
                  currentUser?.email?.[0]?.toUpperCase() ||
                  "U"}
              </span>
            </div>
            <button
              onClick={() => navigate("/personal")}
              className="w-full flex items-center justify-center py-1 rounded-lg text-sidebar-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-foreground/60 transition-colors"
              title="Personal Home"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex items-center justify-center py-1 rounded-lg text-sidebar-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-foreground/60 transition-colors text-[11px]"
            >
              →
            </button>
          </div>
        ) : (
          /* Expanded */
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-sidebar-foreground">
                  {currentUser?.full_name?.[0] ||
                    currentUser?.email?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-tight">
                  {currentUser?.full_name || "User"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                  {currentUser?.email || ""}
                </p>
              </div>
              <button
                onClick={() => navigate("/personal")}
                className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground"
                title="Personal Home"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="mt-2 w-full flex items-center justify-center py-1.5 rounded-lg text-sidebar-foreground/30 hover:bg-sidebar-accent hover:text-sidebar-foreground/60 transition-colors text-[11px] gap-1"
            >
              ← Collapse
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
