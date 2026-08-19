import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopAppBarProps {
  title: string;
  /** Shows back arrow instead of menu icon */
  showBack?: boolean;
  backHref?: string;
  onBackClick?: () => void;
  /** Right-side icon buttons (max 2) */
  actions?: React.ReactNode;
  /** Transparent + white text variant (for hero/colored backgrounds) */
  variant?: "default" | "transparent";
  className?: string;
  onMenuClick?: () => void;
  /** Whether to show the hamburger menu icon (defaults to true) */
  showMenu?: boolean;
}

/**
 * Android Material 3 Top App Bar
 * Sticky, 56px height, with optional back button or hamburger.
 */
export function TopAppBar({
  title,
  showBack = false,
  backHref,
  onBackClick,
  actions,
  variant = "default",
  className,
  onMenuClick,
  showMenu = true,
}: TopAppBarProps) {
  const isTransparent = variant === "transparent";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[56px] items-center gap-1 px-1 select-none",
        isTransparent
          ? "bg-transparent text-white"
          : "bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] text-[#1E293B]",
        className,
      )}
    >
      {/* Leading: Back or Menu */}
      {showBack ? (
        backHref ? (
          <Link
            href={backHref}
            aria-label="Kembali"
            className="md-icon-btn shrink-0"
          >
            <ArrowLeft className="size-6" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Kembali"
            onClick={onBackClick}
            className="md-icon-btn shrink-0"
          >
            <ArrowLeft className="size-6" />
          </button>
        )
      ) : showMenu ? (
        <button
          type="button"
          aria-label="Buka navigasi"
          onClick={onMenuClick}
          className="md-icon-btn shrink-0 lg:hidden"
        >
          <Menu className="size-6" />
        </button>
      ) : (
        <div className="size-6 ml-2" /> // Spacer when menu is hidden
      )}

      {/* Title — fills space */}
      <h1
        className={cn(
          "flex-1 min-w-0 truncate text-[20px] font-semibold leading-tight px-1",
          isTransparent ? "text-white" : "text-[#1E293B]",
        )}
      >
        {title}
      </h1>

      {/* Trailing actions */}
      {actions && (
        <div className="flex items-center shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
