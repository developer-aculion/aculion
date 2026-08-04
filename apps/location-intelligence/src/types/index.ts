export type CampaignStatus = "Running" | "Upcoming" | "Completed";

export interface Campaign {
  name: string;
  owner: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: CampaignStatus;
  notes?: string;
}

export interface Billboard {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  campaign: Campaign;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Engineered Features (raw computed values from spatial data)
// ---------------------------------------------------------------------------
export interface EngineeredFeatures {
  poi_density: number;            // POIs per km²
  road_density: number;           // km of road per km²
  junction_density: number;       // junctions per km²
  transit_accessibility: number;  // 0–100 weighted transit score
  commercial_density: number;     // % of POIs that are commercial
  residential_density: number;    // % of land area that is residential
  green_cover_ratio: number;      // % of land area that is green
  competition_index: number;      // 0–100 retail+bank saturation
  walkability: number;            // 0–100 composite walkability
  land_use_mix: number;           // 0–100 Shannon entropy of land use
  population_proxy: number;       // estimated population in radius
  building_density: number;       // 0–100 building footprint ratio
  total_pois: number;             // raw POI count in radius
  bus_count: number;              // bus stops
  metro_count: number;            // metro stations
  rail_count: number;             // rail stations
  bank_count: number;             // bank branches/ATMs
  restaurant_count: number;       // restaurant count
  office_count: number;           // office count
  shopping_count: number;         // shopping count
  road_length_m: number;          // total road length in metres
  area_km2: number;               // analysis circle area in km²
}

// ---------------------------------------------------------------------------
// KPI Scores (all 0–100)
// ---------------------------------------------------------------------------
export interface KPIScores {
  overall_score: number;
  accessibility: number;
  commercial_potential: number;
  residential_density: number;
  transit_connectivity: number;
  green_coverage: number;
  building_density: number;
  footfall_potential: number;
  ai_confidence: number;
}


// ---------------------------------------------------------------------------
// AI Recommendation
// ---------------------------------------------------------------------------
export interface AdRecommendation {
  category: string;
  score: number;       // 0–100
  confidence: number;  // 0–100
  reason: string;
  supporting_evidence?: string;
}

export interface AudienceSegment {
  segment: string;
  driven_by: string;
  description: string;
}

export interface BestAdvertisingDomain {
  category: string;
  score: number;
  rationale: string;
}

export interface TargetAudienceSegment {
  segment: string;
  driven_by: string;
  relevance: string;
}

export interface LLMRecommendation {
  best_advertising_domains: BestAdvertisingDomain[];
  why_domains_fit: string;
  advantages_of_publishing: string[];
  target_audience: TargetAudienceSegment[];
  area_strength_summary: string;

  // Legacy back-compat fields
  ai_recommendation?: string;
  top_advertising_categories?: AdRecommendation[];
  audience_segments?: AudienceSegment[];
  target_audience_legacy?: string;
  why_fits?: string;
  expected_customer_profile?: string;
  best_performing_industries?: string[];
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  limitations?: string[];
  suggested_campaigns?: string[];
}

// ---------------------------------------------------------------------------
// POI Distribution (enriched)
// ---------------------------------------------------------------------------
export interface POIDistributionEnriched {
  category: string;
  count: number;
  density: number;       // per km²
  percentage: number;    // % share of total POIs
  weighted_score: number; // 0–100 normalized density score
  absolute_score?: number;
  relative_share?: number;
  label?: string;
}

// Legacy alias kept for backward compat in chart components
export type POIDistribution = POIDistributionEnriched;

// ---------------------------------------------------------------------------
// Other shared types
// ---------------------------------------------------------------------------
export interface LandUseDistribution {
  name: string;
  value: number;
}

export interface RoadAnalyticsData {
  connectivity: number;
  accessibility: number;
  walkability: number;
  trafficDensity: number;
  roadQuality: number;
  publicTransport: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface POILocation {
  name: string;
  type: string;
  lat: number;
  lng: number;
}

export interface RealEstateRecord {
  source: string;
  area: string;
  area_tamil: string;
  category: string;
  tier: string;
  price_low: number;
  price_high: number;
}

export interface KPILabelInfo {
  value: number;
  tier: string | null;       // Exceptional | Strong | Developing | Emerging | null
  label: string | null;      // Adaptive per-KPI description text
  threshold: number | null;  // Score boundary crossed: 90 | 60 | 40 | 20 | null
}


export interface KPILabelsPayload {
  kpi_labels: Record<string, KPILabelInfo>;
  data_confidence_note: string | null;
}

// ---------------------------------------------------------------------------
// Main Analytics payload (API response shape)
// ---------------------------------------------------------------------------
export interface LocationAnalytics {
  latitude: number;
  longitude: number;
  radius: number;
  area?: string;
  real_estate_score?: number;

  // Raw engineered features
  features: EngineeredFeatures;

  // Computed KPI scores
  kpis: KPIScores;

  // KPI labels (Step A contract)
  kpi_labels: KPILabelsPayload;

  // Real estate prices (Supabase)
  real_estate?: RealEstateRecord[];

  // Raw backend data for debug/AI
  raw_data?: any;



  // AI recommendation results
  top_recommendations: AdRecommendation[];
  llm_recommendation?: LLMRecommendation;

  // Explanation factors
  explanation: {
    positive: string[];
    negative: string[];
    summary?: string;  // Populated when no spatial data is available
  };

  // Chart data
  poi_distribution: POIDistributionEnriched[];
  land_use_distribution: LandUseDistribution[];
  road_analytics: RoadAnalyticsData;
  heatmap_points: HeatmapPoint[];
  poi_locations: POILocation[];

  // Legacy fields (for backwards compat during transition)
  billboardId?: string;
  overallScore?: number;
  aiConfidence?: number;
  poiDensity?: number;
  accessibility?: number;
  footfallPotential?: number;
  competitionScore?: number;
  poiDistribution?: POIDistributionEnriched[];
  landUseDistribution?: LandUseDistribution[];
  roadAnalytics?: RoadAnalyticsData;
  heatmapPoints?: HeatmapPoint[];
  poiLocations?: POILocation[];
}
