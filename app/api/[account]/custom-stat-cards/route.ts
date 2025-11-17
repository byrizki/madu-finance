import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { customStatCards } from "@/lib/db/schema";
import { authorizeAccountAccess } from "@/lib/api/ownership";

const createCustomStatCardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const updateCustomStatCardSchema = createCustomStatCardSchema.partial().extend({
  id: z.string().uuid(),
});

// GET /api/[account]/custom-stat-cards
export async function GET(
  request: Request,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const cards = await db
      .select()
      .from(customStatCards)
      .where(eq(customStatCards.accountId, resolved.context.account.id))
      .orderBy(customStatCards.createdAt);

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching custom stat cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/[account]/custom-stat-cards
export async function POST(
  request: Request,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const body = await request.json();
    const validatedData = createCustomStatCardSchema.parse(body);

    const [newCard] = await db
      .insert(customStatCards)
      .values({
        accountId: resolved.context.account.id,
        name: validatedData.name,
        type: validatedData.type,
        categories: validatedData.categories,
        color: validatedData.color || (validatedData.type === "income" ? "emerald" : "rose"),
        icon: validatedData.icon,
      })
      .returning();

    return NextResponse.json(newCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating custom stat card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
