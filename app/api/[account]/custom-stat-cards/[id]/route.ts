import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { customStatCards } from "@/lib/db/schema";
import { authorizeAccountAccess } from "@/lib/api/ownership";

const updateCustomStatCardSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(["income", "expense"]).optional(),
  categories: z.array(z.string()).min(1, "At least one category is required").optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// PUT /api/[account]/custom-stat-cards/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ account: string; id: string }> }
) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCustomStatCardSchema.parse(body);

    // Check if the card exists and belongs to the account
    const existingCard = await db
      .select()
      .from(customStatCards)
      .where(
        and(
          eq(customStatCards.id, id),
          eq(customStatCards.accountId, resolved.context.account.id)
        )
      )
      .limit(1);

    if (existingCard.length === 0) {
      return NextResponse.json({ error: "Stat card not found" }, { status: 404 });
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // If type changed, update color accordingly if not explicitly provided
    if (validatedData.type && !validatedData.color) {
      updateData.color = validatedData.type === "income" ? "emerald" : "rose";
    }

    const [updatedCard] = await db
      .update(customStatCards)
      .set(updateData)
      .where(
        and(
          eq(customStatCards.id, id),
          eq(customStatCards.accountId, resolved.context.account.id)
        )
      )
      .returning();

    return NextResponse.json(updatedCard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating custom stat card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/[account]/custom-stat-cards/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ account: string; id: string }> }
) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const { id } = await params;

    // Check if the card exists and belongs to the account
    const existingCard = await db
      .select()
      .from(customStatCards)
      .where(
        and(
          eq(customStatCards.id, id),
          eq(customStatCards.accountId, resolved.context.account.id)
        )
      )
      .limit(1);

    if (existingCard.length === 0) {
      return NextResponse.json({ error: "Stat card not found" }, { status: 404 });
    }

    await db
      .delete(customStatCards)
      .where(
        and(
          eq(customStatCards.id, id),
          eq(customStatCards.accountId, resolved.context.account.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom stat card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
