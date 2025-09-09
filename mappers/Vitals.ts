import { Observation } from "fhir/r4";

export function generatePatientVitals(
  details: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    vitals_value_code: string;
    effective_date_string: string;
    vitals_type_code: string;
    vitals_type_name: string;
    quantity_unit_code: string;
    vitals_type_system: string;
    vitals_value_system: string;
    quantity_unit_system: string;
    vitals_value_name: string;
    vitals_value_quantity: string;
    quantity_unit_name: string;
    vitals_type_concept_map: string;
    quantity_unit_concept_map: string;
  },
  patientUrl: string
) {
  return <Observation>{
    resourceType: "Observation",
    identifier: [
      {
        system: details.trg_source_system_name,
        value: details.trg_row_ice_id,
      },
    ],
    status: "final",
    ...(details.effective_date_string && {
      effectiveDateTime: details.effective_date_string,
    }),
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
        text: "Vital Signs",
      },
    ],
    code: {
      coding: [
        {
          system: details.vitals_type_system || "N/A",
          code: details.vitals_type_code || "N/A",
          display:
            details.vitals_type_name || details.vitals_type_code || "N/A",
        },
      ],
      text: details.vitals_type_name || details.vitals_type_code || "N/A",
    },
    subject: {
      reference: patientUrl,
    },
    valueQuantity: {
      value: details.vitals_value_quantity
        ? parseFloat(details.vitals_value_quantity)
        : undefined,
      unit: details.quantity_unit_name || "N/A",
      system: details.quantity_unit_system || "N/A",
      code: details.quantity_unit_code || "N/A",
    },
    meta: {
      tag: [
        {
          system: "vitals_type_concept_map",
          code: details.vitals_type_concept_map || "N/A",
        },
        {
          system: "vitals_value_concept_map",
          code: details.vitals_value_system || "N/A",
        },
        {
          system: "quantity_unit_concept_map",
          code: details.quantity_unit_concept_map || "N/A",
        },
      ],
    },
  };
}
