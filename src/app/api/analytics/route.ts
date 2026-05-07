import { NextResponse } from "next/server";
import Papa from "papaparse";

// Define the shape of our analytics data
export type AnalyticsData = {
  totalResponses: number;
  averageRating: number;
  wouldUsePercentage: number;
  ratingDistribution: { rating: string; count: number }[];
  conceptClarity: { name: string; value: number }[];
  standoutFeatures: { name: string; count: number }[];
  wouldUseIt: { name: string; value: number }[];
  futureFeatures: { name: string; count: number }[];
  suggestions: { text: string; timestamp: string }[];
  lastUpdated: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const csvUrl = process.env.SHEET_CSV_URL;
    
    if (!csvUrl) {
      return NextResponse.json({ error: "SHEET_CSV_URL is not configured" }, { status: 500 });
    }

    const response = await fetch(csvUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    
    // Parse CSV
    const result = Papa.parse<string[]>(csvText, {
      skipEmptyLines: true,
      header: false, // We use indices instead of relying on exact headers
    });

    // The first row should be headers, so we skip it
    const rows = result.data.slice(1);
    
    const totalResponses = rows.length;
    
    if (totalResponses === 0) {
      return NextResponse.json({
        totalResponses: 0,
        averageRating: 0,
        wouldUsePercentage: 0,
        ratingDistribution: [],
        conceptClarity: [],
        standoutFeatures: [],
        wouldUseIt: [],
        futureFeatures: [],
        suggestions: [],
        lastUpdated: new Date().toISOString()
      });
    }

    // Aggregations
    let totalRating = 0;
    const ratingCounts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    const clarityCounts: Record<string, number> = {};
    const featureCounts: Record<string, number> = {};
    const wouldUseCounts: Record<string, number> = {};
    const futureCounts: Record<string, number> = {};
    const suggestions: { text: string; timestamp: string }[] = [];

    let positiveWouldUseCount = 0;

    rows.forEach((row) => {
      // 0: Timestamp, 1: Rating, 2: Concept clarity, 3: Standout feature, 
      // 4: Would you use it, 5: Exciting future feature, 6: Suggestions
      
      const timestamp = row[0] || "";
      const rating = parseInt(row[1]) || 0;
      const clarity = row[2] || "Unspecified";
      const feature = row[3] || "Unspecified";
      const wouldUse = row[4] || "Unspecified";
      const future = row[5] || "Unspecified";
      const suggestion = row[6] || "";

      // Rating
      if (rating >= 1 && rating <= 5) {
        totalRating += rating;
        ratingCounts[rating.toString()]++;
      }

      // Clarity
      clarityCounts[clarity] = (clarityCounts[clarity] || 0) + 1;

      // Standout Feature
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;

      // Would Use
      wouldUseCounts[wouldUse] = (wouldUseCounts[wouldUse] || 0) + 1;
      const wouldUseLower = wouldUse.toLowerCase();
      if (wouldUseLower.includes("definitely") || wouldUseLower.includes("probably yes") || wouldUseLower === "yes") {
        positiveWouldUseCount++;
      }

      // Future Feature
      futureCounts[future] = (futureCounts[future] || 0) + 1;

      // Suggestions
      if (suggestion.trim() !== "") {
        suggestions.push({ text: suggestion, timestamp });
      }
    });

    const averageRating = totalRating / totalResponses;
    const wouldUsePercentage = Math.round((positiveWouldUseCount / totalResponses) * 100);

    // Format for Recharts
    const formatForCharts = (counts: Record<string, number>) => {
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count, value: count }))
        .sort((a, b) => b.count - a.count); // Sort by count descending
    };

    const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
      rating: `${rating} Stars`,
      count,
    }));

    // Reverse suggestions so newest is first
    suggestions.reverse();

    const data: AnalyticsData = {
      totalResponses,
      averageRating: parseFloat(averageRating.toFixed(1)),
      wouldUsePercentage,
      ratingDistribution,
      conceptClarity: formatForCharts(clarityCounts),
      standoutFeatures: formatForCharts(featureCounts).slice(0, 5), // top 5
      wouldUseIt: formatForCharts(wouldUseCounts),
      futureFeatures: formatForCharts(futureCounts).slice(0, 5), // top 5
      suggestions,
      lastUpdated: new Date().toISOString()
    };

    const apiResponse = NextResponse.json(data);
    apiResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return apiResponse;
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
}
