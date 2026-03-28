type HoodieProduct = {
  id: string | number;
  name: string;
  image?: string | null;
};

async function getProducts(): Promise<HoodieProduct[]> {
  try {
    const res = await fetch("http://localhost:3000/api/hoodies", {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const json = await res.json();

    if (Array.isArray(json)) {
      return json;
    }

    if (Array.isArray(json?.data)) {
      return json.data;
    }

    if (Array.isArray(json?.data?.data)) {
      return json.data.data;
    }

    return [];
  } catch {
    return [];
  }
}

export default async function HoodiesPage() {
  const products = await getProducts();

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "60px auto",
        padding: "0 20px 120px",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          fontWeight: 700,
          marginBottom: "40px",
          color: "#111111",
        }}
      >
        PRO1PUTT Hoodies
      </h1>

      {products.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
            fontSize: "18px",
          }}
        >
          Keine Hoodie-Produkte gefunden.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {products.map((p) => (
            <div
              key={String(p.id)}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "20px",
                background: "#ffffff",
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  height: "220px",
                  background: "#f3f4f6",
                  borderRadius: "12px",
                  marginBottom: "18px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={p.image || "/pro1putt-logo.png"}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    background: "white",
                  }}
                />
              </div>

              <div
                style={{
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "#111111",
                  marginBottom: "10px",
                  lineHeight: 1.3,
                }}
              >
                {p.name}
              </div>

              <a
  href={`/order-hoodie?id=${p.id}`}
  style={{
    display: "block",
    textAlign: "center",
    background: "#0DB26B",
    color: "#ffffff",
    padding: "14px 16px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "16px",
  }}
>
  Jetzt bestellen
</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}