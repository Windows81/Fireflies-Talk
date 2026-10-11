import { create } from "zustand";

/* import { Logger } from "@/logger";
import * as Contacts from "expo-contacts";
import { captureException, getErrorMessage } from "@/errors";
const logger = new Logger("contacts-store"); */

interface PhoneContactsState {
  //contacts: Contacts.Contact[] | null;
  contacts: null;
  permissionDenied: boolean | null;
  loadContacts: () => Promise<void>;
}

export const usePhoneContacts = create<PhoneContactsState>(() => ({
  contacts: null,
  permissionDenied: null,
  loadContacts: async () => {
    /* try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Image,
            Contacts.Fields.Name,
          ],
        });

        if (data.length > 0) {
          set({ contacts: data, permissionDenied: false });
        }
      } else {
        set({ permissionDenied: true });
      }
    } catch (error) {
      logger.error(error);
      captureException(
        new Error(getErrorMessage(error, "phone_contacts: load")),
        {
          tags: {
            section: "phone-contacts-store",
          },
          fingerprint: [`{{ default }}`, String(error.code || error.message)],
        },
      );
      throw error;
    } */
  },
}));
