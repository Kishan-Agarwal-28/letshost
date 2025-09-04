import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";

import { encryptJSON, decryptJSON } from "@/lib/encrypt";
import { immer } from "zustand/middleware/immer";
import type {
  Base64URLString,
  CredentialDeviceType,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/browser";
export interface ICDn {
  cdnProjectID: string;
  filename: string;
  fileType: "image" | "video" | "js" | "css";
  currentVersion: number;
  previousVersion: number;
  size: number;
  bucketAssigned: "cdn" | "cloudinary";
  relativePath: string;
  isTransformActive: boolean;
  transformLimit: number;
  secureUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
type Passkey = {
  id: Base64URLString;
  publicKey: Uint8Array;

  user: IUser;

  webauthnUserID: Base64URLString;

  counter: number;
  deviceType: CredentialDeviceType;
  backedUp: boolean;

  transports?: AuthenticatorTransportFuture[];
};
export interface IUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  oauth: {
    providers: Array<{
      providerName: string;
      sub: string;
    }>;
  };
  subdomains: Array<{
    subDomain: string;
    public: boolean;
    projectID: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  SDLimit: number;
  tier: "free" | "pro";
  fileLimit: number;
  cdns: Array<ICDn> | [];
  cdnCSSJSlimit: number;
  cdnMedialimit: number;
  totalMediaSize: number;
  totalJsCssSize: number;
  genCredits: number;
  apiKey: string;
  fullName: string;
  description: string;
  location: string;
  coverImage: string;
  links: Array<{
    socialPlatform: string;
    url: string;
  }>;
  isCreator: boolean;
  verificationToken: string;
  verificationTokenExpiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
  refreshToken: string;
  isVerified: boolean;
  TwoFAEnabled: boolean;
  TwoFAverified: boolean;
  PassKey?: Passkey;
  TwoFAchallenge?: string;
}

interface IStore {
  user: string | null; // encrypted string or null
  hydrated: boolean;
  setUser: (user: IUser) => Promise<void>;
  getUser: () => Promise<IUser | null>;
  deleteUser: () => void;
  updateUser: (updatedFields: Partial<IUser>) => Promise<void>;
  setHydrated: () => void;
}

export const encryptUserData = async (user: IUser) => {
  const encrypted = await encryptJSON(user);
  return encrypted; // string
};

export const decryptUserData = async (encrypted: string) => {
  const decrypted = await decryptJSON(encrypted);
  return decrypted as IUser; // cast as IUser
};

export const useUserStore = create<IStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        hydrated: false,

        // Set user encrypts the data first, then stores encrypted string
        setUser: async (user: IUser) => {
          const encrypted = await encryptUserData(user);
          set({ user: encrypted });
        },

        // Get user decrypts the stored encrypted string if exists
        getUser: async () => {
          const encryptedUser = get().user;
          if (!encryptedUser) return null;
          const decryptedUser = await decryptUserData(encryptedUser);
          return decryptedUser;
        },

        // Deletes user by setting to null
        deleteUser: () => {
          set({ user: null });
        },

        // Updates partial user data by decrypting -> merging -> encrypting -> storing
        updateUser: async (updatedFields: Partial<IUser>) => {
          const encryptedUser = get().user;
          if (!encryptedUser){
            get().setUser(updatedFields as IUser);
            return;
          }

          const user = await decryptUserData(encryptedUser);
          const updatedUser: IUser = {
            ...user,
            ...updatedFields,
          };
          const encrypted = await encryptUserData(updatedUser);
          set({ user: encrypted });
        },

        setHydrated: () => {
          set({ hydrated: true });
        },
      })),
      {
        name: "User",
        storage: createJSONStorage(() => localStorage),
        onRehydrateStorage: () => {
          return (state, error) => {
            if (!error && state) {
              state.setHydrated();
            }
          };
        },
      }
    )
  )
);
