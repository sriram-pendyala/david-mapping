import JSZip from "jszip";

export async function loadCodes() {
  const response = await fetch(
    "https://www.cms.gov/files/zip/2026-code-descriptions-tabular-order.zip"
  );
  const buffer = await response.arrayBuffer();

  const zip = await JSZip.loadAsync(buffer);

  let data = [];

  for (const filename of Object.keys(zip.files).filter(
    (name) => name.endsWith(".txt") && name === "icd10cm_codes_2026.txt"
  )) {
    const file = zip.files[filename];
    if (!file.dir) {
      const text = await file.async("text");
      console.log(`Contents of ${filename}:\n`);
      console.log(text.slice(0, 1000)); // preview first 1000 chars
      data.push(text);
    }
  }

  const codesText = data[0] || null;

  if (!codesText) {
    return {};
  }

  const lines = codesText.split("\n");
  const codes = lines.reduce((acc, line, index) => {
    const [code, description] = line.split(/\s{2,}/);

    if (code && description) {
      acc[code] = description;
    }
    return acc;
  }, {} as Record<string, string>);

  return codes;
}
