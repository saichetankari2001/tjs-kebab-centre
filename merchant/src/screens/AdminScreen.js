import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { useMenuAdmin } from '../hooks/useMenuAdmin';
import { useStaffSessions } from '../hooks/useStaffSessions';
import Particles from '../components/Particles';

const TABS = ['🍽️ MENU', '🥤 DRINKS', '👥 STAFF'];

export default function AdminScreen({ onClose }) {
  const [tab, setTab] = useState(0);
  const { menuByCategory, drinks, loading, toggleAvailable, updatePrice, deleteItem } = useMenuAdmin();
  const { sessions, loading: sessLoading } = useStaffSessions();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#030200', '#080400', '#050200']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <Particles />
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>ADMIN PANEL</Text>
            <Text style={styles.headerSub}>MANAGE MENU · STOCK · STAFF</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ BACK</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === i && styles.tabBtnActive]}
              onPress={() => setTab(i)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {tab === 0 && (
          loading
            ? <Loader />
            : <MenuTab menuByCategory={menuByCategory} toggleAvailable={toggleAvailable} updatePrice={updatePrice} deleteItem={deleteItem} />
        )}
        {tab === 1 && (
          loading
            ? <Loader />
            : <DrinksTab drinks={drinks} toggleAvailable={toggleAvailable} updatePrice={updatePrice} deleteItem={deleteItem} />
        )}
        {tab === 2 && (
          sessLoading ? <Loader /> : <StaffTab sessions={sessions} />
        )}

      </SafeAreaView>
    </View>
  );
}

/* ─── Menu Tab ─── */
function MenuTab({ menuByCategory, toggleAvailable, updatePrice, deleteItem }) {
  const entries = Object.entries(menuByCategory);
  if (entries.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyText}>No menu items found</Text>
        <Text style={styles.emptySub}>Add items via the web admin dashboard</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {entries.map(([category, items]) => (
        <View key={category} style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleAvailable('menuItems', item.id, item.available !== false); }}
              onPriceChange={p => updatePrice('menuItems', item.id, p)}
              onDelete={() => confirmDelete(item.name, () => deleteItem('menuItems', item.id))}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

/* ─── Drinks Tab ─── */
function DrinksTab({ drinks, toggleAvailable, updatePrice, deleteItem }) {
  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.categoryBlock}>
        <Text style={styles.categoryTitle}>ALL DRINKS</Text>
        {drinks.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleAvailable('drinks', item.id, item.available !== false); }}
            onPriceChange={p => updatePrice('drinks', item.id, p)}
            onDelete={() => confirmDelete(item.name, () => deleteItem('drinks', item.id))}
          />
        ))}
      </View>
    </ScrollView>
  );
}

