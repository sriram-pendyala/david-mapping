import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const folderPath = './BPR_cardio_DAVID'; // Adjust folder name if needed
const outputFolderPath = './BPR_Cardio_DAVID_output' // Output JSON file


if (!fs.existsSync(outputFolderPath)) {
  fs.mkdirSync(outputFolderPath);
}

// Helper function to recursively lowercase all keys in an object
const lowercaseKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(lowercaseKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
    );
  }
  return obj;
};

// Function to read CSV files and convert to JSON
const readCsvFiles = async (folderPath) => {
  const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.csv'));

  const jsonObjects = [];
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileData = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator: '\t' }))
        .on('data', (row) => {
          fileData.push(lowercaseKeys(row)); // Lowercase keys for each row
        })
        .on('end', () => {
          console.log(`Finished reading ${file}`);
          jsonObjects.push({ fileName: path.parse(file).name, data: fileData });
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error reading ${file}:`, err);
          reject(err);
        });
    });
  }

  return jsonObjects;
};

// Function to group data by MRN across all files
const groupByMrn = (jsonObjects) => {
  const groupedData = {};

  jsonObjects.forEach(({ fileName, data }) => {
    data.forEach(row => {

      // console.log('Row:', row); // Debugging log to check the row structure
      const mrn = row.mrn; // Assuming 'mrn' is the column name
      if (!mrn) {
        // console.warn(`Skipping row without MRN in file ${fileName}:`, row);
        return; // Skip rows without an MRN
      }

      if (!groupedData[mrn]) {
        groupedData[mrn] = { mrn };
      }

      if (!groupedData[mrn][fileName]) {
        groupedData[mrn][fileName] = [];
      }

      groupedData[mrn][fileName].push(row);
    });
  });



  return Object.values(groupedData); // Convert the grouped object to an array
};

/**
 * 
 * @param {
  mrn: string;
  trg_source_system_name: string;
  trg_row_ice_id: string;
  note_type: string;
  note_dttm: string;
  note_line: string;
  note_text: string
 }[] --  notesArray 
 * 
 * @returns {
 mrn: string;
 name: string;
 dateTime: string;
 notes: string;
}[]}
*/
const groupNotesForMrn = (notesArray) => {
  // Group notes by note_type
  const groupedByType = notesArray.reduce((acc, note) => {
    const noteType = note.note_type;
    if (!acc[noteType]) {
      acc[noteType] = [];
    }
    acc[noteType].push(note);
    return acc;
  }, {});

  // Process each group
  return Object.keys(groupedByType).map(noteType => {
    const notesForType = groupedByType[noteType];

    // Sort by note_line to maintain order
    notesForType.sort((a, b) => {
      const lineA = parseInt(a.note_line) || 0;
      const lineB = parseInt(b.note_line) || 0;
      return lineA - lineB;
    });

    // Find the latest note_dttm
    const latestDateTime = notesForType.reduce((latest, note) => {
      const currentDate = new Date(note.note_dttm);
      const latestDate = new Date(latest);
      return currentDate > latestDate ? note.note_dttm : latest;
    }, notesForType[0].note_dttm);

    // Concatenate note_text with newlines
    const concatenatedNotes = notesForType
      .map(note => note.note_text)
      .join('\n');

    // Get MRN from the first note (should be same for all)
    const mrn = notesForType[0].mrn;

    return {
      mrn: mrn,
      name: noteType,
      dateTime: latestDateTime,
      notes: concatenatedNotes
    };
  });
};

// Main function
// (async () => {
//   try {
//     const jsonData = await readCsvFiles(folderPath);
//     const groupedData = groupByMrn(jsonData);

//     // Save the grouped data to a JSON file
//     fs.writeFileSync(outputFilePath, JSON.stringify(groupedData, null, 2)); //
//     console.log(`Grouped data saved to ${outputFilePath}`);
//   } catch (err) {
//     console.error('Error:', err);
//   }
// })();

(async () => {
  try {
    const jsonData = await readCsvFiles(folderPath);
    const groupedData = groupByMrn(jsonData); // Now an array of objects

    // Save each MRN object to its own file
    groupedData.forEach(mrnData => {
      const mrn = mrnData.mrn; // Extract the MRN value
      mrnData['notes'] = mrnData.notes ? groupNotesForMrn(mrnData.notes) : [];
      const outputFilePath = path.join(outputFolderPath, `${mrn}.json`);
      fs.writeFileSync(outputFilePath, JSON.stringify(mrnData, null, 2));
      console.log(`Saved MRN ${mrn} to ${outputFilePath}`);
    });

    console.log('All MRN files have been saved.');
  } catch (err) {
    console.error('Error:', err);
  }
})();