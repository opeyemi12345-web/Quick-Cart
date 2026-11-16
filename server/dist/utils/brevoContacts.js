"use strict";
// brevoContacts.ts server/src/utils/brevoContacts.ts
// Adds newsletter subscribers to (and removes them from) your Brevo contacts.
// Then you can send them a newsletter from Brevo's website: Campaigns -> Create an email campaign.
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeContact = exports.addContact = void 0;
// STEP 24 (part 2): Brevo contacts
const env_1 = require("../config/env");
const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";
// One request to Brevo's contacts API. Like sendEmail, it NEVER throws: if Brevo is down or not set up,
// the subscriber is still saved in OUR database, and the problem is only logged.
const brevoContacts = async (method, url, body) => {
    if (!env_1.env.brevoApiKey) {
        console.log(`(Brevo contacts skipped: no BREVO_API_KEY in .env) ${method} ${url}`);
        return;
    }
    try {
        const response = await fetch(url, {
            method,
            headers: {
                "api-key": env_1.env.brevoApiKey,
                "content-type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(body),
        });
        // 201 = created, 204 = updated: both are fine
        if (!response.ok) {
            console.error(`Brevo contacts refused (${response.status}):`, await response.text());
        }
    }
    catch (error) {
        console.error("Could not reach Brevo:", error.message);
    }
};
// The list in Brevo, e.g. 3 (from BREVO_LIST_ID). No list = the contact is saved without a list.
const listIds = () => (env_1.env.brevoListId ? [env_1.env.brevoListId] : undefined);
// Subscribe: create the contact, or update it if it already exists, and allow emails again.
const addContact = (email) => brevoContacts("POST", BREVO_CONTACTS_URL, {
    email,
    listIds: listIds(),
    updateEnabled: true,
    emailBlacklisted: false,
});
exports.addContact = addContact;
// Unsubscribe: "blacklisted" = Brevo will never send this contact a campaign.
const removeContact = (email) => brevoContacts("PUT", `${BREVO_CONTACTS_URL}/${encodeURIComponent(email)}`, { emailBlacklisted: true });
exports.removeContact = removeContact;
