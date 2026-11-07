"use client";
import { usePathname } from "next/navigation";
export default function SiteFooter(){
 const path=usePathname()||"/"; const de=path==="/de"||path.startsWith("/de/");
 const home=de?"/de":"/"; const href=(p:string)=>de?"/de"+p:p;
 const links=[
  [de?"Turniere 2027":"Tour 2027",home+"#tour"],
  [de?"Ausschreibung":"Regulations",href("/ausschreibung")],
  [de?"Ergebnisse":"Leaderboard",href("/leaderboard")],
  [de?"Galerie":"Gallery",href("/galerie")],
  [de?"Partner":"Partners",home+"#partners"],
  [de?"Impressum":"Imprint",href("/impressum")],
  [de?"Datenschutz":"Privacy Policy",href("/datenschutz")],
  [de?"AGB":"Terms & Conditions",href("/agb")]
 ];
 return <footer style={{background:"#061b13",color:"#e5f1e9",padding:"72px clamp(22px,5vw,75px) 30px",borderTop:"1px solid #264c36"}}>
  <div style={{maxWidth:1330,margin:"auto"}}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:50,paddingBottom:52}}>
    <div><a href={home} style={{display:"flex",alignItems:"center",gap:18,color:"white",textDecoration:"none"}}><img src="/pro1putt-logo-white.png" alt="PRO1PUTT" style={{width:85,height:85,objectFit:"contain"}}/><div><div style={{fontWeight:900,fontSize:27,letterSpacing:".04em"}}>PRO1PUTT</div><div style={{fontSize:11,letterSpacing:".15em",color:"#89d4a4"}}>JUNIOR GOLF TOUR</div></div></a>
    <p style={{maxWidth:320,color:"#9bb9a9",lineHeight:1.7,marginTop:20}}>{de?"Große Träume. Echter Wettkampf. Unvergessliche Momente.":"Big dreams. Real competition. Unforgettable moments."}</p></div>
    <div><div style={{fontSize:12,fontWeight:900,letterSpacing:".18em",color:"#80d65b",marginBottom:24}}>{de?"ENTDECKEN":"EXPLORE"}</div><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:"17px 22px"}}>{links.map(([label,url])=><a key={url} href={url} style={{color:"#dcece2",fontSize:13,textDecoration:"none",fontWeight:700}}>{label}</a>)}</div></div>
    <div><div style={{fontSize:12,fontWeight:900,letterSpacing:".18em",color:"#80d65b",marginBottom:24}}>{de?"DEIN NÄCHSTES TURNIER":"YOUR NEXT TOURNAMENT"}</div><p style={{lineHeight:1.7,color:"#a9c8b6",marginBottom:24}}>{de?"Werde Teil der nächsten Golfgeneration.":"Be part of the next generation of golf."}</p><a href={href("/register")} style={{display:"inline-block",background:"#80d65b",color:"#092b1c",padding:"15px 23px",fontSize:12,fontWeight:900,letterSpacing:".08em",textDecoration:"none",borderRadius:5}}>{de?"JETZT ANMELDEN":"REGISTER NOW"} ↗</a></div>
   </div><div style={{borderTop:"1px solid #294c38",paddingTop:26,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:14,color:"#8eac9a",fontSize:12}}><span>© {new Date().getFullYear()} PRO1PUTT. {de?"Alle Rechte vorbehalten.":"All rights reserved."}</span><span>PLAY YOUR GAME. WRITE YOUR STORY.</span></div>
  </div>
 </footer>;
}
