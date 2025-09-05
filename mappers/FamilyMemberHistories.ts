import { FamilyMemberHistory } from "fhir/r4";

export function generateFamilyMemberHistories(
  codes: any,
  members: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    family_member_history_type_name: string;
    family_member_history_type_system: string;
    effective_date_string: string;
    family_member_history_type_code: string;
    family_member_history_condition_system: string;
    family_member_history_condition_name: string;
    family_member_history_condition_code: string;
    family_member_history_type_concept_map: string;
    family_member_history_condition_concept_map: string;
  },
  patientUrl: string
) {
  return <FamilyMemberHistory>{
    resourceType: "FamilyMemberHistory",
    identifier: [
      {
        system: members.trg_source_system_name,
        value: members.trg_row_ice_id,
      },
    ],
    meta: {
      tag: [
        {
          system: "family_member_history_type_concept_map",
          code: members.family_member_history_type_concept_map,
        },
        {
          system: "family_member_history_condition_concept_map",
          code: members.family_member_history_condition_concept_map,
        },
      ],
    },
    status: "health-unknown",
    patient: {
      reference: patientUrl,
      display: "Patient",
    },
    date: members.effective_date_string,
    relationship: {
      coding: [
        {
          system: members.family_member_history_type_system,
          code: members.family_member_history_type_code,
          display: members.family_member_history_type_name,
        },
      ],
      text: members.family_member_history_type_name,
    },
    condition: [
      {
        code: {
          coding: [
            {
              system: members.family_member_history_condition_system,
              code: members.family_member_history_condition_code,
              display: members.family_member_history_condition_name,
            },
          ],
          text:
            codes[members.family_member_history_condition_name] ||
            members.family_member_history_condition_name,
        },
      },
    ],
  };
}
