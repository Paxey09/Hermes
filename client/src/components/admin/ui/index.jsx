import { cn } from "../../../lib/adminUtils";

// Card
export function Card({ children, className }) {
  return <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ children, className }) {
  return <div className={cn("px-5 py-4 border-b border-gray-100 flex items-center justify-between", className)}>{children}</div>;
}

export function CardTitle({ children }) {
  return <h3 className="text-sm font-semibold text-gray-800">{children}</h3>;
}

export function CardContent({ children, className }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

// Badge
const BVS = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  default: "bg-gray-100 text-gray-600",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({ children, variant = "default", className }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", BVS[variant], className)}>{children}</span>;
}

// Button
const BVBtn = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const BSBtn = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export function Button({ children, variant = "primary", size = "md", loading, icon: Icon, className, disabled, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
        BVBtn[variant],
        BSBtn[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      {children}
    </button>
  );
}

// Input
export function Input({ label, error, icon: Icon, className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          className={cn(
            "block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm py-2 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            Icon ? "pl-9" : "pl-3",
            error && "border-red-400",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children, className }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn("relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto", className || "max-w-md")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// StatCard
export function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <Card>
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}

// KanbanColumn
export function KanbanColumn({ title, count, color, children }) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// Table components
export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-gray-200", className)}>{children}</table>
    </div>
  );
}

export function TableHead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children, className }) {
  return <tr className={cn("hover:bg-gray-50", className)}>{children}</tr>;
}

export function TableHeader({ children, className }) {
  return (
    <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }) {
  return <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-900", className)}>{children}</td>;
}

// Avatar
export function Avatar({ name, src, size = "md" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  const bgColor = colors[colorIndex];

  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-medium", sizeClasses[size], bgColor)}>
      {src ? <img src={src} alt={name} className="w-full h-full rounded-full object-cover" /> : initials}
    </div>
  );
}

// Select
export function Select({ label, options, error, className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={cn(
          "block w-full rounded-lg border border-gray-300 bg-white text-gray-900 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// TextArea
export function TextArea({ label, error, className, rows = 3, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        rows={rows}
        className={cn(
          "block w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none",
          error && "border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
