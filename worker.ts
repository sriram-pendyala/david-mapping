import { parentPort, workerData } from "worker_threads";
import fs from "fs/promises";
import { generatePatient } from "./mappers/Patient";
import { Bundle } from "fhir/r4";
import { generateDiagnosis } from "./mappers/Diagnosis";
import * as uuid from "uuid";
import { generateAssessment } from "./mappers/Assessment";
import { generateCamorbidities } from "./mappers/Comorbidities";
import { generateEncounterSchedule } from "./mappers/EncounterSchedule";
import { generateEncounters } from "./mappers/Encounters";
import { generateFamilyMemberHistories } from "./mappers/FamilyMemberHistories";
import { generateImagingDiagnostics } from "./mappers/Imaging";
import { generatePatientLab } from "./mappers/Labs";

async function processFile() {
  const { filepath, filename, icdCodes } = workerData;

  try {
    // Read the file
    const content = await fs.readFile(filepath, "utf8");

    // Process the file based on its type
    const result = processJsonFile(content, filename, icdCodes);

    // Send result back to main thread
    parentPort?.postMessage(result);
  } catch (error) {
    parentPort?.postMessage({
      filename,
      success: false,
      error: (error as any).message,
    });
  }
}

function processJsonFile(content: string, filename: string, codes: any[]) {
  const data = JSON.parse(content);
  // Add your JSON processing logic here
  const demographics = data.clinical_domain.demographics.at(0);
  const patientId = data.patient_tempus_id || uuid.v4();
  let bundle: Bundle | null = null;
  if (!demographics) {
    throw new Error(`No demographics data found in file: ${filename}`);
  }
  const patient = generatePatient(demographics);
  const patientUrl = `urn:uuid:${patientId}`;
  bundle = {
    resourceType: "Bundle",
    type: "transaction",
    entry: [
      {
        fullUrl: patientUrl,
        request: {
          method: "POST",
          url: "Patient",
        },
        resource: patient,
      },
    ],
  };

  // Insert diagnosis.
  const diagnoses = ((data.clinical_domain.diagnoses as any[]) || [])
    .map((diagnosis) => generateDiagnosis(codes, diagnosis, patientUrl))
    .map((diag) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Condition",
      },
      resource: diag,
    }));

  if (bundle && diagnoses.length > 0) {
    bundle.entry?.push(...diagnoses);
  }

  // Insert Assessments.
  const assessments = ((data.clinical_domain.assessments as any[]) || [])
    .map((assessment) => generateAssessment(assessment, patientUrl))
    .map((assessment) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Observation",
      },
      resource: assessment,
    }));

  if (bundle && assessments.length > 0) {
    bundle.entry?.push(...assessments);
  }

  // Insert Comorbidities.
  const comorbidities = ((data.clinical_domain.comorbidities as any[]) || [])
    .map((comorbidity) => generateCamorbidities(comorbidity, patientUrl))
    .map((comorbidity) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Condition",
      },
      resource: comorbidity,
    }));

  if (bundle && comorbidities.length > 0) {
    bundle.entry?.push(...comorbidities);
  }

  // Insert Encounter_schedules
  const encounters = ((data.clinical_domain.encounter_schedules as any[]) || [])
    .map((encounter) => generateEncounterSchedule(encounter, patientUrl))
    .map((encounter) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Appointment",
      },
      resource: encounter,
    }));

  if (bundle && encounters.length > 0) {
    bundle.entry?.push(...encounters);
  }

  // Insert Encounters.
  const encounterEntries = ((data.clinical_domain.encounters as any[]) || [])
    .map((encounter) => generateEncounters(encounter, patientUrl))
    .map((encounter) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Encounter",
      },
      resource: encounter,
    }));

  if (bundle && encounterEntries.length > 0) {
    bundle.entry?.push(...encounterEntries);
  }

  // Insert Family Member History.

  const familyMembers = (
    (data.clinical_domain.family_member_history as any[]) || []
  )
    .map((member) => generateFamilyMemberHistories(codes, member, patientUrl))
    .map((member) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "FamilyMemberHistory",
      },
      resource: member,
    }));

  if (bundle && familyMembers.length > 0) {
    bundle.entry?.push(...familyMembers);
  }

  // Insert imagings DIAGNOSTICS
  const imagings = ((data.clinical_domain.imagings as any[]) || [])
    .map((imaging) => generateImagingDiagnostics(imaging, patientUrl))
    .map((imaging) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "DiagnosticReport",
      },
      resource: imaging,
    }));

  if (bundle && imagings.length > 0) {
    bundle.entry?.push(...imagings);
  }

  // Insert Labs
  const labsDetails = ((data.clinical_domain.labs as any[]) || [])
    .map((lab) => generatePatientLab(lab, patientUrl))
    .map(({ labObservation, labReport }) => {
      const observationId = `urn:uuid:${uuid.v4()}`;
      return [
        {
          fullUrl: observationId,
          request: {
            method: "POST" as any,
            url: "Observation",
          },
          resource: labObservation,
        },
        {
          fullUrl: `urn:uuid:${uuid.v4()}`,
          request: {
            method: "POST" as any,
            url: "DiagnosticReport",
          },
          resource: {
            ...labReport,
            result: [{ reference: observationId }],
          },
        },
      ];
    })
    .flat();

  if (bundle && labsDetails.length > 0) bundle.entry?.push(...labsDetails);

  return bundle;
}
processFile();
