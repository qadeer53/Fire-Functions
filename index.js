const { storage } = require("./config/firebase");
const Jimp = require("jimp");
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const app = express();
global.__basedir = __dirname;
const fileupload = require("express-fileupload");
// File uploading
app.use(fileupload({ useTempFiles: true }));
// Set static folder
app.use(express.static(path.join(__basedir + "public")));

app.post("/upload", async (req, res) => {
  if (req.files == undefined) {
    return res
      .status(404)
      .json({ success: false, message: "Please Upload a File" });
  } else {
    let signedUrl;
    Jimp.read(req.files.file?.tempFilePath, async (error, file) => {
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      } else {
        let name = `${uuidv4()}.png`;
        await file.write(__basedir + "/uploads/" + name);
        var filePath = `test/${name}`;
        await storage
          .bucket("gs://react-todolist-3fd5a.appspot.com")
          .upload(__basedir + "/uploads/" + name, {
            destination: filePath,
            // gzip: true,
            resumable: false,
            metadata: {
              metadata: {
                contentType: file._originalMime,
              },
            },
          });

        signedUrl = `https://firebasestorage.googleapis.com/v0/b/react-todolist-3fd5a.appspot.com/o/test%2F${name}?alt=media&token=dbe4ff0f-93cc-484c-9c29-84ee66cbc385`;

        res.status(200).json({
          success: true,
          data: signedUrl,
        });
      }
    });
  }
});

app.listen(5002, () => {
  console.log("App listening on port 5002!");
});
