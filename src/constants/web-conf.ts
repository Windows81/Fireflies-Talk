import { Config } from "./config";

// TODO: should use shared-libs/utils to get this
const webConferencePlatforms = {
  "meet.google.com": "gmeet",
  "zoom.us": "zoom",
  "zoom.com": "zoom",
  "uberconference.com": "uberconf",
  "meetings.dialpad.com": "uberconf",
  "teams.microsoft.com": "msteams",
  "teams.live.com": "msteams",
  "teams.cloud.microsoft": "msteams",
  "join.skype.com": "skype",
  "webex.com": "webx",
  "go.lifesize.com": "lifesize",
  "lifesizecloud.com": "lifesize",
  "guest.lifesize.com": "lifesize",
  "app.slack.com": "slack",
};

export const getWebConfIcon = (url: string | undefined | null) => {
  if (url) {
    const conf = Object.keys(webConferencePlatforms).find((webconf) =>
      url.includes(webconf),
    ) as keyof typeof webConferencePlatforms;

    if (!conf) {
      return null;
    }

    return {
      src: `${Config.DASHBOARD_URL}/img/${webConferencePlatforms[conf]}.svg`,
      name: conf,
    };
  }

  return null;
};
