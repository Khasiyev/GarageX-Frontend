import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { authService } from "../../services/auth";
import { AxiosError } from "axios";

export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const confirm = async () => {
      try {
        const userId = params.get("userId") ?? "";
        const token = params.get("token") ?? "";

        if (!userId || !token) {
          setError("userId və ya token tapılmadı");
          setLoading(false);
          return;
        }

        const res = await authService.confirmEmail(userId, token);

        if (res.success) {
          setSuccess(res.message || "Email uğurla təsdiqləndi");
        } else {
          setError(res.message || "Email təsdiqlənmədi");
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(
          axiosError.response?.data?.message || "Email təsdiqlənmədi"
        );
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [params]);

  return (
    <div className="min-h-screen bg-skin-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-skin-card border border-skin-border rounded-2xl mb-4 shadow-sm">
            <Wrench size={22} className="text-skin-text" />
          </div>
          <h1 className="text-xl font-bold text-skin-text">Email təsdiqi</h1>
          <p className="text-skin-text3 mt-1 text-sm">
            Hesab təsdiqlənməsi yoxlanılır...
          </p>
        </div>

        <div className="bg-skin-card border border-skin-border rounded-2xl shadow-sm p-7">
          {loading && (
            <p className="text-sm text-skin-text2 text-center">
              Təsdiqləmə edilir...
            </p>
          )}

          {!loading && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4"
            >
              <p className="text-sm text-red-500">{error}</p>
            </motion.div>
          )}

          {!loading && success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4"
            >
              <p className="text-sm text-emerald-500">{success}</p>
            </motion.div>
          )}

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-xs text-skin-text3 hover:text-skin-text transition-colors"
            >
              Login səhifəsinə qayıt
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}