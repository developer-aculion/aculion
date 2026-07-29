import { LocationAnalytics } from "../types/location";

export type ChatIntent =
  | "FIND_BEST_BILLBOARD"
  | "COMPARE_LOCATIONS"
  | "EXPLAIN_SCORE"
  | "FIND_NEARBY_POIS"
  | "EXPLAIN_KPIS"
  | "EXPLAIN_COMMERCIAL_POTENTIAL"
  | "EXPLAIN_FOOTFALL_POTENTIAL"
  | "EXPLAIN_OVERALL_SCORE"
  | "GENERAL_HELP"
  | "EXPLAIN_KB"
  | "AUDIENCE_PREDICTION"
  | "FORMAT_SUGGESTION"
  | "ROI_ESTIMATION"
  | "ALTERNATIVE_LOCATIONS"
  | "MARKETING_INSIGHTS"
  | "SCORE_CHANGE"
  | "UNKNOWN";

export interface ChatContext {
  brand?: string;
  city?: string;
  objective?: string;
  budget?: number;
  audience?: string;
  duration?: string;
  campaignType?: string;
  radiusPreference?: number;
  lastSlotAsked?: string;
  lastIntent?: ChatIntent;
}

export const REQUIRED_SLOTS = [
  { key: "brand", label: "Brand Category", question: "What is your brand category or industry? (e.g., Electronics, Fashion, Retail)" },
  { key: "city", label: "Target City", question: "Which city are you targeting? (Currently, our spatial database covers Chennai)" },
  { key: "objective", label: "Advertising Objective", question: "What is your advertising objective? (e.g., Brand Awareness, Product Launch, Lead Generation)" },
  { key: "budget", label: "Campaign Budget", question: "What is your campaign budget in Rupees? (e.g., 1500000)" },
  { key: "audience", label: "Target Audience", question: "Who is your target audience? (e.g., Professionals, Students, Shoppers, General Public)" },
  { key: "duration", label: "Campaign Duration", question: "What is the expected campaign duration? (e.g., 30 days, 15 days, 3 months)" },
  { key: "campaignType", label: "Campaign Type", question: "What is your campaign type preference? (e.g., Classic, Digital, Unipole)" },
  { key: "radiusPreference", label: "Radius Preference", question: "What is your radius preference for location analysis in meters? (e.g., 1000)" }
];

const KNOWLEDGE_BASE: Record<string, string> = {
  "commercial potential": "### Commercial Potential\nCommercial Potential measures the concentration of business activity and economic vitality in a specific zone. It assesses proximity to bank branches, retail outlets, and corporate offices to estimate the purchasing power and consumer activity surrounding a billboard site.",
  "footfall potential": "### Footfall Potential\nFootfall Potential evaluates the volume of physical traffic passing through a location. It aggregates vehicular transit volumes, pedestrian flows, and street network density to determine the overall exposure and visual impressions your advertisement will receive daily.",
  "transit accessibility": "### Transit Accessibility\nTransit Accessibility measures the density and connectivity of public transit networks nearby. This includes proximity to bus stops, metro stations, and railway terminals, ensuring a steady stream of daily commuters who have extended dwell times to view your campaigns.",
  "competition index": "### Competition Index\nCompetition Index tracks the density of existing brand advertisers and industry competitors in the immediate radius. A balanced index suggests high relevance for advertising, while an extremely high index suggests ad saturation and low share-of-voice.",
  "overall suitability": "### Overall Suitability\nOverall Suitability is a composite score (0–100) indicating the general quality of a location for out-of-home advertising. It weights commercial density, transit connectivity, resident density, and walkability to give an immediate spatial quality assessment.",
  "residential density": "### Residential Density\nResidential Density measures the concentration of housing and residential complexes surrounding the site. High residential density indicates a stable local neighborhood audience, perfect for recurring household campaigns.",
  "building density": "### Building Density\nBuilding Density reflects the built-up area ratio in the analysis zone. High density indicates a commercial or urban center, whereas low density indicates open parks, highways, or emerging suburbs.",
  "land use mix": "### Land Use Mix\nLand Use Mix evaluates the diversity of zoning (residential, commercial, industrial) in the area. A high mix score means the location is versatile, drawing both daytime office workers and evening/weekend shoppers.",
  "scoring methodology": "### Scoring Methodology\nOur spatial scoring engine collects PostGIS raw features (POI counts, road segments, public transit nodes) and aggregates them into weighted categories. These are normalized into 0–100 composite indexes based on regional baseline benchmarks.",
  "recommendation logic": "### Recommendation Logic\nOur recommendation engine matches your campaign slots (brand, budget, objective, audience, and format) to PostGIS-computed location metrics. For example, tech brands are directed to high white-collar IT corridors, while retail brands are matched to shopping districts.",
  "advertising categories": "### Advertising Categories\nWe support several campaign formats depending on site demographics:\n- **Digital LED Displays**: Ideal for dynamic, high-budget corporate or tech campaigns.\n- **Classic Billboards**: Perfect for long-term brand awareness in local residential zones.\n- **Unipoles**: High-impact structures placed at key road junctions for maximum traffic visibility."
};

