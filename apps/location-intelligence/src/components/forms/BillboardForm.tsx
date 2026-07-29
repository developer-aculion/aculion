"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Billboard } from "@/types";
import { Calendar, User, MapPin, Tag, FileText, RefreshCw } from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters"),
  owner: z.string().min(2, "Campaign owner must be at least 2 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  status: z.enum(["Running", "Upcoming", "Completed"] as const),
  notes: z.string().optional(),
});

const billboardFormSchema = z.object({
  id: z.string().min(3, "Billboard ID must be at least 3 characters").regex(/^[A-Za-z0-9_-]+$/, "Alphanumerics, hyphens, and underscores only"),
  name: z.string().min(3, "Billboard name must be at least 3 characters"),
  category: z.string().min(1, "Billboard category is required"),
  latitude: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90")
  ),
  longitude: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180")
  ),
  campaign: campaignSchema,
});

type BillboardFormValues = z.infer<typeof billboardFormSchema>;

interface BillboardFormProps {
  onSubmit: (values: BillboardFormValues) => void;
  onCancel?: () => void;
  initialValues?: Billboard;
}

export default function BillboardForm({
  onSubmit,
  onCancel,
  initialValues,
}: BillboardFormProps) {
  const defaultValues: Partial<BillboardFormValues> = initialValues
    ? {
        id: initialValues.id,
        name: initialValues.name,
        category: initialValues.category,
        latitude: initialValues.latitude,
        longitude: initialValues.longitude,
        campaign: {
          name: initialValues.campaign.name,
          owner: initialValues.campaign.owner,
          startDate: initialValues.campaign.startDate,
          endDate: initialValues.campaign.endDate,
          duration: initialValues.campaign.duration,
          status: initialValues.campaign.status,
          notes: initialValues.campaign.notes || "",
        },
      }
    : {
        id: "",
        name: "",
        category: "Digital",
        latitude: 13.0827, // Default Chennai Lat
        longitude: 80.2707, // Default Chennai Lng
        campaign: {
          name: "",
          owner: "",
          startDate: "",
          endDate: "",
          duration: 0,
          status: "Upcoming",
          notes: "",
        },
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BillboardFormValues>({
    resolver: zodResolver(billboardFormSchema),
    defaultValues,
  });

  const watchStartDate = watch("campaign.startDate");
  const watchEndDate = watch("campaign.endDate");

  // Auto-calculate duration from dates
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const duration = diffDays > 0 ? diffDays : 0;
        setValue("campaign.duration", duration, { shouldValidate: true });
      }
    }
  }, [watchStartDate, watchEndDate, setValue]);

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    reset(defaultValues);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glassmorphism p-6 rounded-2xl border border-border/80 shadow-premium max-w-4xl mx-auto space-y-6 text-foreground"
    >
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-md font-bold tracking-wide uppercase text-primary">
            {initialValues ? "Modify Billboard Details" : "Register New Billboard"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Provide the coordinates and campaign attributes for the asset.
          </p>
        </div>
        <Tag className="h-5 w-5 text-primary opacity-60 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Billboard Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Billboard Specifications
          </h3>

          {/* ID */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Billboard ID <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. BLR005"
              disabled={!!initialValues}
              {...register("id")}
              className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3.5 py-2.5 outline-none transition-all duration-200 uppercase font-semibold disabled:opacity-50"
            />
            {errors.id && (
              <p className="text-[10px] text-destructive mt-1 font-medium">{errors.id.message}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Billboard Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Richmond Flyover Digital Double"
              {...register("name")}
              className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3.5 py-2.5 outline-none transition-all duration-200"
            />
            {errors.name && (
              <p className="text-[10px] text-destructive mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Billboard Category <span className="text-destructive">*</span>
            </label>
            <select
              {...register("category")}
              className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3.5 py-2.5 outline-none transition-all duration-200"
            >
              <option value="Digital">Digital Screen</option>
              <option value="Classic">Classic Billboard</option>
              <option value="Unipole">Unipole</option>
              <option value="Bulletin">Bulletin</option>
              <option value="Poster">Poster</option>
            </select>
            {errors.category && (
              <p className="text-[10px] text-destructive mt-1 font-medium">{errors.category.message}</p>
            )}
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Latitude <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 12.9716"
                  {...register("latitude")}
                  className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-8 pr-3 py-2.5 outline-none transition-all duration-200 font-mono"
                />
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {errors.latitude && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.latitude.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Longitude <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 77.5946"
                  {...register("longitude")}
                  className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-8 pr-3 py-2.5 outline-none transition-all duration-200 font-mono"
                />
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {errors.longitude && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.longitude.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Campaign Attributes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campaign Name */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Campaign Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Tesla Model 3 Launch"
                {...register("campaign.name")}
                className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3.5 py-2.5 outline-none transition-all duration-200"
              />
              {errors.campaign?.name && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.campaign.name.message}</p>
              )}
            </div>

            {/* Campaign Owner */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Campaign Owner <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Tesla Motors India"
                  {...register("campaign.owner")}
                  className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-8 pr-3.5 py-2.5 outline-none transition-all duration-200"
                />
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {errors.campaign?.owner && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.campaign.owner.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Start Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register("campaign.startDate")}
                  className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 outline-none transition-all duration-200 text-foreground"
                />
              </div>
              {errors.campaign?.startDate && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.campaign.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                End Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register("campaign.endDate")}
                  className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 outline-none transition-all duration-200 text-foreground"
                />
              </div>
              {errors.campaign?.endDate && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.campaign.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Campaign Duration */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Duration (Days)
              </label>
              <div className="relative">
                <input
                  type="number"
                  readOnly
                  placeholder="0"
                  {...register("campaign.duration", { valueAsNumber: true })}
                  className="w-full text-xs bg-muted/30 border border-border rounded-xl pl-8 pr-3 py-2.5 outline-none font-mono text-muted-foreground font-semibold cursor-not-allowed"
                />
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {errors.campaign?.duration && (
                <p className="text-[10px] text-destructive mt-1 font-medium">{errors.campaign.duration.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Campaign Status <span className="text-destructive">*</span>
              </label>
              <select
                {...register("campaign.status")}
                className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 outline-none transition-all duration-200"
              >
                <option value="Running">Running</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Notes */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Campaign Notes (Optional)
        </label>
        <div className="relative">
          <textarea
            rows={2}
            placeholder="Specify any installation directives, target audiences, or specific constraints..."
            {...register("campaign.notes")}
            className="w-full text-xs bg-background/50 border border-border hover:border-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary rounded-xl pl-8 pr-3.5 py-2.5 outline-none transition-all duration-200 resize-none"
          />
          <FileText className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-border/40">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border hover:bg-secondary rounded-xl text-xs font-semibold transition-all duration-200"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-secondary rounded-xl text-xs font-semibold transition-all duration-200"
        >
          <RefreshCw size={12} />
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md shadow-primary/25 hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : initialValues ? "Update Billboard" : "Save Billboard"}
        </button>
      </div>
    </form>
  );
}
