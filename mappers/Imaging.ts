import { DiagnosticReport } from "fhir/r4";

export function generateImagingDiagnostics(
  resource: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    imaging_name: string;
    imaging_code: string;
    performed_date_string: string;
    imaging_system: string;
    imaging_concept_map: string;
  },
  patientUrl: string
) {
  return <DiagnosticReport>{
    resourceType: "DiagnosticReport",
    status: "final",
    identifier: [
      {
        system: resource.trg_source_system_name,
        value: resource.trg_row_ice_id,
      },
    ],
    code: {
      coding: [
        {
          system: resource.imaging_system,
          code: resource.imaging_code,
          display: resource.imaging_name,
        },
      ],
    },
    effectiveDateTime: resource.performed_date_string,
    subject: {
      reference: patientUrl,
    },
    meta: {
      tag: [
        {
          system: "imaging_concept_map",
          code: resource.imaging_concept_map,
        },
      ],
    },
    category: [
      {
        coding: [
          {
            code: "Imaging",
          },
        ],
        text: "Imaging",
      },
    ],
  };
}