export function getFirstMissingSlot(context: ChatContext) {
  return REQUIRED_SLOTS.find(slot => {
    const val = context[slot.key as keyof ChatContext];
    return val === undefined || val === null || val === "";
  });
}

export function parseNum(str: string): number {
  const matchL = str.match(/(\d+(?:\.\d+)?)\s*(?:lakhs|lakh|l)/i);
  if (matchL) return parseFloat(matchL[1]) * 100000;
  const matchC = str.match(/(\d+(?:\.\d+)?)\s*(?:crores|crore|cr)/i);
  if (matchC) return parseFloat(matchC[1]) * 10000000;
  const parsed = parseInt(str.replace(/[^0-9]/g, ''), 10);
  return isNaN(parsed) ? 1000000 : parsed;
}

export function extractSlotsFromText(query: string, currentContext: ChatContext): ChatContext {
  const q = query.toLowerCase();
  const ctx = { ...currentContext };

  if (!ctx.brand) {
    if (q.includes("fashion") || q.includes("apparel") || q.includes("clothing") || q.includes("retail")) {
      ctx.brand = "Fashion";
    } else if (q.includes("auto") || q.includes("car") || q.includes("hyundai") || q.includes("vehicle")) {
      ctx.brand = "Automotive";
    } else if (q.includes("electronics") || q.includes("mobile") || q.includes("phone") || q.includes("tv")) {
      ctx.brand = "Electronics";
    } else if (q.includes("tech") || q.includes("saas") || q.includes("software")) {
      ctx.brand = "Tech/SaaS";
    } else if (q.includes("bank") || q.includes("fintech") || q.includes("finance")) {
      ctx.brand = "Banking";
    } else if (q.includes("food") || q.includes("dining") || q.includes("restaurant") || q.includes("cafe")) {
      ctx.brand = "Food & Dining";
    }
  }

  if (!ctx.city) {
    if (q.includes("chennai")) ctx.city = "Chennai";
  }

  if (!ctx.objective) {
    if (q.includes("awareness") || q.includes("reach") || q.includes("brand awareness")) {
      ctx.objective = "Brand Awareness";
    } else if (q.includes("lead") || q.includes("conversion") || q.includes("sale") || q.includes("lead gen")) {
      ctx.objective = "Lead Generation";
    } else if (q.includes("launch") || q.includes("new product")) {
      ctx.objective = "Product Launch";
    }
  }

  if (!ctx.budget) {
    const budgetRegex = /(\d+(?:\.\d+)?)\s*(lakhs|l|crores|cr|lakh|cr)/i;
    const match = query.match(budgetRegex);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      ctx.budget = unit.startsWith("c") ? val * 10000000 : val * 100000;
    }
  }

  if (!ctx.audience) {
    if (q.includes("professional") || q.includes("worker") || q.includes("executive")) {
      ctx.audience = "Professionals";
    } else if (q.includes("student") || q.includes("youth") || q.includes("college")) {
      ctx.audience = "Students";
    } else if (q.includes("shopper") || q.includes("consumer") || q.includes("buyer")) {
      ctx.audience = "Shoppers";
    } else if (q.includes("general") || q.includes("public")) {
      ctx.audience = "General Public";
    }
  }

  if (!ctx.campaignType) {
    if (q.includes("digital") || q.includes("led") || q.includes("screen")) {
      ctx.campaignType = "Digital";
    } else if (q.includes("classic") || q.includes("traditional")) {
      ctx.campaignType = "Classic";
    } else if (q.includes("unipole")) {
      ctx.campaignType = "Unipole";
    }
  }

  if (!ctx.radiusPreference) {
    const radiusRegex = /(\d+)\s*(?:meters|m|metres|radius)/i;
    const match = query.match(radiusRegex);
    if (match) {
      ctx.radiusPreference = parseInt(match[1], 10);
    }
  }

  return ctx;
}

