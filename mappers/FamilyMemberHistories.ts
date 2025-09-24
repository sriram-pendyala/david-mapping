import { FamilyMemberHistory } from "fhir/r4";
import * as uuid from "uuid";

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
    id: uuid.v4(),
    resourceType: "FamilyMemberHistory",
    ...(members.trg_row_ice_id && {
      identifier: [
        {
          system: members.trg_source_system_name,
          value: members.trg_row_ice_id,
        },
      ],
    }),
    meta: {
      tag: [
        {
          system: "family_member_history_type_concept_map",
          code: members.family_member_history_type_concept_map || "N/A",
        },
        {
          system: "family_member_history_condition_concept_map",
          code: members.family_member_history_condition_concept_map || "N/A",
        },
      ],
    },
    status: "health-unknown",
    patient: {
      reference: patientUrl,
    },
    date: members.effective_date_string,
    relationship: {
      coding: [
        {
          system: members.family_member_history_type_system || "N/A",
          code: members.family_member_history_type_code || "N/A",
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
              system: members.family_member_history_condition_system || "N/A",
              code: members.family_member_history_condition_code || "N/A",
              display: members.family_member_history_condition_name,
            },
          ],
          text:
            codes[
              members.family_member_history_condition_name.replace(/\./g, "")
            ] || members.family_member_history_condition_name,
        },
      },
    ],
  };
}
