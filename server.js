import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import azureStorage from "azure-storage";
import intoStream from "into-stream";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const port = process.env.PORT || 7001;
const instance = new express();

const containerName = "test2";

const __dirname = path.dirname(__filename);
dotenv.config();
instance.use(
  fileUpload({
    createParentPath: true,
  })
);

const blobService = azureStorage.createBlobService(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

instance.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

instance.post("/fileupload", (request, response) => {
  if (!request.files) {
    return res.status(400).send("No files are received.");
  }

  const file = request.files.file;
  const path = __dirname + "/files/" + file.name;
  file.mv(path, (err) => {
    if (err) {
      return response.status(500).send(err);
    }
    return response.send({ status: "success", path: path });
  });
});

instance.post("/blobupload", (request, response) =>  {
  if (!request.files) {
    return res.status(400).send("No files are received.");
  }

  const blobName = request.files.file.name;
  const stream = intoStream(request.files.file.data);
  const streamLength = request.files.file.data.length;  

  blobService.createBlockBlobFromStream(
    containerName,
    blobName,
    stream,
    streamLength,
    (err) => {
      if (err) {
        response.status(500).send({ message: err});
        console.log(`File Not Uploaded`);
        return;
      }

      response.status(200).send({message: 'File Uploaded Successfully', data: {"url" : "https://weucartimages.blob.core.windows.net/" + containerName + "/" + blobName}});
      console.log(`File Uploaded on azure`);

    }
  );

 

});

instance.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});