/* Adaptador de motor astronómico.
   Prioriza la librería real 'astronomy-engine' (tabla IAU exacta) si está
   cargada como window.Astronomy con Constellation/SiderealTime/AstroTime.
   Si no, usa el resolvedor de respaldo por cajas (window.AstronomyFallback).

   El engine REAL expone:
     Astronomy.Constellation(ra, dec)  // ra en horas, dec en grados, J2000
        -> { symbol, name, ra1875, dec1875 }   (name = nombre latino completo)
     Astronomy.SiderealTime(astroTime) -> horas (GAST)
     new Astronomy.AstroTime(date)

   Nuestra app llama exactamente a esas firmas, así que es compatible directo.
   Solo normalizamos para que '.name' siempre sea la clave latina que usan
   CONSTELLATIONS_ES y FIGURES (p.ej. "Ursa Major", "Pegasus"). */

(function () {
  function hasRealEngine() {
    return (typeof window.AstronomyReal !== "undefined" &&
            window.AstronomyReal &&
            typeof window.AstronomyReal.Constellation === "function" &&
            typeof window.AstronomyReal.SiderealTime === "function");
  }

  if (hasRealEngine()) {
    const R = window.AstronomyReal;
    // Envolvemos para garantizar que .name sea la clave latina esperada.
    window.Astronomy = {
      AstroTime: R.AstroTime,
      Observer: R.Observer,
      SiderealTime: R.SiderealTime,
      Constellation: function (raHours, decDeg) {
        const c = R.Constellation(raHours, decDeg);
        // c.name ya viene como nombre latino completo ("Ursa Major", etc.)
        return { name: c.name, symbol: c.symbol };
      },
      __source: "astronomy-engine (IAU)"
    };
  } else {
    window.Astronomy = window.AstronomyFallback;
    if (window.Astronomy) window.Astronomy.__source = "fallback-cajas";
  }
})();
