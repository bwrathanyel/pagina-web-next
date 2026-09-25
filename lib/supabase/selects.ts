// Una fila de `tarifas` es UNA promoción del PDF, con sus precios etiquetados y
// las condiciones del plan colgando (`tarifario_bloques`, el recuadro azul).
// Los campos estructurados vienen NULL hasta que corra la carga maestra: la
// carpeta cae sola a `precio_texto`/`vigencia_texto`.
export const TARIFA_SELECT =
  "id,precio_texto,precio_desde_usd,vigencia_texto,vigente,moneda," +
  "titulo,plan,habitacion,precios,venta_desde,venta_hasta,disfrute_desde," +
  "fecha_fin,fecha_venta_fin,minimo_noches,condiciones,ventanas,orden_pdf,origen,resumen_ia," +
  "tarifario_bloques(id,plan,base_precio,incluye,check_in,check_out,ocupacion,ninos,suplementos,minimo_noches,impuestos,otras)";
