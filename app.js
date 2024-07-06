const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
require("dotenv").config();

const pipedrive = require("pipedrive");

// const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

const apiClient = new pipedrive.ApiClient();

// Configuration parameters and credentials
let oauth2 = apiClient.authentications.oauth2;
oauth2.clientId = process.env.CLIENT_ID; // OAuth 2 Client ID
oauth2.clientSecret = process.env.CLIENT_SECRET; // OAuth 2 Client Secret
oauth2.redirectUri = process.env.REDIRECT_URI; // OAuth 2 Redirection endpoint or Callback Uri

app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);

app.use(express.json());
app.use(cors());

// app.use(express.static(path.join(__dirname, "/add_work_client/build")));

app.get("/", async (req, res) => {
  if (
    req.session.accessToken !== null &&
    req.session.accessToken !== undefined
  ) {
    // token is already set in the session
    // now make API calls as required
    // client will automatically refresh the token when it expires and call the token update callback
    const api = new pipedrive.DealsApi(apiClient);
    const deals = await api.getDeals();

    res.send(deals);
  } else {
    const authUrl = apiClient.buildAuthorizationUrl();

    res.redirect(authUrl);
  }
});

app.get("/api/v2/callback", (req, res) => {
  const authCode = req.query.code;
  const promise = apiClient.authorize(authCode);

  console.log(authCode);
  promise.then(
    () => {
      req.session.accessToken = apiClient.authentications.oauth2.accessToken;
      console.log(req.session.accessToken);
      res.redirect("/");
    },
    (exception) => {
      // error occurred, exception will be of type src/exceptions/OAuthProviderException
    }
  );
});

// app.get("*", (req, res) => {
//   res.sendFile(
//     path.resolve(__dirname, "./add_work_client/build", "index.html")
//   );
// });

app.listen(5000, (err) => {
  console.log(err ? err : "running... ");
});
