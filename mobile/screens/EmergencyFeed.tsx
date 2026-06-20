import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { meshMessagesCache } from '../mesh/meshNetwork';

export default function EmergencyFeed({ backendUrl = 'http://127.0.0.1:5000' }: { backendUrl?: string }) {
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmergencies = async () => {
    setLoading(true);
    let backendData: any[] = [];
    try {
      const response = await fetch(`${backendUrl}/api/emergencies`);
      if (response.ok) {
        backendData = await response.json();
      }
    } catch (error) {
      // Silent offline fallback
    }

    // Merge backend data with meshMessagesCache, avoiding duplicates by id
    const merged = [...backendData];
    meshMessagesCache.forEach((msg) => {
      if (!merged.some((item) => item.id === msg.id)) {
        merged.push({
          id: msg.id,
          text: msg.text,
          sender: `BLE Mesh (${msg.sender})`,
          timestamp: msg.timestamp,
          meshPath: msg.path,
          priority: "OFFLINE",
          resourceNeeded: "BLE Mesh Message"
        });
      }
    });

    // Sort by timestamp descending
    merged.sort((a, b) => b.timestamp - a.timestamp);
    setEmergencies(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 3000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  const getPriorityColors = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return { bg: '#2d0606', text: '#ef4444', border: '#450a0a' };
      case 'HIGH':
        return { bg: '#2d1506', text: '#f97316', border: '#451a03' };
      case 'MEDIUM':
        return { bg: '#2d2706', text: '#eab308', border: '#453a04' };
      default:
        return { bg: '#062d16', text: '#22c55e', border: '#04451c' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>INCOMING EMERGENCY TRANSMISSIONS</Text>
          <Text style={styles.headerSubtitle}>{emergencies.length} active emergency points</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchEmergencies} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.refreshBtnText}>SYNC</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Signal Cards List */}
      <FlatList
        data={emergencies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="radio-outline" size={38} color="#52525b" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No emergency transmissions captured in this sector.</Text>
            <Text style={styles.emptySubtext}>Broadcast alerts from the Alert tab to verify.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const colors = getPriorityColors(item.priority);
          return (
            <View style={styles.card}>
              
              {/* Card Header Info */}
              <View style={styles.cardHeader}>
                <View style={styles.sourceWrapper}>
                  <View style={styles.sourceDot} />
                  <Text style={styles.sourceNode}>NODE {item.sender}</Text>
                </View>
                
                <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {item.priority || 'PENDING'}
                  </Text>
                </View>
              </View>

              {/* Emergency Text */}
              <Text style={styles.bodyText}>"{item.text}"</Text>

              {/* Hop Routing Indicator */}
              {item.meshPath && (
                <View style={styles.routingBox}>
                  <Text style={styles.routingLabel}>BLE HOP ROUTING PATH</Text>
                  <View style={styles.pathRow}>
                    {item.meshPath.map((node: string, index: number) => (
                      <React.Fragment key={index}>
                        <View style={styles.pathNode}>
                          <Text style={styles.pathNodeText}>{node}</Text>
                        </View>
                        {index !== item.meshPath.length - 1 && (
                          <Text style={styles.pathArrow}>➔</Text>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}

              {/* Bottom Footer Info */}
              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                
                <View style={styles.allocationBox}>
                  <Text style={styles.allocLabel}>DISPATCHED RESOURCE</Text>
                  <Text style={styles.allocVal}>{item.resourceNeeded || 'Calculating...'}</Text>
                </View>
              </View>

            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 35, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#18181b', backgroundColor: '#09090b' },
  headerTitle: { fontSize: 18, fontWeight: '950', color: '#ffffff', letterSpacing: 2 },
  headerSubtitle: { fontSize: 10, color: '#71717a', marginTop: 2, fontWeight: 'bold' },
  
  refreshBtn: { backgroundColor: '#1c1c20', borderWidth: 1, borderColor: '#27272a', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  refreshBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  listContent: { padding: 18 },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 32, opacity: 0.3, marginBottom: 15 },
  emptyText: { color: '#a1a1aa', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  emptySubtext: { color: '#52525b', fontSize: 11, marginTop: 4, textAlign: 'center' },
  
  card: { backgroundColor: '#141417', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#27272a', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  
  sourceWrapper: { flexDirection: 'row', alignItems: 'center' },
  sourceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#38bdf8', marginRight: 8 },
  sourceNode: { color: '#e4e4e7', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '950', letterSpacing: 1 },
  
  bodyText: { color: '#ffffff', fontSize: 14, fontWeight: '600', lineHeight: 22, marginVertical: 8, fontStyle: 'italic' },
  
  // Custom routing path view
  routingBox: { backgroundColor: '#09090b', borderRadius: 8, padding: 10, marginVertical: 10, borderWidth: 1, borderColor: '#1c1c20' },
  routingLabel: { fontSize: 8, fontWeight: 'bold', color: '#52525b', letterSpacing: 0.5, marginBottom: 6 },
  pathRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  pathNode: { backgroundColor: '#1c1c20', borderWidth: 1, borderColor: '#27272a', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  pathNodeText: { color: '#38bdf8', fontSize: 10, fontWeight: '850', fontFamily: 'monospace' },
  pathArrow: { color: '#71717a', fontSize: 10, marginHorizontal: 6 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#27272a', paddingTop: 12 },
  timeText: { color: '#52525b', fontSize: 11, fontWeight: 'bold' },
  
  allocationBox: { alignItems: 'flex-end' },
  allocLabel: { fontSize: 7, fontWeight: 'bold', color: '#52525b', letterSpacing: 0.5 },
  allocVal: { fontSize: 12, fontWeight: '900', color: '#f43f5e', marginTop: 2 }
});
