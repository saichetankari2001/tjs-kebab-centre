import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C, SHADOW_AMBER, SHADOW_DARK } from '../theme';

const TIME_OPTIONS = [10, 15, 20, 25, 30, 45, 60];

const STATUS_COLOR = {
  pending:   C.brand,
  confirmed: C.blue,
  preparing: '#fb923c',
  ready:     C.green,
};

const STATUS_LABEL = {
  pending:   'NEW ORDER',
  confirmed: 'CONFIRMED',
  preparing: 'PREPARING',
  ready:     'READY',
};

export default function OrderCard({ order, isNew, onAccept, onPrepare, onReady, onPress }) {
  const pulse  = useRef(new Animated.Value(1)).current;
  const glow   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(-40)).current;
  const op     = useRef(new Animated.Value(0)).current;
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Slide in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Pulse animation for new orders
  useEffect(() => {
    if (!isNew) { pulse.setValue(1); glow.setValue(0); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.018, duration: 500, useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 1,     duration: 500, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1,     duration: 500, useNativeDriver: true }),
          Animated.timing(glow,  { toValue: 0,     duration: 500, useNativeDriver: false }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isNew]);

  const time = order.createdAt?.toDate?.()
    ? order.createdAt.toDate().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const status      = order.status || 'pending';
  const statusColor = STATUS_COLOR[status] || C.brand;
  const borderColor = glow.interpolate({ inputRange: [0, 1], outputRange: ['rgba(58,32,0,0.9)', 'rgba(245,158,11,0.85)'] });
  const shadowOp    = glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] });

  const btn = (label, color, onPress) => (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
      style={[styles.btn, { backgroundColor: color + '22', borderColor: color + '55' }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY: slideY }, { scale: pulse }], opacity: op }]}>
      <Animated.View style={[styles.card, { borderColor, shadowOpacity: shadowOp }, isNew ? SHADOW_AMBER : SHADOW_DARK]}>
        <LinearGradient
          colors={isNew
            ? ['rgba(245,158,11,0.12)', 'rgba(234,88,12,0.06)', 'rgba(20,10,0,0.97)']
            : ['rgba(30,15,0,0.98)', 'rgba(20,10,0,0.99)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* 3D top edge highlight */}
          <View style={styles.topEdge} />

          {/* Header */}
          <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.orderRef}>#{order.orderRef || order.id?.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '55' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABEL[status] || status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.total}>${order.total?.toFixed(2)}</Text>
                <Text style={styles.time}>{time}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Customer */}
          <View style={styles.divider} />
          <View style={styles.customer}>
            <Text style={styles.customerName}>{order.name || order.customer?.firstName || 'Customer'}</Text>
            <Text style={styles.customerSub}>
              {order.phone || order.customer?.phone || ''} · {order.orderMode === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}
            </Text>
          </View>

          {/* Items */}
          {order.items?.slice(0, 3).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.qty}×</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.displayName || item.name}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
            </View>
          ))}
          {(order.items?.length || 0) > 3 && (
            <Text style={styles.moreItems}>+{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}</Text>
          )}

          {/* Actions */}
          <View style={styles.divider} />
          <View style={styles.actions}>
            {status === 'pending'   && btn('✓ ACCEPT',  C.green,  () => setShowTimePicker(true))}
            {status === 'confirmed' && btn('👨‍🍳 PREPARE', '#fb923c', onPrepare)}
            {status === 'preparing' && btn('✓ READY',   C.green,  onReady)}
            {status === 'ready' && <Text style={styles.readyText}>✓ Ready for pickup</Text>}
          </View>

          {/* Time picker modal */}
          <Modal visible={showTimePicker} transparent animationType="fade">
            <View style={styles.timeBackdrop}>
              <View style={styles.timeModal}>
                <View style={styles.timeEdge} />
                <Text style={styles.timeTitle}>HOW LONG WILL IT TAKE?</Text>
                <Text style={styles.timeSub}>Customer will see this on their order</Text>
                <View style={styles.timeGrid}>
                  {TIME_OPTIONS.map(mins => (
                    <TouchableOpacity
                      key={mins}
                      style={styles.timeBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setShowTimePicker(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        onAccept(mins);
                      }}
                    >
                      <LinearGradient
                        colors={['rgba(245,158,11,0.15)', 'rgba(234,88,12,0.08)']}
                        style={styles.timeBtnGrad}
                      >
                        <Text style={styles.timeMins}>{mins}</Text>
                        <Text style={styles.timeMinsLabel}>min</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.timeCancelBtn} onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.timeCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { marginHorizontal: 16, marginVertical: 8 },
  card:       { borderRadius: 20, borderWidth: 1, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, elevation: 14 },
  gradient:   { padding: 18 },
  topEdge:    { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(245,158,11,0.25)', borderRadius: 1 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 },
  headerLeft: { gap: 6 },
  headerRight:{ alignItems: 'flex-end' },
  orderRef:   { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  statusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  total:      { color: C.brand, fontSize: 22, fontWeight: '900' },
  time:       { color: C.muted, fontSize: 12, marginTop: 2 },
  divider:    { height: 1, backgroundColor: 'rgba(58,32,0,0.7)', marginVertical: 12 },
  customer:   { marginBottom: 10 },
  customerName:{ color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  customerSub: { color: C.muted, fontSize: 12 },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  itemQty:    { color: C.brand, fontSize: 13, fontWeight: '800', width: 24 },
  itemName:   { color: C.text2, fontSize: 13, flex: 1 },
  itemPrice:  { color: C.muted, fontSize: 12 },
  moreItems:  { color: C.muted, fontSize: 11, marginTop: 2, fontStyle: 'italic' },
  actions:        { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  btn:            { flex: 1, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText:        { fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  readyText:      { color: C.green, fontSize: 13, fontWeight: '700', textAlign: 'center', flex: 1 },
  timeBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  timeModal:      { width: 340, backgroundColor: '#0e0700', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)', padding: 24, overflow: 'hidden' },
  timeEdge:       { position: 'absolute', top: 0, left: 40, right: 40, height: 1, backgroundColor: 'rgba(245,158,11,0.4)' },
  timeTitle:      { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 6 },
  timeSub:        { color: C.muted, fontSize: 12, textAlign: 'center', marginBottom: 20 },
  timeGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  timeBtn:        { width: 80, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  timeBtnGrad:    { paddingVertical: 14, alignItems: 'center' },
  timeMins:       { color: C.brand, fontSize: 22, fontWeight: '900' },
  timeMinsLabel:  { color: C.muted, fontSize: 11, fontWeight: '700' },
  timeCancelBtn:  { paddingVertical: 12, alignItems: 'center' },
  timeCancelText: { color: C.muted, fontSize: 14, fontWeight: '700' },
});
