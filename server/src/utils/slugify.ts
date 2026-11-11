//slugify
//Turns a name into a web-friendly id, e.g "Home & living" -> "home-living"

//STEP: Make web-friendly names (slugs)
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-") //anything that is not alleter or number becomes "-"
    .replace(/^-+|-+$/g, "");
};
