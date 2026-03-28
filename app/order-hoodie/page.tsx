type OrderPageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

export default async function OrderHoodiePage({
  searchParams,
}: OrderPageProps) {
  const params = searchParams ? await searchParams : {};
  const productId = params?.id ?? "";

  return (
    <div
      style={{
        maxWidth: "760px",
        margin: "60px auto",
        padding: "0 20px 120px",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          fontWeight: 700,
          marginBottom: "18px",
          color: "#111111",
        }}
      >
        Hoodie bestellen
      </h1>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            color: "#374151",
            marginBottom: "24px",
          }}
        >
          Produkt-ID: <strong>{productId || "nicht gefunden"}</strong>
        </div>

        <form
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111111",
              }}
            >
              Größe
            </label>
            <select
              name="size"
              defaultValue=""
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: "16px",
                background: "#ffffff",
              }}
            >
              <option value="" disabled>
                Bitte Größe wählen
              </option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="3XL">3XL</option>
              <option value="4XL">4XL</option>
              <option value="5XL">5XL</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111111",
              }}
            >
              Anzahl
            </label>
            <input
              type="number"
              name="quantity"
              min={1}
              defaultValue={1}
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: "16px",
                background: "#ffffff",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111111",
              }}
            >
              Vorname
            </label>
            <input
              type="text"
              name="firstName"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: "16px",
                background: "#ffffff",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111111",
              }}
            >
              Nachname
            </label>
            <input
              type="text"
              name="lastName"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: "16px",
                background: "#ffffff",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111111",
              }}
            >
              E-Mail
            </label>
            <input
              type="email"
              name="email"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: "16px",
                background: "#ffffff",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#111111",
              }}
            >
              Straße und Hausnummer
            </label>
            <input
              type="text"
              name="street"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                padding: "0 14px",
                fontSize: "16px",
                background: "#ffffff",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "#111111",
                }}
              >
                PLZ
              </label>
              <input
                type="text"
                name="zip"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "16px",
                  background: "#ffffff",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "#111111",
                }}
              >
                Ort
              </label>
              <input
                type="text"
                name="city"
                style={{
                  width: "100%",
                  height: "48px",
                  borderRadius: "10px",
                  border: "1px solid #d1d5db",
                  padding: "0 14px",
                  fontSize: "16px",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: "10px",
              background: "#0DB26B",
              color: "#ffffff",
              padding: "16px 18px",
              borderRadius: "10px",
              border: "none",
              width: "100%",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            Bestellung absenden
          </button>
        </form>
      </div>
    </div>
  );
}