import { Patient } from "fhir/r4";
import * as uuid from "uuid";

export function generatePatient(demographics: {
  trg_source_system_name: string;
  trg_row_ice_id: string;
  gender_system: string;
  state: string;
  date_of_birth_string: string;
  gender_code: string;
  race_code: string;
  ethnicity_code: string;
  family_name: string;
  postal_code: string;
  first_name: string;
  race_name: string;
  ethnicity_system: string;
  date_of_death_string: string;
  gender_name: string;
  ethnicity_name: string;
  deceased: string;
  race_system: string;
  mrn: string;
  gender_concept_map: string;
  ethnicity_concept_map: string;
  race_concept_map: string;
}) {
  const patient: Patient = {
    resourceType: "Patient",
    id: uuid.v4(),
    identifier: demographics.trg_row_ice_id
      ? [
          {
            system: demographics.trg_source_system_name,
            value: demographics.trg_row_ice_id,
          },
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            value: demographics.mrn,
          },
        ]
      : [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            value: demographics.mrn,
          },
        ],
    meta: {
      tag: [
        {
          system: "gender_concept_map",
          code: demographics.gender_concept_map || "N/A",
        },
        {
          system: "ethnicity_concept_map",
          code: demographics.ethnicity_concept_map || "N/A",
        },
        {
          system: "race_concept_map",
          code: demographics.race_concept_map || "N/A",
        },
      ],
    },
    extension: [
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-sex",
        valueCoding: {
          system: demographics.gender_system || "N/A",
          code: demographics.gender_code || "N/A",
          display: demographics.gender_name,
        },
      },
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
        valueCoding: {
          system: demographics.race_system || "N/A",
          code: demographics.race_code || "N/A",
          display: demographics.race_name,
        },
      },
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethinicity",
        valueCoding: {
          system: demographics.ethnicity_system || "N/A",
          code: demographics.ethnicity_code || "N/A",
          display: demographics.ethnicity_name,
        },
      },
    ],
    address: [
      {
        state: demographics.state,
        postalCode: demographics.postal_code,
      },
    ],
    ...(demographics.date_of_birth_string && {
      birthDate: demographics.date_of_birth_string,
    }),
    ...(demographics.date_of_death_string && {
      deceasedDateTime: demographics.date_of_death_string,
    }),
    ...(!demographics.date_of_death_string && {
      deceasedBoolean: !!demographics.deceased,
    }),
    name: [
      {
        family: demographics.family_name,
        given: [demographics.first_name],
      },
    ],
  };

  return patient;
}
