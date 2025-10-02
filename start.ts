import { loadCodes } from "./load_codes.js";
import { Worker } from "worker_threads";
import fs from "fs/promises";
import path from "path";
import clipboardy from "clipboardy";

async function generatePatientBundles() {
  const codes = await loadCodes();

  // Read files from data directory
  const dataDir = "./data";
  const files = await fs.readdir(dataDir);

  // Filter for relevant files (adjust extensions as needed)
  const dataFiles = files.filter((file) => file.endsWith(".json"));

  console.log(`Found ${dataFiles.length} files to process`);

  // Process files in parallel using worker threads
  const workers = dataFiles.map((filename) => {
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
        resolve(result);
      });

      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  });

  try {
    const results = await Promise.all(workers);
    console.log("All files processed successfully");
    const outputDir = "./output";
    await fs.mkdir(outputDir, { recursive: true });

    for (const { filename, result } of results as any[]) {
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
    // clipboardy.writeSync(JSON.stringify(results, null, 2));
    // console.log("copy complete");
    // results.forEach((res) => {
    //   console.log(`Results: `);
    //   console.log(JSON.stringify(res));
    // });
    return results;
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

generatePatientBundles();
