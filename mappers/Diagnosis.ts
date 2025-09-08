import { Condition } from "fhir/r4";
import { text } from "stream/consumers";

export function generateDiagnosis(
  codes: any,
  diagnosisData: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    diagnosis_system: string;
    diagnosis_code: string;
    diagnosis_id: string;
    diagnosis_status_code: string;
    diagnosis_status_system: string;
    onset_date_string: string;
    diagnosis_status_name: string;
    diagnosis_class_system: string;
    diagnosis_name: string;
    diagnosis_class_code: string;
    diagnosis_class_name: string;
    diagnosis_concept_map: string;
    diagnosis_status_concept_map: string;
    diagnosis_class_concept_map: string;
  },
  patientUrl: string
) {
  return <Condition>{
    resourceType: "Condition",
    identifier: [
      {
        system: diagnosisData.trg_source_system_name,
        value: diagnosisData.trg_row_ice_id,
      },
    ],
    code: {
      coding: [
        {
          system: diagnosisData.diagnosis_system || "N/A",
          code: diagnosisData.diagnosis_code || "N/A",
          display: diagnosisData.diagnosis_name,
        },
      ],
      text: codes[diagnosisData.diagnosis_name] || diagnosisData.diagnosis_name,
    },
    onsetDateTime: diagnosisData.onset_date_string,
    clinicalStatus: {
      coding: [{}],
      text: diagnosisData.diagnosis_status_name,
    },
    category: [
      {
        coding: [
          {
            system: diagnosisData.diagnosis_class_system || "N/A",
            code: diagnosisData.diagnosis_class_code || "N/A",
          },
        ],
        text: diagnosisData.diagnosis_class_name,
      },
    ],
    meta: {
      tag: [
        {
          system: "diagnosis_concept_map",
          code: diagnosisData.diagnosis_concept_map || "N/A",
        },
        {
          system: "diagnosis_status_concept_map",
          code: diagnosisData.diagnosis_status_concept_map || "N/A",
        },
        {
          system: "diagnosis_class_concept_map",
          code: diagnosisData.diagnosis_class_concept_map || "N/A",
        },
      ],
    },
    subject: { reference: patientUrl },
  };
}
