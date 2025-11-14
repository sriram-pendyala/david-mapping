import { loadCodes } from "./load_codes.js";
import { Worker } from "worker_threads";
import fs from "fs/promises";
import path from "path";

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
          JSON.stringify(result.result, null, 2),
          "utf8"
        );
        console.log(`Written bundle to ${outputFilePath}`);
      }
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

if (generateBundlesFromDocuments) {
  console.time("generatePatientBundlesFromDocuments");
  console.log("Generating patient bundles from documents...");
  await generatePatientBundlesFromDocuments();
  console.timeEnd("generatePatientBundlesFromDocuments");
  console.log("Finished generating patient bundles from documents.");
} else {
  await generatePatientBundlesFromMetadata();
}
