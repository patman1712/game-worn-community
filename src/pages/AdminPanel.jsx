import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Users, Euro, Download, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin' && u?.data?.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/backup/full', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Backup failed');

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-full-${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Backup fehlgeschlagen: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/60 border-white/5">
            <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" /> User Verwaltung
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-white/60 text-sm mb-4">
                Verwalte alle registrierten User, blockiere oder lösche Accounts.
                </p>
                <Link to={createPageUrl("ManageUsers")}>
                    <Button variant="secondary" className="w-full">
                        User verwalten
                    </Button>
                </Link>
            </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-white/5">
            <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" /> System Backup
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-white/60 text-sm mb-4">
                Erstelle ein vollständiges Backup aller Daten (Datenbank + Bilder).
                </p>
                <Button 
                    onClick={handleBackup} 
                    disabled={isBackingUp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    {isBackingUp ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4 mr-2" />
                    )}
                    {isBackingUp ? 'Backup wird erstellt...' : 'Backup herunterladen'}
                </Button>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}