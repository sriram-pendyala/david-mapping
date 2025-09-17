import { MedicationAdministration, MedicationRequest } from "fhir/r4";

export function generatePatientMedications(
  details: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    dosage_quantity: string;
    ordered_administered_flag: string;
    medication_end_date_string: string;
    dosage_unit_name: string;
    dosage_unit_system: string;
    medication_name: string;
    administration_route_system: string;
    medication_start_date_string: string;
    dosage_timing_repeat_count: string;
    medication_code: string;
    administration_route_name: string;
    medication_system: string;
    administration_route_code: string;
    dosage_unit_code: string;
    dosage_unit_concept_map: string;
    administration_route_concept_map: string;
    medication_concept_map: string;
  },
  patientUrl: string
) {
  if (
    ["medicationordered", "medicationprescribed", "medicationrequest"].includes(
      details.ordered_administered_flag.toLowerCase()
    )
  ) {
    return <MedicationRequest>{
      resourceType: "MedicationRequest",
      ...(details.trg_row_ice_id && {
        identifier: [
          {
            system: details.trg_source_system_name,
            value: details.trg_row_ice_id,
          },
        ],
      }),
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        coding: [
          {
            system: details.medication_system || "N/A",
            code: details.medication_code || "N/A",
            display: details.medication_name,
          },
        ],
      },
      subject: {
        reference: patientUrl,
      },
      ...(details.medication_start_date_string && {
        authoredOn: new Date(
          details.medication_start_date_string
        ).toISOString(),
      }),

      dosageInstruction: [
        {
          patientInstruction: details.dosage_timing_repeat_count || "",
          ...(details.dosage_quantity &&
            Number(details.dosage_quantity) && {
              doseAndRate: [
                {
                  doseQuantity: {
                    value: Number(details.dosage_quantity),
                    unit: details.dosage_unit_name,
                    system: details.dosage_unit_system || "N/A",
                    code: details.dosage_unit_code || "N/A",
                  },
                },
              ],
            }),
          ...((details.dosage_timing_repeat_count ||
            details.medication_start_date_string ||
            details.medication_end_date_string) && {
            timing: {
              repeat: {
                frequency:
                  Number(details.dosage_timing_repeat_count) || undefined,
                boundsPeriod: {
                  start: details.medication_start_date_string
                    ? new Date(
                        details.medication_start_date_string
                      ).toISOString()
                    : undefined,
                  end: details.medication_end_date_string
                    ? new Date(details.medication_end_date_string).toISOString()
                    : undefined,
                },
              },
            },
          }),
          ...(details.administration_route_name && {
            route: {
              coding: [
                {
                  system: details.administration_route_system || "N/A",
                  code: details.administration_route_code || "N/A",
                  display: details.administration_route_name,
                },
              ],
            },
          }),
        },
      ],
      meta: {
        tag: [
          {
            system: "dosage_unit_concept_map",
            code: details.dosage_unit_concept_map || "N/A",
          },
          {
            system: "administration_route_concept_map",
            code: details.administration_route_concept_map || "N/A",
          },
          {
            system: "medication_concept_map",
            code: details.medication_concept_map || "N/A",
          },
        ],
      },
    };
  } else {
    return <MedicationAdministration>{
      resourceType: "MedicationAdministration",
      ...(details.trg_row_ice_id && {
        identifier: [
          {
            system: details.trg_source_system_name,
            value: details.trg_row_ice_id,
          },
        ],
      }),
      category: {
        coding: [
          {
            code: details.medication_code || "N/A",
            system: details.medication_system || "N/A",
            display: details.medication_name,
          },
        ],
        text: details.medication_name,
      },
      status: "completed",
      medicationCodeableConcept: {
        coding: [
          {
            system: details.medication_system || "N/A",
            code: details.medication_code || "N/A",
            display: details.medication_name,
          },
        ],
      },
      subject: {
        reference: patientUrl,
      },
      ...(details.medication_start_date_string &&
        !details.medication_end_date_string && {
          effectiveDateTime: new Date(
            details.medication_start_date_string
          ).toISOString(),
        }),
      ...(details.medication_start_date_string &&
        details.medication_end_date_string && {
          effectivePeriod: {
            start: new Date(details.medication_start_date_string).toISOString(),
            end: new Date(details.medication_end_date_string).toISOString(),
          },
        }),

      dosage: {
        text: details.dosage_timing_repeat_count || "",
        ...(details.dosage_quantity &&
          Number(details.dosage_quantity) && {
            dose: {
              value: Number(details.dosage_quantity),
              unit: details.dosage_unit_name,
              system: details.dosage_unit_system || "N/A",
              code: details.dosage_unit_code || "N/A",
            },
          }),
        ...(details.administration_route_name && {
          route: {
            coding: [
              {
                system: details.administration_route_system || "N/A",
                code: details.administration_route_code || "N/A",
                display: details.administration_route_name,
              },
            ],
          },
        }),
      },
      meta: {
        tag: [
          {
            system: "dosage_unit_concept_map",
            code: details.dosage_unit_concept_map || "N/A",
          },
          {
            system: "administration_route_concept_map",
            code: details.administration_route_concept_map || "N/A",
          },
          {
            system: "medication_concept_map",
            code: details.medication_concept_map || "N/A",
          },
        ],
      },
    };
  }
}
