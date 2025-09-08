import { Appointment } from "fhir/r4";

export function generateEncounterSchedule(
  encounter_schedules: {
    trg_source_system_name: string;
    trg_row_ice_id: string;
    schedule_status_code: string;
    effective_date_string: string;
    schedule_name: string;
    schedule_code: string;
    schedule_system: string;
    schedule_status_system: string;
    schedule_status_name: string;
    schedule_concept_map: string;
    schedule_status_concept_map: string;
  },
  patientUrl: string
) {
  return <Appointment>{
    resourceType: "Appointment",
    identifier: [
      {
        system: encounter_schedules.trg_source_system_name,
        value: encounter_schedules.trg_row_ice_id,
      },
    ],
    meta: {
      tag: [
        {
          system: "schedule_concept_map",
          code: encounter_schedules.schedule_concept_map,
        },
        {
          system: "schedule_status_concept_map",
          code: encounter_schedules.schedule_status_concept_map,
        },
      ],
    },
    status: [
      "proposed",
      "pending",
      "booked",
      "arrived",
      "fulfilled",
      "cancelled",
      "noshow",
      "entered-in-error",
      "checked-in",
      "waitlist",
    ].includes(encounter_schedules.schedule_status_name.toLowerCase())
      ? encounter_schedules.schedule_status_name.toLowerCase()
      : "proposed",
    description: encounter_schedules.schedule_name,
    ...(encounter_schedules.effective_date_string && {
      start: new Date(encounter_schedules.effective_date_string).toISOString(),
      end: new Date(encounter_schedules.effective_date_string).toISOString(),
    }),
    participant: [
      {
        actor: {
          reference: patientUrl,
          display: "Patient",
        },
        status: "accepted",
      },
    ],
    serviceType: [
      {
        coding: [
          {
            system: encounter_schedules.schedule_system || "N/A",
            code: encounter_schedules.schedule_code || "N/A",
            display: encounter_schedules.schedule_name,
          },
        ],
      },
    ],
  };
}
