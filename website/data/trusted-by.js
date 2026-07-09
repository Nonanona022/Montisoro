/* ═══════════════════════════════════════════════════════════════════
   Montisoro — "Vertrouwd door" / "Trusted by"  SINGLE SOURCE OF TRUTH
   Both the public site (Home.html / Home-en.html) and the admin panel
   ("Vertrouwd door" view) read this exact shape.

   Each entry:
     name   : string   — company name (shown under the logo)
     logo   : string   — path to a transparent SVG/PNG, '' = name-only
     order  : number   — ascending display order
     active : boolean  — false hides it without deleting

   Logos live in /website/assets/logos/<slug>.svg  (transparent, ideally SVG).
   They are rendered monochrome-white so any single brand colour stays
   visually consistent on the dark strip.

   ⚠ Only add official logos you have permission to display.
   To regenerate this file from the admin panel: "Vertrouwd door" → Exporteer.
═══════════════════════════════════════════════════════════════════ */
window.MONTISORO_TRUSTED = [
  { name:'Volvo Group',                logo:'../assets/logos/volvo.svg', order:1,  active:true },
  { name:'Novartis Manufacturing',     logo:'../assets/logos/novartis.png', order:2,  active:true },
  { name:'Lonza',                      logo:'../assets/logos/lonza.svg', order:3,  active:true },
  { name:'LyondellBasell',             logo:'../assets/logos/lyondellbasell.png', order:4,  active:true },
  { name:'Rockwool',                   logo:'../assets/logos/rockwool.png', order:5,  active:true },
  { name:'Alcon Laboratories Belgium', logo:'../assets/logos/alcon.svg', order:6,  active:true },
  { name:'Emeis',                      logo:'../assets/logos/emeis.png', order:7,  active:true },
  { name:'HB Accountants',             logo:'../assets/logos/hb.png', order:8,  active:true },
  { name:'Legend Biotech',             logo:'../assets/logos/legend.png', order:9,  active:true },
  { name:'AXA Belgium',                logo:'../assets/logos/axa.png', order:10, active:true },
  { name:'Vaillant',                   logo:'../assets/logos/vaillant.png', order:11, active:true },
  { name:'Howden',                     logo:'../assets/logos/howden.png', order:12, active:true },
  { name:'AMS', logo:'../assets/logos/ams.png', order:13, active:true },
  { name:'Feneko', logo:'../assets/logos/feneko.png', order:14, active:true },
  { name:'Securitas', logo:'../assets/logos/securitas.png', order:15, active:true },
  { name:'Sortimo', logo:'../assets/logos/sortimo.png', order:16, active:true },
  { name:'Van Breda Risk & Benefits', logo:'../assets/logos/vanbreda.png', order:17, active:true },
  { name:'Rockfon', logo:'../assets/logos/rockfon.png', order:5.5, active:true }
];
