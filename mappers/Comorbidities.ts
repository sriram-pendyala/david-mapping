import { Condition } from "fhir/r4";
import * as uuid from "uuid";

export function generateCamorbidities(
  codes: any,
  comorbidities: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    onset_date_string: string;
    comorbidity_system: string;
    comorbidity_class_name: string;
    comorbidity_status_code: string;
    comorbidity_class_system: string;
    comorbidity_class_code: string;
    comorbidity_status_name: string;
    comorbidity_code: string;
    comorbidity_name: string;
    comorbidity_status_system: string;
    comorbidity_concept_map: string;
    comorbidity_class_concept_map: string;
    comorbidity_status_concept_map: string;
  },
  patientUrl: string
) {
  return <Condition>{
    id: uuid.v4(),
    resourceType: "Condition",
    ...(comorbidities.trg_row_ice_id && {
      identifier: [
        {
          system: comorbidities.trg_source_system_name,
          value: comorbidities.trg_row_ice_id,
        },
      ],
    }),
    ...(comorbidities.onset_date_string && {
      onsetDateTime: comorbidities.onset_date_string,
    }),
    code: {
      coding: [
        {
          system: comorbidities.comorbidity_system || "N/A",
          code: comorbidities.comorbidity_code || "N/A",
          display: comorbidities.comorbidity_name,
        },
      ],
      text:
        codes[comorbidities.comorbidity_code.replace(/\./g, "")] ||
        comorbidities.comorbidity_name,
    },
    category: [
      {
        text:
          Number(comorbidities.comorbidity_class_code) &&
          Number(comorbidities.comorbidity_class_code) === 1
            ? "Primary"
            : "Secondary",
      },
    ],
    clinicalStatus: {
      coding: [
        {
          system: comorbidities.comorbidity_status_system || "N/A",
          code: comorbidities.comorbidity_status_code || "N/A",
          display: comorbidities.comorbidity_status_name,
        },
      ],
    },
    subject: {
      reference: patientUrl,
    },
    meta: {
      tag: [
        {
          system: "comorbidity_concept_map",
          code: comorbidities.comorbidity_concept_map || "N/A",
        },
        {
          system: "comorbidity_class_concept_map",
          code: comorbidities.comorbidity_class_concept_map || "N/A",
        },
        {
          system: "comorbidity_status_concept_map",
          code: comorbidities.comorbidity_status_concept_map || "N/A",
        },
      ],
    },
  };
}
