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
import { generatePatientMedications } from "./mappers/Medication";
import { generateProcedure } from "./mappers/Procedure";
import { generatePatientVitals } from "./mappers/Vitals";
import { generatePatientMolecularSequencing } from "./mappers/MolecularSequencing";
import { generatePatientRadioTherapies } from "./mappers/RadioTherapies";

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
  const demographics =
    data.clinical_domain?.demographics.at(0) || data.demographics.at(0);
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
  const diagnoses = (
    ((data.clinical_domain?.diagnoses || data.diagnoses || []) as any[]) || []
  )
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
  const assessments = (
    ((data.clinical_domain?.assessments || data?.assessments || []) as any[]) ||
    []
  )
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
  const comorbidities = (
    ((data.clinical_domain?.comorbidities ||
      data.comorbidities ||
      []) as any[]) || []
  )
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
  const encounters = (
    ((data.clinical_domain?.encounter_schedules ||
      data.encounter_schedules ||
      []) as any[]) || []
  )
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
  const encounterEntries = (
    ((data.clinical_domain?.encounters || data.encounters || []) as any[]) || []
  )
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
    ((data.clinical_domain?.family_member_history ||
      data.family_member_history ||
      []) as any[]) || []
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
  const imagings = (
    ((data.clinical_domain?.imagings || data.imagings || []) as any[]) || []
  )
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

  // // Insert Labs
  // const labsDetails = (
  //   ((data.clinical_domain?.labs || data.labs || []) as any[]) || []
  // )
  //   .map((lab) => generatePatientLab(lab, patientUrl))
  //   .map(({ labObservation, labReport }) => {
  //     const observationId = `urn:uuid:${uuid.v4()}`;
  //     return [
  //       {
  //         fullUrl: observationId,
  //         request: {
  //           method: "POST" as any,
  //           url: "Observation",
  //         },
  //         resource: labObservation,
  //       },
  //       {
  //         fullUrl: `urn:uuid:${uuid.v4()}`,
  //         request: {
  //           method: "POST" as any,
  //           url: "DiagnosticReport",
  //         },
  //         resource: {
  //           ...labReport,
  //           result: [{ reference: observationId }],
  //         },
  //       },
  //     ];
  //   })
  //   .flat();

  // if (bundle && labsDetails.length > 0) bundle.entry?.push(...labsDetails);

  // Insert medications

  const medications = (
    ((data.clinical_domain?.medications || data.medications || []) as any[]) ||
    []
  )
    .map((med) => generatePatientMedications(med, patientUrl))
    .map((medication) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: medication.resourceType,
      },
      resource: medication,
    }));

  if (bundle && medications.length > 0) {
    bundle.entry?.push(...medications);
  }

  // Insert other diagnosis
  const otherDiagnoses = (
    ((data.clinical_domain?.other_diagnoses ||
      data.other_diagnoses ||
      []) as any[]) || []
  )
    .map((diagnosis) =>
      generateDiagnosis(
        codes,
        {
          trg_source_system_name: diagnosis.trg_source_system_name,
          trg_row_ice_id: diagnosis.trg_row_ice_id,
          diagnosis_system: diagnosis.other_diagnosis_system || "N/A",
          diagnosis_code: diagnosis.other_diagnosis_code || "N/A",
          diagnosis_id: diagnosis.diagnosis_id || "N/A",
          diagnosis_status_code: diagnosis.other_diagnosis_status_code,
          diagnosis_status_system: diagnosis.other_diagnosis_status_system,
          onset_date_string: diagnosis.onset_date_string,
          diagnosis_status_name: diagnosis.other_diagnosis_status_name,
          diagnosis_class_system: diagnosis.other_diagnosis_class_system,
          diagnosis_name: diagnosis.other_diagnosis_name,
          diagnosis_class_code: diagnosis.other_diagnosis_class_code,
          diagnosis_class_name: diagnosis.other_diagnosis_class_name,
          diagnosis_concept_map: diagnosis.other_diagnosis_concept_map,
          diagnosis_status_concept_map:
            diagnosis.other_diagnosis_status_concept_map,
          diagnosis_class_concept_map:
            diagnosis.other_diagnosis_class_concept_map,
        },
        patientUrl
      )
    )
    .map((diag) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Condition",
      },
      resource: diag,
    }));

  if (bundle && otherDiagnoses.length > 0) {
    bundle.entry?.push(...otherDiagnoses);
  }

  //Insert Procedures
  const procedures = (
    ((data.clinical_domain?.other_procedures ||
      data.other_procedures ||
      []) as any[]) || []
  )
    .map((procedure) => generateProcedure(codes, procedure, patientUrl))
    .map((proc) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Procedure",
      },
      resource: proc,
    }));

  if (bundle && procedures.length > 0) {
    bundle.entry?.push(...procedures);
  }

  // Insert Vitals
  const vitals = (
    ((data.clinical_domain?.vitals || data.vitals || []) as any[]) || []
  )
    .map((vital) => generatePatientVitals(vital, patientUrl))
    .map((observation) => {
      const observationId = `urn:uuid:${uuid.v4()}`;
      return {
        fullUrl: observationId,
        request: {
          method: "POST" as any,
          url: "Observation",
        },
        resource: observation,
      };
    });

  if (bundle && vitals.length > 0) bundle.entry?.push(...vitals);

  // Insert surgeries
  const surgeries = (
    ((data.clinical_domain?.surgeries || data.surgeries || []) as any[]) || []
  )
    .map((surgery) =>
      generateProcedure(
        codes,
        {
          trg_source_system_name: surgery.trg_source_system_name,
          trg_row_ice_id: surgery.trg_row_ice_id,
          other_procedure_code: surgery.surgery_code || "N/A",
          other_procedure_name: surgery.surgery_name || "N/A",
          other_procedure_system: surgery.surgery_system || "N/A",
          performed_date_string: surgery.performed_date_string,
          other_procedure_concept_map: surgery.surgery_concept_map || "N/A",
        },
        patientUrl
      )
    )
    .map((surgery) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Procedure",
      },
      resource: surgery,
    }));

  if (bundle && surgeries.length > 0) {
    bundle.entry?.push(...surgeries);
  }

  // Insert Molecular Sequencing
  const molecularSequencings = (
    ((data.clinical_domain?.molecular_sequencings ||
      data.molecular_sequencings ||
      []) as any[]) || []
  )
    .map((molecular) =>
      generatePatientMolecularSequencing(molecular, patientUrl)
    )
    .map(({ molecularSequence, observation }) => [
      {
        fullUrl: `urn:uuid:${molecularSequence.id}`,
        request: {
          method: "POST" as any,
          url: "MolecularSequence",
        },
        resource: molecularSequence,
      },
      {
        fullUrl: `urn:uuid:${observation.id}`,
        request: {
          method: "POST" as any,
          url: "Observation",
        },
        resource: observation,
      },
    ])
    .flat();

  // Insert Radio Therapies
  const radioTherapies = (
    ((data.clinical_domain?.radiotherapies ||
      data.radiotherapies ||
      []) as any[]) || []
  )
    .map((radio) => generatePatientRadioTherapies(radio, patientUrl))
    .map((radio) => ({
      fullUrl: `urn:uuid:${uuid.v4()}`,
      request: {
        method: "POST" as any,
        url: "Procedure",
      },
      resource: radio,
    }));

  if (bundle && radioTherapies.length > 0) {
    bundle.entry?.push(...radioTherapies);
  }

  if (bundle && molecularSequencings.length > 0) {
    bundle.entry?.push(...molecularSequencings);
  }

  return bundle;
}
processFile();
