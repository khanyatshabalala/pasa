import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { apiErrorMessage, apiRequest } from '@/lib/api';

type LinkRequest = {
  id: string;
  firstName: string;
  lastName: string;
  learnerNumber: string;
  gradeId: number | null;
  relationship: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  parentName: string | null;
};

export default function LinkRequestsScreen() {
  const { primaryRole, primarySchoolId } = useAuth();
  const canManage = ['principal', 'school_admin', 'super_admin'].includes(primaryRole);

  const [requests, setRequests]   = useState<LinkRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acting, setActing]       = useState<string | null>(null);
  const [tab, setTab]             = useState<'pending' | 'resolved'>('pending');

  // Reject modal
  const [rejectOpen, setRejectOpen]     = useState(false);
  const [rejectTarget, setRejectTarget] = useState<LinkRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting]       = useState(false);

  const load = async () => {
    if (!primarySchoolId) { setRequests([]); setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await apiRequest<LinkRequest[]>(`/api/v1/schools/${primarySchoolId}/link-requests`);
      setRequests(rows);
    } catch (error) {
      setLoadError(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const onApprove = async (req: LinkRequest) => {
    setActing(req.id);
    try {
      await apiRequest(`/api/v1/link-requests/${req.id}/approve`, { method: 'POST' });
      Alert.alert('Approved', `${req.firstName} ${req.lastName} has been linked to their parent.`);
      await load();
    } catch (error) {
      Alert.alert('Could not approve', apiErrorMessage(error));
    } finally {
      setActing(null);
    }
  };

  const onRejectConfirm = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await apiRequest(`/api/v1/link-requests/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: { reason: rejectReason.trim() || null },
      });
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason('');
      await load();
    } catch (error) {
      Alert.alert('Could not reject request', apiErrorMessage(error));
    } finally {
      setRejecting(false);
    }
  };

  if (!canManage) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyWrap}>
          <Ionicons name="shield-outline" size={40} color="#334155" />
          <Text style={s.empty}>Staff only.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pending  = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');
  const displayed = tab === 'pending' ? pending : resolved;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Link requests</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'pending' && s.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[s.tabText, tab === 'pending' && s.tabTextActive]}>
            Pending{pending.length > 0 ? ` (${pending.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'resolved' && s.tabActive]}
          onPress={() => setTab('resolved')}
        >
          <Text style={[s.tabText, tab === 'resolved' && s.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 40 }} />
      ) : loadError ? (
        <View style={s.emptyWrap}>
          <Text style={s.empty}>{loadError}</Text>
          <TouchableOpacity onPress={load}><Text style={s.tabTextActive}>Try again</Text></TouchableOpacity>
        </View>
      ) : !primarySchoolId ? (
        <View style={s.emptyWrap}>
          <Text style={s.empty}>No school is associated with this staff account.</Text>
        </View>
      ) : displayed.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="people-outline" size={40} color="#334155" />
          <Text style={s.empty}>
            {tab === 'pending' ? 'No pending requests.' : 'No resolved requests yet.'}
          </Text>
          {tab === 'pending' && (
            <Text style={s.emptySub}>Parents submit requests from the app.</Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {displayed.map(r => (
            <View key={r.id} style={s.card}>
              {/* Learner info */}
              <View style={s.cardTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{r.firstName[0]}{r.lastName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{r.firstName} {r.lastName}</Text>
                  <Text style={s.cardSub}>
                    Learner no. {r.learnerNumber} · {r.relationship} · Grade {r.gradeId === 0 ? 'R' : r.gradeId ?? '—'}
                  </Text>
                  {r.parentName && (
                    <Text style={s.cardParent}>Parent: {r.parentName}</Text>
                  )}
                </View>
                {/* Status badge */}
                {r.status === 'pending' && (
                  <View style={s.badgePending}><Text style={s.badgePendingText}>Pending</Text></View>
                )}
                {r.status === 'approved' && (
                  <View style={s.badgeApproved}><Text style={s.badgeApprovedText}>Approved</Text></View>
                )}
                {r.status === 'rejected' && (
                  <View style={s.badgeRejected}><Text style={s.badgeRejectedText}>Rejected</Text></View>
                )}
              </View>

              {r.rejectionReason && (
                <Text style={s.rejectionReason}>{r.rejectionReason}</Text>
              )}

              <Text style={s.cardDate}>
                {new Date(r.createdAt).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>

              {/* Action buttons for pending */}
              {r.status === 'pending' && (
                <View style={s.actions}>
                  <TouchableOpacity
                    style={[s.approveBtn, acting === r.id && s.btnDisabled]}
                    onPress={() => onApprove(r)}
                    disabled={acting === r.id}
                  >
                    {acting === r.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Ionicons name="checkmark" size={14} color="#fff" /><Text style={s.approveBtnText}>Approve</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.rejectBtn, acting === r.id && s.btnDisabled]}
                    onPress={() => { setRejectTarget(r); setRejectOpen(true); }}
                    disabled={acting === r.id}
                  >
                    <Ionicons name="close" size={14} color="#ef4444" />
                    <Text style={s.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Reject modal */}
      <Modal visible={rejectOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Reject request</Text>
            <TouchableOpacity onPress={() => { setRejectOpen(false); setRejectTarget(null); setRejectReason(''); }}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={s.modalBody}>
            <Text style={s.modalDesc}>
              Rejecting request for{' '}
              <Text style={{ color: '#f1f5f9', fontWeight: '700' }}>
                {rejectTarget?.firstName} {rejectTarget?.lastName}
              </Text>
              . The parent will be notified.
            </Text>
            <Text style={s.fieldLabel}>Reason (optional)</Text>
            <TextInput
              style={[s.input, s.textarea]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Learner number not found in our records"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              maxLength={300}
            />
            <TouchableOpacity
              style={[s.rejectConfirmBtn, rejecting && s.btnDisabled]}
              onPress={onRejectConfirm}
              disabled={rejecting}
            >
              {rejecting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.rejectConfirmBtnText}>Reject request</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0f172a' },
  header:             { padding: 20, paddingBottom: 8 },
  title:              { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  tabs:               { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab:                { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b' },
  tabActive:          { borderColor: '#38bdf8', backgroundColor: '#38bdf820' },
  tabText:            { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabTextActive:      { color: '#38bdf8' },
  list:               { padding: 16, gap: 10, paddingBottom: 40 },
  emptyWrap:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  empty:              { color: '#94a3b8', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  emptySub:           { color: '#475569', fontSize: 13, textAlign: 'center' },
  card:               { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, gap: 8 },
  cardTop:            { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar:             { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0ea5e920', alignItems: 'center', justifyContent: 'center' },
  avatarText:         { color: '#38bdf8', fontWeight: '700', fontSize: 13 },
  cardName:           { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
  cardSub:            { color: '#64748b', fontSize: 12, marginTop: 2 },
  cardParent:         { color: '#475569', fontSize: 11, marginTop: 2 },
  cardDate:           { color: '#475569', fontSize: 11 },
  rejectionReason:    { color: '#ef4444', fontSize: 12, fontStyle: 'italic' },
  badgePending:       { backgroundColor: '#f9730920', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgePendingText:   { color: '#f97316', fontSize: 11, fontWeight: '700' },
  badgeApproved:      { backgroundColor: '#22c55e20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeApprovedText:  { color: '#22c55e', fontSize: 11, fontWeight: '700' },
  badgeRejected:      { backgroundColor: '#ef444420', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeRejectedText:  { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  actions:            { flexDirection: 'row', gap: 8, marginTop: 4 },
  approveBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#22c55e', borderRadius: 8, paddingVertical: 10 },
  approveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 13 },
  rejectBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444440', borderRadius: 8, paddingVertical: 10 },
  rejectBtnText:      { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  btnDisabled:        { opacity: 0.5 },
  modal:              { flex: 1, backgroundColor: '#0f172a' },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle:         { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  modalBody:          { padding: 20, gap: 12 },
  modalDesc:          { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  fieldLabel:         { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  input:              { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#f1f5f9' },
  textarea:           { minHeight: 80, textAlignVertical: 'top' },
  rejectConfirmBtn:   { backgroundColor: '#ef4444', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  rejectConfirmBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});
