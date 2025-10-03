import { DocumentReference, Binary } from "fhir/r4";
import * as uuid from "uuid";

export function generateDocumentReferences(
  patientUrl: string,
  d: {
    category: string;
    date: string | null;
    dId: string;
    mimeType: string;
    base64Content: string;
  }
) {
  const documentReferenceId = uuid.v4();
  const binaryId = uuid.v4();

  const documentReference: DocumentReference = {
    resourceType: "DocumentReference",
    id: documentReferenceId,
    status: "current",
    // category: [
    //   {
    //     text: d.category,
    //   },
    // ],
    subject: {
      reference: patientUrl,
    },
    identifier: [
      {
        system: "urn:ietf:rfc:3986",
        value: d.dId || "N/A",
      },
    ],
    ...(d.date && { date: d.date }),
    content: [
      {
        attachment: {
          contentType: d.mimeType || "",
          url: `Binary/${binaryId}`,
          title: d.category || "",
          ...(d.date && { creation: d.date }),
        },
      },
    ],
  };

  const binary: Binary = {
    resourceType: "Binary",
    id: binaryId,
    contentType: d.mimeType || "",
    data: d.base64Content,
  };

  return { documentReference, binary };
}
