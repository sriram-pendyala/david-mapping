import { Observation, MolecularSequence } from "fhir/r4";
import * as uuid from "uuid";

export function generatePatientMolecularSequencing(
  details: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    effective_date_string: string;
    genetic_test_id: string;
    quantity_comparator: string;
    sequencing_type_code: string;
    sequencing_type_name: string;
    sequencing_type_system: string;
    sequencing_unit_code: string;
    sequencing_unit_name: string;
    sequencing_unit_system: string;
    sequencing_value_code: string;
    sequencing_value_name: string;
    sequencing_value_quantity: string;
    sequencing_value_system: string;
    method_code: string;
    method_system: string;
    method_name: string;
    sequencing_type_concept_map: string;
    sequencing_unit_concept_map: string;
    sequencing_value_concept_map: string;
    method_concept_map: string;
  },
  patientUrl: string
) {
  const molecularSequenceId = uuid.v4();
  const observationId = uuid.v4();

  const observation: Observation = {
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
    id: observationId,
    category: [
      {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "laboratory",
            display: "Laboratory",
          },
        ],
        text: "Laboratory",
      },
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "81247-9",
          display: "Molecular genetics study report panel",
        },
      ],
      text: "Molecular genetics study report panel",
    },
    subject: {
      reference: patientUrl,
    },
    derivedFrom: [
      {
        reference: `urn:uuid:${molecularSequenceId}`,
      },
    ],
    meta: {
      tag: [
        {
          system: "sequencing_type_concept_map",
          code: details.sequencing_type_concept_map || "N/A",
        },
        {
          system: "sequencing_unit_concept_map",
          code: details.sequencing_unit_concept_map || "N/A",
        },
        {
          system: "sequencing_value_concept_map",
          code: details.sequencing_value_concept_map || "N/A",
        },
        {
          system: "method_concept_map",
          code: details.method_concept_map || "N/A",
        },
      ],
    },
    ...(details.sequencing_value_quantity && {
      valueQuantity: {
        value: parseFloat(details.sequencing_value_quantity),
        comparator: (details.quantity_comparator as any) || undefined,
        unit: details.sequencing_unit_name || "N/A",
        system: details.sequencing_unit_system || "N/A",
        code: details.sequencing_unit_code || "N/A",
      },
    }),
    ...(!details.sequencing_value_quantity && {
      valueCodeableConcept: {
        coding: [
          {
            system: details.sequencing_value_system || "N/A",
            code: details.sequencing_value_code || "N/A",
            display: details.sequencing_value_name || "N/A",
          },
        ],
        text: details.sequencing_value_name || "N/A",
      },
    }),
    method: {
      coding: [
        {
          system: details.method_system || "N/A",
          code: details.method_code || "N/A",
          display: details.method_name || "N/A",
        },
      ],
      text: details.method_name || "N/A",
    },
  };

  const molecularSequence: MolecularSequence = {
    resourceType: "MolecularSequence",
    id: molecularSequenceId,
    identifier: [
      {
        system: details.trg_source_system_name,
        value: details.trg_row_ice_id,
      },
      {
        system: "tempus",
        value: details.genetic_test_id || "N/A",
      },
    ],
    extension: [
      {
        url: "http://hl7.org/fhir/us/mcode/StructureDefinition/mcode-sequencing-type",
        valueCoding: {
          system: details.sequencing_type_system || "N/A",
          code: details.sequencing_type_code || "N/A",
          display: details.sequencing_type_name || "N/A",
        },
      },
    ],
    meta: {
      tag: [
        {
          system: "sequencing_type_concept_map",
          code: details.sequencing_type_concept_map || "N/A",
        },
        {
          system: "sequencing_unit_concept_map",
          code: details.sequencing_unit_concept_map || "N/A",
        },
        {
          system: "sequencing_value_concept_map",
          code: details.sequencing_value_concept_map || "N/A",
        },
        {
          system: "method_concept_map",
          code: details.method_concept_map || "N/A",
        },
      ],
    },
    patient: {
      reference: patientUrl,
    },
    quality: [
      {
        type: "unknown",
        method: {
          coding: [
            {
              system: details.method_system || "N/A",
              code: details.method_code || "N/A",
              display: details.method_name || "N/A",
            },
          ],
          text: details.method_name || "N/A",
        },
      },
    ],
    coordinateSystem: 0,
  };

  return { observation, molecularSequence };
}
