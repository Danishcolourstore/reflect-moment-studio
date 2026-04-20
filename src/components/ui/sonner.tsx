import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      className="toaster group"
      duration={4000}
      offset={16}
      toastOptions={{
        style: {
          background: "#0A0A0A",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "var(--radius-sharp)",
          boxShadow: "var(--shadow-modal)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
        },
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-[#A8A6A0]",
          actionButton: "group-[.toast]:bg-white group-[.toast]:text-[#0A0A0A]",
          cancelButton: "group-[.toast]:bg-[#2A2A28] group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
