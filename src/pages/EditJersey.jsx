import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import JerseyUploadForm from "@/components/jerseys/JerseyUploadForm";
import GenericProductForm from "@/components/products/GenericProductForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditJersey() {
  const params = new URLSearchParams(window.location.search);
  const jerseyId = params.get("id");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

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
      if (jerseyList.length > 0) {
        const j = jerseyList[0];
        return { 
          ...j, 
          ...j.data, 
          player_number: j.number, // Map number back to player_number
          for_sale: j.is_for_sale, // Map is_for_sale back to for_sale
          entityType: 'Jersey' 
        };
      }
      
      // Try CollectionItem
      const collectionList = await base44.entities.CollectionItem.filter({ id: jerseyId });
      if (collectionList.length > 0) {
        const item = collectionList[0];
        return { 
          ...item, 
          ...item.data, // Flatten data for form
          product_type: item.type, // Map type back to product_type
          entityType: 'CollectionItem' 
        };
      }
      
      return null;
    },
    enabled: !!jerseyId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const entityType = jersey?.entityType || 'Jersey';
      if (entityType === 'CollectionItem') {
        const {
          sport_type,
          product_type,
          image_url,
          additional_images,
          is_private,
          description,
          purchase_price,
          invoice_url,
          ...otherData
        } = data;
        
        const title = `${otherData.team || ''} ${product_type || ''} ${otherData.player_name ? '- ' + otherData.player_name : ''}`.trim() || product_type || 'Unbenannt';

        return base44.entities.CollectionItem.update(jerseyId, {
          sport_type,
          type: product_type,
          image_url,
          additional_images,
          is_private,
          description,
          purchase_price,
          invoice_url,
          title,
          data: otherData
        });
      }
      return base44.entities.Jersey.update(jerseyId, {
        team: data.team,
        league: data.league,
        season: data.season,
        player_name: data.player_name,
        number: data.player_number,
        sport_type: data.sport_type,
        product_type: "jersey",
        image_url: data.image_url,
        additional_images: data.additional_images,
        is_game_worn: data.is_game_worn,
        is_for_sale: data.for_sale,
        is_private: data.is_private,
        description: data.description,
        brand: data.brand,
        size: data.size,
        purchase_price: data.purchase_price,
        invoice_url: data.invoice_url,
        data: {
          ...data,
          // Exclude fields that are already columns to avoid duplication in JSON (optional, but cleaner)
          // But keeping them is also fine and easier.
          // Ensure special mappings are preserved if needed by form on reload (though we handle reload above)
        }
      });
    },
    onSuccess: () => navigate(createPageUrl("MyCollection")),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const entity = jersey.entityType === 'CollectionItem' ? base44.entities.CollectionItem : base44.entities.Jersey;
      
      // Delete likes
      try {
        const likes = await base44.entities.JerseyLike.filter({ jersey_id: jerseyId });
        for (const like of likes) {
            try { await base44.entities.JerseyLike.delete(like.id); } catch (e) {}
        }
      } catch (e) {}
      
      // Delete comments
      try {
          const comments = await base44.entities.Comment.filter({ jersey_id: jerseyId });
          for (const comment of comments) {
            try { await base44.entities.Comment.delete(comment.id); } catch (e) {}
          }
      } catch (e) {}
      
      // Delete item
      await entity.delete(jerseyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["collectionItems"] });
      queryClient.invalidateQueries({ queryKey: ["myJerseys"] });
      queryClient.invalidateQueries({ queryKey: ["myItems"] });
      navigate(createPageUrl("MyCollection"));
    },
    onError: (error) => {
        alert("Fehler beim Löschen: " + error.message);
    }
  });

  const handleDelete = (e) => {
      e.preventDefault();
      setDeleteOpen(true);
  };

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
        
        <div className="flex justify-end mb-4">
             <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                    <Button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setDeleteOpen(true);
                        }}
                        variant="destructive" 
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Objekt löschen?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/50">
                            Das Objekt wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={() => setDeleteOpen(false)}
                            className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                        >
                            Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteMutation.mutate();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

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