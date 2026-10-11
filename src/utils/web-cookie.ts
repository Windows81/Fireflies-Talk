export function getCookie(cname: string) {
  if (typeof document === "undefined") {
    return "";
  }
  const name = `${cname}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie ? decodedCookie.split(";") : [];
  ca = ca.filter((n) => n);
  for (let i = 0; i < ca.length; i++) {
    const c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
