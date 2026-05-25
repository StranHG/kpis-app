import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Dimensions } from 'react-native';

const API = 'http://192.168.0.9:3000';
const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const [pedidos, setPedidos] = useState(null);
  const [ingresos, setIngresos] = useState(null);
  const [tiempo, setTiempo] = useState(null);
  const [cancelaciones, setCancelaciones] = useState(null);
  const [topRestaurantes, setTopRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/kpi/total-pedidos`).then(r => r.json()),
      fetch(`${API}/kpi/ingresos`).then(r => r.json()),
      fetch(`${API}/kpi/tiempo-entrega`).then(r => r.json()),
      fetch(`${API}/kpi/cancelaciones`).then(r => r.json()),
      fetch(`${API}/kpi/top-restaurantes`).then(r => r.json()),
    ]).then(([p, i, t, c, r]) => {
      setPedidos(p.total);
      setIngresos(i.ingresos);
      setTiempo(t.promedio);
      setCancelaciones(c);
      setTopRestaurantes(r);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.loadingText}>Cargando KPIs...</Text>
    </View>
  );

  const maxPedidos = Math.max(...topRestaurantes.map(r => Number(r.total_pedidos)));

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DiDi Food</Text>
      <Text style={styles.subtitle}>Panel gerencial</Text>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Total pedidos</Text>
          <Text style={styles.value}>{Number(pedidos).toLocaleString()}</Text>
        </View>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.label}>Tiempo entrega</Text>
          <Text style={styles.value}>{tiempo} min</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ingresos totales</Text>
        <Text style={styles.valueLarge}>${Number(ingresos).toLocaleString()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tasa de cancelación</Text>
        <View style={styles.row}>
          <View style={styles.pieSlice}>
            <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.pieLabel}>Completados</Text>
            <Text style={styles.pieValue}>{(100 - Number(cancelaciones?.porcentaje)).toFixed(1)}%</Text>
          </View>
          <View style={styles.pieSlice}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.pieLabel}>Cancelados</Text>
            <Text style={styles.pieValue}>{cancelaciones?.porcentaje}%</Text>
          </View>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, { width: `${100 - Number(cancelaciones?.porcentaje)}%`, backgroundColor: '#22c55e' }]} />
          <View style={[styles.barFill, { width: `${cancelaciones?.porcentaje}%`, backgroundColor: '#ef4444' }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Top 5 restaurantes</Text>
        {topRestaurantes.map((r, i) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{r.nombre.substring(0, 12)}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFillRest, { width: `${(Number(r.total_pedidos) / maxPedidos) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{Number(r.total_pedidos).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  loadingContainer: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', marginTop: 60 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16 },
  halfCard: { flex: 1 },
  label: { fontSize: 12, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' },
  value: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  valueLarge: { fontSize: 32, fontWeight: 'bold', color: '#FF6B35' },
  barContainer: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 12 },
  barFill: { height: 12 },
  pieSlice: { flex: 1, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  pieLabel: { fontSize: 11, color: '#94a3b8' },
  pieValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 80, fontSize: 11, color: '#94a3b8' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  barFillRest: { height: 8, backgroundColor: '#FF6B35', borderRadius: 4 },
  barValue: { width: 50, fontSize: 11, color: '#94a3b8', textAlign: 'right' },
});