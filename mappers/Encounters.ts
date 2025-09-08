import { Encounter } from "fhir/r4";
export function generateEncounters(
  encounter: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    effective_date_string: string;
    encounter_system: string;
    encounter_name: string;
    encounter_code: string;
    encounter_concept_map: string;
  },
  patientUrl: string
) {
  return <Encounter>{
    resourceType: "Encounter",
    identifier: [
      {
        system: encounter.trg_source_system_name,
        value: encounter.trg_row_ice_id,
      },
    ],
    class: {
      system: encounter.encounter_system || "N/A",
      code: encounter.encounter_code || "N/A",
      display: encounter.encounter_name,
    },
    meta: {
      tag: [
        {
          system: "encounter_concept_map",
          code: encounter.encounter_concept_map || "N/A",
        },
      ],
    },
    status: "unknown",
    type: [
      {
        coding: [
          {
            system: encounter.encounter_system || "N/A",
            code: encounter.encounter_code || "N/A",
            display: encounter.encounter_name,
          },
        ],
        text: encounter.encounter_name,
      },
    ],
    period: {
      start: encounter.effective_date_string,
    },
    subject: {
      reference: patientUrl,
      display: "Patient",
    },
  };
}
