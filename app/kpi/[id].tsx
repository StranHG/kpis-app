import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { Brand } from '@/constants/theme';

const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API = `http://${host}:3000`;

const fetchJSON = (url: string) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(url, { signal: ctrl.signal }).then(r => r.json()).finally(() => clearTimeout(timer));
};

// ── Configuración por KPI ─────────────────────────────────────────────────────

const KPI_META: Record<string, { titulo: string; icono: string; descripcion: string; endpoints: string[] }> = {
  pedidos: {
    titulo: 'Total de pedidos',
    icono: '📦',
    descripcion: 'Mide el volumen de demanda mensual. El crecimiento sostenido indica que la plataforma gana usuarios y restaurantes activos.',
    endpoints: ['/kpi/total-pedidos', '/kpi/pedidos-por-mes', '/kpi/tendencia'],
  },
  ingresos: {
    titulo: 'Ingresos totales',
    icono: '💰',
    descripcion: 'Suma del valor de todos los pedidos por mes. Refleja la salud financiera de la operación y el ticket promedio.',
    endpoints: ['/kpi/ingresos', '/kpi/ingresos-por-mes', '/kpi/tendencia'],
  },
  tiempo: {
    titulo: 'Tiempo de entrega',
    icono: '⏱',
    descripcion: 'Promedio de minutos desde que el cliente ordena hasta que recibe su pedido. Menos tiempo = mejor experiencia y menos cancelaciones.',
    endpoints: ['/kpi/tiempo-entrega', '/kpi/tiempo-por-mes', '/kpi/tendencia'],
  },
  cancelaciones: {
    titulo: 'Tasa de cancelación',
    icono: '❌',
    descripcion: 'Porcentaje de pedidos que no se completaron. Cada cancelación es ingreso perdido y una mala experiencia para el cliente.',
    endpoints: ['/kpi/cancelaciones', '/kpi/cancelaciones-por-mes', '/kpi/tendencia'],
  },
  restaurantes: {
    titulo: 'Top 5 restaurantes',
    icono: '🍽',
    descripcion: 'Los restaurantes con mayor volumen de pedidos. Identifica socios clave y posibles concentraciones de riesgo operativo.',
    endpoints: ['/kpi/top-restaurantes', '/kpi/pedidos-por-mes', '/kpi/tendencia'],
  },
};

// ── Análisis inteligente ──────────────────────────────────────────────────────

type Analisis = {
  estado: string;
  color: string;
  resumen: string;
  detalle: string;
  acciones: { titulo: string; items: string[] };
  esBueno: boolean;
};