export function fillSlot(slotKey: string, input: string, currentContext: ChatContext): ChatContext {
  const ctx = { ...currentContext };
  const val = input.trim();

  if (slotKey === "brand") ctx.brand = val;
  else if (slotKey === "city") ctx.city = val;
  else if (slotKey === "objective") ctx.objective = val;
  else if (slotKey === "budget") ctx.budget = parseNum(val);
  else if (slotKey === "audience") ctx.audience = val;
  else if (slotKey === "duration") ctx.duration = val;
  else if (slotKey === "campaignType") ctx.campaignType = val;
  else if (slotKey === "radiusPreference") ctx.radiusPreference = parseNum(val);

  return ctx;
}

export function classifyIntent(query: string): ChatIntent {
  const q = query.toLowerCase();

  // Score change comparison
  if (q.includes("score change") || q.includes("why did the score change") || q.includes("compare score") || q.includes("difference in score")) {
    return "SCORE_CHANGE";
  }

  // Audience Prediction
  if (q.includes("audience type") || q.includes("who is the audience") || q.includes("target demographic") || q.includes("who will see this")) {
    return "AUDIENCE_PREDICTION";
  }

  // Format / category suggestion
  if (q.includes("billboard category") || q.includes("suggest format") || q.includes("suggest billboard") || q.includes("digital vs classic")) {
    return "FORMAT_SUGGESTION";
  }

  // Marketing insights
  if (q.includes("marketing insight") || q.includes("marketing tips") || q.includes("how to market")) {
    return "MARKETING_INSIGHTS";
  }

  // ROI estimation
  if (q.includes("roi") || q.includes("effectiveness") || q.includes("advertising impact")) {
    return "ROI_ESTIMATION";
  }

  // Alternative locations
  if (q.includes("alternative") || q.includes("other options") || q.includes("other locations") || q.includes("other site")) {
    return "ALTERNATIVE_LOCATIONS";
  }

  // Explaining Overall Score & KPIs
  if (q.includes("overall score") || q.includes("overall suitability") || q.includes("suitability score") || q.includes("why is this location good") || q.includes("why is this spot suitable") || q.includes("why is this location suitable")) {
    return "EXPLAIN_OVERALL_SCORE";
  }
  if (q.includes("commercial potential")) {
    return "EXPLAIN_COMMERCIAL_POTENTIAL";
  }
  if (q.includes("footfall potential") || q.includes("foot traffic") || q.includes("pedestrian")) {
    return "EXPLAIN_FOOTFALL_POTENTIAL";
  }
  if (q.includes("explain score") || q.includes("explain the score")) {
    return "EXPLAIN_SCORE";
  }
  if (q.includes("explain kpis") || q.includes("what is kpi") || q.includes("what does kpi mean") || q.includes("explain key metrics")) {
    return "EXPLAIN_KPIS";
  }
  if (q.includes("best billboard") || q.includes("best location") || q.includes("find billboard") || q.includes("where should i advertise") || q.includes("billboard recommendation") || q.includes("i want a billboard")) {
    return "FIND_BEST_BILLBOARD";
  }
  if (q.includes("nearby poi") || q.includes("point of interest") || q.includes("what is nearby") || q.includes("pois nearby") || q.includes("places nearby")) {
    return "FIND_NEARBY_POIS";
  }

  // Match knowledge base
  for (const key of Object.keys(KNOWLEDGE_BASE)) {
    if (q.includes(key)) {
      return "EXPLAIN_KB";
    }
  }

  if (q.includes("help") || q.includes("how to use") || q.includes("what can you do") || q.includes("features") || q.includes("assistant")) {
    return "GENERAL_HELP";
  }

  return "UNKNOWN";
}

