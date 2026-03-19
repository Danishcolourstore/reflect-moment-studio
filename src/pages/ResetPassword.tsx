import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-[400px] flex flex-col text-center">
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight mb-2">Mirror AI</h1>

        <p className="text-sm text-muted-foreground mb-6">Password reset is not enabled.</p>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
          <p className="text-sm text-muted-foreground">Please contact admin to get access.</p>

          <a
            href="https://wa.me/919605761589"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center hover:opacity-90 transition-all"
          >
            Contact on WhatsApp
          </a>

          <button
            onClick={() => navigate("/login")}
            className="w-full h-11 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
