import { NextResponse } from "next/server";

type BrandCanyonView = {
  image?: string;
  variant_id?: number;
  view_type_id?: number;
};

type BrandCanyonProduct = {
  id?: number | string;
  name?: string;
  views?: BrandCanyonView[];
  attributes?: any[];
};

const PRODUCT_IDS = ["254483", "254484", "254485", "254486"];

async function loadProduct(api: string, apiKey: string, productId: string) {
  const res = await fetch(`${api}/products/${productId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  const json = await res.json();
  return json?.data ?? null;
}

function buildColors(product: BrandCanyonProduct) {
  const views = product.views || [];

  const variants: Record<number, { front?: string; back?: string }> = {};

  for (const v of views) {
    if (!v.variant_id || !v.image) continue;

    if (!variants[v.variant_id]) {
      variants[v.variant_id] = {};
    }

    // Front
    if (v.view_type_id === 1 && !variants[v.variant_id].front) {
      variants[v.variant_id].front = v.image;
    }

    // Back
    if (v.view_type_id === 2 && !variants[v.variant_id].back) {
      variants[v.variant_id].back = v.image;
    }
  }

  // nur vollständige Farben
  return Object.values(variants)
    .filter((v) => v.front)
    .map((v, i) => ({
      color: `Variante ${i + 1}`,
      front: v.front,
      back: v.back || v.front,
    }))
    .slice(0, 6);
}

export async function GET() {
  try {
    const api = process.env.BRANDCANYON_API;
    const apiKey = process.env.BRANDCANYON_API_KEY;

    const products = await Promise.all(
      PRODUCT_IDS.map((id) => loadProduct(api!, apiKey!, id))
    );

    const data = products.map((product) => ({
      id: product.id,
      name: product.name,
      colors: buildColors(product),
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message });
  }
}