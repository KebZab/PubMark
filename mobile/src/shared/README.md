# Philippine registration addresses

`philippine-address-data.json` is the single bundled snapshot used by mobile and
web registration. `philippine-address.mjs` provides the shared lookups, validation,
dependent resets, search, and address formatting. Keeping it inside `mobile/`
also includes it in standalone Expo/EAS uploads. No location network requests
are made by either registration form.

## Source and attribution

- Publication: **PSA PSGC, first quarter 2026 (31 March 2026)**.
- Original authority: https://psa.gov.ph/classification/psgc
- Snapshot mirror: https://github.com/alkevintan/psgc-rb
- Pinned revision: `f4c7e1ffd7ba4eb3bf216544a5022ce7c7771362`.
- Mirror license: MIT; see `PSGC-LICENSE.txt`. PSA attributes its website data
  under CC BY 4.0 unless otherwise stated.
- Exact retrieval timestamp and SHA-256 input checksums are embedded in metadata.
- Counts: 82 provinces, 1,642 cities/municipalities, 42,010 barangays.

The planned PSGC Cloud v2 source failed validation: its city response assigned
Manila to Sarangani, the Manila barangay endpoint returned an empty list, and the
all-barangays endpoint returned only 100 records even with larger limit options.
The official June 2026 XLSX download returned HTTP 403 in this environment.
We therefore pinned the complete March 2026 PSA-derived mirror instead. This is
not claimed to include the June 2026 name changes. PSA's June publication confirms
the same nationwide province, city/municipality, and barangay counts.

## Normalization

- Preserve full ten-digit PSGC codes as strings and trim location names.
- Derive hierarchy from full codes; the mirror's truncated foreign keys are
  not sufficiently precise to use as parent IDs.
- Combine Manila sub-municipalities into City of Manila's barangay list.
- Use Metro Manila (NCR) as an area, not a fictitious province.
- Group the eight province-less BARMM municipalities under Special Geographic
  Area (BARMM). Isabela, a component city listed separately in Region IX, has a
  "Separate area" entry rather than an incorrect independent-city designation.
  References: https://psa.gov.ph/classification/psgc/ccs and
  https://parliament.bangsamoro.gov.ph/2023/08/17/barmm-approves-bills-creating-eight-new-municipalities-in-the-special-geographic-area/
- Cities with a separate province-level PSGC code get an explicitly labeled
  independent-city area; do not infer a neighboring province.
- For independent-city areas, omit the duplicate area name from saved addresses.

## Refresh and checks

Run `node scripts/update-philippine-addresses.mjs` from the repository root to
reproduce the pinned snapshot (network access required). To adopt a new release,
review its provenance, update the pinned revision and expected counts in that
script, regenerate, and review the data diff. Refresh is never automatic.

Run `node --test mobile/tests/philippine-address.test.mjs mobile/tests/registration-address.test.cjs`.
No database, API, or existing address records are modified by these checks.
