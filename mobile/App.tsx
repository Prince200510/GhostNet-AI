import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, NativeModules } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmergencyCreate from './screens/EmergencyCreate';
import EmergencyFeed from './screens/EmergencyFeed';
import AgentDecision from './screens/AgentDecision';
import { initializeDefaultMesh } from './mesh/meshNetwork';

const getDevServerIp = () => {
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:/]+)/) || scriptURL.match(/exp:\/\/([^:/]+)/);
      if (match && match[1]) {
        // If it's a local address (not tunnel), return it, otherwise fallback
        if (!match[1].includes('exp.direct') && !match[1].includes('ngrok')) {
          return match[1];
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  return '10.0.2.2'; // fallback to emulator default
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<'create' | 'feed' | 'decisions'>('create');
  
  // Default connection URL dynamically resolved
  const [backendUrl, setBackendUrl] = useState(`http://${getDevServerIp()}:5000`); 

  useEffect(() => {
    initializeDefaultMesh();
  }, []);

  const renderContent = () => {
    switch (currentTab) {
      case 'create':
        return <EmergencyCreate backendUrl={backendUrl} />;
      case 'feed':
        return <EmergencyFeed backendUrl={backendUrl} />;
      case 'decisions':
        return <AgentDecision backendUrl={backendUrl} />;
      default:
        return <EmergencyCreate backendUrl={backendUrl} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      {/* Network Configuration Header Container */}
      <View style={styles.settingsHeaderContainer}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsLabel}>Uplink API:</Text>
          <TextInput
            style={styles.settingsInput}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://192.168.x.x:5000"
            placeholderTextColor="#71717a"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {backendUrl.includes('10.0.2.2') && (
          <Text style={styles.settingsHelperText}>
            💡 Simulator mode active. For physical devices, enter your computer's local Wi-Fi IP address (e.g. http://192.168.x.x:5000)
          </Text>
        )}
        {NativeModules.SourceCode?.scriptURL?.includes('exp.direct') && (
          <Text style={styles.settingsHelperText}>
            ⚠️ Expo Tunnel is active. Please enter your laptop's local IP address (e.g. http://192.168.1.XX:5000) in the input above.
          </Text>
        )}
      </View>

      {/* Screen Component */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Tab Switcher with Vector Icons */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setCurrentTab('create')}
        >
          <Ionicons 
            name={currentTab === 'create' ? "alert-circle" : "alert-circle-outline"} 
            size={20} 
            color={currentTab === 'create' ? '#f43f5e' : '#71717a'} 
          />
          <Text style={[styles.tabText, currentTab === 'create' && styles.tabTextActive]}>Alert</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setCurrentTab('feed')}
        >
          <Ionicons 
            name={currentTab === 'feed' ? "radio" : "radio-outline"} 
            size={20} 
            color={currentTab === 'feed' ? '#f43f5e' : '#71717a'} 
          />
          <Text style={[styles.tabText, currentTab === 'feed' && styles.tabTextActive]}>Transmissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => setCurrentTab('decisions')}
        >
          <Ionicons 
            name={currentTab === 'decisions' ? "shield-checkmark" : "shield-checkmark-outline"} 
            size={20} 
            color={currentTab === 'decisions' ? '#f43f5e' : '#71717a'} 
          />
          <Text style={[styles.tabText, currentTab === 'decisions' && styles.tabTextActive]}>Ledger</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    flex: 1,
  },
  settingsHeaderContainer: {
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  settingsHelperText: {
    color: '#fb7185',
    fontSize: 9,
    paddingHorizontal: 15,
    paddingBottom: 8,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  settingsLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  settingsInput: {
    flex: 1,
    backgroundColor: '#09090b',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#fff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    fontFamily: 'monospace',
  },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 6,
  },
  tabText: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#f43f5e',
  },
});
