import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, RefreshControl, Dimensions, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SHADOW_AMBER } from '../theme';
import { useOrders } from '../hooks/useOrders';
import { useAlarm } from '../components/AlarmController';
import OrderCard from '../components/OrderCard';
import NewOrderAlert from '../components/NewOrderAlert';
import OrderDetailModal from './OrderDetailScreen';
import Particles from '../components/Particles';
import AdminScreen from './AdminScreen';

const { width } = Dimensions.get('window');
const TABS = ['PENDING', 'ACTIVE', 'COMPLETED'];

export default function DashboardScreen({ onLogout }) {
  const { pending, active, completed, loading, error, newOrderIds, clearAllNew, clearNewOrder, updateStatus } = useOrders();
  const [tab,          setTab]          = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing,   setRefreshing]   = useState(false);
  const [showAdmin,    setShowAdmin]    = useState(false);

  // Alarm fires while there are unacknowledged new orders
  useAlarm(newOrderIds.length > 0);

  // Tab indicator animation
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth    = width / TABS.length;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: tab * tabWidth,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [tab]);

  // Auto-switch to PENDING when new orders arrive
  useEffect(() => {
    if (newOrderIds.length > 0) setTab(0);
  }, [newOrderIds.length]);

  const lists = [pending, active, completed];
  const currentList = lists[tab];

  const handleDismissAlarm = useCallback(() => {
    clearAllNew();
  }, [clearAllNew]);

  const handleAccept   = (id) => updateStatus(id, 'confirmed');
  const handlePrepare  = (id) => updateStatus(id, 'preparing');
  const handleReady    = (id) => updateStatus(id, 'ready');

  const todayTotal = [...pending, ...active, ...completed]
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#030200', '#080400', '#050200']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <Particles />

      {/* New order alert banner */}
      <NewOrderAlert count={newOrderIds.length} onDismiss={handleDismissAlarm} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ORDER DASHBOARD</Text>
            <Text style={styles.headerSub}>TJ'S KEBAB CENTRE · LIVE ORDERS</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.revenueBadge}>
              <Text style={styles.revenueLabel}>TODAY</Text>
              <Text style={styles.revenueAmount}>${todayTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAdmin(true)} style={styles.adminBtn}>
              <Text style={styles.adminBtnText}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>↩</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'PENDING',   value: pending.length,   color: C.brand },
            { label: 'ACTIVE',    value: active.length,    color: '#fb923c' },
            { label: 'COMPLETED', value: completed.length, color: C.green },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'rgba(0,0,0,0.2)']}
                style={styles.statGrad}
              >
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrap}>
          <View style={styles.tabsBar}>
            {TABS.map((t, i) => {
              const counts = [pending.length, active.length, completed.length];
              const isActive = tab === i;
              return (
                <TouchableOpacity
                  key={t} style={styles.tab}
                  onPress={() => setTab(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t}</Text>
                  {counts[i] > 0 && (
                    <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                      <Text style={styles.tabBadgeText}>{counts[i]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sliding indicator */}
          <View style={styles.tabsIndicatorTrack}>
            <Animated.View
              style={[styles.tabsIndicator, { width: tabWidth - 24, transform: [{ translateX: Animated.add(indicatorX, new Animated.Value(12)) }] }]}
            />
          </View>
        </View>

        {/* Order list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={C.brand} />
          }
        >
          {error ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>⚠️</Text>
              <Text style={styles.emptyText}>Cannot connect to orders</Text>
              <Text style={styles.emptySubText}>{error}</Text>
            </View>
          ) : loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Loading orders...</Text>
            </View>
          ) : currentList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>{tab === 0 ? '🍽️' : tab === 1 ? '👨‍🍳' : '✅'}</Text>
              <Text style={styles.emptyText}>
                {tab === 0 ? 'No pending orders' : tab === 1 ? 'No active orders' : 'No completed orders'}
              </Text>
              <Text style={styles.emptySubText}>
                {tab === 0 ? 'New orders will appear here and trigger the alarm' : ''}
              </Text>
            </View>
          ) : (
            currentList.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                isNew={newOrderIds.includes(order.id)}
                onAccept={() => handleAccept(order.id)}
                onPrepare={() => handlePrepare(order.id)}
                onReady={() => handleReady(order.id)}
                onPress={() => setSelectedOrder(order)}
              />
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Admin panel */}
      {showAdmin && (
        <View style={StyleSheet.absoluteFill}>
          <AdminScreen onClose={() => setShowAdmin(false)} />
        </View>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={() => { handleAccept(selectedOrder.id); setSelectedOrder(null); }}
          onPrepare={() => { handlePrepare(selectedOrder.id); setSelectedOrder(null); }}
          onReady={() => { handleReady(selectedOrder.id); setSelectedOrder(null); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  safe:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerTitle:     { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerSub:       { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  revenueBadge:    { alignItems: 'flex-end' },
  revenueLabel:    { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  revenueAmount:   { color: C.brand, fontSize: 20, fontWeight: '900' },
  adminBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  adminBtnText:    { fontSize: 18 },
  signOutBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  signOutText:     { color: C.muted, fontSize: 16 },
  statsRow:        { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard:        { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  statGrad:        { padding: 12, alignItems: 'center' },
  statValue:       { fontSize: 22, fontWeight: '900' },
  statLabel:       { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
  tabsWrap:        { marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: 'hidden' },
  tabsBar:         { flexDirection: 'row' },
  tab:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 6 },
  tabText:         { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  tabTextActive:   { color: '#fff' },
  tabBadge:        { backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive:  { backgroundColor: C.brand },
  tabBadgeText:    { color: '#fff', fontSize: 10, fontWeight: '900' },
  tabsIndicatorTrack: { height: 2, backgroundColor: 'transparent', position: 'relative' },
  tabsIndicator:   { height: 2, backgroundColor: C.brand, borderRadius: 1, position: 'absolute', bottom: 0 },
  list:            { flex: 1 },
  listContent:     { paddingTop: 4 },
  emptyWrap:       { alignItems: 'center', paddingTop: 80 },
  emptyIcon:       { fontSize: 52, marginBottom: 16 },
  emptyText:       { color: C.text2, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySubText:    { color: C.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
});
