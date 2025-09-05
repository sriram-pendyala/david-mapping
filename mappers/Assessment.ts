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
            code: assessment.assessment_value_code,
            system: assessment.assessment_value_system,
          },
        ],
      },
    }),
    ...(assessment.assessment_value_quantity && {
      valueQuantity: {
        system: assessment.quantity_unit_system,
        code: assessment.quantity_unit_code,
        unit: assessment.quantity_unit_name,
        value: assessment.assessment_value_quantity,
      },
    }),
    code: {
      coding: [
        {
          system: assessment.assessment_type_system,
          code: assessment.assessment_type_code,
          display: assessment.assessment_type_name,
        },
      ],
    },
    issued: assessment.assessment_date,
    effectiveDateTime: assessment.effective_date_string,
    subject: {
      reference: patientUrl,
    },
    meta: {
      tag: [
        {
          system: "quantity_unit_concept_map",
          code: assessment.quantity_unit_concept_map,
        },
        {
          system: "assessment_value_concept_map",
          code: assessment.assessment_value_concept_map,
        },
        {
          system: "assessment_type_concept_map",
          code: assessment.assessment_type_concept_map,
        },
      ],
    },
  };
}
