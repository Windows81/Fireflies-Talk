import { storage } from "@/features/storage";
import { getTimeZone } from "@/utils/device";
import { getCookie } from "@/utils/web-cookie";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import type { ParamList } from "src/screens/types";

// https://github.com/firefliesai/dashboard-ff/blob/a1cd66aa6040b7dddf648c30bb595aab3c3d4542/client/shared/helpers/browserHelper.js#L23
function serializeUTMReferral({
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
}: {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}) {
  let utm = "";
  if (utmSource) utm += `utmSource=${utmSource}|`;
  if (utmMedium) utm += `utmMedium=${utmMedium}|`;
  if (utmCampaign) utm += `utmCampaign=${utmCampaign}|`;
  if (utmTerm) utm += `utmTerm=${utmTerm}|`;
  if (utmContent) utm += `utmContent=${utmContent}`;
  return utm;
}

function getAndPersistSiteReferral() {
  const storedSiteReferral = storage.getItem("siteReferral");
  if (storedSiteReferral) return storedSiteReferral;
  try {
    // https://github.com/firefliesai/dashboard-ff/blob/a1cd66aa6040b7dddf648c30bb595aab3c3d4542/client/shared/helpers/browserHelper.js#L82
    const heapCookie = getCookie("_hp5_meta.960461493");
    if (!heapCookie) return undefined;
    const obj = JSON.parse(heapCookie);
    const mostLikelyKey = Object.values(obj?.sessionProperties || {}).find(
      (val) => typeof val === "string" && val.includes("."),
    );
    const siteReferral = obj?.sessionProperties?.referrer || mostLikelyKey;
    if (
      siteReferral.includes("fireflies.ai") ||
      siteReferral.includes("fireflies.dev")
    )
      return undefined;
    storage.setItem("siteReferral", siteReferral);
    return siteReferral;
  } catch {
    return undefined;
  }
}

export function persistReferral(
  navigationRef: NavigationContainerRefWithCurrent<ParamList>,
) {
  // https://github.com/firefliesai/dashboard-ff/blob/a1cd66aa6040b7dddf648c30bb595aab3c3d4542/client/shared/helpers/browserHelper.js#L91
  const currentRoute = navigationRef.getCurrentRoute();
  if (!currentRoute) return;
  const params = (currentRoute.params || {}) as { [key: string]: string };
  const cookieUtmParamsStr = getCookie("utm_params");
  const cookieUtmParams = cookieUtmParamsStr
    ? new URLSearchParams(cookieUtmParamsStr)
    : null;

  const userReferral = params["referralCode"];
  const trackTxReferral = params["track"];
  const linkref = params["linkref"];
  const utmSource = cookieUtmParams?.get("utm_source") || params["utm_source"];
  const utmMedium = cookieUtmParams?.get("utm_medium") || params["utm_medium"];
  const utmCampaign =
    cookieUtmParams?.get("utm_campaign") || params["utm_campaign"];
  const utmTerm = cookieUtmParams?.get("utm_term") || params["utm_term"];
  const utmContent =
    cookieUtmParams?.get("utm_content") || params["utm_content"];

  // https://github.com/firefliesai/dashboard-ff/blob/0dee5a70b0884a31f3d32ef60dcdc45cb56414f1/client/startup/useAppAnalytics.js#L40
  const inviteToken = params["invite_token"] || params["public_token"];
  const siteReferral = getAndPersistSiteReferral();

  const utm = serializeUTMReferral({
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
  });

  const referral = {} as Record<string, string>;

  const existingReferral = getExistingReferral();

  if (linkref) referral.l = linkref || existingReferral.l;
  if (inviteToken) referral.r = inviteToken || existingReferral.r;
  if (siteReferral) referral.s = siteReferral || existingReferral.s;
  if (trackTxReferral) referral.t = trackTxReferral || existingReferral.t;
  if (userReferral) referral.u = userReferral || existingReferral.u;
  if (utm) referral.utm = utm || existingReferral.utm;

  if (Object.keys(referral).length) {
    const serializedQuery = new URLSearchParams(referral).toString();
    storage.setItem("referral", serializedQuery);
  }
}

function getExistingReferral() {
  const referral = storage.getItem("referral");
  if (!referral) return {};
  return Object.fromEntries(new URLSearchParams(referral));
}

export function getLoginTrackingParams() {
  const timezone = getTimeZone();
  const referral = storage.getItem("referral");
  return { timezone, referral };
}