function analizar(id: string, datos: any[], tend: any): Analisis {
  const v = (key: string) => Number(tend?.[key]?.variacion ?? 0);
  const a = (key: string) => Number(tend?.[key]?.actual ?? 0);
  const ant = (key: string) => Number(tend?.[key]?.anterior ?? 0);

  if (id === 'pedidos') {
    const variacion = v('pedidos');
    const actual = a('pedidos');
    const anterior = ant('pedidos');
    const total = Number(datos[0]?.total ?? 0);
    if (variacion <= -15) return {
      estado: 'CRÍTICO', color: '#dc2626', esBueno: false,
      resumen: `Caída severa de ${Math.abs(variacion)}% en pedidos este mes (${actual.toLocaleString()} vs ${anterior.toLocaleString()} el mes anterior).`,
      detalle: `La plataforma perdió ${(anterior - actual).toLocaleString()} pedidos en un solo mes. Esto representa una señal de alerta máxima que requiere acción inmediata para recuperar demanda.`,
      acciones: { titulo: '🚨 Plan de acción urgente', items: [
        'Lanzar campaña de descuentos del 20-30% por tiempo limitado para reactivar usuarios inactivos.',
        'Revisar si la caída coincide con problemas técnicos, precios altos o entrada de un competidor.',
        'Activar notificaciones push a usuarios que no han ordenado en los últimos 15 días.',
        'Analizar si alguna zona geográfica concentra la caída y reforzar la oferta de restaurantes ahí.',
        'Reunión urgente con los 5 restaurantes con más caída individual de pedidos.',
      ]},
    };
    if (variacion <= -5) return {
      estado: 'ALERTA', color: '#f59e0b', esBueno: false,
      resumen: `Baja de ${Math.abs(variacion)}% en pedidos este mes (${actual.toLocaleString()} vs ${anterior.toLocaleString()}).`,
      detalle: `La demanda muestra una tendencia descendente. Si no se actúa, la caída podría acelerarse el próximo mes. El acumulado total es ${total.toLocaleString()} pedidos.`,
      acciones: { titulo: '⚠️ Medidas correctivas', items: [
        'Implementar promoción "2x1" o envío gratis en pedidos mínimos para estimular la demanda.',
        'Revisar la experiencia de usuario en la app — abandono en checkout puede ser la causa.',
        'Identificar los horarios de menor demanda y aplicar descuentos dinámicos en esos rangos.',
        'Contactar a restaurantes con caída de pedidos para entender si hay problemas de stock o calidad.',
      ]},
    };
    if (variacion >= 15) return {
      estado: 'EXCELENTE', color: '#16a34a', esBueno: true,
      resumen: `Crecimiento sobresaliente de ${variacion}% en pedidos (${actual.toLocaleString()} vs ${anterior.toLocaleString()} el mes anterior).`,
      detalle: `La plataforma supera las expectativas. El acumulado total es ${total.toLocaleString()} pedidos. Este ritmo de crecimiento indica fuerte adopción y retención de usuarios.`,
      acciones: { titulo: '🏆 Recompensas para repartidores', items: [
        'Bono mensual de $800 para los 3 repartidores con mayor número de entregas completadas.',
        'Certificado digital "Repartidor Estrella del Mes" con reconocimiento público en la app.',
        'Acceso prioritario a pedidos de alto valor para los 10 repartidores con mejor desempeño.',
        'Insignia especial en el perfil de repartidores con más de 300 entregas en el mes.',
        'Descuentos exclusivos en gasolina/mantenimiento para los repartidores más activos.',
      ]},
    };
    if (variacion >= 5) return {
      estado: 'POSITIVO', color: '#16a34a', esBueno: true,
      resumen: `Crecimiento sólido de ${variacion}% en pedidos (${actual.toLocaleString()} vs ${anterior.toLocaleString()}).`,
      detalle: `La demanda crece de forma consistente. Acumulado total: ${total.toLocaleString()} pedidos. El negocio está en buena dirección.`,
      acciones: { titulo: '🎉 Reconocimiento al equipo', items: [
        'Bono de $400 para los 5 repartidores con más entregas completadas sin incidencias.',
        'Anuncio interno reconociendo el crecimiento y el trabajo del equipo de reparto.',
        'Sistema de puntos canjeables por beneficios para repartidores que mantengan la tendencia.',
      ]},
    };
    return {
      estado: 'ESTABLE', color: Brand.blue, esBueno: true,
      resumen: `Pedidos estables este mes (${actual.toLocaleString()} vs ${anterior.toLocaleString()}, variación ${variacion}%).`,
      detalle: `El volumen se mantiene consistente. Acumulado total: ${total.toLocaleString()} pedidos. Buena base para trabajar en optimización.`,
      acciones: { titulo: '💡 Oportunidades de mejora', items: [
        'Explorar nuevas zonas de cobertura para incrementar la base de clientes.',
        'Analizar restaurantes sin presencia en la plataforma que podrían sumarse.',
        'Implementar programa de referidos para atraer nuevos usuarios orgánicamente.',
      ]},
    };
  }

  if (id === 'ingresos') {
    const variacion = v('ingresos');
    const actual = a('ingresos');
    const anterior = ant('ingresos');
    const totalAcum = Number(datos[0]?.ingresos ?? 0);
    const ticketProm = datos[1]?.length ? (actual / (tend?.pedidos?.actual ?? 1)).toFixed(0) : '-';
    if (variacion <= -15) return {
      estado: 'CRÍTICO', color: '#dc2626', esBueno: false,
      resumen: `Caída crítica de ingresos del ${Math.abs(variacion)}% ($${actual.toLocaleString()} vs $${anterior.toLocaleString()}).`,
      detalle: `Se dejaron de percibir $${(anterior - actual).toLocaleString()} en un mes. Esta caída supera el umbral de riesgo financiero y requiere intervención inmediata. Ticket promedio estimado: $${ticketProm}.`,
      acciones: { titulo: '🚨 Plan de recuperación financiera', items: [
        'Auditar las comisiones de restaurantes — revisar si alguno redujo precios sin aviso.',
        'Activar campañas de "pedido mínimo" para elevar el ticket promedio por orden.',
        'Reducir descuentos que estén impactando el margen sin generar volumen adicional.',
        'Analizar si la caída de ingresos va ligada a caída de pedidos o a reducción del ticket.',
        'Negociar con restaurantes top un programa de menús premium para incrementar el valor promedio.',
      ]},
    };
    if (variacion <= -5) return {
      estado: 'ALERTA', color: '#f59e0b', esBueno: false,
      resumen: `Ingresos a la baja: ${Math.abs(variacion)}% menos que el mes anterior ($${actual.toLocaleString()} vs $${anterior.toLocaleString()}).`,
      detalle: `La reducción de ingresos puede deberse a menos pedidos, tickets más bajos o más descuentos aplicados. Ticket promedio estimado: $${ticketProm}.`,
      acciones: { titulo: '⚠️ Acciones para recuperar ingresos', items: [
        'Revisar la efectividad de cupones y descuentos activos — evaluar si generan valor neto positivo.',
        'Promover restaurantes de alto ticket en las posiciones destacadas de la app.',
        'Implementar sugerencias de complementos (postres, bebidas) al momento del checkout.',
        'Analizar si algún restaurante clave bajó precios o redujo su menú.',
      ]},
    };
    if (variacion >= 15) return {
      estado: 'EXCELENTE', color: '#16a34a', esBueno: true,
      resumen: `Ingresos excepcionales: +${variacion}% respecto al mes anterior ($${actual.toLocaleString()} vs $${anterior.toLocaleString()}).`,
      detalle: `Ingreso acumulado total: $${totalAcum.toLocaleString()}. El negocio genera valor sólido. Ticket promedio estimado: $${ticketProm}.`,
      acciones: { titulo: '🏆 Recompensas para repartidores', items: [
        'Bono de productividad: $600 para los 5 repartidores que más ingresos generaron (pedidos de alto valor).',
        'Programa "Repartidor Premium": los mejores ganan acceso exclusivo a pedidos con mayor propina estimada.',
        'Reconocimiento mensual con placa digital y beneficio de seguro de accidentes ampliado.',
        'Incremento del 5% en su porcentaje de comisión por el siguiente mes como incentivo.',
      ]},
    };
    if (variacion >= 5) return {
      estado: 'POSITIVO', color: '#16a34a', esBueno: true,
      resumen: `Ingresos en crecimiento: +${variacion}% ($${actual.toLocaleString()} vs $${anterior.toLocaleString()}).`,
      detalle: `Tendencia positiva. Acumulado: $${totalAcum.toLocaleString()}. Ticket promedio estimado: $${ticketProm}.`,
      acciones: { titulo: '🎉 Incentivos al equipo de reparto', items: [
        'Bono de $300 para los 3 repartidores con mayor volumen de pedidos de alto valor en el mes.',
        'Comunicación interna destacando la contribución del equipo al crecimiento de ingresos.',
        'Acceso a capacitación de atención al cliente para elevar calificaciones y con ello el ticket promedio.',
      ]},
    };
    return {
      estado: 'ESTABLE', color: Brand.blue, esBueno: true,
      resumen: `Ingresos estables ($${actual.toLocaleString()} vs $${anterior.toLocaleString()}, ${variacion}% de variación).`,
      detalle: `Los ingresos se mantienen consistentes. Acumulado: $${totalAcum.toLocaleString()}.`,
      acciones: { titulo: '💡 Estrategias de crecimiento', items: [
        'Explorar alianzas con restaurantes premium para elevar el ticket promedio.',
        'Analizar las horas pico y reforzar la disponibilidad de repartidores en esos momentos.',
      ]},
    };
  }

  if (id === 'tiempo') {
    const variacion = v('tiempo');
    const actual = a('tiempo');
    const anterior = ant('tiempo');
    if (variacion >= 10) return {
      estado: 'CRÍTICO', color: '#dc2626', esBueno: false,
      resumen: `Tiempo de entrega deteriorado gravemente: +${variacion}% (${actual} min vs ${anterior} min el mes anterior).`,
      detalle: `Cada pedido tarda ${(actual - anterior).toFixed(1)} minutos más que el mes anterior. Tiempos superiores a 50 min aumentan cancelaciones y reducen calificaciones. Esto impacta directamente la retención de clientes.`,
      acciones: { titulo: '🚨 Plan de optimización operativa', items: [
        'Mapa de calor: identificar zonas donde el tiempo de entrega supera los 55 min y asignar más repartidores.',
        'Revisar los restaurantes con mayor tiempo de preparación — establecer tiempo máximo de aceptación.',
        'Optimizar el algoritmo de asignación para que el repartidor más cercano tome el pedido primero.',
        'Analizar si hay cuellos de botella en ciertas horas del día (hora pico sin suficientes repartidores).',
        'Implementar alerta automática si un pedido supera 45 min sin ser entregado.',
      ]},
    };
    if (variacion >= 5) return {
      estado: 'ALERTA', color: '#f59e0b', esBueno: false,
      resumen: `Tiempo de entrega aumentando: +${variacion}% (${actual} min vs ${anterior} min).`,
      detalle: `La tendencia al alza en tiempo de entrega puede derivar en más cancelaciones y peores reseñas si no se controla a tiempo.`,
      acciones: { titulo: '⚠️ Acciones para reducir tiempos', items: [
        'Identificar los restaurantes más lentos en preparación y alertarlos sobre los tiempos objetivo.',
        'Revisar si hay zonas con escasez de repartidores disponibles en horas pico.',
        'Implementar mensajes proactivos al cliente si el pedido se retrasa más de 10 min del estimado.',
        'Revisar las rutas sugeridas al repartidor — actualizar mapas de tráfico en tiempo real.',
      ]},
    };
    if (variacion <= -10) return {
      estado: 'EXCELENTE', color: '#16a34a', esBueno: true,
      resumen: `Tiempo de entrega mejorado notablemente: ${Math.abs(variacion)}% más rápido (${actual} min vs ${anterior} min).`,
      detalle: `Una reducción de ${(anterior - actual).toFixed(1)} minutos por pedido es un logro operativo significativo. Esto se traduce directamente en más satisfacción del cliente y menos cancelaciones.`,
      acciones: { titulo: '🏆 Reconocimiento a repartidores veloces', items: [
        'Premio "Entrega Exprés": bono de $500 para los 5 repartidores con menor tiempo promedio en el mes.',
        'Distintivo especial "⚡ Repartidor Rápido" visible en su perfil de la app para atraer más pedidos.',
        'Certificado de excelencia operativa con reconocimiento público en redes sociales de la empresa.',
        'Preferencia en asignación de pedidos de larga distancia (mayor ingreso) como beneficio adicional.',
      ]},
    };
    if (variacion <= -5) return {
      estado: 'POSITIVO', color: '#16a34a', esBueno: true,
      resumen: `Tiempo de entrega mejorado: ${Math.abs(variacion)}% más rápido (${actual} min vs ${anterior} min).`,
      detalle: `El equipo logró reducir el tiempo promedio de entrega, lo cual impacta positivamente la satisfacción del cliente.`,
      acciones: { titulo: '🎉 Incentivos por velocidad', items: [
        'Bono de $250 para los 10 repartidores con menor tiempo promedio de entrega en el mes.',
        'Comunicado interno destacando la mejora operativa y el impacto en satisfacción del cliente.',
        'Mantener el ritmo: compartir mejores prácticas de rutas entre el equipo.',
      ]},
    };
    return {
      estado: 'ESTABLE', color: Brand.blue, esBueno: true,
      resumen: `Tiempo de entrega estable en ${actual} min promedio (variación ${variacion}%).`,
      detalle: `El tiempo se mantiene dentro de rangos aceptables. La meta recomendada para delivery urbano es ≤ 40 min.`,
      acciones: { titulo: '💡 Oportunidades de mejora', items: [
        'Establecer meta mensual de reducir el tiempo promedio 2 min cada mes.',
        'Revisar los restaurantes con mayor tiempo de preparación como primer punto de optimización.',
      ]},
    };
  }

  if (id === 'cancelaciones') {
    const variacion = v('cancelaciones');
    const actual = a('cancelaciones');
    const anterior = ant('cancelaciones');
    const totalCancel = Number(datos[0]?.cancelados ?? 0);
    if (variacion >= 20 || actual >= 20) return {
      estado: 'CRÍTICO', color: '#dc2626', esBueno: false,
      resumen: `Tasa de cancelación crítica: ${actual}% este mes (vs ${anterior}% el mes anterior, +${variacion}% de variación).`,
      detalle: `Con ${totalCancel.toLocaleString()} pedidos cancelados, la empresa pierde ingresos directos y daña la reputación. Una tasa sobre 15% es una señal de problemas estructurales en el servicio.`,
      acciones: { titulo: '🚨 Plan de reducción de cancelaciones', items: [
        'Investigar las razones principales de cancelación: tiempo de espera, restaurante cerrado, o problema con repartidor.',
        'Implementar encuesta rápida al cancelar para clasificar la causa y actuar por categoría.',
        'Alertar automáticamente al cliente si el tiempo estimado supera 50 min antes de que cancele.',
        'Suspender temporalmente restaurantes con tasa de cancelación interna superior al 20%.',
        'Capacitación urgente a repartidores con más de 5 cancelaciones en el mes.',
      ]},
    };
    if (variacion >= 10) return {
      estado: 'ALERTA', color: '#f59e0b', esBueno: false,
      resumen: `Cancelaciones en aumento: +${variacion}% (${actual}% vs ${anterior}% el mes anterior).`,
      detalle: `La tendencia al alza en cancelaciones debe atenderse antes de que se vuelva un problema mayor. ${totalCancel.toLocaleString()} pedidos cancelados este mes.`,
      acciones: { titulo: '⚠️ Acciones preventivas', items: [
        'Revisar los pedidos cancelados de las últimas 2 semanas e identificar patrones (hora, zona, restaurante).',
        'Comunicar a restaurantes el impacto de los tiempos de preparación largos en las cancelaciones.',
        'Mejorar la estimación de tiempo de entrega para que el cliente tenga expectativas realistas.',
        'Hacer seguimiento a repartidores con más de 3 cancelaciones en el mes.',
      ]},
    };
    if (variacion <= -20 || actual <= 8) return {
      estado: 'EXCELENTE', color: '#16a34a', esBueno: true,
      resumen: `Tasa de cancelación excelente: ${actual}% (vs ${anterior}% el mes anterior, mejora de ${Math.abs(variacion)}%).`,
      detalle: `Una tasa por debajo del 10% es un indicador de servicio de clase mundial. El equipo de repartidores está entregando una experiencia excepcional al cliente.`,
      acciones: { titulo: '🏆 Reconocimiento por excelencia en servicio', items: [
        '"Premio Cero Cancelaciones": bono de $600 para cada repartidor que logre 0 cancelaciones en el mes.',
        'Publicar en redes sociales de la empresa el logro del equipo con foto grupal de los ganadores.',
        'Acceso a un fondo de emergencias de salud exclusivo para repartidores con 3 meses consecutivos de baja cancelación.',
        'Incremento del 3% en comisión base para los repartidores con tasa de cancelación menor al 2%.',
        'Reconocimiento en la app como "Repartidor Confiable" con badge especial visible para los clientes.',
      ]},
    };
    if (variacion <= -10) return {
      estado: 'POSITIVO', color: '#16a34a', esBueno: true,
      resumen: `Cancelaciones reduciéndose: ${Math.abs(variacion)}% de mejora (${actual}% vs ${anterior}% el mes anterior).`,
      detalle: `La tendencia es positiva. Mantener este ritmo llevaría a la empresa a una tasa de cancelación óptima en los próximos meses.`,
      acciones: { titulo: '🎉 Incentivos por buen servicio', items: [
        'Bono de $300 para los repartidores con 0 o 1 cancelación en el mes.',
        'Ranking público interno de "Repartidores más confiables" para generar competencia sana.',
        'Comunicado felicitando al equipo por la mejora en calidad del servicio.',
      ]},
    };
    return {
      estado: 'ESTABLE', color: Brand.blue, esBueno: actual < 12,
      resumen: `Tasa de cancelación en ${actual}% (variación ${variacion}% vs mes anterior).`,
      detalle: `La tasa se mantiene. La meta recomendada para plataformas de delivery es estar por debajo del 10%.`,
      acciones: { titulo: '💡 Estrategias para reducir cancelaciones', items: [
        'Meta: reducir la tasa un punto porcentual cada mes hasta llegar al 10%.',
        'Identificar el restaurante con mayor tasa de cancelación y trabajar un plan de mejora con ellos.',
        'Revisar si el tiempo de entrega promedio tiene correlación con los picos de cancelación.',
      ]},
    };
  }

  if (id === 'restaurantes') {
    const top = datos[0] ?? [];
    const primero = top[0];
    const total = top.reduce((s: number, r: any) => s + Number(r.total_pedidos), 0);
    const pctPrimero = primero ? ((Number(primero.total_pedidos) / total) * 100).toFixed(1) : '0';
    return {
      estado: 'ANÁLISIS', color: Brand.blue, esBueno: true,
      resumen: `${primero?.nombre ?? ''} lidera con ${Number(primero?.total_pedidos ?? 0).toLocaleString()} pedidos (${pctPrimero}% del top 5).`,
      detalle: `El top 5 concentra ${total.toLocaleString()} pedidos. Una concentración muy alta en un solo restaurante representa riesgo operativo si ese socio sale de la plataforma.`,
      acciones: { titulo: '💡 Estrategia de socios', items: [
        `Reconocer públicamente a ${primero?.nombre ?? 'el restaurante líder'} como "Socio Destacado del Mes".`,
        'Si el #1 concentra más del 40% del top 5, desarrollar activamente al #2 y #3 para equilibrar.',
        'Ofrecer a los restaurantes del top 5 un programa de co-marketing para aumentar sus pedidos aún más.',
        'Analizar qué hace diferente al restaurante líder y replicar esas prácticas con otros socios.',
        'Bono especial para los repartidores asignados principalmente a los restaurantes del top 5 por su volumen de trabajo.',
      ]},
    };
  }

  return { estado: 'N/A', color: Brand.subtext, esBueno: true, resumen: '', detalle: '', acciones: { titulo: '', items: [] } };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function KpiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meta = KPI_META[id];
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    Promise.all(meta.endpoints.map(e => fetchJSON(`${API}${e}`)))
      .then(results => { setDatos(results); setLoading(false); })
      .catch(() => { setError('No se pudo conectar con la API.'); setLoading(false); });
  }, [id]);

  const generarPDF = async () => {
    if (!datos.length) return;
    setGenerando(true);
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const tend = datos[2];
    const info = analizar(id, datos, tend);

    const colorEstado = info.color;
    const accionesHTML = info.acciones.items.map(a => `<li style="margin-bottom:10px;line-height:1.5;">${a}</li>`).join('');

    // Tabla de datos mensuales
    let tablaHTML = '';
    let barrasHTML = '';

    if (id === 'pedidos') {
      const meses = datos[1] ?? [];
      const max = Math.max(...meses.map((m: any) => Number(m.total)));
      tablaHTML = meses.map((m: any) => `<tr><td>${m.mes}</td><td style="text-align:right;color:#FF6B35;font-weight:bold;">${Number(m.total).toLocaleString()}</td></tr>`).join('');
      barrasHTML = meses.map((m: any) => `
        <div style="display:flex;align-items:center;margin-bottom:8px;gap:10px;">
          <div style="width:36px;font-size:11px;color:#64748B;">${m.mes}</div>
          <div style="flex:1;height:16px;background:#0D1B2A;border-radius:8px;overflow:hidden;">
            <div style="width:${(Number(m.total)/max)*100}%;height:100%;background:#FF6B35;border-radius:8px;"></div>
          </div>
          <div style="width:70px;font-size:11px;color:#E2E8F0;text-align:right;">${Number(m.total).toLocaleString()}</div>
        </div>`).join('');
    } else if (id === 'ingresos') {
      const meses = datos[1] ?? [];
      const max = Math.max(...meses.map((m: any) => Number(m.ingresos)));
      tablaHTML = meses.map((m: any) => `<tr><td>${m.mes}</td><td style="text-align:right;color:#FF6B35;font-weight:bold;">$${Number(m.ingresos).toLocaleString()}</td></tr>`).join('');
      barrasHTML = meses.map((m: any) => `
        <div style="display:flex;align-items:center;margin-bottom:8px;gap:10px;">
          <div style="width:36px;font-size:11px;color:#64748B;">${m.mes}</div>
          <div style="flex:1;height:16px;background:#0D1B2A;border-radius:8px;overflow:hidden;">
            <div style="width:${(Number(m.ingresos)/max)*100}%;height:100%;background:#3b82f6;border-radius:8px;"></div>
          </div>
          <div style="width:80px;font-size:11px;color:#E2E8F0;text-align:right;">$${Number(m.ingresos).toLocaleString()}</div>
        </div>`).join('');
    } else if (id === 'tiempo') {
      const meses = datos[1] ?? [];
      const max = Math.max(...meses.map((m: any) => Number(m.promedio)));
      tablaHTML = meses.map((m: any) => `<tr><td>${m.mes}</td><td style="text-align:right;color:#FF6B35;font-weight:bold;">${m.promedio} min</td></tr>`).join('');
      barrasHTML = meses.map((m: any) => `
        <div style="display:flex;align-items:center;margin-bottom:8px;gap:10px;">
          <div style="width:36px;font-size:11px;color:#64748B;">${m.mes}</div>
          <div style="flex:1;height:16px;background:#0D1B2A;border-radius:8px;overflow:hidden;">
            <div style="width:${(Number(m.promedio)/max)*100}%;height:100%;background:#a855f7;border-radius:8px;"></div>
          </div>
          <div style="width:60px;font-size:11px;color:#E2E8F0;text-align:right;">${m.promedio} min</div>
        </div>`).join('');
    } else if (id === 'cancelaciones') {
      const meses = datos[1] ?? [];
      tablaHTML = meses.map((m: any) => `<tr><td>${m.mes}</td><td style="text-align:right;color:#ef4444;font-weight:bold;">${m.porcentaje}%</td><td style="text-align:right;color:#64748B;">${Number(m.cancelados).toLocaleString()} cancel.</td></tr>`).join('');
      barrasHTML = meses.map((m: any) => `
        <div style="display:flex;align-items:center;margin-bottom:8px;gap:10px;">
          <div style="width:36px;font-size:11px;color:#64748B;">${m.mes}</div>
          <div style="flex:1;height:16px;background:#0D1B2A;border-radius:8px;overflow:hidden;">
            <div style="width:${m.porcentaje}%;height:100%;background:#ef4444;border-radius:8px;"></div>
          </div>
          <div style="width:40px;font-size:11px;color:#E2E8F0;text-align:right;">${m.porcentaje}%</div>
        </div>`).join('');
    } else if (id === 'restaurantes') {
      const top = datos[0] ?? [];
      const max = Math.max(...top.map((r: any) => Number(r.total_pedidos)));
      tablaHTML = top.map((r: any, i: number) => `<tr><td>#${i+1}</td><td>${r.nombre}</td><td style="text-align:right;color:#FF6B35;font-weight:bold;">${Number(r.total_pedidos).toLocaleString()}</td></tr>`).join('');
      barrasHTML = top.map((r: any, i: number) => `
        <div style="display:flex;align-items:center;margin-bottom:8px;gap:10px;">
          <div style="width:90px;font-size:11px;color:#64748B;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${r.nombre}</div>
          <div style="flex:1;height:16px;background:#0D1B2A;border-radius:8px;overflow:hidden;">
            <div style="width:${(Number(r.total_pedidos)/max)*100}%;height:100%;background:${i===0?'#FF6B35':'#3b82f6'};border-radius:8px;"></div>
          </div>
          <div style="width:60px;font-size:11px;color:#E2E8F0;text-align:right;">${Number(r.total_pedidos).toLocaleString()}</div>
        </div>`).join('');
    }

    const seccionAcciones = info.esBueno
      ? `<div style="background:#0a2a1a;border-left:4px solid #16a34a;border-radius:0 12px 12px 0;padding:20px 24px;">
           <h3 style="color:#16a34a;margin:0 0 16px;">${info.acciones.titulo}</h3>
           <ul style="padding-left:16px;color:#E2E8F0;">${accionesHTML}</ul>
         </div>`
      : `<div style="background:#2a0a0a;border-left:4px solid #dc2626;border-radius:0 12px 12px 0;padding:20px 24px;">
           <h3 style="color:#dc2626;margin:0 0 16px;">${info.acciones.titulo}</h3>
           <ul style="padding-left:16px;color:#E2E8F0;">${accionesHTML}</ul>
         </div>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; background:#0D1B2A; color:#E2E8F0; padding:40px; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #FF6B35; padding-bottom:20px; margin-bottom:28px; }
      .header h1 { font-size:22px; color:#FF6B35; font-weight:800; }
      .header p { color:#64748B; font-size:12px; margin-top:4px; }
      .badge-conf { background:#FF6B35; color:#fff; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; }
      .estado-badge { display:inline-block; padding:6px 16px; border-radius:20px; font-weight:800; font-size:13px; margin-bottom:12px; }
      .resumen { background:#1B2A3F; border-radius:12px; padding:20px; margin-bottom:20px; }
      .resumen p { color:#94a3b8; font-size:13px; line-height:1.6; margin-top:8px; }
      .section { background:#1B2A3F; border-radius:12px; padding:20px; margin-bottom:20px; }
      .section h3 { color:#E2E8F0; font-size:14px; margin-bottom:16px; }
      table { width:100%; border-collapse:collapse; }
      th { text-align:left; padding:8px; font-size:11px; color:#64748B; text-transform:uppercase; border-bottom:1px solid #0D1B2A; }
      td { padding:8px; border-bottom:1px solid #0D1B2A; font-size:13px; }
      .footer { text-align:center; margin-top:32px; color:#64748B; font-size:11px; border-top:1px solid #1B2A3F; padding-top:20px; }
    </style></head><body>
      <div class="header">
        <div><h1>${meta.icono} DiDi Food — ${meta.titulo}</h1><p>Informe de KPI · ${fecha}</p></div>
        <div class="badge-conf">CONFIDENCIAL</div>
      </div>

      <div class="resumen">
        <div class="estado-badge" style="background:${colorEstado}20;color:${colorEstado};border:1px solid ${colorEstado};">${info.estado}</div>
        <strong style="color:#E2E8F0;font-size:15px;display:block;">${info.resumen}</strong>
        <p>${info.detalle}</p>
      </div>

      <div class="section">
        <h3>Evolución — comparativo mensual</h3>
        ${barrasHTML}
        <table style="margin-top:16px;">
          <tr><th>Mes</th><th style="text-align:right;">Valor</th>${id==='cancelaciones'?'<th style="text-align:right;">Cancelados</th>':''}</tr>
          ${tablaHTML}
        </table>
      </div>

      ${seccionAcciones}

      <div class="footer">Generado el ${fecha} · DiDi Food — Panel Gerencial · Uso interno confidencial</div>
    </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `KPI — ${meta.titulo}` });
    } catch {
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
    setGenerando(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!meta) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>KPI no encontrado</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.btn}>
        <Text style={styles.btnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Brand.accent} />
      <Text style={styles.loadingText}>Cargando {meta.titulo}...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );

  const tend = datos[2];
  const info = analizar(id, datos, tend);

  const renderChart = () => {
    if (id === 'pedidos') {
      const meses = datos[1] ?? [];
      return <BarChart data={meses.map((m: any) => ({ value: Number(m.total), label: m.mes, frontColor: Brand.accent }))}
        width={290} height={180} barWidth={32} spacing={10} roundedTop noOfSections={4}
        yAxisColor={Brand.subtext} xAxisColor={Brand.subtext}
        yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Brand.subtext, fontSize: 9 }}
        hideRules backgroundColor={Brand.card} />;
    }
    if (id === 'ingresos') {
      const meses = datos[1] ?? [];
      return <BarChart data={meses.map((m: any) => ({ value: Number(m.ingresos), label: m.mes, frontColor: Brand.blue }))}
        width={290} height={180} barWidth={32} spacing={10} roundedTop noOfSections={4}
        yAxisColor={Brand.subtext} xAxisColor={Brand.subtext}
        yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Brand.subtext, fontSize: 9 }}
        hideRules backgroundColor={Brand.card} />;
    }
    if (id === 'tiempo') {
      const meses = datos[1] ?? [];
      const lineData = meses.map((m: any) => ({ value: Number(m.promedio), label: m.mes }));
      return <LineChart data={lineData} width={290} height={160} color="#a855f7" thickness={2}
        dataPointsColor="#a855f7" noOfSections={4}
        yAxisColor={Brand.subtext} xAxisColor={Brand.subtext}
        yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Brand.subtext, fontSize: 9 }}
        hideRules backgroundColor={Brand.card} areaChart
        startFillColor="#a855f7" startOpacity={0.2} endOpacity={0} />;
    }
    if (id === 'cancelaciones') {
      const meses = datos[1] ?? [];
      return <BarChart data={meses.map((m: any) => ({ value: Number(m.porcentaje), label: m.mes, frontColor: Brand.red }))}
        width={290} height={180} barWidth={32} spacing={10} roundedTop noOfSections={4}
        yAxisColor={Brand.subtext} xAxisColor={Brand.subtext}
        yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Brand.subtext, fontSize: 9 }}
        hideRules backgroundColor={Brand.card} />;
    }
    if (id === 'restaurantes') {
      const top = datos[0] ?? [];
      return <BarChart
        data={top.map((r: any, i: number) => ({ value: Number(r.total_pedidos), label: r.nombre.substring(0, 7), frontColor: i === 0 ? Brand.accent : Brand.blue }))}
        width={290} height={180} barWidth={32} spacing={10} roundedTop noOfSections={4}
        yAxisColor={Brand.subtext} xAxisColor={Brand.subtext}
        yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: Brand.subtext, fontSize: 9 }}
        hideRules backgroundColor={Brand.card} />;
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{meta.icono}  {meta.titulo}</Text>
      <Text style={styles.descripcion}>{meta.descripcion}</Text>

      {/* Estado */}
      <View style={[styles.estadoCard, { borderLeftColor: info.color }]}>
        <View style={[styles.estadoBadge, { backgroundColor: info.color + '25' }]}>
          <Text style={[styles.estadoText, { color: info.color }]}>{info.estado}</Text>
        </View>
        <Text style={styles.resumenText}>{info.resumen}</Text>
        <Text style={styles.detalleText}>{info.detalle}</Text>
      </View>

      {/* Gráfica */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Comparativo por mes</Text>
        <Text style={styles.cardSub}>Últimos 6 meses</Text>
        {renderChart()}
      </View>

      {/* Acciones */}
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: info.color }]}>
        <Text style={[styles.cardTitle, { color: info.color }]}>{info.acciones.titulo}</Text>
        {info.acciones.items.map((item, i) => (
          <View key={i} style={styles.accionRow}>
            <Text style={[styles.accionNum, { backgroundColor: info.color }]}>{i + 1}</Text>
            <Text style={styles.accionText}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.pdfBtn} onPress={generarPDF} disabled={generando}>
        {generando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.pdfText}>Generar PDF — {meta.titulo}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg, padding: 20 },
  center: { flex: 1, backgroundColor: Brand.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: Brand.subtext, marginTop: 12 },
  errorText: { color: Brand.red, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: Brand.accent, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  backBtn: { marginTop: 60, marginBottom: 8 },
  backText: { color: Brand.accent, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: Brand.text, marginBottom: 8 },
  descripcion: { fontSize: 13, color: Brand.subtext, lineHeight: 20, marginBottom: 20 },
  estadoCard: { backgroundColor: Brand.card, borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  estadoBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 12 },
  estadoText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  resumenText: { fontSize: 15, fontWeight: 'bold', color: Brand.text, marginBottom: 8, lineHeight: 22 },
  detalleText: { fontSize: 13, color: Brand.subtext, lineHeight: 20 },
  card: { backgroundColor: Brand.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: Brand.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Brand.subtext, marginBottom: 16 },
  accionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  accionNum: { width: 22, height: 22, borderRadius: 11, color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center', lineHeight: 22, flexShrink: 0 },
  accionText: { flex: 1, fontSize: 13, color: Brand.text, lineHeight: 20 },
  pdfBtn: { backgroundColor: Brand.accent, borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 40 },
  pdfText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
