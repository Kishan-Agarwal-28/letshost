import {
  VerifaliaRestClient,
  BearerAuthenticator,
} from "verifalia/node/esm/index.mjs";
import domains from "./tempmail.json" with { type: "json" };
import validator from "validator";

export const checkEmail = async (email) => {
  if (!validator.isEmail(email)) {
    throw new Error("Invalid email address");
  }
  if (domains.includes(email.split("@")[1])) {
    throw new Error("Email is disposable");
  } else {
    const verifalia = new VerifaliaRestClient({
      authenticator: new BearerAuthenticator(
        "admin@letshost.dpdns.org",
        "QijDEh1TazBsnaB"
      ),
    });
    const result = await verifalia.emailValidations.submit(email);
    const entry = result.entries[0];
    if (entry.classification === "Deliverable" || entry.status === "Success") {
      return true;
    } else {
      throw new Error("Email is not deliverable");
    }
  }
};
