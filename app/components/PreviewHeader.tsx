import Link from "next/link";

export default function PreviewHeader() {
  return (
    <>
      <header className="p1-new-header">
        <Link href="/design-preview" aria-label="PRO1PUTT Home">
          <img
            src="/pro1putt-logo-white.png"
            alt="PRO1PUTT"
          />
        </Link>

        <nav aria-label="PRO1PUTT Navigation">
          <Link href="/leaderboard-preview" className="p1-new-leaderboard">
            LEADERBOARD ↗
          </Link>

          <Link href="/register-preview" className="p1-new-register">
            REGISTER NOW ↗
          </Link>
        </nav>
      </header>

      <style>{`
        .p1-new-header {
          position: fixed;
          z-index: 100;
          top: 0;
          left: 0;
          width: 100%;
          padding: 10px 5vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6, 31, 21, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .p1-new-header img {
          display: block;
          width: auto;
          height: 50px;
          max-width: 200px;
          object-fit: contain;
        }

        .p1-new-header nav {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .p1-new-header a {
          text-decoration: none;
        }

        .p1-new-leaderboard {
          color: white;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .p1-new-register {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 22px;
          border-radius: 5px;
          background: #80d65b;
          color: #092b1c;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.07em;
          white-space: nowrap;
        }

        .p1-new-register:hover {
          background: #a7e78a;
        }

        @media (max-width: 600px) {
          .p1-new-header {
            padding: 10px 22px;
          }

          .p1-new-header img {
            height: 43px;
            max-width: 155px;
          }

          .p1-new-leaderboard {
            display: none;
          }

          .p1-new-header nav {
            gap: 8px;
          }

          .p1-new-register {
            padding: 12px 14px;
            font-size: 10px;
          }
        }
      `}</style>
    </>
  );
}
