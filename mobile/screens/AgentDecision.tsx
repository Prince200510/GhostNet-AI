import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyDecision } from '../blockchain/contract';
import { meshDecisionsCache } from '../mesh/meshNetwork';

export default function AgentDecision({ backendUrl = 'http://127.0.0.1:5000' }: { backendUrl?: string }) {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchDecisions = async () => {
    setLoading(true);
    let backendData: any[] = [];
    try {
      const response = await fetch(`${backendUrl}/api/decisions`);
      if (response.ok) {
        backendData = await response.json();
      }
    } catch (error) {
      // Silent offline fallback
    }

    // Merge backend decisions with meshDecisionsCache, avoiding duplicates by id
    const merged = [...backendData];
    meshDecisionsCache.forEach((dec) => {
      if (!merged.some((item) => item.id === dec.id)) {
        merged.push(dec);
      }
    });

    // Sort by timestamp descending (adjust for timestamp in seconds vs milliseconds)
    merged.sort((a, b) => {
      const aTime = a.timestamp * (a.timestamp < 10000000000 ? 1000 : 1);
      const bTime = b.timestamp * (b.timestamp < 10000000000 ? 1000 : 1);
      return bTime - aTime;
    });

    setDecisions(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 3000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const result = await verifyDecision(backendUrl, id);
      if (result.isValid) {
        Alert.alert(
          "Verification Success ✅", 
          "Cryptographic hash matches the immutable records registered on the Monad testnet blockchain. Ledger integrity active."
        );
      } else {
        Alert.alert(
          "INTEGRITY MISMATCH ❌", 
          "On-chain validation failed! The local record data does not match the immutable hash committed to the smart contract."
        );
      }
      await fetchDecisions();
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleTamper = async (id: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/verify/tamper/${id}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Tamper route unreachable");
      const data = await response.json();
      Alert.alert(
        "Ledger Tampered! ⚠️",
        `Altered local DB decision: "${data.decision.action}". Tap 'Verify' to watch the blockchain catch this data mutation.`
      );
      await fetchDecisions();
    } catch (error: any) {
      Alert.alert("Tamper simulation failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LEDGER AUDITING</Text>
          <Text style={styles.headerSubtitle}>{decisions.length} committed AI decisions</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchDecisions} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.refreshBtnText}>SYNC</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Decision Cards List */}
      <FlatList
        data={decisions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={38} color="#52525b" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No auditing records registered on-chain yet.</Text>
            <Text style={styles.emptySubtext}>Broadcast alerts from the Alert tab first.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            
            {/* Keccak Hash header */}
            <View style={styles.cardHeader}>
              <Text style={styles.hashLabel}>KECCAK256 HASH PROOF</Text>
              <Text style={styles.hashVal} numberOfLines={1}>{item.messageHash}</Text>
            </View>

            {/* Block Details Info */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DECISION ACTION</Text>
                <Text style={styles.detailVal}>{item.action}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ALLOCATED RESOURCE</Text>
                <Text style={styles.detailVal}>{item.resource}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>TRIAGE PRIORITY</Text>
                <Text style={[styles.detailVal, { color: '#f43f5e', fontWeight: 'bold' }]}>{item.priority}</Text>
              </View>

              {item.economics && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ECONOMIC GAIN VS COST</Text>
                  <Text style={styles.detailVal}>
                    Payoff {item.economics.utilityScore} / Opportunity Cost {item.economics.scarcityCost?.toFixed(1)}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>COMMIT TIME</Text>
                <Text style={styles.detailVal}>{new Date(item.timestamp * 1000).toLocaleString()}</Text>
              </View>
            </View>

            {/* Transaction Hash */}
            <View style={styles.txRow}>
              <Text style={styles.txLabel}>MONAD TX</Text>
              <Text style={styles.txVal} numberOfLines={1}>{item.txHash}</Text>
            </View>

            {/* Blockchain validation state status badge */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Ledger Integrity State:</Text>
              {item.isVerified ? (
                <View style={styles.badgeVerified}>
                  <Ionicons name="checkmark-circle" size={12} color="#22c55e" style={{ marginRight: 6 }} />
                  <Text style={styles.badgeText}>VERIFIED MATCH</Text>
                </View>
              ) : (
                <View style={styles.badgeUnverified}>
                  <Ionicons name="alert-circle" size={12} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.badgeText}>INTEGRITY FAILING</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => handleVerify(item.id)}
                disabled={verifyingId === item.id}
              >
                {verifyingId === item.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify On Chain</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tamperBtn}
                onPress={() => handleTamper(item.id)}
              >
                <Text style={styles.tamperBtnText}>Tamper Local DB</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}
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
  
  cardHeader: { marginBottom: 10 },
  hashLabel: { fontSize: 8, fontWeight: 'bold', color: '#52525b', letterSpacing: 0.5 },
  hashVal: { color: '#f43f5e', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold', marginTop: 3 },
  
  detailsBox: { backgroundColor: '#09090b', borderRadius: 8, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: '#1c1c20' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#141417' },
  detailLabel: { fontSize: 8, fontWeight: '900', color: '#52525b', letterSpacing: 0.5 },
  detailVal: { fontSize: 11, color: '#e4e4e7', fontWeight: 'bold' },
  
  txRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  txLabel: { fontSize: 9, fontWeight: '900', color: '#52525b', letterSpacing: 0.5, marginRight: 8 },
  txVal: { color: '#38bdf8', fontSize: 11, fontFamily: 'monospace', flex: 1 },
  
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8, borderTopWidth: 1, borderTopColor: '#1c1c20', paddingTop: 10 },
  statusLabel: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold' },
  
  badgeVerified: { backgroundColor: '#062d16', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#04451c', flexDirection: 'row', alignItems: 'center' },
  badgeUnverified: { backgroundColor: '#2d0606', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, borderWidth: 1, borderColor: '#450a0a', flexDirection: 'row', alignItems: 'center' },
  
  indicatorGreen: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e', marginRight: 6 },
  indicatorRed: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444', marginRight: 6 },
  badgeText: { color: '#ffffff', fontSize: 9, fontWeight: '950', letterSpacing: 0.5 },
  
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  verifyBtn: { flex: 1, backgroundColor: '#f43f5e', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginRight: 6 },
  verifyBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  
  tamperBtn: { flex: 1, backgroundColor: '#1c1c20', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginLeft: 6, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ef4444' },
  tamperBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }
});
