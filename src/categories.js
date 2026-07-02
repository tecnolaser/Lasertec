// Estructura de categorias, formas y filtros adicionales.
// Es la misma logica que armamos en el Excel: Categoria -> Forma -> Ficha tecnica de atributos.

const ESPESORES = ["3 mm", "4 mm", "5 mm", "6 mm", "8 mm", "10 mm", "12 mm", "16 mm", "18 mm"];

const AGUJEROS = ["0", "1", "2", "3", "4", "5 a 8", "Mas de 8", "A plano"];

const DIAMETROS = ["Ø6", "Ø8", "Ø10", "Ø12", "Ø14", "Ø16", "Ø18", "Ø20", "Ø22", "Ø25", "No aplica"];

const MATERIALES = ["Acero SAE 1010/1020", "Acero naval ASTM A131", "Acero inoxidable (a futuro)"];

const TERMINACIONES = [
  "Sin proteccion", "Antioxido sintetico", "Antioxido epoxi", "Esmalte sintetico RAL",
  "Epoxi bicomponente", "Poliuretanico", "Galvanizado en caliente", "Zincado", "Metalizado"
];

// id, nombre, formas[], extras[{label, key, kind:'list'|'num', options}]
const CATEGORIAS = [
  { id: "platinas", nombre: "Platinas", icono: "▭",
    formas: ["Rectangulares", "Cuadradas", "En L", "En T", "En U-canal", "Trapezoidales",
      "Con chaflanes", "Curvas-arco", "Con ranuras (slotted)", "Reduccion de seccion (dog-bone)", "A plano (DXF)"],
    extras: [
      { label: "Distancia entre agujeros (mm)", key: "distanciaAgujeros", kind: "num" },
      { label: "Posicion de agujeros", key: "posicionAgujeros", kind: "list", options: ["Centrado", "Descentrado", "Patron simetrico", "A plano"] },
      { label: "Angulo de chaflan", key: "anguloChaflan", kind: "list", options: ["30", "45", "60", "A plano", "No aplica"] },
      { label: "Radio de curvatura", key: "radioCurvatura", kind: "list", options: ["No aplica", "R50", "R100", "R150", "R200", "A plano"] }
    ] },
  { id: "cancamos", nombre: "Cancamos / Orejas de izaje", icono: "◍",
    formas: ["Circular", "Tipo gota (teardrop)", "Trapezoidal", "Triangular reforzada", "Horquilla (fork-clevis)",
      "Rectangular con oreja", "Doble oreja (tandem)", "Monkey face (naval)", "Base curva (para caño)", "A plano"],
    extras: [
      { label: "Capacidad de carga", key: "capacidadCarga", kind: "list", options: ["Hasta 1 Ton", "1 a 5 Ton", "5 a 10 Ton", "Mas de 10 Ton (requiere calculo)"] },
      { label: "Diametro agujero de izaje", key: "diametroIzaje", kind: "list", options: ["Ø16", "Ø20", "Ø25", "Ø32", "Ø40", "A plano"] },
      { label: "Norma de referencia", key: "norma", kind: "list", options: ["DNV", "ABS", "Norma interna del astillero", "Sin norma especifica"] },
      { label: "Altura de cuello (mm)", key: "alturaCuello", kind: "num" },
      { label: "Marcado de capacidad grabado", key: "marcado", kind: "list", options: ["Si", "No"] }
    ] },
  { id: "cartelas", nombre: "Cartelas (gussets)", icono: "◺",
    formas: ["Triangular recta", "Triangular con radio en vertice", "Trapezoidal", "Rectangular con corte diagonal",
      "Con muesca para paso de perfil", "Con refuerzo perimetral", "A plano"],
    extras: [
      { label: "Angulo del vertice", key: "anguloVertice", kind: "list", options: ["30", "45", "60", "90", "A plano"] },
      { label: "Radio en vertice (mm)", key: "radioVertice", kind: "num" },
      { label: "Longitud de catetos (mm)", key: "longitudCatetos", kind: "num" }
    ] },
  { id: "placas-base", nombre: "Placas base", icono: "▤",
    formas: ["Cuadrada", "Rectangular", "Circular", "Con rigidizadores integrados", "A plano"],
    extras: [
      { label: "Patron de anclaje", key: "patronAnclaje", kind: "list", options: ["4 agujeros", "6 agujeros", "8 agujeros", "A plano de fundacion"] },
      { label: "Diametro de perno de anclaje", key: "diametroPerno", kind: "list", options: ["Ø12", "Ø16", "Ø20", "Ø25", "A plano"] },
      { label: "Distancia entre agujeros (mm)", key: "distanciaAgujeros", kind: "num" },
      { label: "Espesor de rigidizador", key: "espesorRigidizador", kind: "list", options: ["No aplica", "4 mm", "6 mm", "8 mm", "A plano"] }
    ] },
  { id: "bridas-ciegas", nombre: "Bridas ciegas", icono: "◎",
    formas: ["Circular estandar", "Circular reforzada", "Ovalada", "A plano"],
    extras: [
      { label: "Norma", key: "norma", kind: "list", options: ["ANSI B16.5", "DIN 2527", "A plano"] },
      { label: "Diametro nominal (DN)", key: "dn", kind: "list", options: ["DN25", "DN50", "DN80", "DN100", "DN150", "DN200", "DN250", "DN300", "A medida"] },
      { label: "Presion de diseño", key: "presion", kind: "list", options: ["PN10", "PN16", "PN20", "PN25", "Class150", "Class300", "A plano"] },
      { label: "Cantidad de bulones", key: "bulones", kind: "list", options: ["4", "6", "8", "12", "16", "A plano"] }
    ] },
  { id: "soportes-canerias", nombre: "Soportes para cañerias", icono: "⊓",
    formas: ["Tipo U (abrazadera)", "Tipo silla (saddle)", "Mensula en L", "Mensula triangular reforzada", "Base curva para caño", "A plano"],
    extras: [
      { label: "Diametro de caño", key: "diametroCano", kind: "list", options: ["1/2\"", "3/4\"", "1\"", "1 1/2\"", "2\"", "3\"", "4\"", "6\"", "A medida"] },
      { label: "Tipo de fijacion", key: "fijacion", kind: "list", options: ["Para soldar", "Para atornillar", "Ambas"] },
      { label: "Altura de soporte (mm)", key: "altura", kind: "num" }
    ] },
  { id: "chapas-perforadas", nombre: "Chapas perforadas / Gratings", icono: "▦",
    formas: ["Rectangular estandar", "Rectangular con marco perimetral", "Con recorte para paso", "A plano"],
    extras: [
      { label: "Patron de perforado", key: "patron", kind: "list", options: ["Redondo", "Cuadrado", "Tipo grating"] },
      { label: "Diametro de perforacion (mm)", key: "diametroPerf", kind: "list", options: ["Ø3", "Ø4", "Ø5", "Ø6", "Ø8", "Ø10", "A plano"] },
      { label: "Distancia entre agujeros (mm)", key: "distanciaAgujeros", kind: "num" },
      { label: "Porcentaje de area abierta", key: "areaAbierta", kind: "list", options: ["20%", "30%", "40%", "50%", "A plano"] },
      { label: "Marco perimetral", key: "marco", kind: "list", options: ["Si", "No"] }
    ] },
  { id: "escalones", nombre: "Escalones antideslizantes", icono: "☰",
    formas: ["Recto simple", "Con reborde frontal", "Con perforado antideslizante", "A plano"],
    extras: [
      { label: "Ancho de huella (mm)", key: "anchoHuella", kind: "num" },
      { label: "Tipo de antideslizante", key: "antideslizante", kind: "list", options: ["Perforado", "Repujado", "Cinta antideslizante adicional"] },
      { label: "Reborde frontal (mm)", key: "reborde", kind: "num" }
    ] },
  { id: "anillos-discos", nombre: "Anillos y discos", icono: "◯",
    formas: ["Disco liso", "Disco perforado centro", "Anillo", "Anillo con multiples perforaciones", "A plano"],
    extras: [
      { label: "Diametro exterior (mm)", key: "diametroExt", kind: "num" },
      { label: "Diametro interior (mm)", key: "diametroInt", kind: "num" },
      { label: "Cantidad de perforaciones adicionales", key: "perforacionesExtra", kind: "list", options: ["0", "1", "2", "3", "4", "Mas de 4", "A plano"] }
    ] },
  { id: "tapas-fondos", nombre: "Tapas y fondos", icono: "⬮",
    formas: ["Circular plana", "Circular con reborde", "Cuadrada-rectangular", "Bombeada (conformado post-corte)", "A plano"],
    extras: [
      { label: "Diametro (mm)", key: "diametro", kind: "num" },
      { label: "Tipo de reborde", key: "reborde", kind: "list", options: ["Sin reborde", "Reborde recto", "Reborde abocardado"] },
      { label: "Altura de bombeo (mm)", key: "alturaBombeo", kind: "num" }
    ] },
  { id: "separadores-shims", nombre: "Separadores / Shims", icono: "▬",
    formas: ["Rectangular", "Circular", "Con ranura en U", "A plano"],
    extras: [
      { label: "Espesor fino adicional", key: "espesorFino", kind: "list", options: ["No aplica", "1 mm", "1.5 mm", "2 mm"] },
      { label: "Ancho de ranura (mm)", key: "anchoRanura", kind: "num" },
      { label: "Diametro interior de ranura (mm)", key: "diametroRanura", kind: "num" }
    ] },
  { id: "escuadras", nombre: "Escuadras y refuerzos", icono: "◣",
    formas: ["En L simetrica", "En L asimetrica", "Con nervio de refuerzo", "A plano"],
    extras: [
      { label: "Longitud de alas (mm)", key: "longitudAlas", kind: "num" },
      { label: "Angulo entre alas", key: "angulo", kind: "list", options: ["90", "A plano"] },
      { label: "Nervio de refuerzo", key: "nervio", kind: "list", options: ["Si", "No"] }
    ] },
  { id: "chapas-desgaste", nombre: "Chapas de desgaste", icono: "▨",
    formas: ["Rectangular", "Con perforado para bulonado", "Con bisel de borde", "A plano"],
    extras: [
      { label: "Tipo de acero", key: "tipoAcero", kind: "list", options: ["Acero comun", "Acero alta resistencia al desgaste (a futuro)"] },
      { label: "Angulo de bisel", key: "bisel", kind: "list", options: ["No aplica", "30", "45", "A plano"] },
      { label: "Patron de bulonado", key: "patronBulonado", kind: "list", options: ["No aplica", "4 agujeros", "6 agujeros", "8 agujeros", "A plano"] }
    ] },
  { id: "placas-anclaje", nombre: "Placas de anclaje", icono: "▮",
    formas: ["Rectangular 2 agujeros", "Rectangular 4 agujeros", "Forma T embutida en hormigon", "A plano"],
    extras: [
      { label: "Diametro de perno", key: "diametroPerno", kind: "list", options: ["Ø12", "Ø16", "Ø20", "Ø25", "A plano"] },
      { label: "Profundidad de embutido (mm)", key: "profundidad", kind: "num" },
      { label: "Distancia entre agujeros (mm)", key: "distanciaAgujeros", kind: "num" }
    ] },
  { id: "señaletica", nombre: "Señaletica industrial", icono: "⚠",
    formas: ["Placa rectangular", "Placa circular", "Troquelada pictograma", "A plano"],
    extras: [
      { label: "Tipo de señal", key: "tipoSeñal", kind: "list", options: ["Peligro", "Prohibicion", "Obligacion", "Advertencia",
        "Identificacion de tanque/equipo", "Numeracion de bloque naval", "Via de evacuacion", "Cartel personalizado"] },
      { label: "Tipo de marcado", key: "marcado", kind: "list", options: ["Grabado laser", "Corte calado"] },
      { label: "Tamaño de placa", key: "tamaño", kind: "list", options: ["Pequeña 10x10cm", "Mediana 20x20cm", "Grande 30x40cm", "A medida"] },
      { label: "Color de fondo", key: "color", kind: "list", options: ["Amarillo", "Rojo", "Verde", "Azul", "Blanco", "A pedido"] }
    ] },
  { id: "repuestos", nombre: "Repuestos a medida", icono: "⚙",
    formas: ["A plano del cliente", "A partir de pieza fisica relevada"],
    extras: [
      { label: "Metodo de relevamiento", key: "metodo", kind: "list", options: ["Plano DXF/DWG", "Escaneo 3D", "Plantilla fisica", "Pieza de muestra enviada"] },
      { label: "Urgencia", key: "urgencia", kind: "list", options: ["Normal", "Urgente 24-48hs"] }
    ] },
  { id: "arandelas-bujes", nombre: "Arandelas y bujes", icono: "◌",
    formas: ["Arandela plana", "Arandela con muesca", "Buje plano", "A plano"],
    extras: [
      { label: "Diametro exterior (mm)", key: "diametroExt", kind: "num" },
      { label: "Diametro interior (mm)", key: "diametroInt", kind: "num" }
    ] },
  { id: "splice-plates", nombre: "Splice plates", icono: "▥",
    formas: ["Para perfil IPN", "Para perfil UPN", "Para perfil H", "A plano"],
    extras: [
      { label: "Cantidad de agujeros segun calculo", key: "cantidadCalculo", kind: "list", options: ["2", "4", "6", "8", "A plano"] },
      { label: "Distancia entre agujeros (mm)", key: "distanciaAgujeros", kind: "num" }
    ] },
  { id: "plantillas-galibos", nombre: "Plantillas / Galibos", icono: "▱",
    formas: ["A plano del cliente", "Replica de pieza"],
    extras: [
      { label: "Material de plantilla", key: "material", kind: "list", options: ["Chapa fina 2mm", "Chapa fina 3mm", "Chapa espesor normal"] },
      { label: "Cantidad de replicas", key: "replicas", kind: "num" }
    ] },
  { id: "piezas-a-plano", nombre: "Piezas a plano (DXF)", icono: "✎",
    formas: ["A plano DXF/DWG del cliente"],
    extras: [
      { label: "Formato de archivo", key: "formato", kind: "list", options: ["DXF", "DWG", "PDF con medidas", "Croquis a mano"] },
      { label: "Cantidad de piezas distintas en el plano", key: "cantidadPiezas", kind: "num" }
    ] }
];

function getCategoria(id) {
  return CATEGORIAS.find(c => c.id === id);
}

module.exports = { CATEGORIAS, ESPESORES, AGUJEROS, DIAMETROS, MATERIALES, TERMINACIONES, getCategoria };
