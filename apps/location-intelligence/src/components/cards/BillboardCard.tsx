"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Billboard } from "@/types";
import {
  MapPin,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  MoreVertical,
  Activity,
  CheckCircle,
  Clock3,
} from "lucide-react";

interface BillboardCardProps {
  billboard: Billboard;
  onEdit: (billboard: Billboard) => void;
  onDelete: (id: string) => void;
}

export default function BillboardCard({
  billboard,
  onEdit,
  onDelete,
}: BillboardCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { id, name, latitude, longitude, campaign, lastUpdated } = billboard;

  // Calculate Days Remaining
  const getDaysRemaining = () => {
    if (campaign.status === "Completed") return 0;
    const end = new Date(campaign.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysRemaining = getDaysRemaining();

  // Status badge style helper
  const getStatusBadge = () => {
    switch (campaign.status) {
      case "Running":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
            ACTIVE
          </span>
        );
      case "Upcoming":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock3 className="h-3 w-3 text-amber-400" />
            UPCOMING
          </span>
        );
      case "Completed":
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <CheckCircle className="h-3 w-3 text-zinc-400" />
            COMPLETED
          </span>
        );
    }
  };

  return (
    <div className="glassmorphism p-5 rounded-2xl border border-border/80 card-interactive relative group flex flex-col justify-between h-[320px] text-foreground">
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-2">
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Action Menu button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-lg border border-border bg-background/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <MoreVertical size={14} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-32 bg-popover border border-border rounded-xl shadow-xl z-10 py-1 text-xs">
                <button
                  onClick={() => {
                    onEdit(billboard);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary text-foreground transition-colors"
                >
                  <Edit size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    onDelete(id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title & ID */}
        <div className="mt-3">
          <h3 className="text-sm font-extrabold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-muted-foreground font-semibold">
              ID: {id}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-bold uppercase">
              {billboard.category || "Digital"}
            </span>
          </div>
        </div>

        {/* Location & Campaign Meta */}
        <div className="mt-4 space-y-2">
          {/* Coordinates */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={13} className="text-muted-foreground/60 flex-shrink-0" />
            <span className="font-mono truncate">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </span>
          </div>

          {/* Campaign Details */}
          <div className="space-y-1 bg-background/30 p-2 rounded-xl border border-border/40">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-14">Campaign:</span>
              <span className="font-bold text-foreground truncate flex-1">{campaign.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase w-14">Owner:</span>
              <span className="text-muted-foreground truncate flex-1 flex items-center gap-1">
                <User size={10} className="text-muted-foreground/50" />
                {campaign.owner}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-4 pt-3 border-t border-border/40 flex flex-col justify-end gap-3.5">
        {/* Date / Days Info */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1 font-semibold">
            <Calendar size={11} />
            <span>Ends: {campaign.endDate}</span>
          </div>

          {campaign.status !== "Completed" && (
            <div className="flex items-center gap-1 font-bold text-primary">
              <Clock size={11} />
              <span>{daysRemaining} Days Left</span>
            </div>
          )}
        </div>

        {/* Action Link CTA */}
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[9px] text-muted-foreground font-mono truncate">
            Updated: {new Date(lastUpdated).toLocaleDateString()}
          </span>
          
          <Link
            to={`/dashboard/${id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-200 rounded-xl text-xs font-bold border border-blue-400/20"
            title="Point-of-Interest census distribution mapping"
          >
            <span>POI Category Density</span>
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
