import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import SportProductSelector from "../components/products/SportProductSelector";
import JerseyUploadForm from "@/components/jerseys/JerseyUploadForm";
import GenericProductForm from "../components/products/GenericProductForm";
import { useTranslation } from 'react-i18next';

export default function AddJersey() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [showSelector, setShowSelector] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const createJerseyMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Jersey.create({
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
        },
        created_by: user?.display_name || user?.full_name || "Anonym",
        owner_email: user?.email,
      }),
    onSuccess: () => {
      navigate(createPageUrl("MyCollection"));
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (formData) => {
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
      } = formData;

      const title = `${otherData.team || ''} ${product_type || ''} ${otherData.player_name ? '- ' + otherData.player_name : ''}`.trim() || product_type || 'Unbenannt';

      return base44.entities.CollectionItem.create({
        sport_type,
        type: product_type,
        image_url,
        additional_images,
        is_private,
        description,
        purchase_price,
        invoice_url,
        title,
        data: otherData,
        created_by: user?.display_name || user?.full_name || "Anonym",
        owner_email: user?.email,
      });
    },
    onSuccess: () => {
      navigate(createPageUrl("MyCollection"));
    },
  });

  const handleSelection = (sport, product) => {
    setSelectedSport(sport);
    setSelectedProduct(product);
    setShowSelector(false);
  };

  if (!user) return null;

  // If Eishockey + Trikots selected, use old Jersey entity and form
  const useOldJerseyForm = selectedSport?.id === "icehockey" && selectedProduct?.id === "jersey";

  return (
    <div className="min-h-screen">
      <SportProductSelector
        open={showSelector}
        onSelect={handleSelection}
        onCancel={() => navigate(createPageUrl("MyCollection"))}
      />

      {!showSelector && (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('detail.back')}
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2">
            {t('products.' + selectedProduct?.id)} {t('common.add')}
          </h1>
          <p className="text-white/40 text-sm mb-8">{t('home.filters.' + selectedSport?.id)}</p>

          {useOldJerseyForm ? (
            <JerseyUploadForm
              onSubmit={(data) => createJerseyMutation.mutate(data)}
              isSubmitting={createJerseyMutation.isPending}
            />
          ) : (
            <GenericProductForm
              sportType={selectedSport.id}
              productType={selectedProduct.id}
              onSubmit={(data) => createItemMutation.mutate(data)}
              isSubmitting={createItemMutation.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
}