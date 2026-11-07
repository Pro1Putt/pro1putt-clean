"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const entries = [
  { href: "/", en: "Home", de: "Startseite" },
  { href: "/#tour", en: "Tour 2027", de: "Tour 2027" },
  { href: "/ausschreibung", en: "Regulations", de: "Ausschreibung" },
  { href: "/leaderboard", en: "Leaderboard", de: "Ergebnisse" },
  { href: "/#partners", en: "Partners", de: "Partner" },
  { href: "/galerie", en: "Gallery", de: "Galerie" },
];

export default function TopBar() {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const isGerman = pathname === "/de" || pathname.startsWith("/de/");
  useEffect(() => { setMobile(false); }, [pathname]);
  const localize = (href: string) => isGerman ? (href === "/" ? "/de" : href.startsWith("/#") ? "/de" + href.slice(1) : "/de" + href) : href;
  const switchLanguage = () => {
    if (isGerman) window.location.assign(pathname === "/de" ? "/" : pathname.replace(/^\/de(?=\/|$)/, "") + window.location.hash);
    else window.location.assign("/de" + (pathname === "/" ? "" : pathname) + window.location.hash);
  };
  return <>
    <style>{`
      .p1-unified-header{position:sticky;top:0;z-index:100;background:rgba(8,36,25,.96);border-bottom:1px solid rgba(128,214,91,.22);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);font-family:Lato,Arial,sans-serif}
      .p1-unified-inner{max-width:1440px;margin:auto;min-height:76px;padding:8px clamp(18px,3.3vw,56px);display:flex;align-items:center;gap:clamp(18px,2.5vw,38px)}
      .p1-unified-brand{display:flex;align-items:center;gap:6px;flex-shrink:0;text-decoration:none;color:white}
      .p1-unified-logo{height:62px;width:92px;object-fit:contain}
      .p1-unified-brandname{font-size:17px;font-weight:900;letter-spacing:.045em;line-height:1.05}
      .p1-unified-tagline{font-size:9px;color:#a8c8b5;letter-spacing:.06em;margin-top:5px}
      .p1-unified-nav{display:flex;gap:clamp(12px,1.65vw,28px);margin-left:auto;align-items:center}
      .p1-unified-nav a{font-size:11px;font-weight:800;letter-spacing:.075em;text-transform:uppercase;color:#e2ece6;text-decoration:none;white-space:nowrap;padding:9px 0;border-bottom:1px solid transparent;transition:color .2s,border-color .2s}
      .p1-unified-nav a:hover,.p1-unified-nav a[aria-current=page]{color:#a1ec78;border-color:#80d65b}
      .p1-unified-actions{display:flex;align-items:center;gap:12px;margin-left:12px}
      .p1-unified-lang{border:1px solid #59776a;border-radius:999px;background:transparent;color:#fff;padding:11px 12px;font-weight:800;cursor:pointer;font-size:12px;white-space:nowrap}
      .p1-unified-cta{background:#80d65b;color:#062719!important;border-radius:6px;padding:14px 19px;text-decoration:none;font-weight:900;font-size:12px;text-transform:uppercase;white-space:nowrap;letter-spacing:.05em}
      .p1-unified-cta:hover{background:#a5ed80}
      .p1-unified-menu{display:none;border:1px solid #59776a;background:transparent;color:#fff;border-radius:10px;padding:10px 13px;font-size:20px;cursor:pointer}
      .p1-unified-mobile{display:none;background:#08271d;padding:12px 24px 24px;border-top:1px solid #2a493c}
      .p1-unified-mobile a{display:block;color:white;padding:13px 5px;text-decoration:none;border-bottom:1px solid #254b39;font-weight:800}
      .p1-language-message{position:fixed;right:22px;top:95px;z-index:120;background:#fff;color:#103527;box-shadow:0 12px 36px #0004;border-radius:14px;padding:17px 20px;max-width:340px;font-size:13px;line-height:1.5}
      .p1-language-message button{border:0;background:#0e3726;color:white;border-radius:8px;padding:7px 12px;margin-top:8px;cursor:pointer}
      @media(max-width:1180px){.p1-unified-nav{display:none}.p1-unified-menu{display:block}.p1-unified-actions{margin-left:auto}.p1-unified-mobile{display:block}}
      @media(max-width:540px){.p1-unified-inner{min-height:70px;padding:8px 14px;gap:8px}.p1-unified-logo{height:46px;width:54px}.p1-unified-brandname{font-size:15px}.p1-unified-tagline{display:none}.p1-unified-actions{gap:6px}.p1-unified-cta{font-size:10px;padding:11px}.p1-unified-lang{padding:9px;font-size:11px}}
    `}</style>
    <header className="p1-unified-header">
      <div className="p1-unified-inner">
        <a className="p1-unified-brand" href={isGerman ? "/de" : "/"} aria-label={isGerman ? "PRO1PUTT Startseite" : "PRO1PUTT Home"}>
          <img className="p1-unified-logo" src="/pro1putt-logo-white.png" alt="PRO1PUTT Logo" onError={(e)=>{const img=e.currentTarget;if(!img.src.includes("supabase.co"))img.src="https://levztgbjylvspmfxcbuj.supabase.co/storage/v1/object/public/public-assets/pro1putt-logo.png";}} />
          
        </a>
        <nav className="p1-unified-nav" aria-label={isGerman ? "Hauptnavigation" : "Main navigation"}>
          {entries.map(item=><a key={item.href} href={localize(item.href)} aria-current={pathname === item.href && item.href !== "/#tour" ? "page" : undefined}>{isGerman?item.de:item.en}</a>)}
        </nav>
        <div className="p1-unified-actions">
          <button className="p1-unified-lang" type="button" onClick={switchLanguage} aria-label={isGerman?"Switch to English":"Deutsch wählen"}>{isGerman?"🇬🇧 EN":"🇩🇪 DE"}</button>
          <a className="p1-unified-cta" href={isGerman ? "/de/register" : "/register"}>{isGerman?"Jetzt anmelden":"Register Now"} ↗</a>
          <button className="p1-unified-menu" type="button" onClick={()=>setMobile(!mobile)} aria-expanded={mobile} aria-label={isGerman ? "Menü öffnen" : "Open menu"}>{mobile?"✕":"☰"}</button>
        </div>
      </div>
      {mobile && <nav className="p1-unified-mobile" aria-label="Mobile navigation">{entries.map(item=><a key={item.href} href={localize(item.href)} onClick={()=>setMobile(false)}>{isGerman?item.de:item.en}</a>)}</nav>}
    </header>

  </>;
}
