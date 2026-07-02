import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C, SHADOW_AMBER } from '../theme';

const { height } = Dimensions.get('window');

const STATUS_COLOR = {
  pending:   C.brand,
  confirmed: C.blue,
  preparing: '#fb923c',
  ready:     C.green,
};

const STATUS_LABEL = {
  pending:   'NEW ORDER',
  confirmed: 'CONFIRMED',
  preparing: 'IN KITCHEN',
  ready:     'READY',
};

export default function OrderDetailModal({ order, onClose, onAccept, onPrepare, onReady }) {
  const slideY  = useRef(new Animated.Value(height)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: height, duration: 280, useNativeDriver: true }),
      Animated.timing(backdropOp, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(onClose);
  };

  const status      = order.status || 'pending';
  const statusColor = STATUS_COLOR[status] || C.brand;

  const time = order.createdAt?.toDate?.()
    ? order.createdAt.toDate().toLocaleString('en-AU', {
        day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Just now';

  const actionBtn = (label, color, handler) => (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: color + '20', borderColor: color + '55' }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handler(); }}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOp }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        <LinearGradient
          colors={['#0e0700', '#0a0500', '#060300']}
          style={styles.sheetGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* 3D top edge */}
          <View style={styles.topEdge} />

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Order ref + status */}
            <View style={styles.orderHead}>
              <Text style={styles.orderRef}>
                #{order.orderRef || order.id?.slice(-6).toUpperCase()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {STATUS_LABEL[status] || status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.orderTime}>{time}</Text>

            {/* Customer info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CUSTOMER</Text>
              <View style={styles.infoCard}>
                <Row label="Name"  value={order.name || order.customer?.firstName || '—'} />
                <Row label="Phone" value={order.phone || order.customer?.phone || '—'} />
                <Row label="Mode"  value={order.orderMode === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'} />
                {order.orderMode === 'delivery' && order.address && (
                  <Row label="Address" value={order.address} />
                )}
                {order.notes && <Row label="Notes" value={order.notes} highlight />}
              </View>
            </View>

            {/* Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
              <View style={styles.infoCard}>
                {order.items?.map((item, i) => (
                  <View key={i} style={[styles.itemRow, i > 0 && styles.itemRowBorder]}>
                    <View style={styles.itemQtyWrap}>
                      <Text style={styles.itemQty}>{item.qty}×</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.displayName || item.name}</Text>
                      {item.extras?.length > 0 && (
                        <Text style={styles.itemExtras}>{item.extras.join(', ')}</Text>
                      )}
                      {item.notes && <Text style={styles.itemNotes}>Note: {item.notes}</Text>}
                    </View>
                    <Text style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Total */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PAYMENT</Text>
              <View style={styles.infoCard}>
                {order.subtotal != null && <Row label="Subtotal" value={`$${order.subtotal?.toFixed(2)}`} />}
                {order.deliveryFee > 0  && <Row label="Delivery" value={`$${order.deliveryFee?.toFixed(2)}`} />}
                <View style={[styles.row, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Text style={styles.totalValue}>${order.total?.toFixed(2)}</Text>
                </View>
                {order.paymentMethod && <Row label="Payment" value={order.paymentMethod} />}
              </View>
            </View>
          </ScrollView>

          {/* Action buttons */}
          {status !== 'ready' && status !== 'delivered' && (
            <View style={styles.actions}>
              {status === 'pending'   && actionBtn('✓ ACCEPT ORDER',  C.green,   onAccept)}
              {status === 'confirmed' && actionBtn('👨‍🍳 START PREPARING', '#fb923c', onPrepare)}
              {status === 'preparing' && actionBtn('✓ MARK READY',    C.green,   onReady)}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

function Row({ label, value, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.87, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: 1, borderColor: 'rgba(58,32,0,0.9)', ...SHADOW_AMBER },
  sheetGrad:     { flex: 1 },
  topEdge:       { position: 'absolute', top: 0, left: 40, right: 40, height: 1, backgroundColor: 'rgba(245,158,11,0.35)' },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 12 },
  closeBtn:      { position: 'absolute', top: 16, right: 20, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  closeBtnText:  { color: C.muted, fontSize: 16 },
  content:       { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  orderHead:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  orderRef:      { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  statusBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot:     { width: 7, height: 7, borderRadius: 3.5 },
  statusText:    { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  orderTime:     { color: C.muted, fontSize: 12, marginBottom: 24 },
  section:       { marginBottom: 20 },
  sectionTitle:  { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  infoCard:      { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  rowLabel:      { color: C.muted, fontSize: 13, flex: 1 },
  rowValue:      { color: C.text2, fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  rowHighlight:  { color: '#fb923c' },
  itemRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 12 },
  itemRowBorder: { borderTopWidth: 1, borderColor: C.border },
  itemQtyWrap:   { width: 30 },
  itemQty:       { color: C.brand, fontSize: 15, fontWeight: '900' },
  itemInfo:      { flex: 1 },
  itemName:      { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  itemExtras:    { color: C.muted, fontSize: 12 },
  itemNotes:     { color: '#fb923c', fontSize: 12, marginTop: 2 },
  itemPrice:     { color: C.text2, fontSize: 14, fontWeight: '700' },
  totalRow:      { borderTopWidth: 1, borderColor: C.border },
  totalLabel:    { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  totalValue:    { color: C.brand, fontSize: 22, fontWeight: '900' },
  actions:       { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, gap: 10 },
  actionBtn:     { paddingVertical: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
