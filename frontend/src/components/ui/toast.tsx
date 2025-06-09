"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, AlertCircle, CheckCircle2, ShieldAlert, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        attention: "border-[#FFEB8E] bg-[#FFFACD] text-[#333333]",
        success: "border-[#B2D8B7] bg-[#D0E6D3] text-[#333333]",
        error: "border-[#F5C6CB] bg-[#F8D7DA] text-[#333333]",
        info: "border-[#87CEEB] bg-[#ADD8E6] text-[#333333]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconComponents = {
  attention: AlertCircle,
  success: CheckCircle2,
  error: ShieldAlert,
  info: Info,
};

const iconBgColors: Record<string, string> = {
  attention: "#FCEFA1",
  success: "#BEE2C8",
  error: "#F4C2C7",
  info: "#B3DFF0",
};
type ToastVariant = keyof typeof iconComponents;

const ToastIconBubble = ({ variant }: { variant?: ToastVariant }) => {
  if (!variant || !(variant in iconComponents)) return null;
  const Icon = iconComponents[variant];
  const bg = iconBgColors[variant];

  return (
    <div
      className="flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full mt-1"
      style={{ backgroundColor: bg }}
    >
      <Icon className="w-4 h-4 text-[#333]" />
    </div>
  );
};

// Create context
const ToastVariantContext = React.createContext<string | undefined>(undefined);
const useToastVariant = () => React.useContext(ToastVariantContext);

interface ToastCustomProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {
  duration?: number;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastCustomProps
>(({ className, variant, duration = 5000, children, ...props }, ref) => {
  return (
    <ToastVariantContext.Provider value={variant ?? undefined}>
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        duration={duration}
        {...props}
      >
        <div className="flex items-start gap-3">
          <ToastIconBubble
            variant={
              variant === "default" || variant == null ? undefined : variant
            }
          />
          <div className="flex-1 flex items-center justify-around gap-2">
            {children}
          </div>
        </div>
      </ToastPrimitives.Root>
    </ToastVariantContext.Provider>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => {
  const variant = useToastVariant();

  const variantClasses: Record<string, string> = {
    attention: "border-yellow-300 text-yellow-900 hover:bg-yellow-100",
    success: "border-green-300 text-green-900 hover:bg-green-100",
    error: "border-red-300 text-red-900 hover:bg-red-100",
    info: "border-blue-300 text-blue-900 hover:bg-blue-100",
  };

  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant ? variantClasses[variant] : "",
        className,
      )}
      {...props}
    />
  );
});
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => {
  const variant = useToastVariant();

  const variantTextColor: Record<string, string> = {
    attention: "text-yellow-700 hover:text-yellow-900",
    success: "text-green-700 hover:text-green-900",
    error: "text-red-700 hover:text-red-900",
    info: "text-blue-700 hover:text-blue-900",
  };

  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-1 top-1 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100",
        variant
          ? variantTextColor[variant]
          : "text-foreground/50 hover:text-foreground",
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  );
});
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
