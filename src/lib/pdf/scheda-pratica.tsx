import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

export interface SchedaPraticaData {
  id: string;
  autoscuolaNome: string;
  classificazione: string | null;
  classificazioneReasons: string[];
  classificazioneVersione: string | null;
  classificazioneAt: Date | null;
  documentiRichiesti: { nome: string; obbligatorio: boolean }[];
  infoMancanti: string[];
  candidato: {
    nome: string | null;
    cognome: string | null;
    nascita: string | null;
  };
  patente: {
    paeseNome: string | null;
    categoria: string | null;
    dataRilascio: string | null;
    dataScadenza: string | null;
  };
  telegramLink: string;
  generataAt: Date;
}

const C = {
  indigo: "#4338ca",
  indigoDark: "#312e81",
  emerald: "#059669",
  rose: "#e11d48",
  amber: "#d97706",
  slate: "#334155",
  slateLight: "#64748b",
  slateLighter: "#94a3b8",
  bg: "#f8fafc",
  white: "#ffffff",
  border: "#e2e8f0",
};

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 36, color: C.slate, backgroundColor: C.white },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.indigo },
  appName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.indigo },
  appSub: { fontSize: 8, color: C.slateLight, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  metaText: { fontSize: 7.5, color: C.slateLighter },
  // Esito banner
  esitoBanner: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 6, marginBottom: 16 },
  esitoLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", marginRight: 8 },
  esitoSub: { fontSize: 8, marginTop: 2 },
  // Sezioni
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.slateLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: C.border },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  field: { width: "47%", marginBottom: 4 },
  fieldFull: { width: "100%", marginBottom: 4 },
  fieldLabel: { fontSize: 7, color: C.slateLighter, marginBottom: 1 },
  fieldValue: { fontSize: 8.5, color: C.slate, fontFamily: "Helvetica-Bold" },
  fieldEmpty: { fontSize: 8.5, color: C.border },
  // Lista motivazioni
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  listBullet: { width: 8, fontSize: 8, color: C.slateLight },
  listText: { flex: 1, fontSize: 8, color: C.slate },
  // Documenti
  docRow: { flexDirection: "row", alignItems: "center", padding: "4 6", marginBottom: 2, borderRadius: 4 },
  docBadge: { fontSize: 7, fontFamily: "Helvetica-Bold", paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3, marginRight: 6 },
  docName: { fontSize: 8, flex: 1 },
  // Note
  noteBox: { borderWidth: 0.5, borderColor: C.border, borderRadius: 4, padding: 8, minHeight: 40 },
  notePrompt: { fontSize: 7.5, color: C.slateLighter },
  // Footer
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6 },
  footerText: { fontSize: 7, color: C.slateLighter },
});

function fmt(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return String(d); }
}

function esitoColor(c: string | null) {
  if (c === "LIKELY_CONVERTIBLE") return { bg: "#ecfdf5", text: C.emerald, label: "Convertibile" };
  if (c === "NOT_CONVERTIBLE_EXAMS") return { bg: "#fff1f2", text: C.rose, label: "Esami richiesti" };
  return { bg: "#fffbeb", text: C.amber, label: "Da valutare" };
}

export function SchedaPraticaDocument({ data }: { data: SchedaPraticaData }) {
  const esito = esitoColor(data.classificazione);
  const ver = data.classificazioneVersione ? `v${data.classificazioneVersione}` : "";

  return (
    <Document title={`Scheda Pratica – ${data.candidato.cognome ?? ""} ${data.candidato.nome ?? ""}`} author="ConvertoPatenti">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.appName}>ConvertoPatenti</Text>
            <Text style={s.appSub}>Scheda Pratica Autoscuola</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.metaText}>{data.autoscuolaNome}</Text>
            <Text style={s.metaText}>Pratica #{data.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={s.metaText}>Generata: {fmt(data.generataAt)}</Text>
          </View>
        </View>

        {/* Esito */}
        <View style={[s.esitoBanner, { backgroundColor: esito.bg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.esitoLabel, { color: esito.text }]}>{esito.label}</Text>
            {data.classificazioneReasons.length > 0 && (
              <Text style={[s.esitoSub, { color: esito.text }]}>{data.classificazioneReasons[0]}</Text>
            )}
          </View>
          {ver ? <Text style={{ fontSize: 7.5, color: esito.text }}>{ver}</Text> : null}
        </View>

        {/* Dati candidato + patente */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Candidato</Text>
          <View style={s.grid2}>
            <Field label="Cognome" value={data.candidato.cognome} />
            <Field label="Nome" value={data.candidato.nome} />
            <Field label="Data di nascita" value={fmt(data.candidato.nascita)} />
            <Field label="Paese rilascio patente" value={data.patente.paeseNome} />
            <Field label="Categoria" value={data.patente.categoria} />
            <Field label="Data rilascio patente" value={fmt(data.patente.dataRilascio)} />
            <Field label="Scadenza patente" value={fmt(data.patente.dataScadenza)} />
          </View>
        </View>

        {/* Motivazioni */}
        {data.classificazioneReasons.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Motivazioni classificazione</Text>
            {data.classificazioneReasons.map((r, i) => (
              <View key={i} style={s.listItem}>
                <Text style={s.listBullet}>•</Text>
                <Text style={s.listText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info mancanti */}
        {data.infoMancanti.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: C.amber }]}>Informazioni mancanti</Text>
            {data.infoMancanti.map((m, i) => (
              <View key={i} style={s.listItem}>
                <Text style={[s.listBullet, { color: C.amber }]}>!</Text>
                <Text style={[s.listText, { color: C.amber }]}>{m}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Documenti richiesti */}
        {data.documentiRichiesti.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Documenti richiesti</Text>
            {data.documentiRichiesti.map((d, i) => (
              <View key={i} style={[s.docRow, { backgroundColor: i % 2 === 0 ? C.bg : C.white }]}>
                <View style={[s.docBadge, { backgroundColor: d.obbligatorio ? "#fee2e2" : "#f1f5f9", color: d.obbligatorio ? C.rose : C.slateLighter }]}>
                  <Text style={{ color: d.obbligatorio ? C.rose : C.slateLighter }}>
                    {d.obbligatorio ? "REQ" : "OPZ"}
                  </Text>
                </View>
                <Text style={s.docName}>{d.nome}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Link candidato */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Riferimenti</Text>
          <View style={s.grid2}>
            <FieldFull label="Link bot Telegram candidato" value={data.telegramLink} />
          </View>
        </View>

        {/* Note operatore */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Note operatore</Text>
          <View style={s.noteBox}>
            <Text style={s.notePrompt}>_</Text>
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

function FieldFull({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={s.fieldFull}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={value ? [s.fieldValue, { fontSize: 7.5, fontFamily: "Helvetica" }] : s.fieldEmpty}>{value ?? "—"}</Text>
    </View>
  );
}
