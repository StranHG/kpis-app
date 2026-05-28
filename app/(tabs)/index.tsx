import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Brand } from '@/constants/theme';

const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
export const API = `http://${host}:3000`;

const fetchJSON = (url: string) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(url, { signal: ctrl.signal }).then(r => r.json()).finally(() => clearTimeout(timer));
};

function Tendencia({ variacion, invertida = false }: { variacion: number; invertida?: boolean }) {
  if (variacion === 0) return null;
  const esBueno = invertida ? variacion < 0 : variacion > 0;
  const flecha = variacion > 0 ? '▲' : '▼';
  const color = esBueno ? Brand.green : Brand.red;
  return (
    <Text style={[styles.tendencia, { color }]}>
      {flecha} {Math.abs(variacion)}% vs mes anterior
    </Text>
  );
}

export default function HomeScreen() {
  const [kpis, setKpis] = useState<any>(null);
  const [tendencia, setTendencia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetchJSON(`${API}/kpi/total-pedidos`),
      fetchJSON(`${API}/kpi/ingresos`),
      fetchJSON(`${API}/kpi/tiempo-entrega`),
      fetchJSON(`${API}/kpi/cancelaciones`),
      fetchJSON(`${API}/kpi/top-restaurantes`),
      fetchJSON(`${API}/kpi/tendencia`),
    ]).then(([pedidos, ingresos, tiempo, cancel, top, tend]) => {
      setKpis({ pedidos, ingresos, tiempo, cancel, top });
      setTendencia(tend);
      setLoading(false);
    }).catch(() => {
      setError(`Sin conexión con la API.\n${API}`);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Brand.accent} />
      <Text style={styles.loadingText}>Cargando KPIs...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={cargar}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const { pedidos, ingresos, tiempo, cancel, top } = kpis;
  const maxPedidos = Math.max(...top.map((r: any) => Number(r.total_pedidos)));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DiDi Food</Text>
      <Text style={styles.subtitle}>Panel gerencial · toca un KPI para ver detalle</Text>

      {/* Pedidos */}
      <TouchableOpacity style={styles.row} onPress={() => router.push('/kpi/pedidos')} activeOpacity={0.75}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Total pedidos</Text>
          <Text style={styles.value}>{Number(pedidos.total).toLocaleString()}</Text>
          <Tendencia variacion={tendencia?.pedidos?.variacion} />
        </View>
        {/* Tiempo */}
        <TouchableOpacity style={[styles.card, styles.halfCard]} onPress={() => router.push('/kpi/tiempo')} activeOpacity={0.75}>
          <Text style={styles.label}>Tiempo entrega</Text>
          <Text style={styles.value}>{tiempo.promedio} min</Text>
          <Tendencia variacion={tendencia?.tiempo?.variacion} invertida />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Ingresos */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/kpi/ingresos')} activeOpacity={0.75}>
        <Text style={styles.label}>Ingresos totales</Text>
        <Text style={styles.valueLarge}>${Number(ingresos.ingresos).toLocaleString()}</Text>
        <Tendencia variacion={tendencia?.ingresos?.variacion} />
      </TouchableOpacity>

      {/* Cancelaciones */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/kpi/cancelaciones')} activeOpacity={0.75}>
        <Text style={styles.label}>Tasa de cancelación</Text>
        <View style={styles.row}>
          <View style={styles.pieSlice}>
            <View style={[styles.dot, { backgroundColor: Brand.green }]} />
            <Text style={styles.pieLabel}>Completados</Text>
            <Text style={styles.pieValue}>{(100 - Number(cancel.porcentaje)).toFixed(1)}%</Text>
          </View>
          <View style={styles.pieSlice}>
            <View style={[styles.dot, { backgroundColor: Brand.red }]} />
            <Text style={styles.pieLabel}>Cancelados</Text>
            <Text style={styles.pieValue}>{cancel.porcentaje}%</Text>
          </View>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${100 - Number(cancel.porcentaje)}%`, backgroundColor: Brand.green }]} />
          <View style={[styles.barFill, { width: `${cancel.porcentaje}%`, backgroundColor: Brand.red }]} />
        </View>
        <Tendencia variacion={tendencia?.cancelaciones?.variacion} invertida />
      </TouchableOpacity>

      {/* Top restaurantes */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/kpi/restaurantes')} activeOpacity={0.75}>
        <Text style={styles.label}>Top 5 restaurantes</Text>
        {top.map((r: any, i: number) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{r.nombre.substring(0, 12)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFillRest, { width: `${(Number(r.total_pedidos) / maxPedidos) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{Number(r.total_pedidos).toLocaleString()}</Text>
          </View>
        ))}
      </TouchableOpacity>

      <Text style={styles.hint}>Toca cualquier tarjeta para ver gráfica y PDF del KPI</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg, padding: 20 },
  center: { flex: 1, backgroundColor: Brand.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { color: Brand.subtext, marginTop: 12 },
  errorText: { color: Brand.red, fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  retryBtn: { backgroundColor: Brand.accent, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: Brand.accent, marginTop: 60 },
  subtitle: { fontSize: 12, color: Brand.subtext, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  card: { backgroundColor: Brand.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  halfCard: { flex: 1 },
  label: { fontSize: 12, color: Brand.subtext, marginBottom: 8, textTransform: 'uppercase' },
  value: { fontSize: 24, fontWeight: 'bold', color: Brand.text },
  valueLarge: { fontSize: 32, fontWeight: 'bold', color: Brand.accent },
  tendencia: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  barContainer: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  barFill: { height: 12 },
  pieSlice: { flex: 1, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  pieLabel: { fontSize: 11, color: Brand.subtext },
  pieValue: { fontSize: 18, fontWeight: 'bold', color: Brand.text },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 80, fontSize: 11, color: Brand.subtext },
  barTrack: { flex: 1, height: 8, backgroundColor: Brand.border, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  barFillRest: { height: 8, backgroundColor: Brand.accent, borderRadius: 4 },
  barValue: { width: 50, fontSize: 11, color: Brand.subtext, textAlign: 'right' },
  hint: { fontSize: 11, color: Brand.subtext, textAlign: 'center', marginBottom: 32 },
});
