import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Users, Euro } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin' && u?.data?.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const isLoading = false;

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <Link to={createPageUrl("ManageUsers")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500">
                <Users className="w-4 h-4 mr-2" />
                Registrierte User
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl("UserPurchases")}>
              <Button variant="outline" className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
                <Euro className="w-4 h-4 mr-2" />
                User Käufe
              </Button>
            </Link>
            <Link to={createPageUrl("EditSiteContent")}>
              <Button variant="outline" className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10">
                Impressum & Datenschutz
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-slate-900/60 border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg">User Verwaltung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60 text-sm mb-4">
              Verwalte alle registrierten User über den Button oben rechts.
            </p>
            <p className="text-white/40 text-xs">
              Neue User können direkt über die Base44 Einladungsfunktion hinzugefügt werden.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}