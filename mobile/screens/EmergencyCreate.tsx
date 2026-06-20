import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeDefaultMesh, globalMeshRegistry, MeshMessage, isHardwareActive } from '../mesh/meshNetwork';

export default function EmergencyCreate({ backendUrl = 'http://127.0.0.1:5000' }: { backendUrl?: string }) {
  const [text, setText] = useState('');
  const [sender, setSender] = useState('A');
  const [isOffline, setIsOffline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setMeshLogs([]);
    setResult(null);
    setActiveNode(sender);

    // Initialize node structure
    initializeDefaultMesh();

    if (isOffline) {
      const logs: string[] = [];
      logs.push(`Initiated emergency signal from Device ${sender}.`);
      
      const startNode = globalMeshRegistry[sender];
      if (!startNode) {
        logs.push(`Error: Node ${sender} is offline.`);
        setMeshLogs(logs);
        setLoading(false);
        setActiveNode(null);
        return;
      }

      // Track hop events to animate the nodes
      Object.keys(globalMeshRegistry).forEach((id) => {
        globalMeshRegistry[id].onReceiveCallback = (msg: MeshMessage, from: string) => {
          setActiveNode(id);
          logs.push(`Node ${id} captured packet via Node ${from} (Hops: ${msg.path.join("➔")})`);
          setMeshLogs([...logs]);
        };
      });

      // Broadcast first packet
      const msg = startNode.sendMessage(text);
      setMeshLogs([...logs]);

      // Delay representing mesh routing latency
      setTimeout(async () => {
        setActiveNode("D");
        logs.push(`Packet reached satellite uplink Gateway (Node D).`);
        
        if (isHardwareActive) {
          logs.push(`[BLE Broadcast Active] Alert is broadcasting over-the-air!`);
          logs.push(`Laptop scanner will capture the packet and upload to blockchain.`);
          setMeshLogs([...logs]);
          setResult({
            decision: {
              priority: "BROADCASTED",
              resource: "BLE Mesh Signal",
              action: "Transmitted offline over Bluetooth. Check laptop terminal listener.",
              txHash: "PENDING_UPLINK"
            }
          });
          setLoading(false);
          setActiveNode(null);
          return;
        }

        logs.push(`Uploading cryptographic proof payload to Monad central server...`);
        setMeshLogs([...logs]);

        try {
          const response = await fetch(`${backendUrl}/api/emergency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: msg.id,
              text: msg.text,
              sender: msg.sender,
              meshPath: [...msg.path, "Gateway"]
            })
          });

          if (!response.ok) {
            throw new Error("Local gateway offline");
          }
          const data = await response.json();
          logs.push(`AI Triage complete! Decision registered on Monad successfully.`);
          setMeshLogs([...logs]);
          setResult(data);
        } catch (err: any) {
          logs.push(`Uplink Error: ${err.message}`);
          setMeshLogs([...logs]);
        } finally {
          setLoading(false);
          setActiveNode(null);
        }
      }, 1000);

    } else {
      // Direct HTTP routing
      try {
        const directId = `msg_direct_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const response = await fetch(`${backendUrl}/api/emergency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: directId,
            text,
            sender: `Direct Node ${sender}`,
            meshPath: ["Uplink"]
          })
        });
        if (!response.ok) throw new Error("Connection failed");
        const data = await response.json();
        setResult(data);
      } catch (err: any) {
        setMeshLogs([`Failed to reach coordination server: ${err.message}`]);
      } finally {
        setLoading(false);
        setActiveNode(null);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>GHOSTNET AI</Text>
      <Text style={styles.subtitle}>OFFLINE EMERGENCY DISPATCH</Text>

      {/* Main Composition Card */}
      <View style={styles.card}>
        <Text style={styles.label}>DISASTER DESCRIPTION</Text>
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder="Describe the crisis situation..."
          placeholderTextColor="#52525b"
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
        />

        <Text style={styles.label}>BROADCAST DEVICE SOURCE</Text>
        <View style={styles.nodeSelectorRow}>
          {['A', 'B', 'C'].map((node) => (
            <TouchableOpacity
              key={node}
              style={[styles.nodeSelectorBtn, sender === node && styles.nodeSelectorBtnActive]}
              onPress={() => setSender(node)}
            >
              <Text style={[styles.nodeSelectorText, sender === node && styles.nodeSelectorTextActive]}>
                Device {node}
              </Text>
              <Text style={styles.nodeSubtext}>
                {node === 'A' ? 'Triage Origin' : 'Relay Node'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toggle Switch */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Bluetooth Mesh Protocol</Text>
            <Text style={styles.toggleDesc}>Forwards signals through neighboring nodes</Text>
          </View>
          <Switch
            value={isOffline}
            onValueChange={setIsOffline}
            trackColor={{ false: '#27272a', true: '#f43f5e' }}
            thumbColor={isOffline ? '#ffffff' : '#71717a'}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>BROADCAST SIGNAL</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Visually Stunning Mesh Routing Animation */}
      {isOffline && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>LIVE NETWORK MESH MAP</Text>
          
          <View style={styles.graphContainer}>
            {['A', 'B', 'C', 'D'].map((nodeName, idx) => {
              const isCurrent = activeNode === nodeName;
              const isPassed = result && isOffline;
              
              let nodeStyle = styles.graphNode;
              if (isCurrent) nodeStyle = styles.graphNodeActive;
              else if (nodeName === 'D' && result) nodeStyle = styles.graphNodeGateway;

              return (
                <View key={nodeName} style={styles.graphNodeWrapper}>
                  <View style={nodeStyle}>
                    <Text style={styles.graphNodeText}>{nodeName}</Text>
                    {nodeName === 'D' && <Text style={styles.gatewayBadge}>GW</Text>}
                  </View>
                  {nodeName !== 'D' && (
                    <View style={[styles.graphLine, (isCurrent || isPassed) && styles.graphLineActive]} />
                  )}
                </View>
              );
            })}
          </View>
          
          {meshLogs.length > 0 && (
            <View style={styles.logsConsole}>
              {meshLogs.map((log, index) => (
                <Text key={index} style={styles.consoleText}>➔ {log}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Success Modal Representation */}
      {result && (
        <View style={styles.cardSuccess}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 6 }} />
            <Text style={styles.successTitle}>On-Chain Dispatch Registered</Text>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>TRIAGE LEVEL</Text>
              <Text style={[styles.metricVal, { color: '#f43f5e' }]}>{result.decision.priority}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>RESOURCE</Text>
              <Text style={styles.metricVal}>{result.decision.resource}</Text>
            </View>
          </View>

          <View style={styles.actionCard}>
            <Text style={styles.actionLabel}>DISPATCH INSTRUCTION</Text>
            <Text style={styles.actionVal}>"{result.decision.action}"</Text>
          </View>

          <Text style={styles.hashText}>TX HASH: {result.decision.txHash}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { padding: 18, paddingTop: 30 },
  title: { fontSize: 24, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: 3, textShadowColor: 'rgba(244, 63, 94, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  subtitle: { fontSize: 10, color: '#f43f5e', textAlign: 'center', marginBottom: 25, fontWeight: '900', letterSpacing: 2 },
  
  card: { backgroundColor: '#141417', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#27272a', marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  cardSuccess: { backgroundColor: '#091e14', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#14532d', marginBottom: 18 },
  
  label: { fontSize: 11, fontWeight: '900', color: '#a1a1aa', marginBottom: 8, letterSpacing: 1.5 },
  input: { backgroundColor: '#09090b', borderRadius: 8, padding: 14, color: '#ffffff', fontSize: 15, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#27272a', marginBottom: 18 },
  inputFocused: { borderColor: '#f43f5e' },
  
  nodeSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  nodeSelectorBtn: { flex: 1, backgroundColor: '#1c1c20', padding: 10, marginHorizontal: 4, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  nodeSelectorBtnActive: { backgroundColor: '#f43f5e', borderColor: '#f43f5e' },
  nodeSelectorText: { color: '#71717a', fontWeight: '800', fontSize: 13 },
  nodeSelectorTextActive: { color: '#ffffff' },
  nodeSubtext: { fontSize: 8, color: '#a1a1aa', marginTop: 2, textTransform: 'uppercase' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#27272a', marginBottom: 15 },
  toggleLabel: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  toggleDesc: { color: '#71717a', fontSize: 11, marginTop: 1 },
  
  sendBtn: { backgroundColor: '#f43f5e', borderRadius: 8, padding: 14, alignItems: 'center', shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  sendBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
  
  sectionTitle: { fontSize: 11, fontWeight: '950', color: '#a1a1aa', marginBottom: 15, letterSpacing: 1.5, textAlign: 'center' },
  
  // Graph visual styles
  graphContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, marginBottom: 15 },
  graphNodeWrapper: { flexDirection: 'row', alignItems: 'center' },
  graphNode: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#27272a', borderWidth: 1, borderColor: '#3f3f46', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  graphNodeActive: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0284c7', borderWidth: 2, borderColor: '#38bdf8', justifyContent: 'center', alignItems: 'center', shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, scaleX: 1.1, scaleY: 1.1 },
  graphNodeGateway: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#166534', borderWidth: 1, borderColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  graphNodeText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  gatewayBadge: { position: 'absolute', bottom: -12, fontSize: 7, color: '#a1a1aa', fontWeight: 'bold', textTransform: 'uppercase' },
  graphLine: { width: 25, height: 2, backgroundColor: '#27272a' },
  graphLineActive: { backgroundColor: '#38bdf8' },

  logsConsole: { backgroundColor: '#09090b', borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: '#f43f5e' },
  consoleText: { color: '#7dd3fc', fontSize: 11, fontFamily: 'monospace', marginVertical: 3, lineHeight: 15 },

  // Success Layout
  successHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 8, shadowColor: '#22c55e', shadowRadius: 4, shadowOpacity: 0.5 },
  successTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff', letterSpacing: 0.5 },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  metricItem: { flex: 1, backgroundColor: '#0b130e', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1b3024', marginHorizontal: 3 },
  metricLabel: { fontSize: 8, fontWeight: 'bold', color: '#52525b', letterSpacing: 0.5 },
  metricVal: { fontSize: 14, fontWeight: '900', color: '#ffffff', marginTop: 3 },
  
  actionCard: { backgroundColor: '#0f1712', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1b3024', marginBottom: 14 },
  actionLabel: { fontSize: 9, fontWeight: 'bold', color: '#52525b', marginBottom: 4 },
  actionVal: { fontSize: 13, color: '#e4e4e7', fontStyle: 'italic', fontWeight: '600' },
  hashText: { color: '#6ee7b7', fontSize: 9, fontFamily: 'monospace', textAlign: 'center' }
});
