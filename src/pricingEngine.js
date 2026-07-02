// Motor de cotizacion. Misma logica que la hoja "Cotizador" del Excel:
// Peso -> Costo material -> Costo corte -> Costo piercing -> Mano de obra -> Terminacion
// -> Overhead -> Margen -> IVA -> Precio final.

const AGUJEROS_NUM = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5 a 8": 6.5, "Mas de 8": 10, "A plano": 0
};

function espesorNumero(espesorLabel) {
  // "10 mm" -> 10
  const n = parseFloat(String(espesorLabel).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * @param {object} params - parametros globales (ver src/store.js -> getPricingParams)
 * @param {object} sel - seleccion: { espesor, ancho, largo, agujeros, terminacion }
 * @returns {object} desglose completo + precioFinal
 */
function calcularPrecio(params, sel) {
  const ancho = Number(sel.ancho);
  const largo = Number(sel.largo);
  const espesorLabel = sel.espesor;
  const agujerosLabel = sel.agujeros || "0";
  const terminacionLabel = sel.terminacion || "Sin proteccion";

  if (!ancho || !largo || !espesorLabel) {
    return { error: "Faltan datos obligatorios: ancho, largo y espesor." };
  }

  const espesorMM = espesorNumero(espesorLabel);
  const velocidad = params.velocidadPorEspesor[espesorLabel];
  if (!velocidad) {
    return { error: `No hay velocidad de corte configurada para el espesor ${espesorLabel}.` };
  }

  const peso = (ancho / 1000) * (largo / 1000) * (espesorMM / 1000) * params.densidad; // kg
  const perimetro = 2 * (ancho + largo); // mm, aproximacion rectangular
  const tiempoCorte = perimetro / velocidad; // min
  const agujerosNum = (agujerosLabel in AGUJEROS_NUM) ? AGUJEROS_NUM[agujerosLabel] : 0;
  const terminacionCostoKg = params.terminacionCostoKg[terminacionLabel] || 0;

  const costoMaterial = peso * (1 + params.desperdicio) * params.precioKg;
  const costoCorte = tiempoCorte * params.costoMinMaquina + (perimetro / 1000) * params.costoConsumiblesM;
  const costoPiercing = agujerosNum * params.tiempoPiercing * params.costoMinMaquina;
  const costoManoObra = params.tiempoSetup * params.costoMinMO;
  const costoTerminacion = terminacionCostoKg * peso;

  const subtotalDirecto = costoMaterial + costoCorte + costoPiercing + costoManoObra + costoTerminacion;
  const conOverhead = subtotalDirecto * (1 + params.overhead);
  const conMargen = conOverhead * (1 + params.margen);
  const precioFinal = conMargen * (1 + params.iva);

  return {
    peso: round2(peso),
    perimetroEstimado: round2(perimetro),
    tiempoCorteMin: round2(tiempoCorte),
    costoMaterial: round2(costoMaterial),
    costoCorte: round2(costoCorte),
    costoPiercing: round2(costoPiercing),
    costoManoObra: round2(costoManoObra),
    costoTerminacion: round2(costoTerminacion),
    subtotalDirecto: round2(subtotalDirecto),
    conOverhead: round2(conOverhead),
    conMargen: round2(conMargen),
    precioFinal: round2(precioFinal)
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calcularPrecio, espesorNumero, AGUJEROS_NUM };
