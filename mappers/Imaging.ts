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
    ...(resource.trg_row_ice_id && {
      identifier: [
        {
          system: resource.trg_source_system_name,
          value: resource.trg_row_ice_id,
        },
      ],
    }),
    code: {
      coding: [
        {
          system: resource.imaging_system || "N/A",
          code: resource.imaging_code || "N/A",
          display: resource.imaging_name,
        },
      ],
    },
    ...(resource.performed_date_string && {
      effectiveDateTime: new Date(resource.performed_date_string).toISOString(),
    }),
    subject: {
      reference: patientUrl,
    },
    meta: {
      tag: [
        {
          system: "imaging_concept_map",
          code: resource.imaging_concept_map || "N/A",
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