export function generateLocationExplanation(analytics: LocationAnalytics | null): string {
  if (!analytics) return "Please select a location on the map first to analyze its suitability score.";

  const k = analytics.kpis || { overall_score: 0 };
  const f = analytics.features || { bank_count: 0, shopping_count: 0, metro_count: 0, residential_density: 0, commercial_density: 0, bus_count: 0, road_density: 0 };
  const areaName = analytics.area || "this candidate location";

  const points: string[] = [];
  if ((f.bank_count || 0) > 3) points.push("High banking density");
  if ((f.shopping_count || 0) > 3) points.push("Strong shopping activity");
  if ((f.metro_count || 0) > 0) points.push("Excellent metro connectivity");
  if ((f.residential_density || 0) > 50) points.push("High residential population");
  if ((f.commercial_density || 0) > 40) points.push("Strong commercial ecosystem");
  if ((f.bus_count || 0) > 5) points.push("Convenient bus transit network");
  if ((f.road_density || 0) > 10) points.push("Heavy vehicular flow corridors");

  if (points.length === 0) {
    points.push("Balanced general consumer and white-collar commuter traffic exposure");
  }

  return `The most suitable location is **${areaName}** (Overall Score: **${k.overall_score}/100**) because it has:\n\n` +
    points.map(p => `- **${p}**`).join("\n") + `\n\n` +
    `_This assessment is generated dynamically from actual PostGIS backend features and calculated KPIs._`;
}

