import React, { useState } from "react";
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Users, Euro, Download, Database, FileText, Settings, Clock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";
import { APP_VERSION } from "@/config/changelog";
import { useTranslation, Trans } from 'react-i18next';

export default function AdminPanel() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    api.auth.me().then(u => {
      const role = u.data?.role || u.role;
      if (role !== 'admin' && role !== 'owner') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => window.location.href = '/');
  }, []);

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      setDownloadProgress(0);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/backup/full', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Backup failed');

      // Attempt to read stream for progress
      const contentLength = response.headers.get('Content-Length');
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;

      while(true) {
        const {done, value} = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        receivedLength += value.length;
        
        if (contentLength) {
            setDownloadProgress(Math.round((receivedLength / parseInt(contentLength)) * 100));
        } else {
            // Fake progress if unknown length
            setDownloadProgress((prev) => Math.min(prev + 5, 90));
        }
      }

      const blob = new Blob(chunks);
      setDownloadProgress(100);
      triggerDownload(blob);

    } catch (error) {
      alert('Backup fehlgeschlagen: ' + error.message);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  const triggerDownload = (blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-full-${new Date().toISOString().slice(0,10)}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const role = user?.data?.role || user?.role;
  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const canManageUsers = isAdmin || isOwner;

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('admin.title')}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Verwaltung */}
            {canManageUsers && (
              <Card className="bg-slate-900/60 border-white/5 h-full">
              <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-400" /> {t('admin.users')}
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-white/60 text-sm h-10">
                  {t('admin.userManageDesc')}
                  </p>
                  <Link to={createPageUrl("ManageUsers")}>
                      <Button variant="secondary" className="w-full mb-2 bg-slate-800 hover:bg-slate-700 text-white border border-white/10">
                          {t('admin.userList')}
                      </Button>
                  </Link>
                  <Link to={createPageUrl("UserPurchases")}>
                      <Button variant="outline" className="w-full text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10">
                          <Euro className="w-4 h-4 mr-2" />
                          {t('admin.userPurchases')}
                      </Button>
                  </Link>
              </CardContent>
              </Card>
            )}

            {/* Seite Verwalten */}
            {isAdmin && (
              <Card className="bg-slate-900/60 border-white/5 h-full">
              <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-400" /> {t('admin.manageSite')}
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-white/60 text-sm h-10">
                  {t('admin.siteManageDesc')}
                  </p>
                  <Link to={createPageUrl("EditSiteContent")}>
                      <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10">
                          <FileText className="w-4 h-4 mr-2" />
                          {t('admin.legalContent')}
                      </Button>
                  </Link>
              </CardContent>
              </Card>
            )}

            {/* System Backup */}
            {isAdmin && (
              <Card className="bg-slate-900/60 border-white/5 h-full">
              <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-400" /> {t('admin.systemBackup')}
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-white/60 text-sm h-10">
                  {t('admin.backupDesc')}
                  </p>
                  {isBackingUp && (
                      <div className="mb-4 space-y-2">
                          <Progress value={downloadProgress} className="h-2 bg-slate-800" indicatorClassName="bg-emerald-500" />
                          <p className="text-emerald-400 text-xs text-center">{downloadProgress}% heruntergeladen</p>
                      </div>
                  )}
                  <Button 
                      onClick={handleBackup} 
                      disabled={isBackingUp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-auto"
                  >
                      {isBackingUp ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                          <Download className="w-4 h-4 mr-2" />
                      )}
                      {isBackingUp ? t('admin.backupProgress') : t('admin.createBackup')}
                  </Button>
              </CardContent>
              </Card>
            )}

            {/* System Version & Changelog */}
            <Card className="bg-slate-900/60 border-white/5 h-full">
            <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" /> {t('admin.systemUpdates')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-white/60 text-sm h-10">
                  <Trans i18nKey="admin.changelogDesc" values={{ version: APP_VERSION }}>
                    Aktuelle Version: <span className="text-cyan-400 font-mono font-bold">v{APP_VERSION}</span>
                    <br />
                    Verlauf der Updates einsehen.
                  </Trans>
                </p>
                <Link to={createPageUrl("UpdateLog")}>
                    <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t('admin.openChangelog')}
                    </Button>
                </Link>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}