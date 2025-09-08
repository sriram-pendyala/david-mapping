import { DiagnosticReport, Observation } from "fhir/r4";

export function generatePatientLab(
  details: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    effective_date_string: string;
    quantity_unit_code: string;
    lab_type_name: string;
    lab_value_code: string;
    lab_value_name: string;
    lab_type_system: string;
    quantity_unit_name: string;
    lab_value_quantity: string;
    lab_type_code: string;
    quantity_comparator: string;
    quantity_unit_system: string;
    lab_value_system: string;
    lab_type_concept_map: string;
    quantity_unit_concept_map: string;
    lab_value_concept_map: string;
  },
  patientUrl: string
) {
  const labObservation: Observation = {
    resourceType: "Observation",
    id: `observation-${details.trg_row_ice_id}`,
    identifier: [
      {
        system: details.trg_source_system_name,
        value: details.trg_row_ice_id,
      },
    ],
    ...(details.effective_date_string && {
      effectiveDateTime: new Date(details.effective_date_string).toISOString(),
    }),
    meta: {
      tag: [
        {
          system: "lab_type_concept_map",
          code: details.lab_type_concept_map || "N/A",
        },
        {
          system: "quantity_unit_concept_map",
          code: details.quantity_unit_concept_map || "N/A",
        },
        {
          system: "lab_value_concept_map",
          code: details.lab_value_concept_map || "N/A",
        },
      ],
    },
    ...(details.lab_value_quantity && {
      valueQuantity: {
        system: details.quantity_unit_system || "N/A",
        code: details.quantity_unit_code || "N/A",
        unit: details.quantity_unit_name,
        value: Number(details.lab_value_quantity),
        comparator: details.quantity_comparator as any,
      },
    }),
    ...(!details.lab_value_quantity && {
      valueCodeableConcept: {
        coding: [
          {
            display: details.lab_value_name,
            code: details.lab_value_code || "N/A",
            system: details.lab_type_system || "N/A",
          },
        ],
      },
    }),
    code: {
      coding: [
        {
          system: details.lab_type_system,
          code: details.lab_type_code || "N/A",
          display: details.lab_type_name || "N/A",
        },
      ],
    },
    status: "final",
  };
  const labReport: DiagnosticReport = {
    resourceType: "DiagnosticReport",
    id: `diagnosticreport-${details.trg_row_ice_id}`,
    identifier: [
      {
        system: details.trg_source_system_name,
        value: details.trg_row_ice_id,
      },
    ],
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "LAB",
            display: "Laboratory",
          },
        ],
        text: "Laboratory",
      },
      {
        coding: [
          {
            system: details.lab_type_system || "N/A",
            code: details.lab_type_code || "N/A",
            display: details.lab_type_name,
          },
        ],
        text: details.lab_type_name,
      },
    ],
    code: {
      coding: [
        {
          system: details.lab_type_system || "N/A",
          code: details.lab_type_code || "N/A",
          display: details.lab_type_name,
        },
      ],
    },
    subject: {
      reference: patientUrl,
    },
    ...(details.effective_date_string && {
      effectiveDateTime: new Date(details.effective_date_string).toISOString(),
    }),
    ...(details.effective_date_string && {
      issued: new Date(details.effective_date_string).toISOString(),
    }),
    result: [
      {
        reference: `Observation/observation-${details.trg_row_ice_id}`,
      },
    ],
  };

  return { labObservation, labReport };
}
