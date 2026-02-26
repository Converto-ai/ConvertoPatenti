import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { PraticaPDFData } from "./generator";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  headerLeft: {},
  appName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerMeta: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "40%",
    color: "#6b7280",
    fontSize: 9,
  },
  value: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  classificationBox: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  classificationText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  reasonItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 12,
    color: "#6b7280",
  },
  reasonText: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
  },
  docItem: {
    flexDirection: "row",
    marginBottom: 5,
    padding: 5,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  docMandatory: {
    width: 14,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
  },
  docName: {
    flex: 1,
    fontSize: 9,
  },
  docNote: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 1,
  },
  warningBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fbbf24",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
});

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("it-IT");
  } catch {
    return d;
  }
}

function classificationColor(c: string | null): string {
  if (c === "LIKELY_CONVERTIBLE") return "#dcfce7";
  if (c === "NOT_CONVERTIBLE_EXAMS") return "#fee2e2";
  return "#fef3c7";
}

function classificationLabel(c: string | null): string {
  if (c === "LIKELY_CONVERTIBLE") return "✓ PROBABILE CONVERTIBILITÀ";
  if (c === "NOT_CONVERTIBLE_EXAMS") return "✗ ESAMI NECESSARI";
  if (c === "NEEDS_REVIEW") return "⚠ REVISIONE MANUALE";
  return "—";
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function PraticaPDFDocument({ data }: { data: PraticaPDFData }) {
  const generatedAt = new Date().toLocaleString("it-IT");

  return (
    <Document
      title={`Pratica ${data.candidato.nome ?? ""} ${data.candidato.cognome ?? ""} - ConvertoPatenti`}
      author="ConvertoPatenti"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>ConvertoPatenti</Text>
            <Text style={styles.headerMeta}>
              {data.autoscuolaNome} • Scheda pratica conversione patente
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerMeta}>
              Generato: {generatedAt}
            </Text>
            <Text style={styles.headerMeta}>
              ID: {data.id.slice(0, 8)}...
            </Text>
            {data.classificazioneVersione && (
              <Text style={styles.headerMeta}>
                Dataset v{data.classificazioneVersione}
              </Text>
            )}
          </View>
        </View>

        {/* Classificazione */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Classificazione</Text>
          <View
            style={[
              styles.classificationBox,
              { backgroundColor: classificationColor(data.classificazione) },
            ]}
          >
            <Text style={styles.classificationText}>
              {classificationLabel(data.classificazione)}
            </Text>
          </View>

          {data.classificazioneReasons.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Helvetica-Bold",
                  marginBottom: 4,
                  color: "#374151",
                }}
              >
                Motivazioni:
              </Text>
              {data.classificazioneReasons.map((r, i) => (
                <View key={i} style={styles.reasonItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {data.infoMancanti.length > 0 && (
            <View style={styles.warningBox}>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Helvetica-Bold",
                  color: "#92400e",
                  marginBottom: 3,
                }}
              >
                Informazioni mancanti:
              </Text>
              {data.infoMancanti.map((m, i) => (
                <Text key={i} style={{ fontSize: 9, color: "#92400e" }}>
                  • {m}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Dati candidato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dati candidato</Text>
          <DataRow
            label="Nome completo"
            value={
              [data.candidato.nome, data.candidato.cognome]
                .filter(Boolean)
                .join(" ") || "—"
            }
          />
          <DataRow
            label="Data di nascita"
            value={formatDate(data.candidato.nascita)}
          />
        </View>

        {/* Dati patente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dati patente</Text>
          <DataRow
            label="Paese rilascio"
            value={data.patente.paeseNome ?? data.patente.paeseRilascio ?? "—"}
          />
          <DataRow label="Categoria" value={data.patente.categoria ?? "—"} />
          <DataRow
            label="Data rilascio"
            value={formatDate(data.patente.dataRilascio)}
          />
          <DataRow
            label="Data scadenza"
            value={formatDate(data.patente.dataScadenza)}
          />
          <DataRow
            label="Validità"
            value={
              data.patente.valida === true
                ? "Valida"
                : data.patente.valida === false
                ? "Scaduta"
                : "Non specificata"
            }
          />
        </View>

        {/* Dati residenza */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dati residenza / soggiorno</Text>
          <DataRow
            label="Prima residenza in Italia"
            value={formatDate(data.residenza.dataPrimaResidenza)}
          />
          <DataRow
            label="Tipo soggiorno"
            value={
              data.residenza.tipoSoggiorno?.replace(/_/g, " ") ?? "—"
            }
          />
          <DataRow
            label="Scadenza permesso"
            value={formatDate(data.residenza.scadenzaPermesso)}
          />
        </View>

        {/* Documenti richiesti */}
        {data.documentiRichiesti.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Documenti da richiedere ({data.documentiRichiesti.length})
            </Text>
            {data.documentiRichiesti.map((doc) => (
              <View key={doc.doc_id} style={styles.docItem}>
                <Text style={styles.docMandatory}>
                  {doc.obbligatorio ? "●" : "○"}
                </Text>
                <View>
                  <Text style={styles.docName}>{doc.nome}</Text>
                  {doc.note && (
                    <Text style={styles.docNote}>{doc.note}</Text>
                  )}
                </View>
              </View>
            ))}
            <Text
              style={{
                fontSize: 7,
                color: "#9ca3af",
                marginTop: 4,
              }}
            >
              ● = obbligatorio · ○ = condizionale
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            ConvertoPatenti — {data.autoscuolaNome}
          </Text>
          <Text style={styles.footerText}>
            Documento generato automaticamente. Pre-classificazione a supporto — verifica finale a cura dell'operatore.
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
