// PERMANENT REGRESSION TEST — run with: node scripts/regression-multiword-keyword-priority.mjs
//
// Covers a real bug found and fixed on this date: a MUST HAVE JD keyword for
// a multi-word technology (e.g. "React Native") could silently disappear from
// the generated CV's Skills when the JD phrased it without the matrix's exact
// spacing ("ReactNative", "React-Native"), while single-word siblings in the
// same JD (React, Expo) appeared normally. Two independent causes, both fixed:
//
//   1. _priorityTierFor() didn't consult ALIAS_MAP, so "react native"
//      (normalized matrix name, WITH a space — _normalize() collapses
//      whitespace, it doesn't strip it) never matched "reactnative"
//      (normalized JD phrasing, no space) via plain string comparison, even
//      though ALIAS_GROUPS already declares them the same technology. This
//      misclassified an explicit must-have as "secondary" priority, letting
//      it get pruned by the Skills content budget.
//   2. recoverMissingKeywords() had its own, separate, unguarded 4-char
//      shared-prefix dedup check (the same bug class fixed in
//      _priorityTierFor() two sessions earlier, but never applied here) —
//      "reactnative" shares a "reac" prefix with an already-listed "React",
//      so it was wrongly treated as an already-present duplicate and never
//      recovered even as a fallback.
//
// Exits non-zero on failure — safe to wire into CI once one exists.
import { atsOptimizerService as svc } from "../src/services/ATSOptimizerService.js";
import { MASTER_PROFILE, TECHNOLOGY_EVIDENCE_MATRIX } from "../src/config/masterProfile.js";

let allPass = true;
function assert(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) allPass = false;
}
function section(t) { console.log("\n" + "#".repeat(70) + "\n" + t + "\n" + "#".repeat(70)); }

// ── THE BUG SCENARIO: JD phrases React Native without a space ─────────────
section("Bug repro: JD keyword 'reactnative' (no space), 'React-Native' (hyphenated)");
for (const variant of ["reactnative", "React-Native", "ReactNative", "react-native"]) {
  const jdAnalysis = {
    requiredSkills: [variant, "expo", "react", "nodejs"],
    niceToHaveSkills: [],
    keywords: [variant, "expo", "react", "nodejs"],
    role: "Mobile Developer",
  };
  const jd = `Mobile Developer - Must have: ${variant}, Expo, React, Node.js.`;
  const jobIdentity = svc.detectJobIdentity(jd, jdAnalysis);

  const priority = svc._priorityTierFor("React Native", jdAnalysis);
  assert(`_priorityTierFor("React Native") is must_have when JD says "${variant}"`, priority === "must_have");

  const adaptiveSkills = svc.buildAdaptiveSkills(jobIdentity, jdAnalysis.keywords, jdAnalysis);
  const recovered = svc.recoverMissingKeywords({ skills: adaptiveSkills }, jdAnalysis.keywords, jdAnalysis);
  const allItems = recovered.skills.flatMap((sg) => sg.items);
  assert(`"React Native" present in final Skills when JD says "${variant}"`, allItems.includes("React Native"));
  assert(`"React" still present (coexists, not displaced)`, allItems.includes("React"));
  assert(`"Expo" still present (unaffected sibling)`, allItems.includes("Expo"));

  const mobileGroup = recovered.skills.find((sg) => sg.category === "Mobile");
  assert(`"React Native" classified under "Mobile" category`, mobileGroup?.items.includes("React Native"));
  const frontendGroup = recovered.skills.find((sg) => sg.category === "Frontend");
  assert(`"React" classified under "Frontend" (not merged with React Native)`, frontendGroup?.items.includes("React"));
}

