import { loadCodes } from "./load_codes.js";
import { Worker } from "worker_threads";
import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";

const generateBundlesFromDocuments = true;
const hasAllPatientDemographicsInSingleJSON = true;

async function generatePatientBundlesFromMetadata() {
  const codes = await loadCodes();

  const dataDir = "./data";
  if (hasAllPatientDemographicsInSingleJSON) {
    const jsonFilePath = "./patient_encounters_results.json";
    await loadDemographicsFromJSON(jsonFilePath);
  }

  const files = await fs.readdir(dataDir);
  const dataFiles = files.filter((file) => file.endsWith(".json"));

  console.log(`Found ${dataFiles.length} files to process`);

  const CONCURRENCY = 10;

  for (let i = 0; i < dataFiles.length; i += CONCURRENCY) {
    const batch = dataFiles.slice(i, i + CONCURRENCY);

    // Start up to CONCURRENCY workers in parallel
    const workers = batch.map((filename) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker("./worker.ts", {
          execArgv: ["--loader", "ts-node/esm"],
          workerData: {
            filepath: path.join(dataDir, filename),
            filename: filename,
            icdCodes: codes,
          },
        });

        worker.on("message", (result) => {
          console.log(`Completed processing: ${filename}`);
          resolve({ filename, result });
        });

        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });

    // Wait for this batch to finish before starting the next
    const results = await Promise.all(workers);

    try {
      console.log("All files processed successfully");
      const outputDir = "./output";
      await fs.mkdir(outputDir, { recursive: true });

      for (const { filename, result } of results as any[]) {
        if (result.result === null) {
          console.log(`No result for file: ${filename}, skipping write.`);
          continue;
        }
        console.log("%%%%%", JSON.stringify(result).substring(0, 200));
        const outputFilePath = path.join(
          outputDir,
          `${path.parse(filename).name}-bundle.json`
        );
        await fs.writeFile(
          outputFilePath,
          JSON.stringify(result, null, 2),
          "utf8"
        );
        console.log(`Written bundle to ${outputFilePath}`);
      }
      return results;
    } catch (error) {
      console.error("Error processing files:", error);
    }
  }
}

async function generatePatientBundlesFromDocuments() {
  const dataDir = "./document-attachments";

  const files = await fs.readdir(dataDir);
  const dataFiles = files.filter((file) => !file.includes("."));

  // create a json object with status like { filename: false }
  const fileStatus = dataFiles.reduce((acc, filename) => {
    acc[filename] = false;
    return acc;
  }, {} as Record<string, boolean>);

  console.log("Generating patient bundles from documents...");
  if (hasAllPatientDemographicsInSingleJSON) {
    const jsonFilePath = "./patient_encounters_results.json";
    await loadDemographicsFromJSON(jsonFilePath);
  }

  console.log(`Found ${dataFiles.length} files to process`);

  const CONCURRENCY = 10;

  for (let i = 0; i < dataFiles.length; i += CONCURRENCY) {
    const batch = dataFiles.slice(i, i + CONCURRENCY);
    // Start up to CONCURRENCY workers in parallel
    const workers = batch.map((filename) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker("./worker.ts", {
          execArgv: ["--loader", "ts-node/esm"],
          workerData: {
            filepath: path.join(dataDir, filename),
            filename: filename,
            generateBundlesFromDocuments: true,
          },
        });

        worker.on("message", (result) => {
          console.log(`Completed processing: ${filename}`);
          resolve({ filename, result });
        });

        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
      });
    });

    // Wait for this batch to finish before starting the next
    const results = await Promise.all(workers);

    try {
      console.log("All files processed successfully");
      const outputDir = "./output";
      await fs.mkdir(outputDir, { recursive: true });

      console.log(
        "Writing output files...",
        results.map((r: any) => ({
          fileName: r.filename,
        }))
      );
      for (const { filename, result } of results as any[]) {
        if (result.result === null) {
          console.log(`No result for file: ${filename}, skipping write.`);
          continue;
        }
        console.log("Writing output for file:", filename);
        const outputFilePath = path.join(
          outputDir,
          `${path.parse(filename).name}-bundle.json`
        );
        await writeJSONStreamChunked(outputFilePath, result.result);
        fileStatus[filename] = true;
        console.log(`Written bundle to ${outputFilePath}`);
      }

      console.log("File processing status:", fileStatus);
    } catch (error) {
      console.error("Error processing files:", error);
    }
  }
}

async function loadDemographicsFromJSON(jsonFilePath: string): Promise<void> {
  try {
    const data = await fs.readFile(jsonFilePath, "utf8");
    const demographicsRaw = JSON.parse(data).flat();

    for (const item of demographicsRaw) {
      // Convert to DemographicsData format
      const demographicsData = {
        clinical_domain: {
          demographics: [
            {
              first_name: item.firstName,
              family_name: item.lastName,
              date_of_birth_string: item.dob,
              gender_name: item.gender,
              mrn: item.patientLinkageId,
              trg_source_system_name: "",
              gender_system: "custom.gender",
              state: "",
              gender_code: "",
              race_code: "",
              ethnicity_code: "",
              race_name: "",
              postal_code: "",
              ethnicity_system: "",
              date_of_death_string: "",
              ethnicity_name: "",
              race_system: "",
              gender_concept_map: "",
              ethnicity_concept_map: "",
              race_concept_map: "",
            },
          ],
        },
      };
      const outPath = path.join("./data/", `${item.patientLinkageId}.json`);
      await fs.writeFile(
        outPath,
        JSON.stringify(demographicsData, null, 2),
        "utf8"
      );
      console.log(`Created file: ${outPath}`);
    }
  } catch (err) {
    console.error("Error processing JSON:", err);
  }
}

async function writeJSONStreamChunked(
  filePath: string,
  data: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath);

    stream.on("error", reject);
    stream.on("finish", resolve);

    // Write in smaller chunks
    const writeChunk = (obj: any, indent = 0) => {
      const indentStr = " ".repeat(indent);

      if (Array.isArray(obj)) {
        stream.write("[\n");
        obj.forEach((item, index) => {
          if (index > 0) stream.write(",\n");
          stream.write(indentStr + "  ");
          writeChunk(item, indent + 2);
        });
        stream.write(`\n${indentStr}]`);
      } else if (obj && typeof obj === "object") {
        stream.write("{\n");
        const keys = Object.keys(obj);
        keys.forEach((key, index) => {
          if (index > 0) stream.write(",\n");
          stream.write(`${indentStr}  "${key}": `);
          writeChunk(obj[key], indent + 2);
        });
        stream.write(`\n${indentStr}}`);
      } else {
        try {
          stream.write(JSON.stringify(obj));
        } catch (err) {
          stream.write('"[VALUE_TOO_LARGE]"');
        }
      }
    };

    writeChunk(data);
    stream.end();
  });
}

if (generateBundlesFromDocuments) {
  console.time("generatePatientBundlesFromDocuments");
  console.log("Generating patient bundles from documents...");
  await generatePatientBundlesFromDocuments();
  console.timeEnd("generatePatientBundlesFromDocuments");
  console.log("Finished generating patient bundles from documents.");
} else {
  await generatePatientBundlesFromMetadata();
}
