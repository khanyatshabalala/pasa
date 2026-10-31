import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, apiErrorMessage } from "@/lib/api";

const CURRENT_YEAR = new Date().getFullYear();

// Shapes returned by the Spring API (see ReportCardResponse and LearnerResponse in the backend).
type Child = {
  id: string; firstName: string; lastName: string;
  gradeId: number | null; schoolName: string | null;
};
type ReportCard = {
  id: string; learnerId: string; academicYear: number; term: number;
  fileName: string; notes: string | null; uploadedAt: string;
};

export default function ReportCardsScreen() {
  const { user, primaryRole } = useAuth();
  const isParent = primaryRole === "parent";
  const [children, setChildren] = useState<Child[]>([]);
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(CURRENT_YEAR);

  useEffect(() => {
    if (!user || !isParent) { setLoading(false); return; }
    (async () => {
      try {
        const kids = await apiRequest<Child[]>("/api/v1/children");
        setChildren(kids);
        // The API lists report cards per learner. A child whose list fails must not hide the others.
        const perChild = await Promise.all(
          kids.map(k => apiRequest<ReportCard[]>(`/api/v1/learners/${k.id}/report-cards`).catch(() => [] as ReportCard[])),
        );
        setReports(perChild.flat().sort((a, b) => b.academicYear - a.academicYear || b.term - a.term));
      } catch (e) {
        Alert.alert("Could not load report cards", apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isParent]);

  const onView = async (card: ReportCard) => {
    setDownloading(card.id);
    try {
      // The phone's PDF viewer cannot send our login, so the API issues a 60-second link.
      const { url } = await apiRequest<{ url: string }>(
        `/api/v1/learners/${card.learnerId}/report-cards/${card.id}/download-link`,
        { method: "POST" },
      );
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert("Could not open report card", apiErrorMessage(e));
    } finally {
      setDownloading(null);
    }
  };

  const filtered = reports.filter(r => r.academicYear === yearFilter);
  const grouped = filtered.reduce<Record<string, { learner: Child | undefined; cards: ReportCard[] }>>((acc, r) => {
    if (!acc[r.learnerId]) acc[r.learnerId] = { learner: children.find(c => c.id === r.learnerId), cards: [] };
    acc[r.learnerId].cards.push(r);
    return acc;
  }, {});
  const years = [...new Set(reports.map(r => r.academicYear))].sort((a, b) => b - a);

  if (!isParent) return (
    <SafeAreaView style={s.container}>
      <View style={s.emptyWrap}><Ionicons name="shield-outline" size={40} color="#334155" /><Text style={s.empty}>Parents only.</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}><Text style={s.title}>Report cards</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.yearRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(years.length ? years : [CURRENT_YEAR]).map(y => (
          <TouchableOpacity key={y} style={[s.yearChip, yearFilter === y && s.yearChipActive]} onPress={() => setYearFilter(y)}>
            <Text style={[s.yearChipText, yearFilter === y && s.yearChipTextActive]}>{y}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {loading ? <ActivityIndicator color="#38bdf8" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.list}>
          {reports.length === 0 ? (
            <View style={s.emptyWrap}>
              <Ionicons name="document-text-outline" size={40} color="#334155" />
              <Text style={s.empty}>No report cards yet.</Text>
              <Text style={s.emptySub}>Your school will upload them at the end of each term.</Text>
            </View>
          ) : Object.keys(grouped).length === 0 ? (
            <Text style={s.empty}>No report cards for {yearFilter}.</Text>
          ) : (
            Object.entries(grouped).map(([learnerId, { learner, cards }]) => (
              <View key={learnerId} style={s.learnerSection}>
                <View style={s.learnerHeader}>
                  <View style={s.learnerAvatar}><Text style={s.learnerAvatarText}>{learner?.firstName?.[0]}{learner?.lastName?.[0]}</Text></View>
                  <View>
                    <Text style={s.learnerName}>{learner?.firstName} {learner?.lastName}</Text>
                    <Text style={s.learnerSub}>{learner?.schoolName} · Grade {learner?.gradeId === 0 ? "R" : learner?.gradeId}</Text>
                  </View>
                </View>
                {cards.map(card => (
                  <View key={card.id} style={s.card}>
                    <View style={s.cardIcon}><Ionicons name="document-text" size={22} color="#64748b" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>Term {card.term} · {card.academicYear}</Text>
                      <Text style={s.cardFile} numberOfLines={1}>{card.fileName}</Text>
                      {card.notes && <Text style={s.cardNotes} numberOfLines={2}>{card.notes}</Text>}
                      <Text style={s.cardDate}>Uploaded {new Date(card.uploadedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</Text>
                    </View>
                    <TouchableOpacity style={s.viewBtn} onPress={() => onView(card)} disabled={downloading === card.id}>
                      {downloading === card.id
                        ? <ActivityIndicator size="small" color="#38bdf8" />
                        : <Ionicons name="open-outline" size={18} color="#38bdf8" />}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#0f172a" },
  header:            { padding: 20, paddingBottom: 8 },
  title:             { fontSize: 22, fontWeight: "800", color: "#f1f5f9" },
  yearRow:           { flexGrow: 0, marginBottom: 8 },
  yearChip:          { borderWidth: 1, borderColor: "#334155", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#1e293b" },
  yearChipActive:    { borderColor: "#38bdf8", backgroundColor: "#38bdf820" },
  yearChipText:      { color: "#64748b", fontSize: 13, fontWeight: "600" },
  yearChipTextActive:{ color: "#38bdf8" },
  list:              { padding: 16, gap: 16, paddingBottom: 40 },
  emptyWrap:         { alignItems: "center", marginTop: 60, gap: 10 },
  empty:             { color: "#94a3b8", fontSize: 15, fontWeight: "600" },
  emptySub:          { color: "#475569", fontSize: 13, textAlign: "center" },
  learnerSection:    { gap: 8 },
  learnerHeader:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  learnerAvatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: "#0ea5e920", alignItems: "center", justifyContent: "center" },
  learnerAvatarText: { color: "#38bdf8", fontWeight: "700", fontSize: 13 },
  learnerName:       { color: "#f1f5f9", fontWeight: "700", fontSize: 14 },
  learnerSub:        { color: "#64748b", fontSize: 12 },
  card:              { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1e293b", borderRadius: 12, padding: 14 },
  cardIcon:          { width: 40, height: 40, borderRadius: 10, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" },
  cardTitle:         { color: "#f1f5f9", fontWeight: "600", fontSize: 14 },
  cardFile:          { color: "#64748b", fontSize: 12, marginTop: 2 },
  cardNotes:         { color: "#64748b", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  cardDate:          { color: "#475569", fontSize: 11, marginTop: 4 },
  viewBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: "#0ea5e915", alignItems: "center", justifyContent: "center" },
});
