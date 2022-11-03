const admin = require("firebase-admin");

var serviceAccount = require("../react-todolist-3fd5a-firebase-adminsdk-wicrb-9ead35fd6f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// firebase utils
const db = admin.firestore();
const firestore = admin
  .firestore()
  .settings({ ignoreUndefinedProperties: true });
const auth = admin.auth();
const storage = admin.storage();

module.exports = {
  admin,
  auth,
  db,
  firestore,
  storage,
};