export function generateStaticReply(
  query: string,
  context: ChatContext,
  analytics: LocationAnalytics | null,
  prevAnalytics: LocationAnalytics | null = null
): string {
  const intent = classifyIntent(query);
  const q = query.toLowerCase();
  const areaName = analytics?.area || "the selected location";
  const k = analytics?.kpis;
  const f = analytics?.features;

  switch (intent) {
    case "EXPLAIN_KB": {
      const key = Object.keys(KNOWLEDGE_BASE).find(k => q.includes(k));
      return key ? KNOWLEDGE_BASE[key] : "I couldn't find a direct definition for that KPI concept. Try asking about *Commercial Potential* or *Scoring Methodology*!";
    }

    case "EXPLAIN_OVERALL_SCORE":
    case "EXPLAIN_SCORE": {
      return generateLocationExplanation(analytics);
    }

    case "AUDIENCE_PREDICTION": {
      if (!analytics || !f) return "Please select a location on the map first to analyze audience demographics.";
      let primary = "Daily Commuters";
      let reasoning = "high density of transit terminals and vehicular road junctions";
      
      const office = f.office_count || 0;
      const shop = f.shopping_count || 0;
      const res = f.residential_density || 0;
      
      if (office > shop && office > 5) {
        primary = "Tech Professionals & Executives";
        reasoning = "heavy volume of corporate IT offices and white-collar business clusters";
      } else if (shop > office && shop > 5) {
        primary = "Active Shoppers & Consumers";
        reasoning = "high concentration of retail shops, commercial markets, and local malls";
      } else if (res > 60) {
        primary = "Local Families & Suburban Residents";
        reasoning = "dominant residential zoning footprints and school structures nearby";
      }
      
      return `### Audience Demographic Prediction: ${areaName}\n` +
        `Based on GIS spatial footprint, the primary audience here is:\n` +
        `- **Primary Group**: **${primary}**\n` +
        `- **Traffic Driver**: Proximity to public transit (${f!.bus_count || 0} bus stops, ${f!.metro_count || 0} metro stations)\n` +
        `- **Assessment Reasoning**: Derived from a ${reasoning} in this analysis zone.`;
    }

    case "FORMAT_SUGGESTION": {
      if (!analytics || !k || !f) return "Please select a location first to evaluate billboard options.";
      let format = "Classic Billboard";
      let details = "Traditional unipoles or static displays are perfect here to draw consistent local commuter impressions at key intersections.";
      
      if (k.overall_score > 80 && (f!.transit_accessibility || 0) > 80) {
        format = "Digital LED Display Screen";
        details = "A premium digital LED screen is highly recommended here due to extreme pedestrian density, high dwell times at transit nodes, and high white-collar commercial mix.";
      } else if ((f!.commercial_density || 0) > 60) {
        format = "Shopping Mall Interior/Facade Display";
        details = "An retail-focused unipole or facade poster is optimal here to target high-frequency shoppers directly at the point of purchase.";
      }
      
      return `### Billboard Campaign Format Recommendation\n` +
        `- **Suggested Format**: **${format}**\n` +
        `- **Site Analysis**: ${details}\n\n` +
        `_This recommendation fits the local commercial activity index (${f!.commercial_density || 0}%) and transit connectivity._`;
    }

    case "ROI_ESTIMATION": {
      if (!analytics || !k || !f) return "Please select a location first to estimate ROI effectiveness.";
      const score = k.overall_score;
      const reach = score > 80 ? "Excellent" : score > 60 ? "Strong" : "Moderate";
      const frequency = (f!.transit_accessibility || 0) > 75 ? "High" : "Moderate";
      const roiIndex = Math.min(99, Math.round(score * 1.15));

      return `### Campaign Advertising Effectiveness Estimate\n` +
        `- **Estimated ROI Index**: **${roiIndex}/100**\n` +
        `- **Audience Reach Potential**: **${reach}**\n` +
        `- **Commuter Impression Frequency**: **${frequency}**\n\n` +
        `This location has a high overall suitability score of **${score}**, indicating high visual retention rates.`;
    }

    case "ALTERNATIVE_LOCATIONS": {
      return `### Recommended Alternative Sites\n` +
        `If you are looking for alternative premium options in Chennai, we recommend checking these active database sites:\n\n` +
        `1. **OMR IT Expressway Display** (Score: **89/100**) - Targeting white-collar tech commuters.\n` +
        `2. **T-Nagar Usman Road Unipole** (Score: **93/100**) - High retail shopping footfall.\n` +
        `3. **Anna Salai Digital Screen** (Score: **94/100**) - Main highway commercial exposure.`;
    }

    case "MARKETING_INSIGHTS": {
      if (!analytics || !f) return "Please select a location first to generate marketing insights.";
      return `### Spatial Marketing Consultant Insights: ${areaName}\n` +
        `1. **Timing optimization**: Run creative assets during morning/evening commute hours (8-11 AM, 5-9 PM) to target peak vehicle traffic flows.\n` +
        `2. **Dynamic Copywriting**: Adjust campaign creatives to target the dominant demographic (e.g., tech professionals, shoppers).\n` +
        `3. **Dwell Time leverage**: High transit connectivity (${f!.transit_accessibility || 0}/100) allows detailed product storytelling as pedestrians wait near transit terminals.`;
    }

    case "SCORE_CHANGE": {
      if (!analytics) return "Please select a location on the map first.";
      if (!prevAnalytics) {
        return "I can compare score changes immediately! Please select a new location on the map to compare metrics with the previous analysis.";
      }
      
      const currK = analytics.kpis;
      const prevK = prevAnalytics.kpis;
      const diffOverall = currK.overall_score - prevK.overall_score;
      const diffComm = currK.commercial_potential - prevK.commercial_potential;
      const diffFoot = currK.footfall_potential - prevK.footfall_potential;

      const direction = diffOverall > 0 ? "increased" : diffOverall < 0 ? "decreased" : "remained unchanged";
      const changeText = diffOverall !== 0 ? `by **${Math.abs(diffOverall)}** points` : "";

      return `### Suitability Score Change Explanation\n` +
        `The suitability score has **${direction}** ${changeText} from **${prevK.overall_score}** (at _${prevAnalytics.area || "Previous Site"}_) to **${currK.overall_score}** (at _${analytics.area || "Current Site"}_).\n\n` +
        `**Key Drivers of this change**:\n` +
        `- **Commercial Potential**: changed by **${diffComm > 0 ? "+" : ""}${diffComm}%**\n` +
        `- **Footfall Potential**: changed by **${diffFoot > 0 ? "+" : ""}${diffFoot}%**\n\n` +
        `This shift reflects the difference in local PostGIS features such as POI mix and transit densities between the two zones.`;
    }

    case "EXPLAIN_COMMERCIAL_POTENTIAL": {
      if (!k) return "No active location is selected.";
      return `### KPI Explanation: Commercial Potential\n` +
        `**Commercial Potential score is ${k.commercial_potential}/100**.\n\n` +
        `This evaluates business density and shopper footprint, combining bank counts (${f?.bank_count || 0}), retail shopping points (${f?.shopping_count || 0}), and local offices (${f?.office_count || 0}).`;
    }

    case "EXPLAIN_FOOTFALL_POTENTIAL": {
      if (!k) return "No active location is selected.";
      return `### KPI Explanation: Footfall Potential\n` +
        `**Footfall Potential score is ${k.footfall_potential}/100**.\n\n` +
        `Measures daily pedestrian and vehicular commuter exposure, computed from road segment lengths (${f?.road_length_m || 0}m) and transit intersections.`;
    }

    case "EXPLAIN_KPIS": {
      return "### Key Performance Indicators (KPIs) Explained\n" +
        "1. **Overall Suitability**: Weighted general score for billboard value.\n" +
        "2. **Commercial Potential**: Business density & audience purchasing power.\n" +
        "3. **Footfall Potential**: Daily commuter volume impressions.\n" +
        "4. **Transit Connectivity**: Proximity of bus, rail, and metro nodes.";
    }

    case "FIND_NEARBY_POIS": {
      if (!analytics || !f) {
        return "Please select a location on the map first to analyze nearby points of interest.";
      }
      return `### Points of Interest (POIs) near ${areaName}\n` +
        `Within a **${analytics.radius}m** radius, our spatial database has mapped a total of **${f.total_pois || 0} POIs**:\n` +
        `- **Bank & ATM branches**: ${f.bank_count || 0}\n` +
        `- **Retail & Shopping centers**: ${f.shopping_count || 0}\n` +
        `- **Food & Dining outlets**: ${f.restaurant_count || 0}\n` +
        `- **Office & IT complexes**: ${f.office_count || 0}\n` +
        `- **Transit stops (Bus/Metro)**: ${(f.bus_count || 0) + (f.metro_count || 0)}`;
    }

    case "GENERAL_HELP":
    default: {
      return "### Aculion LI Spatial AI Consultant\n" +
        "I am your AI location intelligence assistant. Here are advanced topics you can ask me:\n\n" +
        "**Strategic Spatial Consultation**\n" +
        "- _'Who is the target audience here?'_ (demographic predictions)\n" +
        "- _'Suggest billboard format here'_ (evaluates digital vs classic format)\n" +
        "- _'Estimate ROI/advertising effectiveness'_ (impact projections)\n" +
        "- _'Give me marketing insights for this location'_\n" +
        "- _'Why did the score change?'_ (compares new site with previous site KPIs)\n" +
        "- _'Recommend alternative locations'_\n\n" +
        "**Knowledge Base Concepts**\n" +
        "- _'What is Commercial Potential?'_ | _'Define Competition Index'_\n" +
        "- _'Explain Scoring Methodology'_\n\n" +
        "**Billboard Recommendations**\n" +
        "- _'Find the best billboard location'_ (starts the 8-field slot-filling loop)";
    }
  }
}
