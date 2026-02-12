import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import JerseyUploadForm from "@/components/jerseys/JerseyUploadForm";

export default function AddJersey() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Jersey.create({
        ...data,
        owner_name: user?.full_name || "Anonym",
        owner_email: user?.email,
      }),
    onSuccess: () => {
      navigate(createPageUrl("MyCollection"));
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Trikot hinzufügen</h1>
        <p className="text-white/40 text-sm mb-8">Teile ein neues Trikot mit der Community.</p>

        <JerseyUploadForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}