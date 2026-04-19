import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-left"
      className="toaster group"
      duration={3000}
      toastOptions={{
        style: {
          background: "#1A1917",
          color: "#FAFAF8",
          border: "none",
          borderRadius: 0,
          boxShadow: "none",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
        },
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-[#A8A6A0]",
          actionButton: "group-[.toast]:bg-[#B8953F] group-[.toast]:text-[#FAFAF8]",
          cancelButton: "group-[.toast]:bg-[#F4F3F0] group-[.toast]:text-[#1A1917]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
