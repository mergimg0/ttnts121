import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Campaign } from "@/types/contact";

// GET email campaign statistics
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const snapshot = await adminDb.collection("campaigns").get();
    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];

    // Calculate aggregate stats
    const stats = {
      totalCampaigns: campaigns.length,
      draftCampaigns: campaigns.filter((c) => c.status === "draft").length,
      sentCampaigns: campaigns.filter((c) => c.status === "sent").length,
      failedCampaigns: campaigns.filter((c) => c.status === "failed").length,
      totalEmailsSent: campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0),
      totalEmailsFailed: campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0),
      // These would come from Resend webhooks in production
      totalDelivered: campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0),
      totalOpened: campaigns.reduce((acc, c) => acc + (c.openedCount || 0), 0),
      totalClicked: campaigns.reduce((acc, c) => acc + (c.clickedCount || 0), 0),
      totalBounced: campaigns.reduce((acc, c) => acc + (c.bouncedCount || 0), 0),
    };

    // Calculate rates (avoid division by zero)
    const deliveryRate = stats.totalEmailsSent > 0
      ? ((stats.totalDelivered / stats.totalEmailsSent) * 100).toFixed(1)
      : "0.0";
    const openRate = stats.totalDelivered > 0
      ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1)
      : "0.0";
    const clickRate = stats.totalOpened > 0
      ? ((stats.totalClicked / stats.totalOpened) * 100).toFixed(1)
      : "0.0";
    const bounceRate = stats.totalEmailsSent > 0
      ? ((stats.totalBounced / stats.totalEmailsSent) * 100).toFixed(1)
      : "0.0";

    // Recent campaigns (last 5)
    const recentCampaigns = campaigns
      .filter((c) => c.status === "sent")
      .sort((a, b) => {
        const aTime = a.sentAt ? (a.sentAt as any).toDate?.() || new Date(a.sentAt as any) : new Date(0);
        const bTime = b.sentAt ? (b.sentAt as any).toDate?.() || new Date(b.sentAt as any) : new Date(0);
        return bTime.getTime() - aTime.getTime();
      })
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        sentAt: c.sentAt,
        sentCount: c.sentCount || 0,
        openedCount: c.openedCount || 0,
        clickedCount: c.clickedCount || 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        deliveryRate: `${deliveryRate}%`,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
        bounceRate: `${bounceRate}%`,
        recentCampaigns,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch campaign stats" },
      { status: 500 }
    );
  }
}
