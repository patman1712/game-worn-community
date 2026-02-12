import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import JerseyUploadForm from "@/components/jerseys/JerseyUploadForm";

export default function EditJersey() {
  const params = new URLSearchParams(window.location.search);
  const jerseyId = params.get("id");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: jersey, isLoading } = useQuery({
    queryKey: ["jersey", jerseyId],
    queryFn: async () => {
      const list = await base44.entities.Jersey.filter({ id: jerseyId });
      return list[0];
    },
    enabled: !!jerseyId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Jersey.update(jerseyId, data),
    onSuccess: () => navigate(createPageUrl("MyCollection")),
  });

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!jersey) {
    return <div className="text-center py-20 text-white/40">Trikot nicht gefunden.</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("MyCollection")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Trikot bearbeiten</h1>
        <p className="text-white/40 text-sm mb-8">{jersey.title}</p>

        <JerseyUploadForm
          initialData={jersey}
          onSubmit={(data) => updateMutation.mutate(data)}
          onCancel={() => navigate(createPageUrl("MyCollection"))}
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </div>
  );
}