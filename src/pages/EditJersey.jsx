import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import JerseyUploadForm from "@/components/jerseys/JerseyUploadForm";
import GenericProductForm from "@/components/products/GenericProductForm";

export default function EditJersey() {
  const params = new URLSearchParams(window.location.search);
  const jerseyId = params.get("id");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) {
        base44.auth.redirectToLogin(window.location.href);
      } else if (u.data?.role !== 'moderator' && u.role !== 'admin' && u.data?.role !== 'admin') {
        // Not admin/moderator, will check if user owns the jersey later
      }
      setUser(u);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: jersey, isLoading } = useQuery({
    queryKey: ["jersey", jerseyId],
    queryFn: async () => {
      // Try Jersey first
      const jerseyList = await base44.entities.Jersey.filter({ id: jerseyId });
      if (jerseyList.length > 0) return { ...jerseyList[0], entityType: 'Jersey' };
      
      // Try CollectionItem
      const collectionList = await base44.entities.CollectionItem.filter({ id: jerseyId });
      if (collectionList.length > 0) return { ...collectionList[0], entityType: 'CollectionItem' };
      
      return null;
    },
    enabled: !!jerseyId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const entityType = jersey?.entityType || 'Jersey';
      if (entityType === 'CollectionItem') {
        return base44.entities.CollectionItem.update(jerseyId, data);
      }
      return base44.entities.Jersey.update(jerseyId, data);
    },
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

  // Check authorization: owner or moderator/admin
  const isOwner = jersey.owner_email === user?.email || jersey.created_by === user?.email;
  const isModerator = user?.data?.role === 'moderator' || user?.role === 'admin' || user?.data?.role === 'admin';
  
  if (!isOwner && !isModerator) {
    return <div className="text-center py-20 text-white/40">Du hast keine Berechtigung, dieses Trikot zu bearbeiten.</div>;
  }

  // Use old JerseyUploadForm only for old Jersey entities (icehockey jerseys)
  const useOldJerseyForm = jersey.entityType === 'Jersey';
  const isCollectionItem = jersey.entityType === 'CollectionItem';

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

        <h1 className="text-2xl font-bold text-white mb-8">
          {isCollectionItem ? 'Objekt bearbeiten' : 'Trikot bearbeiten'}
        </h1>

        {useOldJerseyForm ? (
          <JerseyUploadForm
            initialData={jersey}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => navigate(createPageUrl("MyCollection"))}
            isSubmitting={updateMutation.isPending}
          />
        ) : (
          <GenericProductForm
            sportType={jersey.sport_type}
            productType={jersey.product_type}
            initialData={jersey}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => navigate(createPageUrl("MyCollection"))}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}