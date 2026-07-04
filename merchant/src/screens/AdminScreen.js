import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Animated, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { useMenuAdmin } from '../hooks/useMenuAdmin';
import Particles from '../components/Particles';

const TABS = ['🍽️ MENU', '🥤 DRINKS'];

export default function AdminScreen({ onClose }) {
  const [tab, setTab] = useState(0);
  const { menuByCategory, drinks, loading, toggleAvailable, updatePrice, deleteItem } = useMenuAdmin();

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
            <Text style={styles.headerSub}>MANAGE MENU & STOCK</Text>
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

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.brand} size="large" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : tab === 0 ? (
          <MenuTab menuByCategory={menuByCategory} toggleAvailable={toggleAvailable} updatePrice={updatePrice} deleteItem={deleteItem} />
        ) : (
          <DrinksTab drinks={drinks} toggleAvailable={toggleAvailable} updatePrice={updatePrice} deleteItem={deleteItem} />
        )}
      </SafeAreaView>
    </View>
  );
}

function MenuTab({ menuByCategory, toggleAvailable, updatePrice, deleteItem }) {
  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {Object.entries(menuByCategory).map(([category, items]) => (
        <View key={category} style={styles.categoryBlock}>
          <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              collectionName="menuItems"
              onToggle={() => toggleAvailable('menuItems', item.id, item.available !== false)}
              onPriceChange={(p) => updatePrice('menuItems', item.id, p)}
              onDelete={() => deleteItem('menuItems', item.id)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function DrinksTab({ drinks, toggleAvailable, updatePrice, deleteItem }) {
  return (
    <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.categoryBlock}>
        <Text style={styles.categoryTitle}>ALL DRINKS</Text>
        {drinks.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            collectionName="drinks"
            onToggle={() => toggleAvailable('drinks', item.id, item.available !== false)}
            onPriceChange={(p) => updatePrice('drinks', item.id, p)}
            onDelete={() => deleteItem('drinks', item.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ItemRow({ item, onToggle, onPriceChange, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [price,   setPrice]     = useState(String(item.price ?? ''));
  const isAvailable = item.available !== false;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onDelete(); } },
      ]
    );
  };

  const handlePriceSave = () => {
    onPriceChange(price);
    setEditing(false);
  };

  return (
    <View style={[styles.itemRow, !isAvailable && styles.itemRowOOS]}>
      {/* Available toggle */}
      <TouchableOpacity
        style={[styles.toggle, isAvailable ? styles.toggleOn : styles.toggleOff]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.toggleThumb, isAvailable ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </TouchableOpacity>

      {/* Name + status */}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, !isAvailable && { color: C.muted }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemStatus, { color: isAvailable ? C.green : C.red }]}>
          {isAvailable ? 'In Stock' : 'Out of Stock'}
        </Text>
      </View>

      {/* Price editor */}
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
            onBlur={handlePriceSave}
            onSubmitEditing={handlePriceSave}
          />
        </View>
      ) : (
        <TouchableOpacity onPress={() => { setPrice(String(item.price ?? '')); setEditing(true); }} style={styles.priceTap}>
          <Text style={styles.priceText}>${item.price?.toFixed(2) ?? '—'}</Text>
          <Text style={styles.priceEditHint}>tap to edit</Text>
        </TouchableOpacity>
      )}

      {/* Delete */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.7}>
        <Text style={styles.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  safe:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  headerTitle:     { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  headerSub:       { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  closeBtn:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border },
  closeBtnText:    { color: C.brand, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  tabsRow:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  tabBtn:          { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabBtnActive:    { backgroundColor: 'rgba(245,158,11,0.15)', borderBottomWidth: 2, borderBottomColor: C.brand },
  tabText:         { color: C.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  tabTextActive:   { color: '#fff' },
  list:            { flex: 1, paddingHorizontal: 16 },
  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:     { color: C.muted, fontSize: 14 },
  categoryBlock:   { marginBottom: 20 },
  categoryTitle:   { color: C.brand, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8, paddingLeft: 4 },
  itemRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, gap: 12 },
  itemRowOOS:      { opacity: 0.6 },
  toggle:          { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  toggleOn:        { backgroundColor: 'rgba(74,222,128,0.3)', borderWidth: 1, borderColor: C.green },
  toggleOff:       { backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: C.red },
  toggleThumb:     { width: 20, height: 20, borderRadius: 10 },
  toggleThumbOn:   { backgroundColor: C.green, alignSelf: 'flex-end' },
  toggleThumbOff:  { backgroundColor: C.red,   alignSelf: 'flex-start' },
  itemInfo:        { flex: 1 },
  itemName:        { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  itemStatus:      { fontSize: 11, fontWeight: '600' },
  priceTap:        { alignItems: 'flex-end' },
  priceText:       { color: C.brand, fontSize: 16, fontWeight: '900' },
  priceEditHint:   { color: C.muted, fontSize: 9, marginTop: 2 },
  priceEdit:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, borderWidth: 1, borderColor: C.brand, paddingHorizontal: 8, paddingVertical: 4 },
  priceDollar:     { color: C.brand, fontSize: 14, fontWeight: '900', marginRight: 2 },
  priceInput:      { color: C.brand, fontSize: 14, fontWeight: '900', minWidth: 50 },
  deleteBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:   { fontSize: 18 },
});