// ── Original (space-preserved) phrasing must keep working ──────────────────
section("No regression: JD keyword 'React Native' (with space) still works");
{
  const jdAnalysis = { requiredSkills: ["react native", "expo", "react", "nodejs"], niceToHaveSkills: [], keywords: ["react native", "expo", "react", "nodejs"] };
  const jobIdentity = svc.detectJobIdentity("React Native Expo React Node.js", jdAnalysis);
  const adaptiveSkills = svc.buildAdaptiveSkills(jobIdentity, jdAnalysis.keywords, jdAnalysis);
  const recovered = svc.recoverMissingKeywords({ skills: adaptiveSkills }, jdAnalysis.keywords, jdAnalysis);
  const allItems = recovered.skills.flatMap((sg) => sg.items);
  assert("React Native / React / Expo all present with the original spaced phrasing", ["React Native", "React", "Expo"].every((t) => allItems.includes(t)));
}

// ── Regression guard: previously-fixed false positives stay fixed ──────────
section("No regression: previously-fixed false positives (git/github, react/react-native via _priorityTierFor)");
{
  const jdAnalysis = { requiredSkills: ["git"], niceToHaveSkills: [], keywords: ["git"] };
  assert("'github' still NOT must_have from a 'git' requirement", svc._priorityTierFor("GitHub", jdAnalysis) !== "must_have");
  const jdAnalysis2 = { requiredSkills: ["react"], niceToHaveSkills: [], keywords: ["react"] };
  assert("'React Native' still NOT must_have from a bare 'react' requirement", svc._priorityTierFor("React Native", jdAnalysis2) !== "must_have");
  const jdAnalysis3 = { requiredSkills: ["postgresql"], niceToHaveSkills: [], keywords: ["postgresql"] };
  assert("'Postman' still NOT must_have from a 'postgresql' requirement", svc._priorityTierFor("Postman", jdAnalysis3) !== "must_have");
}

// ── Regression guard: legitimate near-duplicate dedup in recoverMissingKeywords still works ──
section("No regression: recoverMissingKeywords still dedupes real near-duplicates");
{
  // "postgres" (JD) should NOT be re-added as a separate item when "PostgreSQL" is already present.
  const jdAnalysis = { requiredSkills: ["postgresql"], niceToHaveSkills: [], keywords: ["postgresql", "postgres"] };
  const skills = [{ category: "Base de datos", items: ["PostgreSQL"] }];
  const recovered = svc.recoverMissingKeywords({ skills }, jdAnalysis.keywords, jdAnalysis);
  const dbItems = recovered.skills.find((sg) => sg.category === "Base de datos").items;
  assert("'postgres' does not create a duplicate PostgreSQL entry", dbItems.filter((i) => svc._normalize(i) === "postgresql").length === 1);
}

// ── Alias symmetry sanity: React and React Native are independent, both can appear together ──
section("React and React Native coexist as independent, correctly-classified entries");
{
  const jdAnalysis = {
    requiredSkills: ["react", "react native"],
    niceToHaveSkills: [],
    keywords: ["react", "react native"],
  };
  const jobIdentity = svc.detectJobIdentity("React React Native", jdAnalysis);
  const adaptiveSkills = svc.buildAdaptiveSkills(jobIdentity, jdAnalysis.keywords, jdAnalysis);
  const recovered = svc.recoverMissingKeywords({ skills: adaptiveSkills }, jdAnalysis.keywords, jdAnalysis);
  const dup = svc._detectDuplicateSkills(recovered.skills);
  assert("No duplicate-skill warning between React and React Native", dup.length === 0);
  const react = recovered.skills.find((sg) => sg.category === "Frontend")?.items.includes("React");
  const reactNative = recovered.skills.find((sg) => sg.category === "Mobile")?.items.includes("React Native");
  assert("Both React (Frontend) and React Native (Mobile) present simultaneously", react && reactNative);
}

section("Sanity: master profile untouched");
{
  const A = TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => t.category === "A").length;
  const B = TECHNOLOGY_EVIDENCE_MATRIX.filter((t) => t.category === "B").length;
  assert("Master profile evidence counts unchanged (A19 B26)", A === 19 && B === 26);
}

console.log("\n" + "=".repeat(70));
console.log(allPass ? "ALL ASSERTIONS PASSED" : "SOME ASSERTIONS FAILED");
console.log("=".repeat(70));
process.exit(allPass ? 0 : 1);
