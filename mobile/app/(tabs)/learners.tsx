import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { apiErrorMessage, apiRequest } from '@/lib/api';

type Learner = {
  id: string;
  firstName: string;
  lastName: string;
  gradeId: number | null;
  learnerNumber: string | null;
  gender: string | null;
};
type Grade = { id: number; label: string };

export default function LearnersScreen() {
  const { primarySchoolId, primaryRole } = useAuth();
  const router = useRouter();
  const canManage = ['principal', 'school_admin', 'super_admin'].includes(primaryRole);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [gradePickerOpen, setGradePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [learnerNumber, setLearnerNumber] = useState('');
  const [gradeId, setGradeId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!primarySchoolId) {
      setLearners([]);
      setGrades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [learnerRows, gradeRows] = await Promise.all([
        apiRequest<Learner[]>(`/api/v1/schools/${primarySchoolId}/learners`),
        apiRequest<Grade[]>(`/api/v1/grades?schoolId=${primarySchoolId}`),
      ]);
      setLearners(learnerRows);
      setGrades(gradeRows);
    } catch (error) {
      setLoadError(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [primarySchoolId]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setLearnerNumber('');
    setGradeId(null);
  };

  const onCreate = async () => {
    if (!primarySchoolId) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required information', 'Enter the learner’s first and last name.');
      return;
    }
    if (gradeId === null) {
      Alert.alert('Select a grade', 'Choose the learner’s grade at this school.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/api/v1/schools/${primarySchoolId}/learners`, {
        method: 'POST',
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          learnerNumber: learnerNumber.trim() || null,
          gradeId,
        },
      });
      setModalOpen(false);
      resetForm();
      await load();
    } catch (error) {
      Alert.alert('Could not create learner', apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const filtered = learners.filter((learner) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return `${learner.firstName} ${learner.lastName}`.toLowerCase().includes(query)
      || (learner.learnerNumber ?? '').toLowerCase().includes(query);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learners</Text>
        <View style={styles.headerActions}>
          <Text style={styles.count}>{learners.length} registered</Text>
          {canManage && primarySchoolId && (
            <TouchableOpacity style={styles.addButton} onPress={() => setModalOpen(true)}>
              <Ionicons name="add" size={20} color="#0f172a" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#475569" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or learner number…"
          placeholderTextColor="#475569"
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 40 }} />
      ) : loadError ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>{loadError}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retry}>Try again</Text></TouchableOpacity>
        </View>
      ) : !primarySchoolId ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No school is associated with this staff account.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.length === 0 ? (
            <Text style={styles.empty}>
              {search ? 'No learners match your search.' : 'No learners registered yet.'}
            </Text>
          ) : (
            filtered.map((learner) => (
              <TouchableOpacity
                key={learner.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/(tabs)/learner-detail', params: { id: learner.id } } as never)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {learner.firstName[0]}{learner.lastName[0]}
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.name}>{learner.firstName} {learner.lastName}</Text>
                  <Text style={styles.sub}>
                    {learner.gradeId === 0 ? 'Grade R' : `Grade ${learner.gradeId ?? '—'}`}
                    {learner.learnerNumber ? ` · ${learner.learnerNumber}` : ''}
                    {learner.gender ? ` · ${learner.gender}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#334155" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create learner profile</Text>
            <TouchableOpacity onPress={() => { setModalOpen(false); resetForm(); }}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.fieldLabel}>First name *</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#475569" />
            <Text style={styles.fieldLabel}>Last name *</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#475569" />
            <Text style={styles.fieldLabel}>Learner number</Text>
            <TextInput style={styles.input} value={learnerNumber} onChangeText={setLearnerNumber} placeholder="Optional" placeholderTextColor="#475569" />
            <Text style={styles.fieldLabel}>Grade *</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setGradePickerOpen(true)}>
              <Text style={gradeId !== null ? styles.pickerText : styles.pickerPlaceholder}>
                {grades.find(grade => grade.id === gradeId)?.label ?? 'Select grade'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (saving || !firstName.trim() || !lastName.trim() || gradeId === null) && styles.disabled]}
              onPress={onCreate}
              disabled={saving || !firstName.trim() || !lastName.trim() || gradeId === null}
            >
              {saving ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveButtonText}>Create profile</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
        <Modal visible={gradePickerOpen} transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerSheet}>
              <Text style={styles.modalTitle}>Select grade</Text>
              <ScrollView>
                {grades.map(grade => (
                  <TouchableOpacity key={grade.id} style={styles.pickerOption} onPress={() => { setGradeId(grade.id); setGradePickerOpen(false); }}>
                    <Text style={gradeId === grade.id ? styles.retry : styles.pickerText}>{grade.label}</Text>
                    {gradeId === grade.id && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setGradePickerOpen(false)}>
                <Text style={styles.pickerText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#f1f5f9' },
  count: { fontSize: 13, color: '#64748b' },
  addButton: { backgroundColor: '#38bdf8', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#f1f5f9' },
  list: { padding: 16, gap: 8 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  retry: { color: '#38bdf8', fontWeight: '700' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0ea5e922', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#38bdf8', fontWeight: '700', fontSize: 14 },
  cardBody: { flex: 1 },
  name: { color: '#f1f5f9', fontWeight: '600', fontSize: 14 },
  sub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  modal: { flex: 1, backgroundColor: '#0f172a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', padding: 16 },
  modalBody: { padding: 20, gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#f1f5f9' },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  pickerText: { color: '#cbd5e1', fontSize: 14 },
  pickerPlaceholder: { color: '#475569', fontSize: 14 },
  saveButton: { backgroundColor: '#38bdf8', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.5 },
  pickerModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000080' },
  pickerSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#0f172a' },
  cancelButton: { margin: 16, backgroundColor: '#0f172a', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
});
