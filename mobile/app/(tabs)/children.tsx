import { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, apiErrorMessage } from "@/lib/api";

const PROVINCES = [
  "Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo",
  "Mpumalanga","Northern Cape","North West","Western Cape",
];

type ChildLink = {
  id: string;
  firstName: string;
  lastName: string;
  gradeId: number | null;
  schoolName: string | null;
  relationship: string | null;
  isPrimary: boolean | null;
};
type LinkRequest = {
  id: string; firstName: string; lastName: string; learnerNumber: string;
  gradeId: number | null; schoolName: string | null;
  status: "pending" | "approved" | "rejected"; rejectionReason: string | null;
  createdAt: string;
};
type District = { id: string; name: string };
type School = { id: string; name: string; gradeFrom: number | null; gradeTo: number | null };
type Grade = { id: number; label: string; phase: string };

export default function ChildrenScreen() {
  const { profile } = useAuth();
  const isPremium = profile?.subscription_tier === "premium";
  const [children, setChildren] = useState<ChildLink[]>([]);
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cascading state
  const [province, setProvince] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeId, setGradeId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [learnerNo, setLearnerNo] = useState("");

  // Province/district/school pickers
  const [showProvince, setShowProvince] = useState(false);
  const [showDistrict, setShowDistrict] = useState(false);
  const [showSchool, setShowSchool] = useState(false);
  const [showGrade, setShowGrade] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [links, reqs] = await Promise.all([
        apiRequest<ChildLink[]>("/api/v1/children"),
        apiRequest<LinkRequest[]>("/api/v1/link-requests/mine"),
      ]);
      setChildren(links);
      setRequests(reqs);
    } catch (error) {
      setLoadError(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!province) { setDistricts([]); setDistrictId(""); setSchools([]); setSchoolId(""); return; }
    apiRequest<District[]>(`/api/v1/districts?province=${encodeURIComponent(province)}`)
      .then(data => { setDistricts(data); setDistrictId(""); setSchools([]); setSchoolId(""); })
      .catch(error => Alert.alert("Could not load districts", apiErrorMessage(error)));
  }, [province]);

  useEffect(() => {
    if (!districtId) { setSchools([]); setSchoolId(""); return; }
    apiRequest<Array<{ id: string; name: string; gradeFrom: number | null; gradeTo: number | null }>>(
      `/api/v1/schools?districtId=${encodeURIComponent(districtId)}`
    )
      .then(data => { setSchools(data); setSchoolId(""); setGradeId(null); setGrades([]); })
      .catch(error => Alert.alert("Could not load schools", apiErrorMessage(error)));
  }, [districtId]);

  useEffect(() => {
    if (!schoolId) { setGrades([]); setGradeId(null); return; }
    apiRequest<Grade[]>(`/api/v1/grades?schoolId=${encodeURIComponent(schoolId)}`)
      .then(setGrades)
      .catch(error => Alert.alert("Could not load grades", apiErrorMessage(error)));
  }, [schoolId]);

  const resetForm = () => {
    setProvince(""); setDistrictId(""); setSchoolId("");
    setDistricts([]); setSchools([]);
    setGrades([]); setGradeId(null);
    setFirstName(""); setLastName(""); setLearnerNo("");
  };

  const onSubmit = async () => {
    if (!schoolId) return Alert.alert("Select a school");
    if (gradeId === null) return Alert.alert("Select the learner's grade");
    if (!firstName.trim()) return Alert.alert("Enter first name");
    if (!lastName.trim()) return Alert.alert("Enter last name");
    if (!learnerNo.trim()) return Alert.alert("Enter learner number");
    setSubmitting(true);
    try {
      await apiRequest("/api/v1/link-requests", {
        method: "POST",
        body: {
          schoolId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          learnerNumber: learnerNo.trim(),
          relationship: "parent",
          gradeId,
        },
      });
      Alert.alert("Submitted", "The school will review and approve your request.");
      setModalOpen(false); resetForm(); await load();
    } catch (error) {
      Alert.alert("Could not submit request", apiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const pending = requests.filter(r => r.status === "pending");
  const rejected = requests.filter(r => r.status === "rejected");
  const atLimit = !isPremium && children.length >= 1;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My children</Text>
        {!atLimit && (
          <TouchableOpacity style={s.addBtn} onPress={() => setModalOpen(true)}>
            <Ionicons name="add" size={20} color="#0f172a" />
          </TouchableOpacity>
        )}
      </View>

      {atLimit && (
        <View style={s.upgradeBanner}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={s.upgradeBannerText}>Free plan: 1 child. Upgrade for unlimited.</Text>
        </View>
      )}

      {loading ? <ActivityIndicator color="#38bdf8" style={{ marginTop: 40 }} /> : loadError ? (
        <View style={s.emptyWrap}>
          <Text style={s.rejectedReason}>{loadError}</Text>
          <TouchableOpacity onPress={load}><Text style={s.pickerOptionActive}>Try again</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {pending.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Pending approval</Text>
              {pending.map(r => (
                <View key={r.id} style={[s.card, s.cardPending]}>
                  <Ionicons name="time-outline" size={18} color="#f97316" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardName}>{r.firstName} {r.lastName}</Text>
                    <Text style={s.cardSub}>{r.schoolName} · {r.learnerNumber}</Text>
                  </View>
                  <View style={s.pendingPill}><Text style={s.pendingPillText}>Pending</Text></View>
                </View>
              ))}
            </>
          )}

          {rejected.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Not approved</Text>
              {rejected.map(r => (
                <View key={r.id} style={[s.card, s.cardRejected]}>
                  <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardName}>{r.firstName} {r.lastName}</Text>
                    <Text style={s.cardSub}>{r.schoolName} · {r.learnerNumber}</Text>
                    {r.rejectionReason && <Text style={s.rejectedReason}>{r.rejectionReason}</Text>}
                  </View>
                </View>
              ))}
            </>
          )}

          {children.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Linked children</Text>
              {children.map(c => {
                return (
                  <View key={c.id} style={s.card}>
                    <View style={s.avatar}><Text style={s.avatarText}>{c.firstName[0]}{c.lastName[0]}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardName}>{c.firstName} {c.lastName}</Text>
                      <Text style={s.cardSub}>{c.schoolName} · {grades.find(g => g.id === c.gradeId)?.label ?? (c.gradeId === 0 ? "Grade R" : c.gradeId ? `Grade ${c.gradeId}` : "Grade not set")}</Text>
                      <Text style={s.cardRelationship}>{c.relationship}{c.isPrimary ? " · Primary" : ""}</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  </View>
                );
              })}
            </>
          )}

          {children.length === 0 && requests.length === 0 && (
            <View style={s.emptyWrap}>
              <Ionicons name="people-outline" size={40} color="#334155" />
              <Text style={s.empty}>No children linked yet.</Text>
              <Text style={s.emptySub}>Tap + to submit a link request.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Link request modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Link a child</Text>
            <TouchableOpacity onPress={() => { setModalOpen(false); resetForm(); }}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            <Text style={s.fieldLabel}>Province</Text>
            <TouchableOpacity style={s.picker} onPress={() => setShowProvince(true)}>
              <Text style={province ? s.pickerText : s.pickerPlaceholder}>{province || "Select province"}</Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>

            <Text style={s.fieldLabel}>Learner grade</Text>
            <TouchableOpacity style={[s.picker, !schoolId && s.pickerDisabled]} onPress={() => schoolId && setShowGrade(true)}>
              <Text style={gradeId !== null ? s.pickerText : s.pickerPlaceholder}>
                {grades.find(g => g.id === gradeId)?.label ?? (!schoolId ? "Select school first" : "Select grade")}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>

            <Text style={s.fieldLabel}>District</Text>
            <TouchableOpacity style={[s.picker, !province && s.pickerDisabled]} onPress={() => province && setShowDistrict(true)}>
              <Text style={districtId ? s.pickerText : s.pickerPlaceholder}>
                {districts.find(d => d.id === districtId)?.name || (!province ? "Select province first" : "Select district")}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>

            <Text style={s.fieldLabel}>School</Text>
            <TouchableOpacity style={[s.picker, !districtId && s.pickerDisabled]} onPress={() => districtId && setShowSchool(true)}>
              <Text style={schoolId ? s.pickerText : s.pickerPlaceholder}>
                {schools.find(sc => sc.id === schoolId)?.name || (!districtId ? "Select district first" : "Select school")}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748b" />
            </TouchableOpacity>

            <Text style={s.fieldLabel}>Child first name</Text>
            <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="e.g. Sipho" placeholderTextColor="#475569" />

            <Text style={s.fieldLabel}>Child last name</Text>
            <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="e.g. Dlamini" placeholderTextColor="#475569" />

            <Text style={s.fieldLabel}>Learner number</Text>
            <TextInput style={s.input} value={learnerNo} onChangeText={setLearnerNo} placeholder="e.g. 2024001" placeholderTextColor="#475569" />
            <Text style={s.hint}>Enter details exactly as registered at the school.</Text>

            <TouchableOpacity
              style={[s.submitBtn, (submitting || !schoolId || gradeId === null || !firstName || !lastName || !learnerNo) && s.submitBtnDisabled]}
              onPress={onSubmit}
              disabled={submitting || !schoolId || gradeId === null || !firstName || !lastName || !learnerNo}
            >
              <Text style={s.submitBtnText}>{submitting ? "Submitting…" : "Submit request"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>

        {/* Province picker modal */}
        <Modal visible={showProvince} transparent animationType="slide">
          <View style={s.pickerModal}>
            <View style={s.pickerSheet}>
              <Text style={s.pickerSheetTitle}>Select province</Text>
              <ScrollView>
                {PROVINCES.map(p => (
                  <TouchableOpacity key={p} style={s.pickerOption} onPress={() => { setProvince(p); setShowProvince(false); }}>
                    <Text style={[s.pickerOptionText, province === p && s.pickerOptionActive]}>{p}</Text>
                    {province === p && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={s.pickerCancel} onPress={() => setShowProvince(false)}>
                <Text style={s.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Grade picker */}
        <Modal visible={showGrade} transparent animationType="slide">
          <View style={s.pickerModal}>
            <View style={s.pickerSheet}>
              <Text style={s.pickerSheetTitle}>Select grade</Text>
              <ScrollView>
                {grades.map(g => (
                  <TouchableOpacity key={g.id} style={s.pickerOption} onPress={() => { setGradeId(g.id); setShowGrade(false); }}>
                    <Text style={[s.pickerOptionText, gradeId === g.id && s.pickerOptionActive]}>{g.label}</Text>
                    {gradeId === g.id && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={s.pickerCancel} onPress={() => setShowGrade(false)}>
                <Text style={s.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* District picker modal */}
        <Modal visible={showDistrict} transparent animationType="slide">
          <View style={s.pickerModal}>
            <View style={s.pickerSheet}>
              <Text style={s.pickerSheetTitle}>Select district</Text>
              <ScrollView>
                {districts.map(d => (
                  <TouchableOpacity key={d.id} style={s.pickerOption} onPress={() => { setDistrictId(d.id); setShowDistrict(false); }}>
                    <Text style={[s.pickerOptionText, districtId === d.id && s.pickerOptionActive]}>{d.name}</Text>
                    {districtId === d.id && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={s.pickerCancel} onPress={() => setShowDistrict(false)}>
                <Text style={s.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* School picker modal */}
        <Modal visible={showSchool} transparent animationType="slide">
          <View style={s.pickerModal}>
            <View style={s.pickerSheet}>
              <Text style={s.pickerSheetTitle}>Select school</Text>
              <ScrollView>
                {schools.map(sc => (
                  <TouchableOpacity key={sc.id} style={s.pickerOption} onPress={() => { setSchoolId(sc.id); setShowSchool(false); }}>
                    <Text style={[s.pickerOptionText, schoolId === sc.id && s.pickerOptionActive]}>{sc.name}</Text>
                    {schoolId === sc.id && <Ionicons name="checkmark" size={16} color="#38bdf8" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={s.pickerCancel} onPress={() => setShowSchool(false)}>
                <Text style={s.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#0f172a" },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  title:            { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  addBtn:           { backgroundColor: "#38bdf8", borderRadius: 20, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  upgradeBanner:    { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: "#f59e0b15", borderRadius: 10, padding: 10 },
  upgradeBannerText:{ color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  list:             { padding: 16, gap: 8, paddingBottom: 40 },
  sectionLabel:     { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  card:             { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1e293b", borderRadius: 12, padding: 14 },
  cardPending:      { borderLeftWidth: 3, borderLeftColor: "#f97316" },
  cardRejected:     { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
  cardName:         { color: "#f1f5f9", fontWeight: "600", fontSize: 14 },
  cardSub:          { color: "#64748b", fontSize: 12, marginTop: 2 },
  cardRelationship: { color: "#475569", fontSize: 11, marginTop: 2, textTransform: "capitalize" },
  rejectedReason:   { color: "#ef4444", fontSize: 12, marginTop: 3 },
  pendingPill:      { backgroundColor: "#f9730920", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pendingPillText:  { color: "#f97316", fontSize: 11, fontWeight: "700" },
  avatar:           { width: 38, height: 38, borderRadius: 19, backgroundColor: "#0ea5e920", alignItems: "center", justifyContent: "center" },
  avatarText:       { color: "#38bdf8", fontWeight: "700", fontSize: 13 },
  emptyWrap:        { alignItems: "center", marginTop: 60, gap: 10 },
  empty:            { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  emptySub:         { color: "#475569", fontSize: 13 },
  modal:            { flex: 1, backgroundColor: "#0f172a" },
  modalHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  modalTitle:       { fontSize: 18, fontWeight: "700", color: "#f1f5f9" },
  modalBody:        { padding: 20, gap: 4, paddingBottom: 40 },
  fieldLabel:       { fontSize: 13, fontWeight: "600", color: "#94a3b8", marginTop: 14, marginBottom: 6 },
  picker:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  pickerDisabled:   { opacity: 0.4 },
  pickerText:       { color: "#f1f5f9", fontSize: 14 },
  pickerPlaceholder:{ color: "#475569", fontSize: 14 },
  input:            { backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#f1f5f9" },
  hint:             { color: "#475569", fontSize: 11, marginTop: 4 },
  submitBtn:        { backgroundColor: "#38bdf8", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  submitBtnDisabled:{ opacity: 0.5 },
  submitBtnText:    { color: "#0f172a", fontWeight: "700", fontSize: 15 },
  pickerModal:      { flex: 1, justifyContent: "flex-end", backgroundColor: "#00000080" },
  pickerSheet:      { backgroundColor: "#1e293b", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 20 },
  pickerSheetTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", padding: 20, borderBottomWidth: 1, borderBottomColor: "#334155" },
  pickerOption:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#0f172a" },
  pickerOptionText: { color: "#cbd5e1", fontSize: 15 },
  pickerOptionActive:{ color: "#38bdf8", fontWeight: "700" },
  pickerCancel:     { margin: 16, backgroundColor: "#0f172a", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  pickerCancelText: { color: "#94a3b8", fontWeight: "600", fontSize: 15 },
});
