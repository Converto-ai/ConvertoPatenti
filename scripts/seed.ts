/**
 * Seed script: imports normative dataset + creates demo autoscuola + 5 demo pratiche
 * Run: npm run db:seed
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { createTelegramTokenSync } from "./utils/token-sync";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

import countriesData from "../data/countries.json";
import agreementsData from "../data/agreements.json";
import documentsConfig from "../data/documents-config.json";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedNormativeDataset() {
  console.log("Seeding normative dataset...");
  const version = countriesData.version;

  // Seed document types
  for (const dt of documentsConfig.document_types) {
    await db
      .insert(schema.tipologieDocumento)
      .values({
        codice: dt.code,
        nomeIt: dt.name_it,
        nomeEn: dt.name_en,
        istruzioniIt: dt.instructions_it,
        istruzioniEn: dt.instructions_en,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${documentsConfig.document_types.length} tipologie documento`);

  // Seed agreements — let DB generate UUID, keep a map jsonId → dbUuid
  const agreementIdMap: Record<string, string> = {};
  for (const ag of agreementsData.agreements) {
    // Check if already seeded (by paeseIso, since id is auto-generated)
    const { eq: eqOp } = await import("drizzle-orm");
    const existing = await db.query.accordiBilaterali.findFirst({
      where: eqOp(schema.accordiBilaterali.paeseIso, ag.country_iso),
      columns: { id: true },
    });
    if (existing) {
      agreementIdMap[ag.id] = existing.id;
      continue;
    }
    const [inserted] = await db
      .insert(schema.accordiBilaterali)
      .values({
        paeseIso: ag.country_iso,
        dataInizio: ag.effective_date ?? null,
        dataFine: ag.expiry_date ?? null,
        inVigore: ag.active,
        categorie: ag.categories,
        condizioneTemporale: ag.temporal_condition ?? null,
        anniDallaResidenza: ag.years_from_residency ?? null,
        richiedeEsameTeo: ag.requires_theory_exam,
        richiedeEsamePra: ag.requires_practical_exam,
        reciproco: ag.reciprocal ?? true,
        note: ag.notes ?? null,
        riferimentoNormativo: ag.legal_reference ?? null,
        versioneDataset: version,
      })
      .returning({ id: schema.accordiBilaterali.id });
    agreementIdMap[ag.id] = inserted.id;
  }
  console.log(`  ✓ ${agreementsData.agreements.length} accordi bilaterali`);

  // Seed countries — resolve accordoId via map
  for (const c of countriesData.countries as {
    iso: string;
    name_it: string;
    name_en: string;
    zone: string;
    is_eu_eea: boolean;
    has_agreement: boolean;
    agreement_id?: string;
    notes?: string;
  }[]) {
    const accordoUuid = c.agreement_id ? (agreementIdMap[c.agreement_id] ?? null) : null;
    await db
      .insert(schema.paesi)
      .values({
        codiceIso: c.iso,
        nomeIt: c.name_it,
        nomeEn: c.name_en,
        zona: c.zone,
        isEuEea: c.is_eu_eea,
        haAccordo: c.has_agreement,
        accordoId: accordoUuid,
        note: c.notes ?? null,
        versioneDataset: version,
      })
      .onConflictDoNothing();
  }
  console.log(`  ✓ ${countriesData.countries.length} paesi`);

  // Seed document requirements config
  for (const req of documentsConfig.requirements as {
    zone: string | null;
    country_iso: string | null;
    category: string | null;
    required_docs: {
      code: string;
      mandatory: boolean;
      conditional: string | null;
      order: number;
    }[];
  }[]) {
    for (const doc of req.required_docs) {
      // Find tipologia by code
      const tipologia = await db.query.tipologieDocumento.findFirst({
        where: eq(schema.tipologieDocumento.codice, doc.code),
        columns: { id: true },
      });
      if (!tipologia) {
        console.warn(`  ⚠ Tipologia not found: ${doc.code}`);
        continue;
      }
      await db
        .insert(schema.documentiRichiesti)
        .values({
          zona: req.zone,
          paeseIso: req.country_iso,
          categoria: req.category,
          tipologiaId: tipologia.id,
          obbligatorio: doc.mandatory,
          condizionale: doc.conditional,
          ordine: doc.order,
          versioneDataset: version,
        })
        .onConflictDoNothing();
    }
  }
  console.log(`  ✓ Configurazioni documenti richiesti`);
}

async function seedDemoAutoscuola() {
  console.log("Creating demo autoscuola...");

  const [autoscuola] = await db
    .insert(schema.autoscuole)
    .values({
      nome: "Autoscuola Demo Rossi",
      email: "demo@autoscuola-rossi.it",
      codiceFiscale: "RSSABC12A01H501Z",
      citta: "Milano",
      piano: "pro",
    })
    .onConflictDoNothing()
    .returning();

  if (!autoscuola) {
    // Already exists
    const existing = await db.query.autoscuole.findFirst({
      where: eq(schema.autoscuole.email, "demo@autoscuola-rossi.it"),
    });
    if (!existing) throw new Error("Failed to create autoscuola");
    console.log("  → Using existing autoscuola:", existing.id);
    return existing;
  }

  // Create admin operatore
  const passwordHash = await bcrypt.hash("Demo12345", 12);
  await db.insert(schema.operatori).values({
    autoscuolaId: autoscuola.id,
    nome: "Mario",
    cognome: "Rossi",
    email: "mario.rossi@autoscuola-rossi.it",
    passwordHash,
    ruolo: "admin",
  });

  console.log(`  ✓ Autoscuola: ${autoscuola.nome} (${autoscuola.id})`);
  console.log(
    `  ✓ Operatore: mario.rossi@autoscuola-rossi.it / Demo12345`
  );

  return autoscuola;
}

async function seedDemoPratiche(autoscuolaId: string, operatoreId: string) {
  console.log("Creating 5 demo pratiche...");

  const cases = [
    {
      // T01: Romanian (EU) - Convertible
      candidatoNome: "Ionel",
      candidatoCognome: "Popescu",
      candidatoLingua: "ro",
      paeseRilascio: "RO",
      categoriaPatente: "B",
      dataRilascioPatente: "2015-06-20",
      dataScadenzaPatente: "2030-06-20",
      patenteValida: true,
      dataPrimaResidenza: "2018-03-01",
      tipoSoggiorno: "cittadino_eu",
      stato: "completata",
    },
    {
      // T02: Moroccan (Bilateral, ante-residency) - Convertible
      candidatoNome: "Ahmed",
      candidatoCognome: "Benali",
      candidatoLingua: "ar",
      paeseRilascio: "MA",
      categoriaPatente: "B",
      dataRilascioPatente: "2016-04-10",
      dataScadenzaPatente: "2026-04-10",
      patenteValida: true,
      dataPrimaResidenza: "2019-09-15",
      tipoSoggiorno: "permesso_soggiorno",
      scadenzaPermesso: "2025-12-01",
      stato: "completata",
    },
    {
      // T03: Brazilian (no agreement) - Not convertible
      candidatoNome: "Fernanda",
      candidatoCognome: "Costa",
      candidatoLingua: "pt",
      paeseRilascio: "BR",
      categoriaPatente: "B",
      dataRilascioPatente: "2018-11-05",
      dataScadenzaPatente: "2028-11-05",
      patenteValida: true,
      dataPrimaResidenza: "2022-01-10",
      tipoSoggiorno: "permesso_soggiorno",
      scadenzaPermesso: "2025-06-30",
      stato: "completata",
    },
    {
      // T04: Moroccan - issued after residency → Not convertible
      candidatoNome: "Fatima",
      candidatoCognome: "El Idrissi",
      candidatoLingua: "ar",
      paeseRilascio: "MA",
      categoriaPatente: "B",
      dataRilascioPatente: "2021-08-20", // AFTER residency
      dataScadenzaPatente: "2031-08-20",
      patenteValida: true,
      dataPrimaResidenza: "2019-03-01",
      tipoSoggiorno: "permesso_soggiorno",
      scadenzaPermesso: "2026-03-01",
      stato: "completata",
    },
    {
      // T05: Ukrainian (bilateral, no temporal condition) - attesa candidato
      candidatoNome: null,
      candidatoCognome: null,
      candidatoLingua: "uk",
      paeseRilascio: null,
      categoriaPatente: null,
      stato: "attesa_candidato",
    },
  ];

  for (const c of cases) {
    const praticaId = crypto.randomUUID();
    const token = createTelegramTokenSync();

    await db.insert(schema.pratiche).values({
      id: praticaId,
      autoscuolaId,
      operatoreId,
      telegramToken: token,
      stato: c.stato,
      candidatoNome: c.candidatoNome ?? null,
      candidatoCognome: c.candidatoCognome ?? null,
      candidatoLingua: c.candidatoLingua ?? "it",
      paeseRilascio: c.paeseRilascio ?? null,
      categoriaPatente: c.categoriaPatente ?? null,
      dataRilascioPatente: c.dataRilascioPatente ?? null,
      dataScadenzaPatente: c.dataScadenzaPatente ?? null,
      patenteValida: c.patenteValida ?? null,
      dataPrimaResidenza: c.dataPrimaResidenza ?? null,
      tipoSoggiorno: c.tipoSoggiorno ?? null,
      scadenzaPermesso: c.scadenzaPermesso ?? null,
    });

    // Evaluate completed cases
    if (c.stato === "completata" && c.paeseRilascio) {
      const { evaluateWithDataset } = await import(
        "../src/lib/rules-engine/index"
      );
      const result = evaluateWithDataset({
        country_of_issue: c.paeseRilascio,
        license_category: c.categoriaPatente ?? null,
        license_issue_date: c.dataRilascioPatente
          ? new Date(c.dataRilascioPatente)
          : null,
        license_expiry_date: c.dataScadenzaPatente
          ? new Date(c.dataScadenzaPatente)
          : null,
        license_valid: c.patenteValida ?? null,
        italy_residency_date: c.dataPrimaResidenza
          ? new Date(c.dataPrimaResidenza)
          : null,
        permit_type:
          (c.tipoSoggiorno as
            | "permesso_soggiorno"
            | "carta_soggiorno"
            | "cittadino_eu"
            | null) ?? null,
        permit_expiry_date: c.scadenzaPermesso
          ? new Date(c.scadenzaPermesso)
          : null,
      });

      await db
        .update(schema.pratiche)
        .set({
          classificazione: result.classification,
          classificazioneReasons: result.reasons,
          documentiRichiestiOutput: result.required_documents,
          infoMancanti: result.missing_information,
          classificazioneAt: result.evaluated_at,
          classificazioneVersione: result.dataset_version,
        })
        .where(eq(schema.pratiche.id, praticaId));

      console.log(
        `  ✓ ${c.candidatoNome ?? "?"} ${c.candidatoCognome ?? "?"} (${c.paeseRilascio}) → ${result.classification}`
      );
    } else {
      console.log(`  ✓ Pratica vuota (attesa candidato)`);
    }
  }
}

async function main() {
  console.log("\n=== ConvertoPatenti Seed ===\n");

  await seedNormativeDataset();
  const autoscuola = await seedDemoAutoscuola();

  // Get operatore id
  const operatore = await db.query.operatori.findFirst({
    where: eq(schema.operatori.autoscuolaId, autoscuola.id),
    columns: { id: true },
  });

  if (!operatore) throw new Error("Operatore not found after seed");

  await seedDemoPratiche(autoscuola.id, operatore.id);

  console.log("\n✅ Seed completato!\n");
  console.log("Login demo:");
  console.log("  Email: mario.rossi@autoscuola-rossi.it");
  console.log("  Password: Demo12345\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
