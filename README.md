Once the data files are properly set up, running below command will create FHIR bundles in output folder.

```
npm run start
```



document-attachments - will hold document attached, 
Folder name inside document-attachments is unique ids map to file ids from bpr data (look at constants.ts)

![1762808944030](image/README/1762808944030.png)

![1762809158955](image/README/1762809158955.png)



make sure data folder contains, appropriate JSONs in valid format with corresponding ids from bpr data (Values in the mapper)
![1762809256677](image/README/1762809256677.png)



#### Pulling data from csvs.

- Place all the csv files in folder BPR_cardio_DAVID
- Make sure all the csv files mrn column and linking data to patient.
- rename the files as below.

![1762809780108](image/README/1762809780108.png)

- run node bpr.convert
  
- you will find appropriate grouped data created in BPR_Cardio_DAVID_output like below
  ![1762809838293](image/README/1762809838293.png)


- Now in order to create FHIR bundles for above grouped data, move the necessary/all files to data folder and run the npm run start command. 
