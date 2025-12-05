import { Procedure } from "fhir/r4";
import * as uuid from "uuid";

export function generatePatientRadioTherapies(
  details: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    body_site_system: string;
    radiotherapy_technique_system: string;
    dose_quantity: string;
    radiotherapy_code: string;
    radiotherapy_start_date_string: string;
    radiotherapy_treatment_intent_code: string;
    radiotherapy_end_date_string: string;
    radiotherapy_name: string;
    dosage_unit_name: string;
    radiotherapy_treatment_intent_name: string;
    dosage_unit_system: string;
    body_site_name: string;
    radiotherapy_system: string;
    fraction: string;
    dosage_unit_code: string;
    ordered_administered_flag: string;
    body_site_code: string;
    radiotherapy_treatment_intent_system: string;
    radiotherapy_technique_code: string;
    radiotherapy_technique_name: string;
    body_site_concept_map: string;
    radiotherapy_technique_concept_map: string;
    dosage_unit_concept_map: string;
    radiotherapy_concept_map: string;
    radiotherapy_treatment_intent_concept_map: string;
  },
  patientUrl: string
) {
  const procedureExtensions = [];
  if (parseFloat(details.dose_quantity)) {
    procedureExtensions.push({
      url: "totalDoseDelivered",
      valueQuantity: {
        value: parseFloat(details.dose_quantity),
        unit: details.dosage_unit_name || "N/A",
        system: details.dosage_unit_system || "N/A",
        code: details.dosage_unit_code || "N/A",
      },
    });
  }
  if (parseInt(details.fraction)) {
    procedureExtensions.push({
      url: "numberOfFractionsDelivered",
      valuePositiveInt: details.fraction
        ? parseInt(details.fraction)
        : undefined,
    });
  }
  const procedure: Procedure = {
    id: uuid.v4(),
    resourceType: "Procedure",
    ...(details.trg_row_ice_id && {
      identifier: [
        {
          system: details.trg_source_system_name,
          value: details.trg_row_ice_id,
        },
      ],
    }),
    status: "completed",
    category: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "367336001",
          display: "Radiotherapy procedure (procedure)",
        },
        {
          system: details.radiotherapy_technique_system || "N/A",
          code: details.radiotherapy_technique_code || "N/A",
          display: details.radiotherapy_technique_name || "N/A",
        },
      ],
      text: details.radiotherapy_technique_name || "N/A",
    },
    code: {
      coding: [
        {
          system: details.radiotherapy_system || "N/A",
          code: details.radiotherapy_code || "N/A",
          display: details.radiotherapy_name || "N/A",
        },
      ],
    },
    subject: {
      reference: patientUrl,
    },
    ...((details.radiotherapy_start_date_string ||
      details.radiotherapy_end_date_string) && {
      performedPeriod: {
        start: details.radiotherapy_start_date_string
          ? new Date(details.radiotherapy_start_date_string).toISOString()
          : undefined,
        ...(details.radiotherapy_end_date_string && {
          end: details.radiotherapy_end_date_string
            ? new Date(details.radiotherapy_end_date_string).toISOString()
            : undefined,
        }),
      },
    }),
    ...(details.body_site_code && {
      bodySite: details.body_site_code
        ? [
            {
              coding: [
                {
                  system: details.body_site_system || "N/A",
                  code: details.body_site_code || "N/A",
                  display: details.body_site_name || "N/A",
                },
              ],
              text: details.body_site_name || "N/A",
            },
          ]
        : undefined,
    }),
    extension: [
      {
        url: "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-radiotherapy-dose-delivered-to-volume",
        extension: procedureExtensions,
      },
      {
        url: "ordered_administered_flag",
        valueString: details.ordered_administered_flag || "N/A",
      },
    ],
    reasonCode: [
      {
        coding: [
          {
            system: details.radiotherapy_treatment_intent_system || "N/A",
            code: details.radiotherapy_treatment_intent_code || "N/A",
            display: details.radiotherapy_treatment_intent_name || "N/A",
          },
        ],
        text: details.radiotherapy_treatment_intent_name || "N/A",
      },
    ],
    meta: {
      tag: [
        {
          system: "body_site_concept_map",
          code: details.body_site_concept_map || "N/A",
        },
        {
          system: "radiotherapy_technique_concept_map",
          code: details.radiotherapy_technique_concept_map || "N/A",
        },
        {
          system: "dosage_unit_concept_map",
          code: details.dosage_unit_concept_map || "N/A",
        },
        {
          system: "radiotherapy_concept_map",
          code: details.radiotherapy_concept_map || "N/A",
        },
        {
          system: "radiotherapy_treatment_intent_concept_map",
          code: details.radiotherapy_treatment_intent_concept_map || "N/A",
        },
      ],
    },
  };

  return procedure;
}
