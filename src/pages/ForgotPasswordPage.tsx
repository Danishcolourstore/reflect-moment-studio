import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) {
      setMessage("Error sending reset link");
    } else {
      setMessage("Password reset link sent to your email");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="p-6 border rounded-lg space-y-4 w-[300px]">
        <h2 className="text-lg font-semibold">Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <button onClick={handleReset} className="w-full bg-primary text-white py-2 rounded">
          Send Reset Link
        </button>

        {message && <p className="text-sm text-center">{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
