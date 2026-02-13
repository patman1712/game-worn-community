import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CustomLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    // Redirect to Base44's built-in login
    base44.auth.redirectToLogin(createPageUrl("Home"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-white/50">Weiterleitung zum Login...</p>
      </div>
    </div>
  );
}