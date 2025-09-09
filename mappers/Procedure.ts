import { Procedure } from "fhir/r4";
import { HCPCSCodes } from "../hcpcs";

export function generateProcedure(
  codes: any,
  procedure: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    other_procedure_code: string;
    other_procedure_name: string;
    other_procedure_system: string;
    performed_date_string: string;
    other_procedure_concept_map: string;
  },
  patientUrl: string
) {
  const name = procedure.other_procedure_name
    ? HCPCSCodes.find((code) => code.code === procedure.other_procedure_name)
        ?.short_description ||
      codes[procedure.other_procedure_name] ||
      procedure.other_procedure_name
    : "N/A";

  return <Procedure>{
    resourceType: "Procedure",
    identifier: [
      {
        system: procedure.trg_source_system_name,
        value: procedure.trg_row_ice_id,
      },
    ],
    status: "completed",
    code: {
      coding: [
        {
          system: procedure.other_procedure_system || "N/A",
          code: procedure.other_procedure_code || "N/A",
          display: name,
        },
      ],
      text: name || "N/A",
    },
    subject: {
      reference: patientUrl,
    },
    performedDateTime: procedure.performed_date_string,
    meta: {
      tag: [
        {
          system: "other_procedure_concept_map",
          code: procedure.other_procedure_concept_map || "N/A",
        },
      ],
    },
  };
}
