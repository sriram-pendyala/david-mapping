import { Observation } from "fhir/r4";

export function generateAssessment(
  assessment: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    assessment_value_name: string;
    assessment_value_code: string;
    quantity_unit_name: string;
    quantity_unit_system: string;
    quantity_unit_code: string;
    assessment_type_code: string;
    assessment_type_name: string;
    assessment_value_quantity: string;
    assessment_date: string;
    effective_date_string: string;
    assessment_value_system: string;
    assessment_type_system: string;
    quantity_unit_concept_map: string;
    assessment_value_concept_map: string;
    assessment_type_concept_map: string;
  },
  patientUrl: string
) {
  return <Observation>{
    resourceType: "Observation",
    identifier: [
      {
        system: assessment.trg_source_system_name,
        value: assessment.trg_row_ice_id,
      },
    ],
    ...(!assessment.assessment_value_quantity && {
      valueCodeableConcept: {
        coding: [
          {
            display: assessment.assessment_value_name,
            code: assessment.assessment_value_code || "N/A",
            system: assessment.assessment_value_system || "N/A",
          },
        ],
      },
    }),
    ...(assessment.assessment_value_quantity && {
      valueQuantity: {
        system: assessment.quantity_unit_system || "N/A",
        code: assessment.quantity_unit_code || "N/A",
        unit: assessment.quantity_unit_name,
        value: Number(assessment.assessment_value_quantity),
      },
    }),
    code: {
      coding: [
        {
          system: assessment.assessment_type_system || "N/A",
          code: assessment.assessment_type_code || "N/A",
          display: assessment.assessment_type_name,
        },
      ],
    },
    ...(assessment.assessment_date && {
      issued: new Date(assessment.assessment_date).toISOString(),
    }),
    ...(assessment.effective_date_string && {
      effectiveDateTime: new Date(
        assessment.effective_date_string
      ).toISOString(),
    }),
    subject: {
      reference: patientUrl,
    },
    status: "unknown",
    meta: {
      tag: [
        {
          system: "quantity_unit_concept_map",
          code: assessment.quantity_unit_concept_map || "N/A",
        },
        {
          system: "assessment_value_concept_map",
          code: assessment.assessment_value_concept_map || "N/A",
        },
        {
          system: "assessment_type_concept_map",
          code: assessment.assessment_type_concept_map || "N/A",
        },
      ],
    },
  };
}
