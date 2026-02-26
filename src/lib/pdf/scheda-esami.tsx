import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface SchedaEsamiData {
  id: string;
  autoscuolaNome: string;
  candidato: { nome: string | null; cognome: string | null; nascita: string | null };
  patente: { paeseNome: string | null; categoria: string | null };
  classificazioneReasons: string[];
  classificazioneVersione: string | null;
  generataAt: Date;
}

const C = { indigo: "#4338ca", rose: "#e11d48", slate: "#334155", slateLight: "#64748b", slateLighter: "#94a3b8", border: "#e2e8f0", bg: "#f8fafc", white: "#ffffff" };

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 36, color: C.slate, backgroundColor: C.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.rose },
  appName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.rose },
  appSub: { fontSize: 8, color: C.slateLight, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  metaText: { fontSize: 7.5, color: C.slateLighter },
  banner: { backgroundColor: "#fff1f2", padding: 12, borderRadius: 6, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: C.rose },
  bannerTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.rose },
  bannerSub: { fontSize: 8, color: C.rose, marginTop: 3 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.slateLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: C.border },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  field: { width: "47%", marginBottom: 4 },
  fieldLabel: { fontSize: 7, color: C.slateLighter, marginBottom: 1 },
  fieldValue: { fontSize: 8.5, color: C.slate, fontFamily: "Helvetica-Bold" },
  fieldEmpty: { fontSize: 8.5, color: C.border },
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  listBullet: { width: 10, fontSize: 8, color: C.rose },
  listText: { flex: 1, fontSize: 8, color: C.slate },
  azioniBox: { backgroundColor: C.bg, borderRadius: 4, padding: 10, marginTop: 4 },
  azioneItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  checkBox: { width: 10, height: 10, borderWidth: 0.75, borderColor: C.slateLight, borderRadius: 2, marginRight: 6 },
  azioneText: { fontSize: 8.5, color: C.slate },
  firmaBox: { flexDirection: "row", gap: 20, marginTop: 8 },
  firmaField: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: C.border, paddingBottom: 20, marginTop: 4 },
  firmaLabel: { fontSize: 7, color: C.slateLighter },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6 },
  footerText: { fontSize: 7, color: C.slateLighter },
});

function fmt(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return String(d); }
}

export function SchedaEsamiDocument({ data }: { data: SchedaEsamiData }) {
  const ver = data.classificazioneVersione ? `v${data.classificazioneVersione}` : "";
  const motivo = data.classificazioneReasons[0] ?? "Patente non convertibile direttamente.";

  return (
    <Document title={`Scheda Avvio Esami – ${data.candidato.cognome ?? ""} ${data.candidato.nome ?? ""}`} author="ConvertoPatenti">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.appName}>ConvertoPatenti</Text>
            <Text style={s.appSub}>Scheda Avvio Percorso Esami</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.metaText}>{data.autoscuolaNome}</Text>
            <Text style={s.metaText}>Pratica #{data.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={s.metaText}>Data: {fmt(data.generataAt)}</Text>
          </View>
        </View>

        {/* Banner esito */}
        <View style={s.banner}>
          <Text style={s.bannerTitle}>Esami obbligatori</Text>
          <Text style={s.bannerSub}>{motivo}</Text>
          {ver ? <Text style={{ fontSize: 7, color: C.rose, marginTop: 2 }}>Engine {ver}</Text> : null}
        </View>

        {/* Dati candidato */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Candidato</Text>
          <View style={s.grid2}>
            <Field label="Cognome" value={data.candidato.cognome} />
            <Field label="Nome" value={data.candidato.nome} />
            <Field label="Data di nascita" value={fmt(data.candidato.nascita)} />
            <Field label="Paese rilascio patente" value={data.patente.paeseNome} />
            <Field label="Categoria richiesta (Italia)" value={data.patente.categoria} />
          </View>
        </View>

        {/* Motivo non convertibilità */}
        {data.classificazioneReasons.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Motivazioni</Text>
            {data.classificazioneReasons.map((r, i) => (
              <View key={i} style={s.listItem}>
                <Text style={s.listBullet}>•</Text>
                <Text style={s.listText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Azioni operative */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Azioni operative</Text>
          <View style={s.azioniBox}>
            {[
              "Avvio percorso conseguimento patente italiana",
              "Verifica documenti identità e soggiorno",
              "Iscrizione candidato al corso teorico",
              "Prenotazione visita medica (se richiesta)",
              "Comunicazione candidato — esami obbligatori",
            ].map((az, i) => (
              <View key={i} style={s.azioneItem}>
                <View style={s.checkBox} />
                <Text style={s.azioneText}>{az}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Firma */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Firme</Text>
          <View style={s.firmaBox}>
            <View style={s.firmaField}>
              <Text style={s.firmaLabel}>Operatore autoscuola</Text>
            </View>
            <View style={s.firmaField}>
              <Text style={s.firmaLabel}>Candidato (presa visione)</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>ConvertoPatenti — {data.autoscuolaNome}</Text>
          <Text style={s.footerText}>Pratica #{data.id.slice(0, 8).toUpperCase()} · {fmt(data.generataAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={value ? s.fieldValue : s.fieldEmpty}>{value ?? "—"}</Text>
    </View>
  );
}
