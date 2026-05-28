import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { Brand } from '@/constants/theme';

const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const API = `http://${host}:3000`;

const fetchJSON = (url: string) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(url, { signal: ctrl.signal })
    .then(r => r.json())
    .finally(() => clearTimeout(timer));
};

export default function GraficasScreen() {
  const [topRestaurantes, setTopRestaurantes] = useState([]);
  const [cancelaciones, setCancelaciones] = useState(null);
  const [pedidosPorDia, setPedidosPorDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = () => {
    setLoading(true);
    setError('');
    Promise.all([
      fetchJSON(`${API}/kpi/top-restaurantes`),
      fetchJSON(`${API}/kpi/cancelaciones`),
      fetchJSON(`${API}/kpi/pedidos-por-dia`),
    ]).then(([rest, cancel, dias]) => {
      setTopRestaurantes(rest);
      setCancelaciones(cancel);
      setPedidosPorDia(dias);
      setLoading(false);
    }).catch(() => {
      setError(`No se pudo conectar con la API.\n${API}`);
      setLoading(false);
    });
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Brand.accent} />
      <Text style={styles.loadingText}>Cargando gráficas...</Text>
    </View>
  );

  if (error) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={cargar}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const barData = topRestaurantes.map((r, i) => ({
    value: Number(r.total_pedidos),
    label: r.nombre.substring(0, 8),
    frontColor: i === 0 ? Brand.accent : Brand.blue,
  }));

  const lineData = pedidosPorDia.slice(-14).map(d => ({
    value: Number(d.total),
    dataPointText: '',
  }));

  const pieData = cancelaciones ? [
    { value: 100 - Number(cancelaciones.porcentaje), color: Brand.green, text: 'Completados' },
    { value: Number(cancelaciones.porcentaje), color: Brand.red, text: 'Cancelados' },
  ] : [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gráficas</Text>
      <Text style={styles.subtitle}>Visualización de KPIs</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top 5 Restaurantes</Text>
        <Text style={styles.cardSub}>Pedidos por restaurante</Text>
        <BarChart
          data={barData}
          width={280}
          height={180}
          barWidth={36}
          spacing={16}
          roundedTop
          noOfSections={4}
          yAxisColor={Brand.subtext}
          xAxisColor={Brand.subtext}
          yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: Brand.subtext, fontSize: 9 }}
          hideRules
          backgroundColor={Brand.card}
          rulesColor={Brand.border}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pedidos — últimos 14 días</Text>
        <Text style={styles.cardSub}>Tendencia diaria</Text>
        {lineData.length > 0 && (
          <LineChart
            data={lineData}
            width={280}
            height={160}
            color={Brand.accent}
            thickness={2}
            dataPointsColor={Brand.accent}
            noOfSections={4}
            yAxisColor={Brand.subtext}
            xAxisColor={Brand.subtext}
            yAxisTextStyle={{ color: Brand.subtext, fontSize: 10 }}
            hideDataPoints={false}
            hideRules
            backgroundColor={Brand.card}
            startFillColor={Brand.accent}
            startOpacity={0.2}
            endOpacity={0}
            areaChart
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tasa de cancelación</Text>
        <Text style={styles.cardSub}>Completados vs cancelados</Text>
        <View style={styles.pieRow}>
          <PieChart
            data={pieData}
            donut
            radius={80}
            innerRadius={50}
            innerCircleColor={Brand.card}
            centerLabelComponent={() => (
              <Text style={styles.pieCenter}>{cancelaciones?.porcentaje}%{'\n'}canc.</Text>
            )}
          />
          <View style={styles.legend}>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: Brand.green }]} />
              <Text style={styles.legendText}>Completados{'\n'}{(100 - Number(cancelaciones?.porcentaje)).toFixed(1)}%</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: Brand.red }]} />
              <Text style={styles.legendText}>Cancelados{'\n'}{cancelaciones?.porcentaje}%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.bg, padding: 20 },
  loadingContainer: { flex: 1, backgroundColor: Brand.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Brand.subtext, marginTop: 12 },
  errorText: { color: Brand.red, fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  retryBtn: { backgroundColor: Brand.accent, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: Brand.accent, marginTop: 60 },
  subtitle: { fontSize: 14, color: Brand.subtext, marginBottom: 24 },
  card: { backgroundColor: Brand.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Brand.text, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Brand.subtext, marginBottom: 16 },
  pieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  pieCenter: { color: Brand.text, fontSize: 12, textAlign: 'center', fontWeight: 'bold' },
  innerCircle: { backgroundColor: Brand.card },
  legend: { gap: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: Brand.text, fontSize: 13, lineHeight: 18 },
});