/* ─── Staff Tab ─── */
function StaffTab({ sessions }) {
  const fmt = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const duration = (login, logout) => {
    if (!login?.toDate || !logout?.toDate) return null;
    const mins = Math.round((logout.toDate() - login.toDate()) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={[styles.categoryTitle, { marginBottom: 12, paddingLeft: 4 }]}>RECENT SESSIONS</Text>
      {sessions.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No sessions recorded yet</Text>
        </View>
      )}
      {sessions.map(s => {
        const isActive = !s.logoutTime;
        const dur = duration(s.loginTime, s.logoutTime);
        return (
          <View key={s.id} style={[styles.sessionCard, isActive && styles.sessionCardActive]}>
            <View style={styles.sessionLeft}>
              <View style={[styles.sessionDot, { backgroundColor: isActive ? C.green : C.muted }]} />
              <View>
                <Text style={styles.sessionDevice}>{s.device || 'Merchant Tablet'}</Text>
                <Text style={styles.sessionTime}>In: {fmt(s.loginTime)}</Text>
                {s.logoutTime && <Text style={styles.sessionTime}>Out: {fmt(s.logoutTime)}</Text>}
              </View>
            </View>
            <View style={styles.sessionRight}>
              <View style={[styles.sessionBadge, { backgroundColor: isActive ? C.green + '20' : 'rgba(255,255,255,0.05)', borderColor: isActive ? C.green + '50' : C.border }]}>
                <Text style={[styles.sessionBadgeText, { color: isActive ? C.green : C.muted }]}>
                  {isActive ? 'ACTIVE' : dur || 'LOGGED OUT'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ─── Item Row ─── */
function ItemRow({ item, onToggle, onPriceChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [price,   setPrice]   = useState(String(item.price ?? ''));
  const isAvailable = item.available !== false;

  return (
    <View style={[styles.itemRow, !isAvailable && styles.itemRowOOS]}>
      <TouchableOpacity
        style={[styles.toggle, isAvailable ? styles.toggleOn : styles.toggleOff]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.toggleThumb, isAvailable ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, !isAvailable && { color: C.muted }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.itemStatus, { color: isAvailable ? C.green : C.red }]}>
          {isAvailable ? '✓ In Stock' : '✕ Out of Stock'}
        </Text>
      </View>

      {editing ? (
        <View style={styles.priceEdit}>
          <Text style={styles.priceDollar}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            autoFocus
            selectTextOnFocus
            onBlur={() => { onPriceChange(price); setEditing(false); }}
            onSubmitEditing={() => { onPriceChange(price); setEditing(false); }}
          />
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setPrice(String(item.price ?? '')); setEditing(true); }} style={styles.priceTap}>
          <Text style={styles.priceText}>${item.price?.toFixed(2) ?? '—'}</Text>
          <Text style={styles.priceHint}>edit</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

function Loader() {
  return (
    <View style={styles.emptyWrap}>
      <ActivityIndicator color={C.brand} size="large" />
    </View>
  );
}

function confirmDelete(name, onConfirm) {
  Alert.alert('Delete Item', `Delete "${name}"? This cannot be undone.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

const styles = StyleSheet.create({
  root:             { flex: 1 },
  safe:             { flex: 1 },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerTitle:      { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerSub:        { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  closeBtn:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border },
  closeBtnText:     { color: C.brand, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  tabsRow:          { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  tabBtn:           { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabBtnActive:     { backgroundColor: 'rgba(245,158,11,0.15)', borderBottomWidth: 2, borderBottomColor: C.brand },
  tabText:          { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  tabTextActive:    { color: '#fff' },
  list:             { flex: 1, paddingHorizontal: 16 },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon:        { fontSize: 48 },
  emptyText:        { color: C.text2, fontSize: 16, fontWeight: '700' },
  emptySub:         { color: C.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: 40 },
  categoryBlock:    { marginBottom: 20 },
  categoryTitle:    { color: C.brand, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  itemRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, gap: 12 },
  itemRowOOS:       { opacity: 0.55 },
  toggle:           { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  toggleOn:         { backgroundColor: 'rgba(74,222,128,0.25)', borderWidth: 1, borderColor: C.green },
  toggleOff:        { backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: C.red },
  toggleThumb:      { width: 20, height: 20, borderRadius: 10 },
  toggleThumbOn:    { backgroundColor: C.green, alignSelf: 'flex-end' },
  toggleThumbOff:   { backgroundColor: C.red,   alignSelf: 'flex-start' },
  itemInfo:         { flex: 1 },
  itemName:         { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  itemStatus:       { fontSize: 11, fontWeight: '600' },
  priceTap:         { alignItems: 'flex-end' },
  priceText:        { color: C.brand, fontSize: 16, fontWeight: '900' },
  priceHint:        { color: C.muted, fontSize: 9, marginTop: 2, textAlign: 'right' },
  priceEdit:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, borderWidth: 1, borderColor: C.brand, paddingHorizontal: 8, paddingVertical: 4 },
  priceDollar:      { color: C.brand, fontSize: 14, fontWeight: '900', marginRight: 2 },
  priceInput:       { color: C.brand, fontSize: 14, fontWeight: '900', minWidth: 50 },
  deleteBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:    { fontSize: 18 },
  sessionCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 10 },
  sessionCardActive:{ borderColor: 'rgba(74,222,128,0.4)', backgroundColor: 'rgba(74,222,128,0.05)' },
  sessionLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionDot:       { width: 10, height: 10, borderRadius: 5 },
  sessionDevice:    { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sessionTime:      { color: C.muted, fontSize: 12 },
  sessionRight:     {},
  sessionBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  sessionBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});
