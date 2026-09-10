# Murcia market — local map data

Exported: 2026-09-10T13:56:40.096Z

Source: Three-building reference layout generated from local-stall-map.html. Wet Store Building traced from the supplied wet-market photograph: perimeter wings, meat counters, vegetable counters, fish counters and stairwell. Perimeter numbers repeat by wing; table labels are assigned locally where tiny printed labels remain unreadable. Geometry is an image trace, not survey measurements. Browser-only edits are not included. Timestamps were generated for this reference snapshot.

302 mapped objects: 168 regular stalls, 132 table stalls, 2 facilities (technical room/comfort room). Includes all floors, regardless of the displayed floor or search.

## Coordinates and restore format

Coordinates are WGS 84 (EPSG:4326). GeoJSON positions are [longitude, latitude], while Leaflet uses [latitude, longitude]. Each Polygon ring lists its corners in order, with the first point repeated at the end to close it. Preserve the full numeric precision in the JSON below.

The complete JSON payload below can be copied into a .json file and opened with Import JSON in local-stall-map.html. This restores the mapped objects; the separate storage snapshot records flags and historical backups for reference.

## Database handoff notes

This is a data backup, not executable SQL, and it has not uploaded anything. Local IDs (plan_1, plan_table_1, etc.) are not database UUIDs: retain them as source IDs and map them to generated database IDs during import.

The current server stall API uses stall_name, business_type, section, floor, floor_area, notes, and geometry. The local mapper does not set floor_area or status by default, and business_type can be blank. These missing values have not been invented here; resolve required fields before database import. Displayed map areas are calculated, not stored floor_area values.

Preserve kind for table_stall and technical_room in an appropriate schema field or separate facilities model. The current stall insert route does not persist kind; do not silently turn the Technical Room into a rentable stall. Local created_at/updated_at values are local timestamps, not existing database audit timestamps.

## Map anchors

```json
{
  "revision": "three-buildings-upright-v3",
  "buildings_latitude_longitude": {
    "Main Building": [
      [
        10.6059207,
        123.0410153
      ],
      [
        10.6057245,
        123.0417015
      ],
      [
        10.6057703,
        123.0409708
      ]
    ],
    "Dry Store Building": [
      [
        10.6057458,
        123.0409892
      ],
      [
        10.6055637,
        123.0416404
      ],
      [
        10.6055628,
        123.0409363
      ]
    ],
    "Wet Store Building": [
      [
        10.6055552,
        123.0409234
      ],
      [
        10.6053677,
        123.0415861
      ],
      [
        10.6053568,
        123.0408653
      ]
    ]
  },
  "floor_plan_rotation_degrees": 0
}
```

## Point-by-point map locations

| Object | Building | Local ID | Floor | Ring | Point | Longitude | Latitude |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stall 1 | Dry Store Building | plan_1 | 1 | 1 | 1 | 123.04098919999998 | 10.605745800000005 |
| Stall 1 | Dry Store Building | plan_1 | 1 | 1 | 2 | 123.04101637586209 | 10.605738200609562 |
| Stall 1 | Dry Store Building | plan_1 | 1 | 1 | 3 | 123.04100876146812 | 10.605711859706553 |
| Stall 1 | Dry Store Building | plan_1 | 1 | 1 | 4 | 123.04098158560603 | 10.605719459097656 |
| Stall 1 | Dry Store Building | plan_1 | 1 | 1 | 5 (close) | 123.04098919999998 | 10.605745800000005 |
| Stall 2 | Dry Store Building | plan_2 | 1 | 1 | 1 | 123.04098158560603 | 10.605719459097656 |
| Stall 2 | Dry Store Building | plan_2 | 1 | 1 | 2 | 123.04100876146812 | 10.605711859706553 |
| Stall 2 | Dry Store Building | plan_2 | 1 | 1 | 3 | 123.04100074631663 | 10.605684132437771 |
| Stall 2 | Dry Store Building | plan_2 | 1 | 1 | 4 | 123.04097357045454 | 10.605691731829575 |
| Stall 2 | Dry Store Building | plan_2 | 1 | 1 | 5 (close) | 123.04098158560603 | 10.605719459097656 |
| Stall 3 | Dry Store Building | plan_3 | 1 | 1 | 1 | 123.04101637586209 | 10.605738200609562 |
| Stall 3 | Dry Store Building | plan_3 | 1 | 1 | 2 | 123.0410435517241 | 10.605730601218891 |
| Stall 3 | Dry Store Building | plan_3 | 1 | 1 | 3 | 123.04103593733015 | 10.605704260315232 |
| Stall 3 | Dry Store Building | plan_3 | 1 | 1 | 4 | 123.04100876146812 | 10.605711859706553 |
| Stall 3 | Dry Store Building | plan_3 | 1 | 1 | 5 (close) | 123.04101637586209 | 10.605738200609562 |
| Stall 4 | Dry Store Building | plan_4 | 1 | 1 | 1 | 123.04100876146812 | 10.605711859706553 |
| Stall 4 | Dry Store Building | plan_4 | 1 | 1 | 2 | 123.04103593733015 | 10.605704260315232 |
| Stall 4 | Dry Store Building | plan_4 | 1 | 1 | 3 | 123.04102792217866 | 10.605676533045765 |
| Stall 4 | Dry Store Building | plan_4 | 1 | 1 | 4 | 123.04100074631663 | 10.605684132437771 |
| Stall 4 | Dry Store Building | plan_4 | 1 | 1 | 5 (close) | 123.04100876146812 | 10.605711859706553 |
| Stall 5 | Dry Store Building | plan_5 | 1 | 1 | 1 | 123.0410435517241 | 10.605730601218891 |
| Stall 5 | Dry Store Building | plan_5 | 1 | 1 | 2 | 123.0410707275862 | 10.605723001828053 |
| Stall 5 | Dry Store Building | plan_5 | 1 | 1 | 3 | 123.04106311319225 | 10.605696660923734 |
| Stall 5 | Dry Store Building | plan_5 | 1 | 1 | 4 | 123.04103593733015 | 10.605704260315232 |
| Stall 5 | Dry Store Building | plan_5 | 1 | 1 | 5 (close) | 123.0410435517241 | 10.605730601218891 |
| Stall 6 | Dry Store Building | plan_6 | 1 | 1 | 1 | 123.04103593733015 | 10.605704260315232 |
| Stall 6 | Dry Store Building | plan_6 | 1 | 1 | 2 | 123.04106311319225 | 10.605696660923734 |
| Stall 6 | Dry Store Building | plan_6 | 1 | 1 | 3 | 123.04105509804074 | 10.605668933653591 |
| Stall 6 | Dry Store Building | plan_6 | 1 | 1 | 4 | 123.04102792217866 | 10.605676533045765 |
| Stall 6 | Dry Store Building | plan_6 | 1 | 1 | 5 (close) | 123.04103593733015 | 10.605704260315232 |
| Stall 7 | Dry Store Building | plan_7 | 1 | 1 | 1 | 123.0410707275862 | 10.605723001828053 |
| Stall 7 | Dry Store Building | plan_7 | 1 | 1 | 2 | 123.04109790344828 | 10.605715402437013 |
| Stall 7 | Dry Store Building | plan_7 | 1 | 1 | 3 | 123.04109028905432 | 10.605689061532033 |
| Stall 7 | Dry Store Building | plan_7 | 1 | 1 | 4 | 123.04106311319225 | 10.605696660923734 |
| Stall 7 | Dry Store Building | plan_7 | 1 | 1 | 5 (close) | 123.0410707275862 | 10.605723001828053 |
| Stall 8 | Dry Store Building | plan_8 | 1 | 1 | 1 | 123.04106311319225 | 10.605696660923734 |
| Stall 8 | Dry Store Building | plan_8 | 1 | 1 | 2 | 123.04109028905432 | 10.605689061532033 |
| Stall 8 | Dry Store Building | plan_8 | 1 | 1 | 3 | 123.04108227390282 | 10.605661334261203 |
| Stall 8 | Dry Store Building | plan_8 | 1 | 1 | 4 | 123.04105509804074 | 10.605668933653591 |
| Stall 8 | Dry Store Building | plan_8 | 1 | 1 | 5 (close) | 123.04106311319225 | 10.605696660923734 |
| Stall 9 | Dry Store Building | plan_9 | 1 | 1 | 1 | 123.04109790344828 | 10.605715402437013 |
| Stall 9 | Dry Store Building | plan_9 | 1 | 1 | 2 | 123.04112507931036 | 10.605707803045796 |
| Stall 9 | Dry Store Building | plan_9 | 1 | 1 | 3 | 123.0411174649164 | 10.605681462140165 |
| Stall 9 | Dry Store Building | plan_9 | 1 | 1 | 4 | 123.04109028905432 | 10.605689061532033 |
| Stall 9 | Dry Store Building | plan_9 | 1 | 1 | 5 (close) | 123.04109790344828 | 10.605715402437013 |
| Stall 10 | Dry Store Building | plan_10 | 1 | 1 | 1 | 123.04109028905432 | 10.605689061532033 |
| Stall 10 | Dry Store Building | plan_10 | 1 | 1 | 2 | 123.0411174649164 | 10.605681462140165 |
| Stall 10 | Dry Store Building | plan_10 | 1 | 1 | 3 | 123.04110944976492 | 10.60565373486865 |
| Stall 10 | Dry Store Building | plan_10 | 1 | 1 | 4 | 123.04108227390282 | 10.605661334261203 |
| Stall 10 | Dry Store Building | plan_10 | 1 | 1 | 5 (close) | 123.04109028905432 | 10.605689061532033 |
| Stall 11 | Dry Store Building | plan_11 | 1 | 1 | 1 | 123.04112507931036 | 10.605707803045796 |
| Stall 11 | Dry Store Building | plan_11 | 1 | 1 | 2 | 123.0411522551724 | 10.605700203654386 |
| Stall 11 | Dry Store Building | plan_11 | 1 | 1 | 3 | 123.04114464077844 | 10.60567386274812 |
| Stall 11 | Dry Store Building | plan_11 | 1 | 1 | 4 | 123.0411174649164 | 10.605681462140165 |
| Stall 11 | Dry Store Building | plan_11 | 1 | 1 | 5 (close) | 123.04112507931036 | 10.605707803045796 |
| Stall 12 | Dry Store Building | plan_12 | 1 | 1 | 1 | 123.0411174649164 | 10.605681462140165 |
| Stall 12 | Dry Store Building | plan_12 | 1 | 1 | 2 | 123.04114464077844 | 10.60567386274812 |
| Stall 12 | Dry Store Building | plan_12 | 1 | 1 | 3 | 123.04113662562693 | 10.60564613547589 |
| Stall 12 | Dry Store Building | plan_12 | 1 | 1 | 4 | 123.04110944976492 | 10.60565373486865 |
| Stall 12 | Dry Store Building | plan_12 | 1 | 1 | 5 (close) | 123.0411174649164 | 10.605681462140165 |
| Stall 13 | Dry Store Building | plan_13 | 1 | 1 | 1 | 123.0411522551724 | 10.605700203654386 |
| Stall 13 | Dry Store Building | plan_13 | 1 | 1 | 2 | 123.04117943103448 | 10.605692604262773 |
| Stall 13 | Dry Store Building | plan_13 | 1 | 1 | 3 | 123.04117181664051 | 10.605666263355845 |
| Stall 13 | Dry Store Building | plan_13 | 1 | 1 | 4 | 123.04114464077844 | 10.60567386274812 |
| Stall 13 | Dry Store Building | plan_13 | 1 | 1 | 5 (close) | 123.0411522551724 | 10.605700203654386 |
| Stall 14 | Dry Store Building | plan_14 | 1 | 1 | 1 | 123.04114464077844 | 10.60567386274812 |
| Stall 14 | Dry Store Building | plan_14 | 1 | 1 | 2 | 123.04117181664051 | 10.605666263355845 |
| Stall 14 | Dry Store Building | plan_14 | 1 | 1 | 3 | 123.04116380148903 | 10.605638536082942 |
| Stall 14 | Dry Store Building | plan_14 | 1 | 1 | 4 | 123.04113662562693 | 10.60564613547589 |
| Stall 14 | Dry Store Building | plan_14 | 1 | 1 | 5 (close) | 123.04114464077844 | 10.60567386274812 |
| Stall 15 | Dry Store Building | plan_15 | 1 | 1 | 1 | 123.04117943103448 | 10.605692604262773 |
| Stall 15 | Dry Store Building | plan_15 | 1 | 1 | 2 | 123.04120660689655 | 10.605685004870995 |
| Stall 15 | Dry Store Building | plan_15 | 1 | 1 | 3 | 123.0411989925026 | 10.605658663963418 |
| Stall 15 | Dry Store Building | plan_15 | 1 | 1 | 4 | 123.04117181664051 | 10.605666263355845 |
| Stall 15 | Dry Store Building | plan_15 | 1 | 1 | 5 (close) | 123.04117943103448 | 10.605692604262773 |
| Stall 16 | Dry Store Building | plan_16 | 1 | 1 | 1 | 123.04117181664051 | 10.605666263355845 |
| Stall 16 | Dry Store Building | plan_16 | 1 | 1 | 2 | 123.0411989925026 | 10.605658663963418 |
| Stall 16 | Dry Store Building | plan_16 | 1 | 1 | 3 | 123.04119097735109 | 10.605630936689828 |
| Stall 16 | Dry Store Building | plan_16 | 1 | 1 | 4 | 123.04116380148903 | 10.605638536082942 |
| Stall 16 | Dry Store Building | plan_16 | 1 | 1 | 5 (close) | 123.04117181664051 | 10.605666263355845 |
| Stall 17 | Dry Store Building | plan_17 | 1 | 1 | 1 | 123.04120660689655 | 10.605685004870995 |
| Stall 17 | Dry Store Building | plan_17 | 1 | 1 | 2 | 123.0412337827586 | 10.605677405479012 |
| Stall 17 | Dry Store Building | plan_17 | 1 | 1 | 3 | 123.04122616836463 | 10.605651064570775 |
| Stall 17 | Dry Store Building | plan_17 | 1 | 1 | 4 | 123.0411989925026 | 10.605658663963418 |
| Stall 17 | Dry Store Building | plan_17 | 1 | 1 | 5 (close) | 123.04120660689655 | 10.605685004870995 |
| Stall 18 | Dry Store Building | plan_18 | 1 | 1 | 1 | 123.0411989925026 | 10.605658663963418 |
| Stall 18 | Dry Store Building | plan_18 | 1 | 1 | 2 | 123.04122616836463 | 10.605651064570775 |
| Stall 18 | Dry Store Building | plan_18 | 1 | 1 | 3 | 123.04121815321315 | 10.605623337296485 |
| Stall 18 | Dry Store Building | plan_18 | 1 | 1 | 4 | 123.04119097735109 | 10.605630936689828 |
| Stall 18 | Dry Store Building | plan_18 | 1 | 1 | 5 (close) | 123.0411989925026 | 10.605658663963418 |
| Stall 19 | Dry Store Building | plan_19 | 1 | 1 | 1 | 123.0412337827586 | 10.605677405479012 |
| Stall 19 | Dry Store Building | plan_19 | 1 | 1 | 2 | 123.04126095862067 | 10.605669806086853 |
| Stall 19 | Dry Store Building | plan_19 | 1 | 1 | 3 | 123.04125334422673 | 10.605643465177954 |
| Stall 19 | Dry Store Building | plan_19 | 1 | 1 | 4 | 123.04122616836463 | 10.605651064570775 |
| Stall 19 | Dry Store Building | plan_19 | 1 | 1 | 5 (close) | 123.0412337827586 | 10.605677405479012 |
| Stall 20 | Dry Store Building | plan_20 | 1 | 1 | 1 | 123.04122616836463 | 10.605651064570775 |
| Stall 20 | Dry Store Building | plan_20 | 1 | 1 | 2 | 123.04125334422673 | 10.605643465177954 |
| Stall 20 | Dry Store Building | plan_20 | 1 | 1 | 3 | 123.04124532907522 | 10.605615737902989 |
| Stall 20 | Dry Store Building | plan_20 | 1 | 1 | 4 | 123.04121815321315 | 10.605623337296485 |
| Stall 20 | Dry Store Building | plan_20 | 1 | 1 | 5 (close) | 123.04122616836463 | 10.605651064570775 |
| Stall 21 | Dry Store Building | plan_21 | 1 | 1 | 1 | 123.04126095862067 | 10.605669806086853 |
| Stall 21 | Dry Store Building | plan_21 | 1 | 1 | 2 | 123.04128813448277 | 10.605662206694502 |
| Stall 21 | Dry Store Building | plan_21 | 1 | 1 | 3 | 123.04128052008882 | 10.605635865784967 |
| Stall 21 | Dry Store Building | plan_21 | 1 | 1 | 4 | 123.04125334422673 | 10.605643465177954 |
| Stall 21 | Dry Store Building | plan_21 | 1 | 1 | 5 (close) | 123.04126095862067 | 10.605669806086853 |
| Stall 22 | Dry Store Building | plan_22 | 1 | 1 | 1 | 123.04125334422673 | 10.605643465177954 |
| Stall 22 | Dry Store Building | plan_22 | 1 | 1 | 2 | 123.04128052008882 | 10.605635865784967 |
| Stall 22 | Dry Store Building | plan_22 | 1 | 1 | 3 | 123.04127250493731 | 10.60560813850929 |
| Stall 22 | Dry Store Building | plan_22 | 1 | 1 | 4 | 123.04124532907522 | 10.605615737902989 |
| Stall 22 | Dry Store Building | plan_22 | 1 | 1 | 5 (close) | 123.04125334422673 | 10.605643465177954 |
| Stall 23 | Dry Store Building | plan_23 | 1 | 1 | 1 | 123.04134146551723 | 10.605647293332408 |
| Stall 23 | Dry Store Building | plan_23 | 1 | 1 | 2 | 123.04136864137931 | 10.60563969393951 |
| Stall 23 | Dry Store Building | plan_23 | 1 | 1 | 3 | 123.04136082660659 | 10.605612659846123 |
| Stall 23 | Dry Store Building | plan_23 | 1 | 1 | 4 | 123.04133365074452 | 10.605620259239695 |
| Stall 23 | Dry Store Building | plan_23 | 1 | 1 | 5 (close) | 123.04134146551723 | 10.605647293332408 |
| Stall 24 | Dry Store Building | plan_24 | 1 | 1 | 1 | 123.04133365074452 | 10.605620259239695 |
| Stall 24 | Dry Store Building | plan_24 | 1 | 1 | 2 | 123.04136082660659 | 10.605612659846123 |
| Stall 24 | Dry Store Building | plan_24 | 1 | 1 | 3 | 123.04135301183386 | 10.605585625750342 |
| Stall 24 | Dry Store Building | plan_24 | 1 | 1 | 4 | 123.04132583597178 | 10.605593225144576 |
| Stall 24 | Dry Store Building | plan_24 | 1 | 1 | 5 (close) | 123.04133365074452 | 10.605620259239695 |
| Stall 25 | Dry Store Building | plan_25 | 1 | 1 | 1 | 123.04136864137931 | 10.60563969393951 |
| Stall 25 | Dry Store Building | plan_25 | 1 | 1 | 2 | 123.0413958172414 | 10.605632094546422 |
| Stall 25 | Dry Store Building | plan_25 | 1 | 1 | 3 | 123.0413880024687 | 10.605605060452348 |
| Stall 25 | Dry Store Building | plan_25 | 1 | 1 | 4 | 123.04136082660659 | 10.605612659846123 |
| Stall 25 | Dry Store Building | plan_25 | 1 | 1 | 5 (close) | 123.04136864137931 | 10.60563969393951 |
| Stall 26 | Dry Store Building | plan_26 | 1 | 1 | 1 | 123.04136082660659 | 10.605612659846123 |
| Stall 26 | Dry Store Building | plan_26 | 1 | 1 | 2 | 123.0413880024687 | 10.605605060452348 |
| Stall 26 | Dry Store Building | plan_26 | 1 | 1 | 3 | 123.04138018769592 | 10.605578026355893 |
| Stall 26 | Dry Store Building | plan_26 | 1 | 1 | 4 | 123.04135301183386 | 10.605585625750342 |
| Stall 26 | Dry Store Building | plan_26 | 1 | 1 | 5 (close) | 123.04136082660659 | 10.605612659846123 |
| Stall 27 | Dry Store Building | plan_27 | 1 | 1 | 1 | 123.0413958172414 | 10.605632094546422 |
| Stall 27 | Dry Store Building | plan_27 | 1 | 1 | 2 | 123.04142299310342 | 10.605624495153105 |
| Stall 27 | Dry Store Building | plan_27 | 1 | 1 | 3 | 123.04141517833072 | 10.60559746105838 |
| Stall 27 | Dry Store Building | plan_27 | 1 | 1 | 4 | 123.0413880024687 | 10.605605060452348 |
| Stall 27 | Dry Store Building | plan_27 | 1 | 1 | 5 (close) | 123.0413958172414 | 10.605632094546422 |
| Stall 28 | Dry Store Building | plan_28 | 1 | 1 | 1 | 123.0413880024687 | 10.605605060452348 |
| Stall 28 | Dry Store Building | plan_28 | 1 | 1 | 2 | 123.04141517833072 | 10.60559746105838 |
| Stall 28 | Dry Store Building | plan_28 | 1 | 1 | 3 | 123.04140736355798 | 10.605570426961252 |
| Stall 28 | Dry Store Building | plan_28 | 1 | 1 | 4 | 123.04138018769592 | 10.605578026355893 |
| Stall 28 | Dry Store Building | plan_28 | 1 | 1 | 5 (close) | 123.0413880024687 | 10.605605060452348 |
| Stall 29 | Dry Store Building | plan_29 | 1 | 1 | 1 | 123.04142299310342 | 10.605624495153105 |
| Stall 29 | Dry Store Building | plan_29 | 1 | 1 | 2 | 123.04145016896551 | 10.605616895759635 |
| Stall 29 | Dry Store Building | plan_29 | 1 | 1 | 3 | 123.04144235419281 | 10.605589861664237 |
| Stall 29 | Dry Store Building | plan_29 | 1 | 1 | 4 | 123.04141517833072 | 10.60559746105838 |
| Stall 29 | Dry Store Building | plan_29 | 1 | 1 | 5 (close) | 123.04142299310342 | 10.605624495153105 |
| Stall 30 | Dry Store Building | plan_30 | 1 | 1 | 1 | 123.04141517833072 | 10.60559746105838 |
| Stall 30 | Dry Store Building | plan_30 | 1 | 1 | 2 | 123.04144235419281 | 10.605589861664237 |
| Stall 30 | Dry Store Building | plan_30 | 1 | 1 | 3 | 123.04143453942004 | 10.605562827566434 |
| Stall 30 | Dry Store Building | plan_30 | 1 | 1 | 4 | 123.04140736355798 | 10.605570426961252 |
| Stall 30 | Dry Store Building | plan_30 | 1 | 1 | 5 (close) | 123.04141517833072 | 10.60559746105838 |
| Stall 31 | Dry Store Building | plan_31 | 1 | 1 | 1 | 123.04145016896551 | 10.605616895759635 |
| Stall 31 | Dry Store Building | plan_31 | 1 | 1 | 2 | 123.04147734482761 | 10.605609296365973 |
| Stall 31 | Dry Store Building | plan_31 | 1 | 1 | 3 | 123.04146953005487 | 10.605582262269888 |
| Stall 31 | Dry Store Building | plan_31 | 1 | 1 | 4 | 123.04144235419281 | 10.605589861664237 |
| Stall 31 | Dry Store Building | plan_31 | 1 | 1 | 5 (close) | 123.04145016896551 | 10.605616895759635 |
| Stall 32 | Dry Store Building | plan_32 | 1 | 1 | 1 | 123.04144235419281 | 10.605589861664237 |
| Stall 32 | Dry Store Building | plan_32 | 1 | 1 | 2 | 123.04146953005487 | 10.605582262269888 |
| Stall 32 | Dry Store Building | plan_32 | 1 | 1 | 3 | 123.04146171528214 | 10.605555228171411 |
| Stall 32 | Dry Store Building | plan_32 | 1 | 1 | 4 | 123.04143453942004 | 10.605562827566434 |
| Stall 32 | Dry Store Building | plan_32 | 1 | 1 | 5 (close) | 123.04144235419281 | 10.605589861664237 |
| Stall 33 | Dry Store Building | plan_33 | 1 | 1 | 1 | 123.04147734482761 | 10.605609296365973 |
| Stall 33 | Dry Store Building | plan_33 | 1 | 1 | 2 | 123.04150452068964 | 10.605601696972109 |
| Stall 33 | Dry Store Building | plan_33 | 1 | 1 | 3 | 123.04149670591693 | 10.605574662875362 |
| Stall 33 | Dry Store Building | plan_33 | 1 | 1 | 4 | 123.04146953005487 | 10.605582262269888 |
| Stall 33 | Dry Store Building | plan_33 | 1 | 1 | 5 (close) | 123.04147734482761 | 10.605609296365973 |
| Stall 34 | Dry Store Building | plan_34 | 1 | 1 | 1 | 123.04146953005487 | 10.605582262269888 |
| Stall 34 | Dry Store Building | plan_34 | 1 | 1 | 2 | 123.04149670591693 | 10.605574662875362 |
| Stall 34 | Dry Store Building | plan_34 | 1 | 1 | 3 | 123.04148889114418 | 10.605547628776224 |
| Stall 34 | Dry Store Building | plan_34 | 1 | 1 | 4 | 123.04146171528214 | 10.605555228171411 |
| Stall 34 | Dry Store Building | plan_34 | 1 | 1 | 5 (close) | 123.04146953005487 | 10.605582262269888 |
| Stall 35 | Dry Store Building | plan_35 | 1 | 1 | 1 | 123.04150452068964 | 10.605601696972109 |
| Stall 35 | Dry Store Building | plan_35 | 1 | 1 | 2 | 123.04153169655173 | 10.605594097578079 |
| Stall 35 | Dry Store Building | plan_35 | 1 | 1 | 3 | 123.04152388177899 | 10.605567063480658 |
| Stall 35 | Dry Store Building | plan_35 | 1 | 1 | 4 | 123.04149670591693 | 10.605574662875362 |
| Stall 35 | Dry Store Building | plan_35 | 1 | 1 | 5 (close) | 123.04150452068964 | 10.605601696972109 |
| Stall 36 | Dry Store Building | plan_36 | 1 | 1 | 1 | 123.04149670591693 | 10.605574662875362 |
| Stall 36 | Dry Store Building | plan_36 | 1 | 1 | 2 | 123.04152388177899 | 10.605567063480658 |
| Stall 36 | Dry Store Building | plan_36 | 1 | 1 | 3 | 123.04151606700626 | 10.605540029380844 |
| Stall 36 | Dry Store Building | plan_36 | 1 | 1 | 4 | 123.04148889114418 | 10.605547628776224 |
| Stall 36 | Dry Store Building | plan_36 | 1 | 1 | 5 (close) | 123.04149670591693 | 10.605574662875362 |
| Stall 37 | Dry Store Building | plan_37 | 1 | 1 | 1 | 123.04153169655173 | 10.605594097578079 |
| Stall 37 | Dry Store Building | plan_37 | 1 | 1 | 2 | 123.04155887241379 | 10.605586498183833 |
| Stall 37 | Dry Store Building | plan_37 | 1 | 1 | 3 | 123.04155105764109 | 10.605559464085736 |
| Stall 37 | Dry Store Building | plan_37 | 1 | 1 | 4 | 123.04152388177899 | 10.605567063480658 |
| Stall 37 | Dry Store Building | plan_37 | 1 | 1 | 5 (close) | 123.04153169655173 | 10.605594097578079 |
| Stall 38 | Dry Store Building | plan_38 | 1 | 1 | 1 | 123.04152388177899 | 10.605567063480658 |
| Stall 38 | Dry Store Building | plan_38 | 1 | 1 | 2 | 123.04155105764109 | 10.605559464085736 |
| Stall 38 | Dry Store Building | plan_38 | 1 | 1 | 3 | 123.04154324286834 | 10.60553242998525 |
| Stall 38 | Dry Store Building | plan_38 | 1 | 1 | 4 | 123.04151606700626 | 10.605540029380844 |
| Stall 38 | Dry Store Building | plan_38 | 1 | 1 | 5 (close) | 123.04152388177899 | 10.605567063480658 |
| Stall 39 | Dry Store Building | plan_39 | 1 | 1 | 1 | 123.04155887241379 | 10.605586498183833 |
| Stall 39 | Dry Store Building | plan_39 | 1 | 1 | 2 | 123.04158604827587 | 10.605578898789409 |
| Stall 39 | Dry Store Building | plan_39 | 1 | 1 | 3 | 123.04157823350316 | 10.605551864690652 |
| Stall 39 | Dry Store Building | plan_39 | 1 | 1 | 4 | 123.04155105764109 | 10.605559464085736 |
| Stall 39 | Dry Store Building | plan_39 | 1 | 1 | 5 (close) | 123.04155887241379 | 10.605586498183833 |
| Stall 40 | Dry Store Building | plan_40 | 1 | 1 | 1 | 123.04155105764109 | 10.605559464085736 |
| Stall 40 | Dry Store Building | plan_40 | 1 | 1 | 2 | 123.04157823350316 | 10.605551864690652 |
| Stall 40 | Dry Store Building | plan_40 | 1 | 1 | 3 | 123.04157041873042 | 10.60552483058949 |
| Stall 40 | Dry Store Building | plan_40 | 1 | 1 | 4 | 123.04154324286834 | 10.60553242998525 |
| Stall 40 | Dry Store Building | plan_40 | 1 | 1 | 5 (close) | 123.04155105764109 | 10.605559464085736 |
| Stall 41 | Dry Store Building | plan_41 | 1 | 1 | 1 | 123.04158604827587 | 10.605578898789409 |
| Stall 41 | Dry Store Building | plan_41 | 1 | 1 | 2 | 123.04161322413792 | 10.605571299394793 |
| Stall 41 | Dry Store Building | plan_41 | 1 | 1 | 3 | 123.0416054093652 | 10.60554426529536 |
| Stall 41 | Dry Store Building | plan_41 | 1 | 1 | 4 | 123.04157823350316 | 10.605551864690652 |
| Stall 41 | Dry Store Building | plan_41 | 1 | 1 | 5 (close) | 123.04158604827587 | 10.605578898789409 |
| Stall 42 | Dry Store Building | plan_42 | 1 | 1 | 1 | 123.04157823350316 | 10.605551864690652 |
| Stall 42 | Dry Store Building | plan_42 | 1 | 1 | 2 | 123.0416054093652 | 10.60554426529536 |
| Stall 42 | Dry Store Building | plan_42 | 1 | 1 | 3 | 123.04159759459247 | 10.605517231193526 |
| Stall 42 | Dry Store Building | plan_42 | 1 | 1 | 4 | 123.04157041873042 | 10.60552483058949 |
| Stall 42 | Dry Store Building | plan_42 | 1 | 1 | 5 (close) | 123.04157823350316 | 10.605551864690652 |
| Stall 43 | Dry Store Building | plan_43 | 1 | 1 | 1 | 123.04161322413792 | 10.605571299394793 |
| Stall 43 | Dry Store Building | plan_43 | 1 | 1 | 2 | 123.0416404 | 10.6055637 |
| Stall 43 | Dry Store Building | plan_43 | 1 | 1 | 3 | 123.04163258522729 | 10.605536665899894 |
| Stall 43 | Dry Store Building | plan_43 | 1 | 1 | 4 | 123.0416054093652 | 10.60554426529536 |
| Stall 43 | Dry Store Building | plan_43 | 1 | 1 | 5 (close) | 123.04161322413792 | 10.605571299394793 |
| Stall 44 | Dry Store Building | plan_44 | 1 | 1 | 1 | 123.0416054093652 | 10.60554426529536 |
| Stall 44 | Dry Store Building | plan_44 | 1 | 1 | 2 | 123.04163258522729 | 10.605536665899894 |
| Stall 44 | Dry Store Building | plan_44 | 1 | 1 | 3 | 123.04162477045453 | 10.605509631797396 |
| Stall 44 | Dry Store Building | plan_44 | 1 | 1 | 4 | 123.04159759459247 | 10.605517231193526 |
| Stall 44 | Dry Store Building | plan_44 | 1 | 1 | 5 (close) | 123.0416054093652 | 10.60554426529536 |
| Stall 45 | Dry Store Building | plan_45 | 1 | 1 | 1 | 123.04100756613117 | 10.605602059325413 |
| Stall 45 | Dry Store Building | plan_45 | 1 | 1 | 2 | 123.04103462149517 | 10.605594493627185 |
| Stall 45 | Dry Store Building | plan_45 | 1 | 1 | 3 | 123.0410268067224 | 10.605567459529789 |
| Stall 45 | Dry Store Building | plan_45 | 1 | 1 | 4 | 123.04099975135843 | 10.605575025228692 |
| Stall 45 | Dry Store Building | plan_45 | 1 | 1 | 5 (close) | 123.04100756613117 | 10.605602059325413 |
| Stall 46 | Dry Store Building | plan_46 | 1 | 1 | 1 | 123.04099975135843 | 10.605575025228692 |
| Stall 46 | Dry Store Building | plan_46 | 1 | 1 | 2 | 123.0410268067224 | 10.605567459529789 |
| Stall 46 | Dry Store Building | plan_46 | 1 | 1 | 3 | 123.04101879157089 | 10.60553973224793 |
| Stall 46 | Dry Store Building | plan_46 | 1 | 1 | 4 | 123.04099173620692 | 10.60554729794752 |
| Stall 46 | Dry Store Building | plan_46 | 1 | 1 | 5 (close) | 123.04099975135843 | 10.605575025228692 |
| Stall 47 | Dry Store Building | plan_47 | 1 | 1 | 1 | 123.04103462149517 | 10.605594493627185 |
| Stall 47 | Dry Store Building | plan_47 | 1 | 1 | 2 | 123.04106167685916 | 10.605586927928766 |
| Stall 47 | Dry Store Building | plan_47 | 1 | 1 | 3 | 123.0410538620864 | 10.605559893830721 |
| Stall 47 | Dry Store Building | plan_47 | 1 | 1 | 4 | 123.0410268067224 | 10.605567459529789 |
| Stall 47 | Dry Store Building | plan_47 | 1 | 1 | 5 (close) | 123.04103462149517 | 10.605594493627185 |
| Stall 48 | Dry Store Building | plan_48 | 1 | 1 | 1 | 123.0410268067224 | 10.605567459529789 |
| Stall 48 | Dry Store Building | plan_48 | 1 | 1 | 2 | 123.0410538620864 | 10.605559893830721 |
| Stall 48 | Dry Store Building | plan_48 | 1 | 1 | 3 | 123.04104584693489 | 10.605532166548175 |
| Stall 48 | Dry Store Building | plan_48 | 1 | 1 | 4 | 123.04101879157089 | 10.60553973224793 |
| Stall 48 | Dry Store Building | plan_48 | 1 | 1 | 5 (close) | 123.0410268067224 | 10.605567459529789 |
| Stall 49 | Dry Store Building | plan_49 | 1 | 1 | 1 | 123.04106167685916 | 10.605586927928766 |
| Stall 49 | Dry Store Building | plan_49 | 1 | 1 | 2 | 123.0410887322231 | 10.605579362230156 |
| Stall 49 | Dry Store Building | plan_49 | 1 | 1 | 3 | 123.04108091745034 | 10.605552328131424 |
| Stall 49 | Dry Store Building | plan_49 | 1 | 1 | 4 | 123.0410538620864 | 10.605559893830721 |
| Stall 49 | Dry Store Building | plan_49 | 1 | 1 | 5 (close) | 123.04106167685916 | 10.605586927928766 |
| Stall 50 | Dry Store Building | plan_50 | 1 | 1 | 1 | 123.0410538620864 | 10.605559893830721 |
| Stall 50 | Dry Store Building | plan_50 | 1 | 1 | 2 | 123.04108091745034 | 10.605552328131424 |
| Stall 50 | Dry Store Building | plan_50 | 1 | 1 | 3 | 123.04107290229884 | 10.60552460084819 |
| Stall 50 | Dry Store Building | plan_50 | 1 | 1 | 4 | 123.04104584693489 | 10.605532166548175 |
| Stall 50 | Dry Store Building | plan_50 | 1 | 1 | 5 (close) | 123.0410538620864 | 10.605559893830721 |
| Stall 51 | Dry Store Building | plan_51 | 1 | 1 | 1 | 123.0410887322231 | 10.605579362230156 |
| Stall 51 | Dry Store Building | plan_51 | 1 | 1 | 2 | 123.04111578758707 | 10.605571796531367 |
| Stall 51 | Dry Store Building | plan_51 | 1 | 1 | 3 | 123.04110797281434 | 10.605544762431974 |
| Stall 51 | Dry Store Building | plan_51 | 1 | 1 | 4 | 123.04108091745034 | 10.605552328131424 |
| Stall 51 | Dry Store Building | plan_51 | 1 | 1 | 5 (close) | 123.0410887322231 | 10.605579362230156 |
| Stall 52 | Dry Store Building | plan_52 | 1 | 1 | 1 | 123.04108091745034 | 10.605552328131424 |
| Stall 52 | Dry Store Building | plan_52 | 1 | 1 | 2 | 123.04110797281434 | 10.605544762431974 |
| Stall 52 | Dry Store Building | plan_52 | 1 | 1 | 3 | 123.04109995766284 | 10.605517035148052 |
| Stall 52 | Dry Store Building | plan_52 | 1 | 1 | 4 | 123.04107290229884 | 10.60552460084819 |
| Stall 52 | Dry Store Building | plan_52 | 1 | 1 | 5 (close) | 123.04108091745034 | 10.605552328131424 |
| Stall 53 | Dry Store Building | plan_53 | 1 | 1 | 1 | 123.04111578758707 | 10.605571796531367 |
| Stall 53 | Dry Store Building | plan_53 | 1 | 1 | 2 | 123.04114284295107 | 10.605564230832375 |
| Stall 53 | Dry Store Building | plan_53 | 1 | 1 | 3 | 123.04113502817832 | 10.605537196732307 |
| Stall 53 | Dry Store Building | plan_53 | 1 | 1 | 4 | 123.04110797281434 | 10.605544762431974 |
| Stall 53 | Dry Store Building | plan_53 | 1 | 1 | 5 (close) | 123.04111578758707 | 10.605571796531367 |
| Stall 54 | Dry Store Building | plan_54 | 1 | 1 | 1 | 123.04110797281434 | 10.605544762431974 |
| Stall 54 | Dry Store Building | plan_54 | 1 | 1 | 2 | 123.04113502817832 | 10.605537196732307 |
| Stall 54 | Dry Store Building | plan_54 | 1 | 1 | 3 | 123.04112701302682 | 10.6055094694477 |
| Stall 54 | Dry Store Building | plan_54 | 1 | 1 | 4 | 123.04109995766284 | 10.605517035148052 |
| Stall 54 | Dry Store Building | plan_54 | 1 | 1 | 5 (close) | 123.04110797281434 | 10.605544762431974 |
| Stall 55 | Dry Store Building | plan_55 | 1 | 1 | 1 | 123.04114284295107 | 10.605564230832375 |
| Stall 55 | Dry Store Building | plan_55 | 1 | 1 | 2 | 123.04116989831508 | 10.605556665133205 |
| Stall 55 | Dry Store Building | plan_55 | 1 | 1 | 3 | 123.04116208354232 | 10.605529631032475 |
| Stall 55 | Dry Store Building | plan_55 | 1 | 1 | 4 | 123.04113502817832 | 10.605537196732307 |
| Stall 55 | Dry Store Building | plan_55 | 1 | 1 | 5 (close) | 123.04114284295107 | 10.605564230832375 |
| Stall 56 | Dry Store Building | plan_56 | 1 | 1 | 1 | 123.04113502817832 | 10.605537196732307 |
| Stall 56 | Dry Store Building | plan_56 | 1 | 1 | 2 | 123.04116208354232 | 10.605529631032475 |
| Stall 56 | Dry Store Building | plan_56 | 1 | 1 | 3 | 123.04115406839081 | 10.60550190374718 |
| Stall 56 | Dry Store Building | plan_56 | 1 | 1 | 4 | 123.04112701302682 | 10.6055094694477 |
| Stall 56 | Dry Store Building | plan_56 | 1 | 1 | 5 (close) | 123.04113502817832 | 10.605537196732307 |
| Stall 57 | Dry Store Building | plan_57 | 1 | 1 | 1 | 123.04116989831508 | 10.605556665133205 |
| Stall 57 | Dry Store Building | plan_57 | 1 | 1 | 2 | 123.04119695367905 | 10.60554909943383 |
| Stall 57 | Dry Store Building | plan_57 | 1 | 1 | 3 | 123.0411891389063 | 10.60552206533244 |
| Stall 57 | Dry Store Building | plan_57 | 1 | 1 | 4 | 123.04116208354232 | 10.605529631032475 |
| Stall 57 | Dry Store Building | plan_57 | 1 | 1 | 5 (close) | 123.04116989831508 | 10.605556665133205 |
| Stall 58 | Dry Store Building | plan_58 | 1 | 1 | 1 | 123.04116208354232 | 10.605529631032475 |
| Stall 58 | Dry Store Building | plan_58 | 1 | 1 | 2 | 123.0411891389063 | 10.60552206533244 |
| Stall 58 | Dry Store Building | plan_58 | 1 | 1 | 3 | 123.0411811237548 | 10.605494338046459 |
| Stall 58 | Dry Store Building | plan_58 | 1 | 1 | 4 | 123.04115406839081 | 10.60550190374718 |
| Stall 58 | Dry Store Building | plan_58 | 1 | 1 | 5 (close) | 123.04116208354232 | 10.605529631032475 |
| Stall 59 | Dry Store Building | plan_59 | 1 | 1 | 1 | 123.04119695367905 | 10.60554909943383 |
| Stall 59 | Dry Store Building | plan_59 | 1 | 1 | 2 | 123.04122400904305 | 10.605541533734291 |
| Stall 59 | Dry Store Building | plan_59 | 1 | 1 | 3 | 123.04121619427028 | 10.605514499632227 |
| Stall 59 | Dry Store Building | plan_59 | 1 | 1 | 4 | 123.0411891389063 | 10.60552206533244 |
| Stall 59 | Dry Store Building | plan_59 | 1 | 1 | 5 (close) | 123.04119695367905 | 10.60554909943383 |
| Stall 60 | Dry Store Building | plan_60 | 1 | 1 | 1 | 123.0411891389063 | 10.60552206533244 |
| Stall 60 | Dry Store Building | plan_60 | 1 | 1 | 2 | 123.04121619427028 | 10.605514499632227 |
| Stall 60 | Dry Store Building | plan_60 | 1 | 1 | 3 | 123.04120817911878 | 10.605486772345584 |
| Stall 60 | Dry Store Building | plan_60 | 1 | 1 | 4 | 123.0411811237548 | 10.605494338046459 |
| Stall 60 | Dry Store Building | plan_60 | 1 | 1 | 5 (close) | 123.0411891389063 | 10.60552206533244 |
| Stall 61 | Dry Store Building | plan_61 | 1 | 1 | 1 | 123.04122400904305 | 10.605541533734291 |
| Stall 61 | Dry Store Building | plan_61 | 1 | 1 | 2 | 123.04125106440704 | 10.605533968034575 |
| Stall 61 | Dry Store Building | plan_61 | 1 | 1 | 3 | 123.04124324963428 | 10.605506933931835 |
| Stall 61 | Dry Store Building | plan_61 | 1 | 1 | 4 | 123.04121619427028 | 10.605514499632227 |
| Stall 61 | Dry Store Building | plan_61 | 1 | 1 | 5 (close) | 123.04122400904305 | 10.605541533734291 |
| Stall 62 | Dry Store Building | plan_62 | 1 | 1 | 1 | 123.04121619427028 | 10.605514499632227 |
| Stall 62 | Dry Store Building | plan_62 | 1 | 1 | 2 | 123.04124324963428 | 10.605506933931835 |
| Stall 62 | Dry Store Building | plan_62 | 1 | 1 | 3 | 123.04123523448277 | 10.605479206644493 |
| Stall 62 | Dry Store Building | plan_62 | 1 | 1 | 4 | 123.04120817911878 | 10.605486772345584 |
| Stall 62 | Dry Store Building | plan_62 | 1 | 1 | 5 (close) | 123.04121619427028 | 10.605514499632227 |
| Stall 63 | Dry Store Building | plan_63 | 1 | 1 | 1 | 123.04130439544151 | 10.605519054666248 |
| Stall 63 | Dry Store Building | plan_63 | 1 | 1 | 2 | 123.04133157130357 | 10.605511455270143 |
| Stall 63 | Dry Store Building | plan_63 | 1 | 1 | 3 | 123.04132375653084 | 10.60548442116542 |
| Stall 63 | Dry Store Building | plan_63 | 1 | 1 | 4 | 123.04129658066874 | 10.605492020562185 |
| Stall 63 | Dry Store Building | plan_63 | 1 | 1 | 5 (close) | 123.04130439544151 | 10.605519054666248 |
| Stall 64 | Dry Store Building | plan_64 | 1 | 1 | 1 | 123.04129658066874 | 10.605492020562185 |
| Stall 64 | Dry Store Building | plan_64 | 1 | 1 | 2 | 123.04132375653084 | 10.60548442116542 |
| Stall 64 | Dry Store Building | plan_64 | 1 | 1 | 3 | 123.04131574137934 | 10.605456693876029 |
| Stall 64 | Dry Store Building | plan_64 | 1 | 1 | 4 | 123.04128856551723 | 10.605464293273494 |
| Stall 64 | Dry Store Building | plan_64 | 1 | 1 | 5 (close) | 123.04129658066874 | 10.605492020562185 |
| Stall 65 | Dry Store Building | plan_65 | 1 | 1 | 1 | 123.04133157130357 | 10.605511455270143 |
| Stall 65 | Dry Store Building | plan_65 | 1 | 1 | 2 | 123.04135874716567 | 10.605503855873861 |
| Stall 65 | Dry Store Building | plan_65 | 1 | 1 | 3 | 123.04135093239292 | 10.605476821768464 |
| Stall 65 | Dry Store Building | plan_65 | 1 | 1 | 4 | 123.04132375653084 | 10.60548442116542 |
| Stall 65 | Dry Store Building | plan_65 | 1 | 1 | 5 (close) | 123.04133157130357 | 10.605511455270143 |
| Stall 66 | Dry Store Building | plan_66 | 1 | 1 | 1 | 123.04132375653084 | 10.60548442116542 |
| Stall 66 | Dry Store Building | plan_66 | 1 | 1 | 2 | 123.04135093239292 | 10.605476821768464 |
| Stall 66 | Dry Store Building | plan_66 | 1 | 1 | 3 | 123.04134291724141 | 10.605449094478399 |
| Stall 66 | Dry Store Building | plan_66 | 1 | 1 | 4 | 123.04131574137934 | 10.605456693876029 |
| Stall 66 | Dry Store Building | plan_66 | 1 | 1 | 5 (close) | 123.04132375653084 | 10.60548442116542 |
| Stall 67 | Dry Store Building | plan_67 | 1 | 1 | 1 | 123.04135874716567 | 10.605503855873861 |
| Stall 67 | Dry Store Building | plan_67 | 1 | 1 | 2 | 123.04138592302769 | 10.605496256477377 |
| Stall 67 | Dry Store Building | plan_67 | 1 | 1 | 3 | 123.04137810825496 | 10.605469222371317 |
| Stall 67 | Dry Store Building | plan_67 | 1 | 1 | 4 | 123.04135093239292 | 10.605476821768464 |
| Stall 67 | Dry Store Building | plan_67 | 1 | 1 | 5 (close) | 123.04135874716567 | 10.605503855873861 |
| Stall 68 | Dry Store Building | plan_68 | 1 | 1 | 1 | 123.04135093239292 | 10.605476821768464 |
| Stall 68 | Dry Store Building | plan_68 | 1 | 1 | 2 | 123.04137810825496 | 10.605469222371317 |
| Stall 68 | Dry Store Building | plan_68 | 1 | 1 | 3 | 123.04137009310345 | 10.605441495080552 |
| Stall 68 | Dry Store Building | plan_68 | 1 | 1 | 4 | 123.04134291724141 | 10.605449094478399 |
| Stall 68 | Dry Store Building | plan_68 | 1 | 1 | 5 (close) | 123.04135093239292 | 10.605476821768464 |
| Stall 69 | Dry Store Building | plan_69 | 1 | 1 | 1 | 123.04138592302769 | 10.605496256477377 |
| Stall 69 | Dry Store Building | plan_69 | 1 | 1 | 2 | 123.04141309888979 | 10.605488657080725 |
| Stall 69 | Dry Store Building | plan_69 | 1 | 1 | 3 | 123.04140528411703 | 10.60546162297399 |
| Stall 69 | Dry Store Building | plan_69 | 1 | 1 | 4 | 123.04137810825496 | 10.605469222371317 |
| Stall 69 | Dry Store Building | plan_69 | 1 | 1 | 5 (close) | 123.04138592302769 | 10.605496256477377 |
| Stall 70 | Dry Store Building | plan_70 | 1 | 1 | 1 | 123.04137810825496 | 10.605469222371317 |
| Stall 70 | Dry Store Building | plan_70 | 1 | 1 | 2 | 123.04140528411703 | 10.60546162297399 |
| Stall 70 | Dry Store Building | plan_70 | 1 | 1 | 3 | 123.04139726896553 | 10.60543389568254 |
| Stall 70 | Dry Store Building | plan_70 | 1 | 1 | 4 | 123.04137009310345 | 10.605441495080552 |
| Stall 70 | Dry Store Building | plan_70 | 1 | 1 | 5 (close) | 123.04137810825496 | 10.605469222371317 |
| Stall 71 | Dry Store Building | plan_71 | 1 | 1 | 1 | 123.04141309888979 | 10.605488657080725 |
| Stall 71 | Dry Store Building | plan_71 | 1 | 1 | 2 | 123.04144027475186 | 10.605481057683859 |
| Stall 71 | Dry Store Building | plan_71 | 1 | 1 | 3 | 123.04143245997912 | 10.60545402357645 |
| Stall 71 | Dry Store Building | plan_71 | 1 | 1 | 4 | 123.04140528411703 | 10.60546162297399 |
| Stall 71 | Dry Store Building | plan_71 | 1 | 1 | 5 (close) | 123.04141309888979 | 10.605488657080725 |
| Stall 72 | Dry Store Building | plan_72 | 1 | 1 | 1 | 123.04140528411703 | 10.60546162297399 |
| Stall 72 | Dry Store Building | plan_72 | 1 | 1 | 2 | 123.04143245997912 | 10.60545402357645 |
| Stall 72 | Dry Store Building | plan_72 | 1 | 1 | 3 | 123.04142444482761 | 10.60542629628431 |
| Stall 72 | Dry Store Building | plan_72 | 1 | 1 | 4 | 123.04139726896553 | 10.60543389568254 |
| Stall 72 | Dry Store Building | plan_72 | 1 | 1 | 5 (close) | 123.04140528411703 | 10.60546162297399 |
| Stall 73 | Dry Store Building | plan_73 | 1 | 1 | 1 | 123.04144027475186 | 10.605481057683859 |
| Stall 73 | Dry Store Building | plan_73 | 1 | 1 | 2 | 123.04146745061391 | 10.605473458286825 |
| Stall 73 | Dry Store Building | plan_73 | 1 | 1 | 3 | 123.04145963584115 | 10.605446424178743 |
| Stall 73 | Dry Store Building | plan_73 | 1 | 1 | 4 | 123.04143245997912 | 10.60545402357645 |
| Stall 73 | Dry Store Building | plan_73 | 1 | 1 | 5 (close) | 123.04144027475186 | 10.605481057683859 |
| Stall 74 | Dry Store Building | plan_74 | 1 | 1 | 1 | 123.04143245997912 | 10.60545402357645 |
| Stall 74 | Dry Store Building | plan_74 | 1 | 1 | 2 | 123.04145963584115 | 10.605446424178743 |
| Stall 74 | Dry Store Building | plan_74 | 1 | 1 | 3 | 123.04145162068966 | 10.605418696885918 |
| Stall 74 | Dry Store Building | plan_74 | 1 | 1 | 4 | 123.04142444482761 | 10.60542629628431 |
| Stall 74 | Dry Store Building | plan_74 | 1 | 1 | 5 (close) | 123.04143245997912 | 10.60545402357645 |
| Stall 75 | Dry Store Building | plan_75 | 1 | 1 | 1 | 123.04146745061391 | 10.605473458286825 |
| Stall 75 | Dry Store Building | plan_75 | 1 | 1 | 2 | 123.04149462647598 | 10.605465858889602 |
| Stall 75 | Dry Store Building | plan_75 | 1 | 1 | 3 | 123.04148681170324 | 10.605438824780846 |
| Stall 75 | Dry Store Building | plan_75 | 1 | 1 | 4 | 123.04145963584115 | 10.605446424178743 |
| Stall 75 | Dry Store Building | plan_75 | 1 | 1 | 5 (close) | 123.04146745061391 | 10.605473458286825 |
| Stall 76 | Dry Store Building | plan_76 | 1 | 1 | 1 | 123.04145963584115 | 10.605446424178743 |
| Stall 76 | Dry Store Building | plan_76 | 1 | 1 | 2 | 123.04148681170324 | 10.605438824780846 |
| Stall 76 | Dry Store Building | plan_76 | 1 | 1 | 3 | 123.04147879655173 | 10.605411097487332 |
| Stall 76 | Dry Store Building | plan_76 | 1 | 1 | 4 | 123.04145162068966 | 10.605418696885918 |
| Stall 76 | Dry Store Building | plan_76 | 1 | 1 | 5 (close) | 123.04145963584115 | 10.605446424178743 |
| Stall 77 | Dry Store Building | plan_77 | 1 | 1 | 1 | 123.04149462647598 | 10.605465858889602 |
| Stall 77 | Dry Store Building | plan_77 | 1 | 1 | 2 | 123.04152180233807 | 10.605458259492176 |
| Stall 77 | Dry Store Building | plan_77 | 1 | 1 | 3 | 123.04151398756531 | 10.605431225382757 |
| Stall 77 | Dry Store Building | plan_77 | 1 | 1 | 4 | 123.04148681170324 | 10.605438824780846 |
| Stall 77 | Dry Store Building | plan_77 | 1 | 1 | 5 (close) | 123.04149462647598 | 10.605465858889602 |
| Stall 78 | Dry Store Building | plan_78 | 1 | 1 | 1 | 123.04148681170324 | 10.605438824780846 |
| Stall 78 | Dry Store Building | plan_78 | 1 | 1 | 2 | 123.04151398756531 | 10.605431225382757 |
| Stall 78 | Dry Store Building | plan_78 | 1 | 1 | 3 | 123.0415059724138 | 10.605403498088545 |
| Stall 78 | Dry Store Building | plan_78 | 1 | 1 | 4 | 123.04147879655173 | 10.605411097487332 |
| Stall 78 | Dry Store Building | plan_78 | 1 | 1 | 5 (close) | 123.04148681170324 | 10.605438824780846 |
| Stall 79 | Dry Store Building | plan_79 | 1 | 1 | 1 | 123.04152180233807 | 10.605458259492176 |
| Stall 79 | Dry Store Building | plan_79 | 1 | 1 | 2 | 123.04154897820014 | 10.60545066009457 |
| Stall 79 | Dry Store Building | plan_79 | 1 | 1 | 3 | 123.04154116342741 | 10.605423625984479 |
| Stall 79 | Dry Store Building | plan_79 | 1 | 1 | 4 | 123.04151398756531 | 10.605431225382757 |
| Stall 79 | Dry Store Building | plan_79 | 1 | 1 | 5 (close) | 123.04152180233807 | 10.605458259492176 |
| Stall 80 | Dry Store Building | plan_80 | 1 | 1 | 1 | 123.04151398756531 | 10.605431225382757 |
| Stall 80 | Dry Store Building | plan_80 | 1 | 1 | 2 | 123.04154116342741 | 10.605423625984479 |
| Stall 80 | Dry Store Building | plan_80 | 1 | 1 | 3 | 123.0415331482759 | 10.605395898689578 |
| Stall 80 | Dry Store Building | plan_80 | 1 | 1 | 4 | 123.0415059724138 | 10.605403498088545 |
| Stall 80 | Dry Store Building | plan_80 | 1 | 1 | 5 (close) | 123.04151398756531 | 10.605431225382757 |
| Stall 81 | Dry Store Building | plan_81 | 1 | 1 | 1 | 123.04154897820014 | 10.60545066009457 |
| Stall 81 | Dry Store Building | plan_81 | 1 | 1 | 2 | 123.04157615406218 | 10.605443060696762 |
| Stall 81 | Dry Store Building | plan_81 | 1 | 1 | 3 | 123.04156833928946 | 10.605416026585996 |
| Stall 81 | Dry Store Building | plan_81 | 1 | 1 | 4 | 123.04154116342741 | 10.605423625984479 |
| Stall 81 | Dry Store Building | plan_81 | 1 | 1 | 5 (close) | 123.04154897820014 | 10.60545066009457 |
| Stall 82 | Dry Store Building | plan_82 | 1 | 1 | 1 | 123.04154116342741 | 10.605423625984479 |
| Stall 82 | Dry Store Building | plan_82 | 1 | 1 | 2 | 123.04156833928946 | 10.605416026585996 |
| Stall 82 | Dry Store Building | plan_82 | 1 | 1 | 3 | 123.04156032413795 | 10.605388299290421 |
| Stall 82 | Dry Store Building | plan_82 | 1 | 1 | 4 | 123.0415331482759 | 10.605395898689578 |
| Stall 82 | Dry Store Building | plan_82 | 1 | 1 | 5 (close) | 123.04154116342741 | 10.605423625984479 |
| Stall 83 | Dry Store Building | plan_83 | 1 | 1 | 1 | 123.04157615406218 | 10.605443060696762 |
| Stall 83 | Dry Store Building | plan_83 | 1 | 1 | 2 | 123.04160332992426 | 10.605435461298788 |
| Stall 83 | Dry Store Building | plan_83 | 1 | 1 | 3 | 123.04159551515153 | 10.605408427187347 |
| Stall 83 | Dry Store Building | plan_83 | 1 | 1 | 4 | 123.04156833928946 | 10.605416026585996 |
| Stall 83 | Dry Store Building | plan_83 | 1 | 1 | 5 (close) | 123.04157615406218 | 10.605443060696762 |
| Stall 84 | Dry Store Building | plan_84 | 1 | 1 | 1 | 123.04156833928946 | 10.605416026585996 |
| Stall 84 | Dry Store Building | plan_84 | 1 | 1 | 2 | 123.04159551515153 | 10.605408427187347 |
| Stall 84 | Dry Store Building | plan_84 | 1 | 1 | 3 | 123.04158750000002 | 10.605380699891073 |
| Stall 84 | Dry Store Building | plan_84 | 1 | 1 | 4 | 123.04156032413795 | 10.605388299290421 |
| Stall 84 | Dry Store Building | plan_84 | 1 | 1 | 5 (close) | 123.04156833928946 | 10.605416026585996 |
| Table Stall 1 | Dry Store Building | plan_table_1 | 1 | 1 | 1 | 123.04100866064525 | 10.605655696761325 |
| Table Stall 1 | Dry Store Building | plan_table_1 | 1 | 1 | 2 | 123.04102234426594 | 10.60565187030657 |
| Table Stall 1 | Dry Store Building | plan_table_1 | 1 | 1 | 3 | 123.04101593214472 | 10.605629688487403 |
| Table Stall 1 | Dry Store Building | plan_table_1 | 1 | 1 | 4 | 123.04100224852407 | 10.605633514942424 |
| Table Stall 1 | Dry Store Building | plan_table_1 | 1 | 1 | 5 (close) | 123.04100866064525 | 10.605655696761325 |
| Table Stall 2 | Dry Store Building | plan_table_2 | 1 | 1 | 1 | 123.04102234426594 | 10.60565187030657 |
| Table Stall 2 | Dry Store Building | plan_table_2 | 1 | 1 | 2 | 123.04103602788659 | 10.605648043851765 |
| Table Stall 2 | Dry Store Building | plan_table_2 | 1 | 1 | 3 | 123.04102961576541 | 10.605625862032317 |
| Table Stall 2 | Dry Store Building | plan_table_2 | 1 | 1 | 4 | 123.04101593214472 | 10.605629688487403 |
| Table Stall 2 | Dry Store Building | plan_table_2 | 1 | 1 | 5 (close) | 123.04102234426594 | 10.60565187030657 |
| Table Stall 3 | Dry Store Building | plan_table_3 | 1 | 1 | 1 | 123.041063395128 | 10.605640390942014 |
| Table Stall 3 | Dry Store Building | plan_table_3 | 1 | 1 | 2 | 123.04107707874866 | 10.60563656448707 |
| Table Stall 3 | Dry Store Building | plan_table_3 | 1 | 1 | 3 | 123.04107066662748 | 10.605614382666795 |
| Table Stall 3 | Dry Store Building | plan_table_3 | 1 | 1 | 4 | 123.04105698300678 | 10.60561820912202 |
| Table Stall 3 | Dry Store Building | plan_table_3 | 1 | 1 | 5 (close) | 123.041063395128 | 10.605640390942014 |
| Table Stall 4 | Dry Store Building | plan_table_4 | 1 | 1 | 1 | 123.04107707874866 | 10.60563656448707 |
| Table Stall 4 | Dry Store Building | plan_table_4 | 1 | 1 | 2 | 123.0410907623694 | 10.605632738032073 |
| Table Stall 4 | Dry Store Building | plan_table_4 | 1 | 1 | 3 | 123.0410843502482 | 10.605610556211518 |
| Table Stall 4 | Dry Store Building | plan_table_4 | 1 | 1 | 4 | 123.04107066662748 | 10.605614382666795 |
| Table Stall 4 | Dry Store Building | plan_table_4 | 1 | 1 | 5 (close) | 123.04107707874866 | 10.60563656448707 |
| Table Stall 5 | Dry Store Building | plan_table_5 | 1 | 1 | 1 | 123.04111812961072 | 10.605625085121954 |
| Table Stall 5 | Dry Store Building | plan_table_5 | 1 | 1 | 2 | 123.04113181323146 | 10.60562125866683 |
| Table Stall 5 | Dry Store Building | plan_table_5 | 1 | 1 | 3 | 123.04112540111026 | 10.605599076845436 |
| Table Stall 5 | Dry Store Building | plan_table_5 | 1 | 1 | 4 | 123.04111171748954 | 10.605602903300852 |
| Table Stall 5 | Dry Store Building | plan_table_5 | 1 | 1 | 5 (close) | 123.04111812961072 | 10.605625085121954 |
| Table Stall 6 | Dry Store Building | plan_table_6 | 1 | 1 | 1 | 123.04113181323146 | 10.60562125866683 |
| Table Stall 6 | Dry Store Building | plan_table_6 | 1 | 1 | 2 | 123.04114549685212 | 10.605617432211643 |
| Table Stall 6 | Dry Store Building | plan_table_6 | 1 | 1 | 3 | 123.04113908473094 | 10.60559525038997 |
| Table Stall 6 | Dry Store Building | plan_table_6 | 1 | 1 | 4 | 123.04112540111026 | 10.605599076845436 |
| Table Stall 6 | Dry Store Building | plan_table_6 | 1 | 1 | 5 (close) | 123.04113181323146 | 10.60562125866683 |
| Table Stall 7 | Dry Store Building | plan_table_7 | 1 | 1 | 1 | 123.04117075892108 | 10.605610367986548 |
| Table Stall 7 | Dry Store Building | plan_table_7 | 1 | 1 | 2 | 123.0411844425418 | 10.60560654153122 |
| Table Stall 7 | Dry Store Building | plan_table_7 | 1 | 1 | 3 | 123.04117803042062 | 10.605584359708772 |
| Table Stall 7 | Dry Store Building | plan_table_7 | 1 | 1 | 4 | 123.0411643467999 | 10.605588186164377 |
| Table Stall 7 | Dry Store Building | plan_table_7 | 1 | 1 | 5 (close) | 123.04117075892108 | 10.605610367986548 |
| Table Stall 8 | Dry Store Building | plan_table_8 | 1 | 1 | 1 | 123.0411844425418 | 10.60560654153122 |
| Table Stall 8 | Dry Store Building | plan_table_8 | 1 | 1 | 2 | 123.04119812616248 | 10.605602715075856 |
| Table Stall 8 | Dry Store Building | plan_table_8 | 1 | 1 | 3 | 123.04119171404128 | 10.605580533253127 |
| Table Stall 8 | Dry Store Building | plan_table_8 | 1 | 1 | 4 | 123.04117803042062 | 10.605584359708772 |
| Table Stall 8 | Dry Store Building | plan_table_8 | 1 | 1 | 5 (close) | 123.0411844425418 | 10.60560654153122 |
| Table Stall 9 | Dry Store Building | plan_table_9 | 1 | 1 | 1 | 123.04122479167972 | 10.605595258393466 |
| Table Stall 9 | Dry Store Building | plan_table_9 | 1 | 1 | 2 | 123.04123847530037 | 10.605591431937961 |
| Table Stall 9 | Dry Store Building | plan_table_9 | 1 | 1 | 3 | 123.0412320631792 | 10.605569250114405 |
| Table Stall 9 | Dry Store Building | plan_table_9 | 1 | 1 | 4 | 123.04121837955853 | 10.605573076570202 |
| Table Stall 9 | Dry Store Building | plan_table_9 | 1 | 1 | 5 (close) | 123.04122479167972 | 10.605595258393466 |
| Table Stall 10 | Dry Store Building | plan_table_10 | 1 | 1 | 1 | 123.04123847530037 | 10.605591431937961 |
| Table Stall 10 | Dry Store Building | plan_table_10 | 1 | 1 | 2 | 123.04125215892111 | 10.605587605482405 |
| Table Stall 10 | Dry Store Building | plan_table_10 | 1 | 1 | 3 | 123.04124574679992 | 10.60556542365857 |
| Table Stall 10 | Dry Store Building | plan_table_10 | 1 | 1 | 4 | 123.0412320631792 | 10.605569250114405 |
| Table Stall 10 | Dry Store Building | plan_table_10 | 1 | 1 | 5 (close) | 123.04123847530037 | 10.605591431937961 |
| Table Stall 11 | Dry Store Building | plan_table_11 | 1 | 1 | 1 | 123.04128022788662 | 10.605579756342648 |
| Table Stall 11 | Dry Store Building | plan_table_11 | 1 | 1 | 2 | 123.0412918063349 | 10.605576518572434 |
| Table Stall 11 | Dry Store Building | plan_table_11 | 1 | 1 | 3 | 123.0412853942137 | 10.605554336747808 |
| Table Stall 11 | Dry Store Building | plan_table_11 | 1 | 1 | 4 | 123.04127381576544 | 10.605557574518263 |
| Table Stall 11 | Dry Store Building | plan_table_11 | 1 | 1 | 5 (close) | 123.04128022788662 | 10.605579756342648 |
| Table Stall 12 | Dry Store Building | plan_table_12 | 1 | 1 | 1 | 123.0412918063349 | 10.605576518572434 |
| Table Stall 12 | Dry Store Building | plan_table_12 | 1 | 1 | 2 | 123.04130338478319 | 10.605573280802194 |
| Table Stall 12 | Dry Store Building | plan_table_12 | 1 | 1 | 3 | 123.04129697266198 | 10.605551098977328 |
| Table Stall 12 | Dry Store Building | plan_table_12 | 1 | 1 | 4 | 123.0412853942137 | 10.605554336747808 |
| Table Stall 12 | Dry Store Building | plan_table_12 | 1 | 1 | 5 (close) | 123.0412918063349 | 10.605576518572434 |
| Table Stall 13 | Dry Store Building | plan_table_13 | 1 | 1 | 1 | 123.0413321554728 | 10.605565235433573 |
| Table Stall 13 | Dry Store Building | plan_table_13 | 1 | 1 | 2 | 123.04134548823144 | 10.605561507091933 |
| Table Stall 13 | Dry Store Building | plan_table_13 | 1 | 1 | 3 | 123.04133907611023 | 10.605539325266214 |
| Table Stall 13 | Dry Store Building | plan_table_13 | 1 | 1 | 4 | 123.04132574335162 | 10.605543053608134 |
| Table Stall 13 | Dry Store Building | plan_table_13 | 1 | 1 | 5 (close) | 123.0413321554728 | 10.605565235433573 |
| Table Stall 14 | Dry Store Building | plan_table_14 | 1 | 1 | 1 | 123.04134548823144 | 10.605561507091933 |
| Table Stall 14 | Dry Store Building | plan_table_14 | 1 | 1 | 2 | 123.04135882099006 | 10.605557778750267 |
| Table Stall 14 | Dry Store Building | plan_table_14 | 1 | 1 | 3 | 123.04135240886885 | 10.605535596924282 |
| Table Stall 14 | Dry Store Building | plan_table_14 | 1 | 1 | 4 | 123.04133907611023 | 10.605539325266214 |
| Table Stall 14 | Dry Store Building | plan_table_14 | 1 | 1 | 5 (close) | 123.04134548823144 | 10.605561507091933 |
| Table Stall 15 | Dry Store Building | plan_table_15 | 1 | 1 | 1 | 123.04138408305904 | 10.605550714523797 |
| Table Stall 15 | Dry Store Building | plan_table_15 | 1 | 1 | 2 | 123.04139741581766 | 10.605546986182006 |
| Table Stall 15 | Dry Store Building | plan_table_15 | 1 | 1 | 3 | 123.04139100369648 | 10.60552480435523 |
| Table Stall 15 | Dry Store Building | plan_table_15 | 1 | 1 | 4 | 123.04137767093786 | 10.605528532697303 |
| Table Stall 15 | Dry Store Building | plan_table_15 | 1 | 1 | 5 (close) | 123.04138408305904 | 10.605550714523797 |
| Table Stall 16 | Dry Store Building | plan_table_16 | 1 | 1 | 1 | 123.04139741581766 | 10.605546986182006 |
| Table Stall 16 | Dry Store Building | plan_table_16 | 1 | 1 | 2 | 123.04141074857628 | 10.605543257840138 |
| Table Stall 16 | Dry Store Building | plan_table_16 | 1 | 1 | 3 | 123.04140433645509 | 10.605521076013096 |
| Table Stall 16 | Dry Store Building | plan_table_16 | 1 | 1 | 4 | 123.04139100369648 | 10.60552480435523 |
| Table Stall 16 | Dry Store Building | plan_table_16 | 1 | 1 | 5 (close) | 123.04139741581766 | 10.605546986182006 |
| Table Stall 17 | Dry Store Building | plan_table_17 | 1 | 1 | 1 | 123.04143951926592 | 10.605535212470727 |
| Table Stall 17 | Dry Store Building | plan_table_17 | 1 | 1 | 2 | 123.04145320288664 | 10.605531386014471 |
| Table Stall 17 | Dry Store Building | plan_table_17 | 1 | 1 | 3 | 123.04144679076543 | 10.605509204186564 |
| Table Stall 17 | Dry Store Building | plan_table_17 | 1 | 1 | 4 | 123.04143310714471 | 10.605513030643113 |
| Table Stall 17 | Dry Store Building | plan_table_17 | 1 | 1 | 5 (close) | 123.04143951926592 | 10.605535212470727 |
| Table Stall 18 | Dry Store Building | plan_table_18 | 1 | 1 | 1 | 123.04145320288664 | 10.605531386014471 |
| Table Stall 18 | Dry Store Building | plan_table_18 | 1 | 1 | 2 | 123.0414668865073 | 10.605527559558166 |
| Table Stall 18 | Dry Store Building | plan_table_18 | 1 | 1 | 3 | 123.04146047438611 | 10.60550537772999 |
| Table Stall 18 | Dry Store Building | plan_table_18 | 1 | 1 | 4 | 123.04144679076543 | 10.605509204186564 |
| Table Stall 18 | Dry Store Building | plan_table_18 | 1 | 1 | 5 (close) | 123.04145320288664 | 10.605531386014471 |
| Table Stall 19 | Dry Store Building | plan_table_19 | 1 | 1 | 1 | 123.04149425374871 | 10.6055199066454 |
| Table Stall 19 | Dry Store Building | plan_table_19 | 1 | 1 | 2 | 123.04150758650731 | 10.6055161783032 |
| Table Stall 19 | Dry Store Building | plan_table_19 | 1 | 1 | 3 | 123.04150117438613 | 10.60549399647421 |
| Table Stall 19 | Dry Store Building | plan_table_19 | 1 | 1 | 4 | 123.04148784162749 | 10.605497724816665 |
| Table Stall 19 | Dry Store Building | plan_table_19 | 1 | 1 | 5 (close) | 123.04149425374871 | 10.6055199066454 |
| Table Stall 20 | Dry Store Building | plan_table_20 | 1 | 1 | 1 | 123.04150758650731 | 10.6055161783032 |
| Table Stall 20 | Dry Store Building | plan_table_20 | 1 | 1 | 2 | 123.04152091926593 | 10.605512449960987 |
| Table Stall 20 | Dry Store Building | plan_table_20 | 1 | 1 | 3 | 123.04151450714474 | 10.60549026813172 |
| Table Stall 20 | Dry Store Building | plan_table_20 | 1 | 1 | 4 | 123.04150117438613 | 10.60549399647421 |
| Table Stall 20 | Dry Store Building | plan_table_20 | 1 | 1 | 5 (close) | 123.04150758650731 | 10.6055161783032 |
| Table Stall 21 | Dry Store Building | plan_table_21 | 1 | 1 | 1 | 123.04154758478317 | 10.605504993276398 |
| Table Stall 21 | Dry Store Building | plan_table_21 | 1 | 1 | 2 | 123.04156056667972 | 10.605501363048292 |
| Table Stall 21 | Dry Store Building | plan_table_21 | 1 | 1 | 3 | 123.04155415455853 | 10.60547918121821 |
| Table Stall 21 | Dry Store Building | plan_table_21 | 1 | 1 | 4 | 123.04154117266197 | 10.605482811446583 |
| Table Stall 21 | Dry Store Building | plan_table_21 | 1 | 1 | 5 (close) | 123.04154758478317 | 10.605504993276398 |
| Table Stall 22 | Dry Store Building | plan_table_22 | 1 | 1 | 1 | 123.04156056667972 | 10.605501363048292 |
| Table Stall 22 | Dry Store Building | plan_table_22 | 1 | 1 | 2 | 123.0415735485763 | 10.605497732820162 |
| Table Stall 22 | Dry Store Building | plan_table_22 | 1 | 1 | 3 | 123.04156713645509 | 10.605475550989825 |
| Table Stall 22 | Dry Store Building | plan_table_22 | 1 | 1 | 4 | 123.04155415455853 | 10.60547918121821 |
| Table Stall 22 | Dry Store Building | plan_table_22 | 1 | 1 | 5 (close) | 123.04156056667972 | 10.605501363048292 |
| Technical Room | Dry Store Building | plan_technical_room | 1 | 1 | 1 | 123.04095212992426 | 10.605617561375114 |
| Technical Room | Dry Store Building | plan_technical_room | 1 | 1 | 2 | 123.04100756613117 | 10.605602059325413 |
| Technical Room | Dry Store Building | plan_technical_room | 1 | 1 | 3 | 123.04099173620692 | 10.60554729794752 |
| Technical Room | Dry Store Building | plan_technical_room | 1 | 1 | 4 | 123.04093630000001 | 10.605562799999992 |
| Technical Room | Dry Store Building | plan_technical_room | 1 | 1 | 5 (close) | 123.04095212992426 | 10.605617561375114 |
| Stall 1 | Main Building | main_1 | 1 | 1 | 1 | 123.0410153 | 10.605920700000011 |
| Stall 1 | Main Building | main_1 | 1 | 1 | 2 | 123.04104884755556 | 10.605911108002939 |
| Stall 1 | Main Building | main_1 | 1 | 1 | 3 | 123.04102659755556 | 10.605835908009821 |
| Stall 1 | Main Building | main_1 | 1 | 1 | 4 | 123.04099305 | 10.605845500009249 |
| Stall 1 | Main Building | main_1 | 1 | 1 | 5 (close) | 123.0410153 | 10.605920700000011 |
| Stall 2 | Main Building | main_2 | 1 | 1 | 1 | 123.04099305 | 10.605845500009249 |
| Stall 2 | Main Building | main_2 | 1 | 1 | 2 | 123.04102659755556 | 10.605835908009821 |
| Stall 2 | Main Building | main_2 | 1 | 1 | 3 | 123.04100434755554 | 10.60576070799822 |
| Stall 2 | Main Building | main_2 | 1 | 1 | 4 | 123.0409708 | 10.605770300000012 |
| Stall 2 | Main Building | main_2 | 1 | 1 | 5 (close) | 123.04099305 | 10.605845500009249 |
| Stall 3 | Main Building | main_3 | 1 | 1 | 1 | 123.04104884755556 | 10.605911108002939 |
| Stall 3 | Main Building | main_3 | 1 | 1 | 2 | 123.0410823951111 | 10.605901516005574 |
| Stall 3 | Main Building | main_3 | 1 | 1 | 3 | 123.04106014511109 | 10.60582631601009 |
| Stall 3 | Main Building | main_3 | 1 | 1 | 4 | 123.04102659755556 | 10.605835908009821 |
| Stall 3 | Main Building | main_3 | 1 | 1 | 5 (close) | 123.04104884755556 | 10.605911108002939 |
| Stall 4 | Main Building | main_4 | 1 | 1 | 1 | 123.04102659755556 | 10.605835908009821 |
| Stall 4 | Main Building | main_4 | 1 | 1 | 2 | 123.04106014511109 | 10.60582631601009 |
| Stall 4 | Main Building | main_4 | 1 | 1 | 3 | 123.04103789511109 | 10.605751115996133 |
| Stall 4 | Main Building | main_4 | 1 | 1 | 4 | 123.04100434755554 | 10.60576070799822 |
| Stall 4 | Main Building | main_4 | 1 | 1 | 5 (close) | 123.04102659755556 | 10.605835908009821 |
| Stall 5 | Main Building | main_5 | 1 | 1 | 1 | 123.0410823951111 | 10.605901516005574 |
| Stall 5 | Main Building | main_5 | 1 | 1 | 2 | 123.04111594266668 | 10.605891924007903 |
| Stall 5 | Main Building | main_5 | 1 | 1 | 3 | 123.04109369266668 | 10.605816724010053 |
| Stall 5 | Main Building | main_5 | 1 | 1 | 4 | 123.04106014511109 | 10.60582631601009 |
| Stall 5 | Main Building | main_5 | 1 | 1 | 5 (close) | 123.0410823951111 | 10.605901516005574 |
| Stall 6 | Main Building | main_6 | 1 | 1 | 1 | 123.04106014511109 | 10.60582631601009 |
| Stall 6 | Main Building | main_6 | 1 | 1 | 2 | 123.04109369266668 | 10.605816724010053 |
| Stall 6 | Main Building | main_6 | 1 | 1 | 3 | 123.04107144266668 | 10.60574152399373 |
| Stall 6 | Main Building | main_6 | 1 | 1 | 4 | 123.04103789511109 | 10.605751115996133 |
| Stall 6 | Main Building | main_6 | 1 | 1 | 5 (close) | 123.04106014511109 | 10.60582631601009 |
| Stall 7 | Main Building | main_7 | 1 | 1 | 1 | 123.04111594266668 | 10.605891924007903 |
| Stall 7 | Main Building | main_7 | 1 | 1 | 2 | 123.04114949022221 | 10.605882332009902 |
| Stall 7 | Main Building | main_7 | 1 | 1 | 3 | 123.04112724022221 | 10.60580713200971 |
| Stall 7 | Main Building | main_7 | 1 | 1 | 4 | 123.04109369266668 | 10.605816724010053 |
| Stall 7 | Main Building | main_7 | 1 | 1 | 5 (close) | 123.04111594266668 | 10.605891924007903 |
| Stall 8 | Main Building | main_8 | 1 | 1 | 1 | 123.04109369266668 | 10.605816724010053 |
| Stall 8 | Main Building | main_8 | 1 | 1 | 2 | 123.04112724022221 | 10.60580713200971 |
| Stall 8 | Main Building | main_8 | 1 | 1 | 3 | 123.0411049902222 | 10.605731931991034 |
| Stall 8 | Main Building | main_8 | 1 | 1 | 4 | 123.04107144266668 | 10.60574152399373 |
| Stall 8 | Main Building | main_8 | 1 | 1 | 5 (close) | 123.04109369266668 | 10.605816724010053 |
| Stall 9 | Main Building | main_9 | 1 | 1 | 1 | 123.04114949022221 | 10.605882332009902 |
| Stall 9 | Main Building | main_9 | 1 | 1 | 2 | 123.04118303777778 | 10.60587274001162 |
| Stall 9 | Main Building | main_9 | 1 | 1 | 3 | 123.0411607877778 | 10.605797540009062 |
| Stall 9 | Main Building | main_9 | 1 | 1 | 4 | 123.04112724022221 | 10.60580713200971 |
| Stall 9 | Main Building | main_9 | 1 | 1 | 5 (close) | 123.04114949022221 | 10.605882332009902 |
| Stall 10 | Main Building | main_10 | 1 | 1 | 1 | 123.04112724022221 | 10.60580713200971 |
| Stall 10 | Main Building | main_10 | 1 | 1 | 2 | 123.0411607877778 | 10.605797540009062 |
| Stall 10 | Main Building | main_10 | 1 | 1 | 3 | 123.04113853777778 | 10.605722339988047 |
| Stall 10 | Main Building | main_10 | 1 | 1 | 4 | 123.0411049902222 | 10.605731931991034 |
| Stall 10 | Main Building | main_10 | 1 | 1 | 5 (close) | 123.04112724022221 | 10.60580713200971 |
| Stall 11 | Main Building | main_11 | 1 | 1 | 1 | 123.04118303777778 | 10.60587274001162 |
| Stall 11 | Main Building | main_11 | 1 | 1 | 2 | 123.0412165853333 | 10.605863148013045 |
| Stall 11 | Main Building | main_11 | 1 | 1 | 3 | 123.0411943353333 | 10.605787948008135 |
| Stall 11 | Main Building | main_11 | 1 | 1 | 4 | 123.0411607877778 | 10.605797540009062 |
| Stall 11 | Main Building | main_11 | 1 | 1 | 5 (close) | 123.04118303777778 | 10.60587274001162 |
| Stall 12 | Main Building | main_12 | 1 | 1 | 1 | 123.0411607877778 | 10.605797540009062 |
| Stall 12 | Main Building | main_12 | 1 | 1 | 2 | 123.0411943353333 | 10.605787948008135 |
| Stall 12 | Main Building | main_12 | 1 | 1 | 3 | 123.04117208533332 | 10.605712747984752 |
| Stall 12 | Main Building | main_12 | 1 | 1 | 4 | 123.04113853777778 | 10.605722339988047 |
| Stall 12 | Main Building | main_12 | 1 | 1 | 5 (close) | 123.0411607877778 | 10.605797540009062 |
| Stall 13 | Main Building | main_13 | 1 | 1 | 1 | 123.0412165853333 | 10.605863148013045 |
| Stall 13 | Main Building | main_13 | 1 | 1 | 2 | 123.04125013288889 | 10.605853556014178 |
| Stall 13 | Main Building | main_13 | 1 | 1 | 3 | 123.04122788288889 | 10.605778356006901 |
| Stall 13 | Main Building | main_13 | 1 | 1 | 4 | 123.0411943353333 | 10.605787948008135 |
| Stall 13 | Main Building | main_13 | 1 | 1 | 5 (close) | 123.0412165853333 | 10.605863148013045 |
| Stall 14 | Main Building | main_14 | 1 | 1 | 1 | 123.0411943353333 | 10.605787948008135 |
| Stall 14 | Main Building | main_14 | 1 | 1 | 2 | 123.04122788288889 | 10.605778356006901 |
| Stall 14 | Main Building | main_14 | 1 | 1 | 3 | 123.04120563288889 | 10.605703155981152 |
| Stall 14 | Main Building | main_14 | 1 | 1 | 4 | 123.04117208533332 | 10.605712747984752 |
| Stall 14 | Main Building | main_14 | 1 | 1 | 5 (close) | 123.0411943353333 | 10.605787948008135 |
| Stall 15 | Main Building | main_15 | 1 | 1 | 1 | 123.04125013288889 | 10.605853556014178 |
| Stall 15 | Main Building | main_15 | 1 | 1 | 2 | 123.04128368044445 | 10.605843964014982 |
| Stall 15 | Main Building | main_15 | 1 | 1 | 3 | 123.04126143044446 | 10.605768764005363 |
| Stall 15 | Main Building | main_15 | 1 | 1 | 4 | 123.04122788288889 | 10.605778356006901 |
| Stall 15 | Main Building | main_15 | 1 | 1 | 5 (close) | 123.04125013288889 | 10.605853556014178 |
| Stall 16 | Main Building | main_16 | 1 | 1 | 1 | 123.04122788288889 | 10.605778356006901 |
| Stall 16 | Main Building | main_16 | 1 | 1 | 2 | 123.04126143044446 | 10.605768764005363 |
| Stall 16 | Main Building | main_16 | 1 | 1 | 3 | 123.04123918044446 | 10.60569356397726 |
| Stall 16 | Main Building | main_16 | 1 | 1 | 4 | 123.04120563288889 | 10.605703155981152 |
| Stall 16 | Main Building | main_16 | 1 | 1 | 5 (close) | 123.04122788288889 | 10.605778356006901 |
| Stall 17 | Main Building | main_17 | 1 | 1 | 1 | 123.04128368044445 | 10.605843964014982 |
| Stall 17 | Main Building | main_17 | 1 | 1 | 2 | 123.04131722800001 | 10.605834372015504 |
| Stall 17 | Main Building | main_17 | 1 | 1 | 3 | 123.04129497800001 | 10.605759172003532 |
| Stall 17 | Main Building | main_17 | 1 | 1 | 4 | 123.04126143044446 | 10.605768764005363 |
| Stall 17 | Main Building | main_17 | 1 | 1 | 5 (close) | 123.04128368044445 | 10.605843964014982 |
| Stall 18 | Main Building | main_18 | 1 | 1 | 1 | 123.04126143044446 | 10.605768764005363 |
| Stall 18 | Main Building | main_18 | 1 | 1 | 2 | 123.04129497800001 | 10.605759172003532 |
| Stall 18 | Main Building | main_18 | 1 | 1 | 3 | 123.041272728 | 10.605683971973075 |
| Stall 18 | Main Building | main_18 | 1 | 1 | 4 | 123.04123918044446 | 10.60569356397726 |
| Stall 18 | Main Building | main_18 | 1 | 1 | 5 (close) | 123.04126143044446 | 10.605768764005363 |
| Stall 19 | Main Building | main_19 | 1 | 1 | 1 | 123.041399572 | 10.605810828015503 |
| Stall 19 | Main Building | main_19 | 1 | 1 | 2 | 123.04143311955555 | 10.605801236014983 |
| Stall 19 | Main Building | main_19 | 1 | 1 | 3 | 123.04141086955556 | 10.605726035994856 |
| Stall 19 | Main Building | main_19 | 1 | 1 | 4 | 123.041377322 | 10.605735627997731 |
| Stall 19 | Main Building | main_19 | 1 | 1 | 5 (close) | 123.041399572 | 10.605810828015503 |
| Stall 20 | Main Building | main_20 | 1 | 1 | 1 | 123.041377322 | 10.605735627997731 |
| Stall 20 | Main Building | main_20 | 1 | 1 | 2 | 123.04141086955556 | 10.605726035994856 |
| Stall 20 | Main Building | main_20 | 1 | 1 | 3 | 123.04138861955555 | 10.605650835956258 |
| Stall 20 | Main Building | main_20 | 1 | 1 | 4 | 123.04135507200002 | 10.605660427961485 |
| Stall 20 | Main Building | main_20 | 1 | 1 | 5 (close) | 123.041377322 | 10.605735627997731 |
| Stall 21 | Main Building | main_21 | 1 | 1 | 1 | 123.04143311955555 | 10.605801236014983 |
| Stall 21 | Main Building | main_21 | 1 | 1 | 2 | 123.04146666711112 | 10.605791644014156 |
| Stall 21 | Main Building | main_21 | 1 | 1 | 3 | 123.04144441711111 | 10.605716443991676 |
| Stall 21 | Main Building | main_21 | 1 | 1 | 4 | 123.04141086955556 | 10.605726035994856 |
| Stall 21 | Main Building | main_21 | 1 | 1 | 5 (close) | 123.04143311955555 | 10.605801236014983 |
| Stall 22 | Main Building | main_22 | 1 | 1 | 1 | 123.04141086955556 | 10.605726035994856 |
| Stall 22 | Main Building | main_22 | 1 | 1 | 2 | 123.04144441711111 | 10.605716443991676 |
| Stall 22 | Main Building | main_22 | 1 | 1 | 3 | 123.04142216711111 | 10.605641243950725 |
| Stall 22 | Main Building | main_22 | 1 | 1 | 4 | 123.04138861955555 | 10.605650835956258 |
| Stall 22 | Main Building | main_22 | 1 | 1 | 5 (close) | 123.04141086955556 | 10.605726035994856 |
| Stall 23 | Main Building | main_23 | 1 | 1 | 1 | 123.04146666711112 | 10.605791644014156 |
| Stall 23 | Main Building | main_23 | 1 | 1 | 2 | 123.04150021466671 | 10.605782052013051 |
| Stall 23 | Main Building | main_23 | 1 | 1 | 3 | 123.0414779646667 | 10.605706851988204 |
| Stall 23 | Main Building | main_23 | 1 | 1 | 4 | 123.04144441711111 | 10.605716443991676 |
| Stall 23 | Main Building | main_23 | 1 | 1 | 5 (close) | 123.04146666711112 | 10.605791644014156 |
| Stall 24 | Main Building | main_24 | 1 | 1 | 1 | 123.04144441711111 | 10.605716443991676 |
| Stall 24 | Main Building | main_24 | 1 | 1 | 2 | 123.0414779646667 | 10.605706851988204 |
| Stall 24 | Main Building | main_24 | 1 | 1 | 3 | 123.0414557146667 | 10.605631651944886 |
| Stall 24 | Main Building | main_24 | 1 | 1 | 4 | 123.04142216711111 | 10.605641243950725 |
| Stall 24 | Main Building | main_24 | 1 | 1 | 5 (close) | 123.04144441711111 | 10.605716443991676 |
| Stall 25 | Main Building | main_25 | 1 | 1 | 1 | 123.04150021466671 | 10.605782052013051 |
| Stall 25 | Main Building | main_25 | 1 | 1 | 2 | 123.04153376222222 | 10.605772460011627 |
| Stall 25 | Main Building | main_25 | 1 | 1 | 3 | 123.04151151222223 | 10.605697259984428 |
| Stall 25 | Main Building | main_25 | 1 | 1 | 4 | 123.0414779646667 | 10.605706851988204 |
| Stall 25 | Main Building | main_25 | 1 | 1 | 5 (close) | 123.04150021466671 | 10.605782052013051 |
| Stall 26 | Main Building | main_26 | 1 | 1 | 1 | 123.0414779646667 | 10.605706851988204 |
| Stall 26 | Main Building | main_26 | 1 | 1 | 2 | 123.04151151222223 | 10.605697259984428 |
| Stall 26 | Main Building | main_26 | 1 | 1 | 3 | 123.04148926222223 | 10.605622059938755 |
| Stall 26 | Main Building | main_26 | 1 | 1 | 4 | 123.0414557146667 | 10.605631651944886 |
| Stall 26 | Main Building | main_26 | 1 | 1 | 5 (close) | 123.0414779646667 | 10.605706851988204 |
| Stall 27 | Main Building | main_27 | 1 | 1 | 1 | 123.04153376222222 | 10.605772460011627 |
| Stall 27 | Main Building | main_27 | 1 | 1 | 2 | 123.0415673097778 | 10.605762868009897 |
| Stall 27 | Main Building | main_27 | 1 | 1 | 3 | 123.0415450597778 | 10.605687667980344 |
| Stall 27 | Main Building | main_27 | 1 | 1 | 4 | 123.04151151222223 | 10.605697259984428 |
| Stall 27 | Main Building | main_27 | 1 | 1 | 5 (close) | 123.04153376222222 | 10.605772460011627 |
| Stall 28 | Main Building | main_28 | 1 | 1 | 1 | 123.04151151222223 | 10.605697259984428 |
| Stall 28 | Main Building | main_28 | 1 | 1 | 2 | 123.0415450597778 | 10.605687667980344 |
| Stall 28 | Main Building | main_28 | 1 | 1 | 3 | 123.04152280977782 | 10.605612467932318 |
| Stall 28 | Main Building | main_28 | 1 | 1 | 4 | 123.04148926222223 | 10.605622059938755 |
| Stall 28 | Main Building | main_28 | 1 | 1 | 5 (close) | 123.04151151222223 | 10.605697259984428 |
| Stall 29 | Main Building | main_29 | 1 | 1 | 1 | 123.0415673097778 | 10.605762868009897 |
| Stall 29 | Main Building | main_29 | 1 | 1 | 2 | 123.04160085733334 | 10.605753276007864 |
| Stall 29 | Main Building | main_29 | 1 | 1 | 3 | 123.04157860733334 | 10.605678075975955 |
| Stall 29 | Main Building | main_29 | 1 | 1 | 4 | 123.0415450597778 | 10.605687667980344 |
| Stall 29 | Main Building | main_29 | 1 | 1 | 5 (close) | 123.0415673097778 | 10.605762868009897 |
| Stall 30 | Main Building | main_30 | 1 | 1 | 1 | 123.0415450597778 | 10.605687667980344 |
| Stall 30 | Main Building | main_30 | 1 | 1 | 2 | 123.04157860733334 | 10.605678075975955 |
| Stall 30 | Main Building | main_30 | 1 | 1 | 3 | 123.04155635733332 | 10.605602875925564 |
| Stall 30 | Main Building | main_30 | 1 | 1 | 4 | 123.04152280977782 | 10.605612467932318 |
| Stall 30 | Main Building | main_30 | 1 | 1 | 5 (close) | 123.0415450597778 | 10.605687667980344 |
| Stall 31 | Main Building | main_31 | 1 | 1 | 1 | 123.04160085733334 | 10.605753276007864 |
| Stall 31 | Main Building | main_31 | 1 | 1 | 2 | 123.04163440488892 | 10.60574368400555 |
| Stall 31 | Main Building | main_31 | 1 | 1 | 3 | 123.04161215488891 | 10.605668483971275 |
| Stall 31 | Main Building | main_31 | 1 | 1 | 4 | 123.04157860733334 | 10.605678075975955 |
| Stall 31 | Main Building | main_31 | 1 | 1 | 5 (close) | 123.04160085733334 | 10.605753276007864 |
| Stall 32 | Main Building | main_32 | 1 | 1 | 1 | 123.04157860733334 | 10.605678075975955 |
| Stall 32 | Main Building | main_32 | 1 | 1 | 2 | 123.04161215488891 | 10.605668483971275 |
| Stall 32 | Main Building | main_32 | 1 | 1 | 3 | 123.04158990488891 | 10.60559328391853 |
| Stall 32 | Main Building | main_32 | 1 | 1 | 4 | 123.04155635733332 | 10.605602875925564 |
| Stall 32 | Main Building | main_32 | 1 | 1 | 5 (close) | 123.04157860733334 | 10.605678075975955 |
| Stall 33 | Main Building | main_33 | 1 | 1 | 1 | 123.04163440488892 | 10.60574368400555 |
| Stall 33 | Main Building | main_33 | 1 | 1 | 2 | 123.04166795244446 | 10.605734092002917 |
| Stall 33 | Main Building | main_33 | 1 | 1 | 3 | 123.04164570244446 | 10.60565889196629 |
| Stall 33 | Main Building | main_33 | 1 | 1 | 4 | 123.04161215488891 | 10.605668483971275 |
| Stall 33 | Main Building | main_33 | 1 | 1 | 5 (close) | 123.04163440488892 | 10.60574368400555 |
| Stall 34 | Main Building | main_34 | 1 | 1 | 1 | 123.04161215488891 | 10.605668483971275 |
| Stall 34 | Main Building | main_34 | 1 | 1 | 2 | 123.04164570244446 | 10.60565889196629 |
| Stall 34 | Main Building | main_34 | 1 | 1 | 3 | 123.04162345244444 | 10.60558369191119 |
| Stall 34 | Main Building | main_34 | 1 | 1 | 4 | 123.04158990488891 | 10.60559328391853 |
| Stall 34 | Main Building | main_34 | 1 | 1 | 5 (close) | 123.04161215488891 | 10.605668483971275 |
| Stall 35 | Main Building | main_35 | 1 | 1 | 1 | 123.04166795244446 | 10.605734092002917 |
| Stall 35 | Main Building | main_35 | 1 | 1 | 2 | 123.04170150000002 | 10.605724499999992 |
| Stall 35 | Main Building | main_35 | 1 | 1 | 3 | 123.04167925000002 | 10.60564929996101 |
| Stall 35 | Main Building | main_35 | 1 | 1 | 4 | 123.04164570244446 | 10.60565889196629 |
| Stall 35 | Main Building | main_35 | 1 | 1 | 5 (close) | 123.04166795244446 | 10.605734092002917 |
| Stall 36 | Main Building | main_36 | 1 | 1 | 1 | 123.04164570244446 | 10.60565889196629 |
| Stall 36 | Main Building | main_36 | 1 | 1 | 2 | 123.04167925000002 | 10.60564929996101 |
| Stall 36 | Main Building | main_36 | 1 | 1 | 3 | 123.041657 | 10.605574099903546 |
| Stall 36 | Main Building | main_36 | 1 | 1 | 4 | 123.04162345244444 | 10.60558369191119 |
| Stall 36 | Main Building | main_36 | 1 | 1 | 5 (close) | 123.04164570244446 | 10.60565889196629 |
| NW Stall 2 | Wet Store Building | wet_v5_NW_2 | 1 | 1 | 1 | 123.04092339999998 | 10.605555200000003 |
| NW Stall 2 | Wet Store Building | wet_v5_NW_2 | 1 | 1 | 2 | 123.04095109086015 | 10.60554736533159 |
| NW Stall 2 | Wet Store Building | wet_v5_NW_2 | 1 | 1 | 3 | 123.04093895056167 | 10.605505908624743 |
| NW Stall 2 | Wet Store Building | wet_v5_NW_2 | 1 | 1 | 4 | 123.04091125970149 | 10.605513743294212 |
| NW Stall 2 | Wet Store Building | wet_v5_NW_2 | 1 | 1 | 5 (close) | 123.04092339999998 | 10.605555200000003 |
| NW Stall 3 | Wet Store Building | wet_v5_NW_3 | 1 | 1 | 1 | 123.04095109086015 | 10.60554736533159 |
| NW Stall 3 | Wet Store Building | wet_v5_NW_3 | 1 | 1 | 2 | 123.04097878172031 | 10.605539530662975 |
| NW Stall 3 | Wet Store Building | wet_v5_NW_3 | 1 | 1 | 3 | 123.04096664142182 | 10.60549807395507 |
| NW Stall 3 | Wet Store Building | wet_v5_NW_3 | 1 | 1 | 4 | 123.04093895056167 | 10.605505908624743 |
| NW Stall 3 | Wet Store Building | wet_v5_NW_3 | 1 | 1 | 5 (close) | 123.04095109086015 | 10.60554736533159 |
| NW Stall 4 | Wet Store Building | wet_v5_NW_4 | 1 | 1 | 1 | 123.04097878172031 | 10.605539530662975 |
| NW Stall 4 | Wet Store Building | wet_v5_NW_4 | 1 | 1 | 2 | 123.04100647258048 | 10.605531695994156 |
| NW Stall 4 | Wet Store Building | wet_v5_NW_4 | 1 | 1 | 3 | 123.040994332282 | 10.605490239285169 |
| NW Stall 4 | Wet Store Building | wet_v5_NW_4 | 1 | 1 | 4 | 123.04096664142182 | 10.60549807395507 |
| NW Stall 4 | Wet Store Building | wet_v5_NW_4 | 1 | 1 | 5 (close) | 123.04097878172031 | 10.605539530662975 |
| NW Stall 5 | Wet Store Building | wet_v5_NW_5 | 1 | 1 | 1 | 123.04100647258048 | 10.605531695994156 |
| NW Stall 5 | Wet Store Building | wet_v5_NW_5 | 1 | 1 | 2 | 123.04103416344064 | 10.605523861325144 |
| NW Stall 5 | Wet Store Building | wet_v5_NW_5 | 1 | 1 | 3 | 123.04102202314218 | 10.605482404615115 |
| NW Stall 5 | Wet Store Building | wet_v5_NW_5 | 1 | 1 | 4 | 123.040994332282 | 10.605490239285169 |
| NW Stall 5 | Wet Store Building | wet_v5_NW_5 | 1 | 1 | 5 (close) | 123.04100647258048 | 10.605531695994156 |
| NW Stall 6 | Wet Store Building | wet_v5_NW_6 | 1 | 1 | 1 | 123.04103416344064 | 10.605523861325144 |
| NW Stall 6 | Wet Store Building | wet_v5_NW_6 | 1 | 1 | 2 | 123.04106185430082 | 10.60551602665593 |
| NW Stall 6 | Wet Store Building | wet_v5_NW_6 | 1 | 1 | 3 | 123.04104971400233 | 10.605474569944832 |
| NW Stall 6 | Wet Store Building | wet_v5_NW_6 | 1 | 1 | 4 | 123.04102202314218 | 10.605482404615115 |
| NW Stall 6 | Wet Store Building | wet_v5_NW_6 | 1 | 1 | 5 (close) | 123.04103416344064 | 10.605523861325144 |
| NW Stall 7 | Wet Store Building | wet_v5_NW_7 | 1 | 1 | 1 | 123.04106185430082 | 10.60551602665593 |
| NW Stall 7 | Wet Store Building | wet_v5_NW_7 | 1 | 1 | 2 | 123.04108954516097 | 10.605508191986525 |
| NW Stall 7 | Wet Store Building | wet_v5_NW_7 | 1 | 1 | 3 | 123.04107740486249 | 10.605466735274359 |
| NW Stall 7 | Wet Store Building | wet_v5_NW_7 | 1 | 1 | 4 | 123.04104971400233 | 10.605474569944832 |
| NW Stall 7 | Wet Store Building | wet_v5_NW_7 | 1 | 1 | 5 (close) | 123.04106185430082 | 10.60551602665593 |
| NW Stall 8 | Wet Store Building | wet_v5_NW_8 | 1 | 1 | 1 | 123.04108954516097 | 10.605508191986525 |
| NW Stall 8 | Wet Store Building | wet_v5_NW_8 | 1 | 1 | 2 | 123.04111723602115 | 10.605500357316917 |
| NW Stall 8 | Wet Store Building | wet_v5_NW_8 | 1 | 1 | 3 | 123.04110509572266 | 10.605458900603695 |
| NW Stall 8 | Wet Store Building | wet_v5_NW_8 | 1 | 1 | 4 | 123.04107740486249 | 10.605466735274359 |
| NW Stall 8 | Wet Store Building | wet_v5_NW_8 | 1 | 1 | 5 (close) | 123.04108954516097 | 10.605508191986525 |
| NW Stall 9 | Wet Store Building | wet_v5_NW_9 | 1 | 1 | 1 | 123.04111723602115 | 10.605500357316917 |
| NW Stall 9 | Wet Store Building | wet_v5_NW_9 | 1 | 1 | 2 | 123.04114492688126 | 10.60549252264708 |
| NW Stall 9 | Wet Store Building | wet_v5_NW_9 | 1 | 1 | 3 | 123.04113278658276 | 10.605451065932801 |
| NW Stall 9 | Wet Store Building | wet_v5_NW_9 | 1 | 1 | 4 | 123.04110509572266 | 10.605458900603695 |
| NW Stall 9 | Wet Store Building | wet_v5_NW_9 | 1 | 1 | 5 (close) | 123.04111723602115 | 10.605500357316917 |
| NW Stall 10 | Wet Store Building | wet_v5_NW_10 | 1 | 1 | 1 | 123.04114492688126 | 10.60549252264708 |
| NW Stall 10 | Wet Store Building | wet_v5_NW_10 | 1 | 1 | 2 | 123.04117261774142 | 10.605484687977075 |
| NW Stall 10 | Wet Store Building | wet_v5_NW_10 | 1 | 1 | 3 | 123.04116047744294 | 10.605443231261717 |
| NW Stall 10 | Wet Store Building | wet_v5_NW_10 | 1 | 1 | 4 | 123.04113278658276 | 10.605451065932801 |
| NW Stall 10 | Wet Store Building | wet_v5_NW_10 | 1 | 1 | 5 (close) | 123.04114492688126 | 10.60549252264708 |
| NW Stall 11 | Wet Store Building | wet_v5_NW_11 | 1 | 1 | 1 | 123.04117261774142 | 10.605484687977075 |
| NW Stall 11 | Wet Store Building | wet_v5_NW_11 | 1 | 1 | 2 | 123.04120030860159 | 10.605476853306843 |
| NW Stall 11 | Wet Store Building | wet_v5_NW_11 | 1 | 1 | 3 | 123.04118816830312 | 10.605435396590455 |
| NW Stall 11 | Wet Store Building | wet_v5_NW_11 | 1 | 1 | 4 | 123.04116047744294 | 10.605443231261717 |
| NW Stall 11 | Wet Store Building | wet_v5_NW_11 | 1 | 1 | 5 (close) | 123.04117261774142 | 10.605484687977075 |
| NW Stall 12 | Wet Store Building | wet_v5_NW_12 | 1 | 1 | 1 | 123.04120030860159 | 10.605476853306843 |
| NW Stall 12 | Wet Store Building | wet_v5_NW_12 | 1 | 1 | 2 | 123.04122799946177 | 10.605469018636446 |
| NW Stall 12 | Wet Store Building | wet_v5_NW_12 | 1 | 1 | 3 | 123.04121585916327 | 10.605427561918976 |
| NW Stall 12 | Wet Store Building | wet_v5_NW_12 | 1 | 1 | 4 | 123.04118816830312 | 10.605435396590455 |
| NW Stall 12 | Wet Store Building | wet_v5_NW_12 | 1 | 1 | 5 (close) | 123.04120030860159 | 10.605476853306843 |
| NW Stall 1 | Wet Store Building | wet_v5_NW_1 | 1 | 1 | 1 | 123.04091125970149 | 10.605513743294212 |
| NW Stall 1 | Wet Store Building | wet_v5_NW_1 | 1 | 1 | 2 | 123.04093908026123 | 10.605505871928393 |
| NW Stall 1 | Wet Store Building | wet_v5_NW_1 | 1 | 1 | 3 | 123.04092759033585 | 10.605466636111395 |
| NW Stall 1 | Wet Store Building | wet_v5_NW_1 | 1 | 1 | 4 | 123.04089976977613 | 10.605474507478204 |
| NW Stall 1 | Wet Store Building | wet_v5_NW_1 | 1 | 1 | 5 (close) | 123.04091125970149 | 10.605513743294212 |
| NE Stall 12 | Wet Store Building | wet_v5_NE_12 | 1 | 1 | 1 | 123.04128364058128 | 10.605453275902292 |
| NE Stall 12 | Wet Store Building | wet_v5_NE_12 | 1 | 1 | 2 | 123.04131113689205 | 10.605445496275808 |
| NE Stall 12 | Wet Store Building | wet_v5_NE_12 | 1 | 1 | 3 | 123.04129899659358 | 10.605404039555156 |
| NE Stall 12 | Wet Store Building | wet_v5_NE_12 | 1 | 1 | 4 | 123.04127150028279 | 10.605411819182708 |
| NE Stall 12 | Wet Store Building | wet_v5_NE_12 | 1 | 1 | 5 (close) | 123.04128364058128 | 10.605453275902292 |
| NE Stall 11 | Wet Store Building | wet_v5_NE_11 | 1 | 1 | 1 | 123.04131113689205 | 10.605445496275808 |
| NE Stall 11 | Wet Store Building | wet_v5_NE_11 | 1 | 1 | 2 | 123.04133863320284 | 10.605437716649107 |
| NE Stall 11 | Wet Store Building | wet_v5_NE_11 | 1 | 1 | 3 | 123.04132649290435 | 10.6053962599274 |
| NE Stall 11 | Wet Store Building | wet_v5_NE_11 | 1 | 1 | 4 | 123.04129899659358 | 10.605404039555156 |
| NE Stall 11 | Wet Store Building | wet_v5_NE_11 | 1 | 1 | 5 (close) | 123.04131113689205 | 10.605445496275808 |
| NE Stall 10 | Wet Store Building | wet_v5_NE_10 | 1 | 1 | 1 | 123.04133863320284 | 10.605437716649107 |
| NE Stall 10 | Wet Store Building | wet_v5_NE_10 | 1 | 1 | 2 | 123.04136612951363 | 10.605429937022228 |
| NE Stall 10 | Wet Store Building | wet_v5_NE_10 | 1 | 1 | 3 | 123.04135398921514 | 10.605388480299466 |
| NE Stall 10 | Wet Store Building | wet_v5_NE_10 | 1 | 1 | 4 | 123.04132649290435 | 10.6053962599274 |
| NE Stall 10 | Wet Store Building | wet_v5_NE_10 | 1 | 1 | 5 (close) | 123.04133863320284 | 10.605437716649107 |
| NE Stall 9 | Wet Store Building | wet_v5_NE_9 | 1 | 1 | 1 | 123.04136612951363 | 10.605429937022228 |
| NE Stall 9 | Wet Store Building | wet_v5_NE_9 | 1 | 1 | 2 | 123.04139362582443 | 10.605422157395134 |
| NE Stall 9 | Wet Store Building | wet_v5_NE_9 | 1 | 1 | 3 | 123.04138148552593 | 10.605380700671327 |
| NE Stall 9 | Wet Store Building | wet_v5_NE_9 | 1 | 1 | 4 | 123.04135398921514 | 10.605388480299466 |
| NE Stall 9 | Wet Store Building | wet_v5_NE_9 | 1 | 1 | 5 (close) | 123.04136612951363 | 10.605429937022228 |
| NE Stall 8 | Wet Store Building | wet_v5_NE_8 | 1 | 1 | 1 | 123.04139362582443 | 10.605422157395134 |
| NE Stall 8 | Wet Store Building | wet_v5_NE_8 | 1 | 1 | 2 | 123.04142112213522 | 10.605414377767849 |
| NE Stall 8 | Wet Store Building | wet_v5_NE_8 | 1 | 1 | 3 | 123.04140898183672 | 10.605372921042985 |
| NE Stall 8 | Wet Store Building | wet_v5_NE_8 | 1 | 1 | 4 | 123.04138148552593 | 10.605380700671327 |
| NE Stall 8 | Wet Store Building | wet_v5_NE_8 | 1 | 1 | 5 (close) | 123.04139362582443 | 10.605422157395134 |
| NE Stall 7 | Wet Store Building | wet_v5_NE_7 | 1 | 1 | 1 | 123.04142112213522 | 10.605414377767849 |
| NE Stall 7 | Wet Store Building | wet_v5_NE_7 | 1 | 1 | 2 | 123.041448618446 | 10.605406598140371 |
| NE Stall 7 | Wet Store Building | wet_v5_NE_7 | 1 | 1 | 3 | 123.0414364781475 | 10.60536514141444 |
| NE Stall 7 | Wet Store Building | wet_v5_NE_7 | 1 | 1 | 4 | 123.04140898183672 | 10.605372921042985 |
| NE Stall 7 | Wet Store Building | wet_v5_NE_7 | 1 | 1 | 5 (close) | 123.04142112213522 | 10.605414377767849 |
| NE Stall 6 | Wet Store Building | wet_v5_NE_6 | 1 | 1 | 1 | 123.041448618446 | 10.605406598140371 |
| NE Stall 6 | Wet Store Building | wet_v5_NE_6 | 1 | 1 | 2 | 123.04147611475679 | 10.605398818512692 |
| NE Stall 6 | Wet Store Building | wet_v5_NE_6 | 1 | 1 | 3 | 123.0414639744583 | 10.605357361785718 |
| NE Stall 6 | Wet Store Building | wet_v5_NE_6 | 1 | 1 | 4 | 123.0414364781475 | 10.60536514141444 |
| NE Stall 6 | Wet Store Building | wet_v5_NE_6 | 1 | 1 | 5 (close) | 123.041448618446 | 10.605406598140371 |
| NE Stall 5 | Wet Store Building | wet_v5_NE_5 | 1 | 1 | 1 | 123.04147611475679 | 10.605398818512692 |
| NE Stall 5 | Wet Store Building | wet_v5_NE_5 | 1 | 1 | 2 | 123.04150361106761 | 10.60539103888481 |
| NE Stall 5 | Wet Store Building | wet_v5_NE_5 | 1 | 1 | 3 | 123.04149147076913 | 10.60534958215679 |
| NE Stall 5 | Wet Store Building | wet_v5_NE_5 | 1 | 1 | 4 | 123.0414639744583 | 10.605357361785718 |
| NE Stall 5 | Wet Store Building | wet_v5_NE_5 | 1 | 1 | 5 (close) | 123.04147611475679 | 10.605398818512692 |
| NE Stall 4 | Wet Store Building | wet_v5_NE_4 | 1 | 1 | 1 | 123.04150361106761 | 10.60539103888481 |
| NE Stall 4 | Wet Store Building | wet_v5_NE_4 | 1 | 1 | 2 | 123.0415311073784 | 10.605383259256735 |
| NE Stall 4 | Wet Store Building | wet_v5_NE_4 | 1 | 1 | 3 | 123.04151896707991 | 10.605341802527647 |
| NE Stall 4 | Wet Store Building | wet_v5_NE_4 | 1 | 1 | 4 | 123.04149147076913 | 10.60534958215679 |
| NE Stall 4 | Wet Store Building | wet_v5_NE_4 | 1 | 1 | 5 (close) | 123.04150361106761 | 10.60539103888481 |
| NE Stall 3 | Wet Store Building | wet_v5_NE_3 | 1 | 1 | 1 | 123.0415311073784 | 10.605383259256735 |
| NE Stall 3 | Wet Store Building | wet_v5_NE_3 | 1 | 1 | 2 | 123.04155860368918 | 10.605375479628469 |
| NE Stall 3 | Wet Store Building | wet_v5_NE_3 | 1 | 1 | 3 | 123.0415464633907 | 10.605334022898326 |
| NE Stall 3 | Wet Store Building | wet_v5_NE_3 | 1 | 1 | 4 | 123.04151896707991 | 10.605341802527647 |
| NE Stall 3 | Wet Store Building | wet_v5_NE_3 | 1 | 1 | 5 (close) | 123.0415311073784 | 10.605383259256735 |
| NE Stall 2 | Wet Store Building | wet_v5_NE_2 | 1 | 1 | 1 | 123.04155860368918 | 10.605375479628469 |
| NE Stall 2 | Wet Store Building | wet_v5_NE_2 | 1 | 1 | 2 | 123.04158609999998 | 10.605367699999988 |
| NE Stall 2 | Wet Store Building | wet_v5_NE_2 | 1 | 1 | 3 | 123.0415739597015 | 10.605326243268802 |
| NE Stall 2 | Wet Store Building | wet_v5_NE_2 | 1 | 1 | 4 | 123.0415464633907 | 10.605334022898326 |
| NE Stall 2 | Wet Store Building | wet_v5_NE_2 | 1 | 1 | 5 (close) | 123.04155860368918 | 10.605375479628469 |
| NE Stall 1 | Wet Store Building | wet_v5_NE_1 | 1 | 1 | 1 | 123.04154613914177 | 10.605334114639238 |
| NE Stall 1 | Wet Store Building | wet_v5_NE_1 | 1 | 1 | 2 | 123.0415739597015 | 10.605326243268802 |
| NE Stall 1 | Wet Store Building | wet_v5_NE_1 | 1 | 1 | 3 | 123.04156246977612 | 10.605287007428762 |
| NE Stall 1 | Wet Store Building | wet_v5_NE_1 | 1 | 1 | 4 | 123.04153464921639 | 10.605294878800203 |
| NE Stall 1 | Wet Store Building | wet_v5_NE_1 | 1 | 1 | 5 (close) | 123.04154613914177 | 10.605334114639238 |
| SW Stall 2 | Wet Store Building | wet_v5_SW_2 | 1 | 1 | 1 | 123.04087700671641 | 10.605396776129744 |
| SW Stall 2 | Wet Store Building | wet_v5_SW_2 | 1 | 1 | 2 | 123.04090469757656 | 10.605388941457287 |
| SW Stall 2 | Wet Store Building | wet_v5_SW_2 | 1 | 1 | 3 | 123.04089299086017 | 10.605348965326517 |
| SW Stall 2 | Wet Store Building | wet_v5_SW_2 | 1 | 1 | 4 | 123.04086530000001 | 10.605356800000006 |
| SW Stall 2 | Wet Store Building | wet_v5_SW_2 | 1 | 1 | 5 (close) | 123.04087700671641 | 10.605396776129744 |
| SW Stall 3 | Wet Store Building | wet_v5_SW_3 | 1 | 1 | 1 | 123.04090469757656 | 10.605388941457287 |
| SW Stall 3 | Wet Store Building | wet_v5_SW_3 | 1 | 1 | 2 | 123.04093238843674 | 10.605381106784625 |
| SW Stall 3 | Wet Store Building | wet_v5_SW_3 | 1 | 1 | 3 | 123.04092068172035 | 10.605341130652825 |
| SW Stall 3 | Wet Store Building | wet_v5_SW_3 | 1 | 1 | 4 | 123.04089299086017 | 10.605348965326517 |
| SW Stall 3 | Wet Store Building | wet_v5_SW_3 | 1 | 1 | 5 (close) | 123.04090469757656 | 10.605388941457287 |
| SW Stall 4 | Wet Store Building | wet_v5_SW_4 | 1 | 1 | 1 | 123.04093238843674 | 10.605381106784625 |
| SW Stall 4 | Wet Store Building | wet_v5_SW_4 | 1 | 1 | 2 | 123.0409600792969 | 10.605373272111734 |
| SW Stall 4 | Wet Store Building | wet_v5_SW_4 | 1 | 1 | 3 | 123.04094837258052 | 10.605333295978928 |
| SW Stall 4 | Wet Store Building | wet_v5_SW_4 | 1 | 1 | 4 | 123.04092068172035 | 10.605341130652825 |
| SW Stall 4 | Wet Store Building | wet_v5_SW_4 | 1 | 1 | 5 (close) | 123.04093238843674 | 10.605381106784625 |
| SW Stall 5 | Wet Store Building | wet_v5_SW_5 | 1 | 1 | 1 | 123.0409600792969 | 10.605373272111734 |
| SW Stall 5 | Wet Store Building | wet_v5_SW_5 | 1 | 1 | 2 | 123.04098777015709 | 10.605365437438676 |
| SW Stall 5 | Wet Store Building | wet_v5_SW_5 | 1 | 1 | 3 | 123.04097606344068 | 10.60532546130483 |
| SW Stall 5 | Wet Store Building | wet_v5_SW_5 | 1 | 1 | 4 | 123.04094837258052 | 10.605333295978928 |
| SW Stall 5 | Wet Store Building | wet_v5_SW_5 | 1 | 1 | 5 (close) | 123.0409600792969 | 10.605373272111734 |
| SW Stall 6 | Wet Store Building | wet_v5_SW_6 | 1 | 1 | 1 | 123.04098777015709 | 10.605365437438676 |
| SW Stall 6 | Wet Store Building | wet_v5_SW_6 | 1 | 1 | 2 | 123.04101546101724 | 10.605357602765404 |
| SW Stall 6 | Wet Store Building | wet_v5_SW_6 | 1 | 1 | 3 | 123.04100375430083 | 10.605317626630539 |
| SW Stall 6 | Wet Store Building | wet_v5_SW_6 | 1 | 1 | 4 | 123.04097606344068 | 10.60532546130483 |
| SW Stall 6 | Wet Store Building | wet_v5_SW_6 | 1 | 1 | 5 (close) | 123.04098777015709 | 10.605365437438676 |
| SW Stall 7 | Wet Store Building | wet_v5_SW_7 | 1 | 1 | 1 | 123.04101546101724 | 10.605357602765404 |
| SW Stall 7 | Wet Store Building | wet_v5_SW_7 | 1 | 1 | 2 | 123.04104315187739 | 10.60534976809194 |
| SW Stall 7 | Wet Store Building | wet_v5_SW_7 | 1 | 1 | 3 | 123.04103144516101 | 10.605309791956044 |
| SW Stall 7 | Wet Store Building | wet_v5_SW_7 | 1 | 1 | 4 | 123.04100375430083 | 10.605317626630539 |
| SW Stall 7 | Wet Store Building | wet_v5_SW_7 | 1 | 1 | 5 (close) | 123.04101546101724 | 10.605357602765404 |
| SW Stall 8 | Wet Store Building | wet_v5_SW_8 | 1 | 1 | 1 | 123.04104315187739 | 10.60534976809194 |
| SW Stall 8 | Wet Store Building | wet_v5_SW_8 | 1 | 1 | 2 | 123.04107084273757 | 10.605341933418273 |
| SW Stall 8 | Wet Store Building | wet_v5_SW_8 | 1 | 1 | 3 | 123.04105913602116 | 10.605301957281359 |
| SW Stall 8 | Wet Store Building | wet_v5_SW_8 | 1 | 1 | 4 | 123.04103144516101 | 10.605309791956044 |
| SW Stall 8 | Wet Store Building | wet_v5_SW_8 | 1 | 1 | 5 (close) | 123.04104315187739 | 10.60534976809194 |
| SW Stall 9 | Wet Store Building | wet_v5_SW_9 | 1 | 1 | 1 | 123.04107084273757 | 10.605341933418273 |
| SW Stall 9 | Wet Store Building | wet_v5_SW_9 | 1 | 1 | 2 | 123.04109853359769 | 10.605334098744377 |
| SW Stall 9 | Wet Store Building | wet_v5_SW_9 | 1 | 1 | 3 | 123.0410868268813 | 10.605294122606447 |
| SW Stall 9 | Wet Store Building | wet_v5_SW_9 | 1 | 1 | 4 | 123.04105913602116 | 10.605301957281359 |
| SW Stall 9 | Wet Store Building | wet_v5_SW_9 | 1 | 1 | 5 (close) | 123.04107084273757 | 10.605341933418273 |
| SW Stall 10 | Wet Store Building | wet_v5_SW_10 | 1 | 1 | 1 | 123.04109853359769 | 10.605334098744377 |
| SW Stall 10 | Wet Store Building | wet_v5_SW_10 | 1 | 1 | 2 | 123.04112622445786 | 10.605326264070303 |
| SW Stall 10 | Wet Store Building | wet_v5_SW_10 | 1 | 1 | 3 | 123.04111451774148 | 10.605286287931353 |
| SW Stall 10 | Wet Store Building | wet_v5_SW_10 | 1 | 1 | 4 | 123.0410868268813 | 10.605294122606447 |
| SW Stall 10 | Wet Store Building | wet_v5_SW_10 | 1 | 1 | 5 (close) | 123.04109853359769 | 10.605334098744377 |
| SW Stall 11 | Wet Store Building | wet_v5_SW_11 | 1 | 1 | 1 | 123.04112622445786 | 10.605326264070303 |
| SW Stall 11 | Wet Store Building | wet_v5_SW_11 | 1 | 1 | 2 | 123.04115391531803 | 10.60531842939604 |
| SW Stall 11 | Wet Store Building | wet_v5_SW_11 | 1 | 1 | 3 | 123.04114220860163 | 10.605278453256059 |
| SW Stall 11 | Wet Store Building | wet_v5_SW_11 | 1 | 1 | 4 | 123.04111451774148 | 10.605286287931353 |
| SW Stall 11 | Wet Store Building | wet_v5_SW_11 | 1 | 1 | 5 (close) | 123.04112622445786 | 10.605326264070303 |
| SW Stall 12 | Wet Store Building | wet_v5_SW_12 | 1 | 1 | 1 | 123.04115391531803 | 10.60531842939604 |
| SW Stall 12 | Wet Store Building | wet_v5_SW_12 | 1 | 1 | 2 | 123.04118160617818 | 10.605310594721583 |
| SW Stall 12 | Wet Store Building | wet_v5_SW_12 | 1 | 1 | 3 | 123.04116989946179 | 10.60527061858056 |
| SW Stall 12 | Wet Store Building | wet_v5_SW_12 | 1 | 1 | 4 | 123.04114220860163 | 10.605278453256059 |
| SW Stall 12 | Wet Store Building | wet_v5_SW_12 | 1 | 1 | 5 (close) | 123.04115391531803 | 10.60531842939604 |
| SW Stall 1 | Wet Store Building | wet_v5_SW_1 | 1 | 1 | 1 | 123.04088849664177 | 10.605436011955714 |
| SW Stall 1 | Wet Store Building | wet_v5_SW_1 | 1 | 1 | 2 | 123.04091631720152 | 10.605428140587911 |
| SW Stall 1 | Wet Store Building | wet_v5_SW_1 | 1 | 1 | 3 | 123.04090482727614 | 10.605388904760924 |
| SW Stall 1 | Wet Store Building | wet_v5_SW_1 | 1 | 1 | 4 | 123.04087700671641 | 10.605396776129744 |
| SW Stall 1 | Wet Store Building | wet_v5_SW_1 | 1 | 1 | 5 (close) | 123.04088849664177 | 10.605436011955714 |
| SE Stall 12 | Wet Store Building | wet_v5_SE_12 | 1 | 1 | 1 | 123.0412372472977 | 10.605294851979274 |
| SE Stall 12 | Wet Store Building | wet_v5_SE_12 | 1 | 1 | 2 | 123.0412647436085 | 10.605287072348757 |
| SE Stall 12 | Wet Store Building | wet_v5_SE_12 | 1 | 1 | 3 | 123.04125303689209 | 10.605247096204678 |
| SE Stall 12 | Wet Store Building | wet_v5_SE_12 | 1 | 1 | 4 | 123.0412255405813 | 10.605254875836215 |
| SE Stall 12 | Wet Store Building | wet_v5_SE_12 | 1 | 1 | 5 (close) | 123.0412372472977 | 10.605294851979274 |
| SE Stall 11 | Wet Store Building | wet_v5_SE_11 | 1 | 1 | 1 | 123.0412647436085 | 10.605287072348757 |
| SE Stall 11 | Wet Store Building | wet_v5_SE_11 | 1 | 1 | 2 | 123.04129223991927 | 10.605279292718036 |
| SE Stall 11 | Wet Store Building | wet_v5_SE_11 | 1 | 1 | 3 | 123.04128053320287 | 10.605239316572941 |
| SE Stall 11 | Wet Store Building | wet_v5_SE_11 | 1 | 1 | 4 | 123.04125303689209 | 10.605247096204678 |
| SE Stall 11 | Wet Store Building | wet_v5_SE_11 | 1 | 1 | 5 (close) | 123.0412647436085 | 10.605287072348757 |
| SE Stall 10 | Wet Store Building | wet_v5_SE_10 | 1 | 1 | 1 | 123.04129223991927 | 10.605279292718036 |
| SE Stall 10 | Wet Store Building | wet_v5_SE_10 | 1 | 1 | 2 | 123.04131973623007 | 10.605271513087125 |
| SE Stall 10 | Wet Store Building | wet_v5_SE_10 | 1 | 1 | 3 | 123.04130802951367 | 10.605231536941012 |
| SE Stall 10 | Wet Store Building | wet_v5_SE_10 | 1 | 1 | 4 | 123.04128053320287 | 10.605239316572941 |
| SE Stall 10 | Wet Store Building | wet_v5_SE_10 | 1 | 1 | 5 (close) | 123.04129223991927 | 10.605279292718036 |
| SE Stall 9 | Wet Store Building | wet_v5_SE_9 | 1 | 1 | 1 | 123.04131973623007 | 10.605271513087125 |
| SE Stall 9 | Wet Store Building | wet_v5_SE_9 | 1 | 1 | 2 | 123.04134723254086 | 10.60526373345601 |
| SE Stall 9 | Wet Store Building | wet_v5_SE_9 | 1 | 1 | 3 | 123.04133552582445 | 10.60522375730888 |
| SE Stall 9 | Wet Store Building | wet_v5_SE_9 | 1 | 1 | 4 | 123.04130802951367 | 10.605231536941012 |
| SE Stall 9 | Wet Store Building | wet_v5_SE_9 | 1 | 1 | 5 (close) | 123.04131973623007 | 10.605271513087125 |
| SE Stall 8 | Wet Store Building | wet_v5_SE_8 | 1 | 1 | 1 | 123.04134723254086 | 10.60526373345601 |
| SE Stall 8 | Wet Store Building | wet_v5_SE_8 | 1 | 1 | 2 | 123.04137472885165 | 10.60525595382469 |
| SE Stall 8 | Wet Store Building | wet_v5_SE_8 | 1 | 1 | 3 | 123.04136302213524 | 10.605215977676542 |
| SE Stall 8 | Wet Store Building | wet_v5_SE_8 | 1 | 1 | 4 | 123.04133552582445 | 10.60522375730888 |
| SE Stall 8 | Wet Store Building | wet_v5_SE_8 | 1 | 1 | 5 (close) | 123.04134723254086 | 10.60526373345601 |
| SE Stall 7 | Wet Store Building | wet_v5_SE_7 | 1 | 1 | 1 | 123.04137472885165 | 10.60525595382469 |
| SE Stall 7 | Wet Store Building | wet_v5_SE_7 | 1 | 1 | 2 | 123.04140222516241 | 10.605248174193195 |
| SE Stall 7 | Wet Store Building | wet_v5_SE_7 | 1 | 1 | 3 | 123.04139051844604 | 10.605208198044028 |
| SE Stall 7 | Wet Store Building | wet_v5_SE_7 | 1 | 1 | 4 | 123.04136302213524 | 10.605215977676542 |
| SE Stall 7 | Wet Store Building | wet_v5_SE_7 | 1 | 1 | 5 (close) | 123.04137472885165 | 10.60525595382469 |
| SE Stall 6 | Wet Store Building | wet_v5_SE_6 | 1 | 1 | 1 | 123.04140222516241 | 10.605248174193195 |
| SE Stall 6 | Wet Store Building | wet_v5_SE_6 | 1 | 1 | 2 | 123.04142972147321 | 10.60524039456148 |
| SE Stall 6 | Wet Store Building | wet_v5_SE_6 | 1 | 1 | 3 | 123.04141801475681 | 10.605200418411311 |
| SE Stall 6 | Wet Store Building | wet_v5_SE_6 | 1 | 1 | 4 | 123.04139051844604 | 10.605208198044028 |
| SE Stall 6 | Wet Store Building | wet_v5_SE_6 | 1 | 1 | 5 (close) | 123.04140222516241 | 10.605248174193195 |
| SE Stall 5 | Wet Store Building | wet_v5_SE_5 | 1 | 1 | 1 | 123.04142972147321 | 10.60524039456148 |
| SE Stall 5 | Wet Store Building | wet_v5_SE_5 | 1 | 1 | 2 | 123.04145721778404 | 10.605232614929564 |
| SE Stall 5 | Wet Store Building | wet_v5_SE_5 | 1 | 1 | 3 | 123.04144551106765 | 10.605192638778377 |
| SE Stall 5 | Wet Store Building | wet_v5_SE_5 | 1 | 1 | 4 | 123.04141801475681 | 10.605200418411311 |
| SE Stall 5 | Wet Store Building | wet_v5_SE_5 | 1 | 1 | 5 (close) | 123.04142972147321 | 10.60524039456148 |
| SE Stall 4 | Wet Store Building | wet_v5_SE_4 | 1 | 1 | 1 | 123.04145721778404 | 10.605232614929564 |
| SE Stall 4 | Wet Store Building | wet_v5_SE_4 | 1 | 1 | 2 | 123.04148471409484 | 10.60522483529747 |
| SE Stall 4 | Wet Store Building | wet_v5_SE_4 | 1 | 1 | 3 | 123.04147300737843 | 10.605184859145265 |
| SE Stall 4 | Wet Store Building | wet_v5_SE_4 | 1 | 1 | 4 | 123.04144551106765 | 10.605192638778377 |
| SE Stall 4 | Wet Store Building | wet_v5_SE_4 | 1 | 1 | 5 (close) | 123.04145721778404 | 10.605232614929564 |
| SE Stall 3 | Wet Store Building | wet_v5_SE_3 | 1 | 1 | 1 | 123.04148471409484 | 10.60522483529747 |
| SE Stall 3 | Wet Store Building | wet_v5_SE_3 | 1 | 1 | 2 | 123.0415122104056 | 10.605217055665172 |
| SE Stall 3 | Wet Store Building | wet_v5_SE_3 | 1 | 1 | 3 | 123.04150050368924 | 10.605177079511948 |
| SE Stall 3 | Wet Store Building | wet_v5_SE_3 | 1 | 1 | 4 | 123.04147300737843 | 10.605184859145265 |
| SE Stall 3 | Wet Store Building | wet_v5_SE_3 | 1 | 1 | 5 (close) | 123.04148471409484 | 10.60522483529747 |
| SE Stall 2 | Wet Store Building | wet_v5_SE_2 | 1 | 1 | 1 | 123.0415122104056 | 10.605217055665172 |
| SE Stall 2 | Wet Store Building | wet_v5_SE_2 | 1 | 1 | 2 | 123.04153970671642 | 10.60520927603267 |
| SE Stall 2 | Wet Store Building | wet_v5_SE_2 | 1 | 1 | 3 | 123.04152800000001 | 10.605169299878428 |
| SE Stall 2 | Wet Store Building | wet_v5_SE_2 | 1 | 1 | 4 | 123.04150050368924 | 10.605177079511948 |
| SE Stall 2 | Wet Store Building | wet_v5_SE_2 | 1 | 1 | 5 (close) | 123.0415122104056 | 10.605217055665172 |
| SE Stall 1 | Wet Store Building | wet_v5_SE_1 | 1 | 1 | 1 | 123.04152337608205 | 10.605256383255117 |
| SE Stall 1 | Wet Store Building | wet_v5_SE_1 | 1 | 1 | 2 | 123.04155119664178 | 10.605248511882685 |
| SE Stall 1 | Wet Store Building | wet_v5_SE_1 | 1 | 1 | 3 | 123.04153970671642 | 10.60520927603267 |
| SE Stall 1 | Wet Store Building | wet_v5_SE_1 | 1 | 1 | 4 | 123.04151188615667 | 10.60521714740611 |
| SE Stall 1 | Wet Store Building | wet_v5_SE_1 | 1 | 1 | 5 (close) | 123.04152337608205 | 10.605256383255117 |
| Table Stall W1 | Wet Store Building | wet_v5_table_1 | 1 | 1 | 1 | 123.04093908026123 | 10.605505871928393 |
| Table Stall W1 | Wet Store Building | wet_v5_table_1 | 1 | 1 | 2 | 123.04096675815146 | 10.605498040928344 |
| Table Stall W1 | Wet Store Building | wet_v5_table_1 | 1 | 1 | 3 | 123.04095786971862 | 10.605467688692213 |
| Table Stall W1 | Wet Store Building | wet_v5_table_1 | 1 | 1 | 4 | 123.04093019182842 | 10.605475519693039 |
| Table Stall W1 | Wet Store Building | wet_v5_table_1 | 1 | 1 | 5 (close) | 123.04093908026123 | 10.605505871928393 |
| Table Stall W2 | Wet Store Building | wet_v5_table_2 | 1 | 1 | 1 | 123.04096675815146 | 10.605498040928344 |
| Table Stall W2 | Wet Store Building | wet_v5_table_2 | 1 | 1 | 2 | 123.04099443604164 | 10.605490209928115 |
| Table Stall W2 | Wet Store Building | wet_v5_table_2 | 1 | 1 | 3 | 123.0409855476088 | 10.605459857691196 |
| Table Stall W2 | Wet Store Building | wet_v5_table_2 | 1 | 1 | 4 | 123.04095786971862 | 10.605467688692213 |
| Table Stall W2 | Wet Store Building | wet_v5_table_2 | 1 | 1 | 5 (close) | 123.04096675815146 | 10.605498040928344 |
| Table Stall W3 | Wet Store Building | wet_v5_table_3 | 1 | 1 | 1 | 123.04099443604164 | 10.605490209928115 |
| Table Stall W3 | Wet Store Building | wet_v5_table_3 | 1 | 1 | 2 | 123.04102211393185 | 10.605482378927684 |
| Table Stall W3 | Wet Store Building | wet_v5_table_3 | 1 | 1 | 3 | 123.04101322549903 | 10.605452026689989 |
| Table Stall W3 | Wet Store Building | wet_v5_table_3 | 1 | 1 | 4 | 123.0409855476088 | 10.605459857691196 |
| Table Stall W3 | Wet Store Building | wet_v5_table_3 | 1 | 1 | 5 (close) | 123.04099443604164 | 10.605490209928115 |
| Table Stall W4 | Wet Store Building | wet_v5_table_4 | 1 | 1 | 1 | 123.04102211393185 | 10.605482378927684 |
| Table Stall W4 | Wet Store Building | wet_v5_table_4 | 1 | 1 | 2 | 123.04104979182208 | 10.605474547927024 |
| Table Stall W4 | Wet Store Building | wet_v5_table_4 | 1 | 1 | 3 | 123.04104090338923 | 10.605444195688564 |
| Table Stall W4 | Wet Store Building | wet_v5_table_4 | 1 | 1 | 4 | 123.04101322549903 | 10.605452026689989 |
| Table Stall W4 | Wet Store Building | wet_v5_table_4 | 1 | 1 | 5 (close) | 123.04102211393185 | 10.605482378927684 |
| Table Stall W5 | Wet Store Building | wet_v5_table_5 | 1 | 1 | 1 | 123.04104979182208 | 10.605474547927024 |
| Table Stall W5 | Wet Store Building | wet_v5_table_5 | 1 | 1 | 2 | 123.04107746971226 | 10.605466716926196 |
| Table Stall W5 | Wet Store Building | wet_v5_table_5 | 1 | 1 | 3 | 123.04106858127942 | 10.60543636468695 |
| Table Stall W5 | Wet Store Building | wet_v5_table_5 | 1 | 1 | 4 | 123.04104090338923 | 10.605444195688564 |
| Table Stall W5 | Wet Store Building | wet_v5_table_5 | 1 | 1 | 5 (close) | 123.04104979182208 | 10.605474547927024 |
| Table Stall W6 | Wet Store Building | wet_v5_table_6 | 1 | 1 | 1 | 123.04107746971226 | 10.605466716926196 |
| Table Stall W6 | Wet Store Building | wet_v5_table_6 | 1 | 1 | 2 | 123.04110514760248 | 10.605458885925142 |
| Table Stall W6 | Wet Store Building | wet_v5_table_6 | 1 | 1 | 3 | 123.04109625916965 | 10.605428533685119 |
| Table Stall W6 | Wet Store Building | wet_v5_table_6 | 1 | 1 | 4 | 123.04106858127942 | 10.60543636468695 |
| Table Stall W6 | Wet Store Building | wet_v5_table_6 | 1 | 1 | 5 (close) | 123.04107746971226 | 10.605466716926196 |
| Table Stall W7 | Wet Store Building | wet_v5_table_7 | 1 | 1 | 1 | 123.04110514760248 | 10.605458885925142 |
| Table Stall W7 | Wet Store Building | wet_v5_table_7 | 1 | 1 | 2 | 123.04113282549265 | 10.60545105492391 |
| Table Stall W7 | Wet Store Building | wet_v5_table_7 | 1 | 1 | 3 | 123.04112393705982 | 10.60542070268311 |
| Table Stall W7 | Wet Store Building | wet_v5_table_7 | 1 | 1 | 4 | 123.04109625916965 | 10.605428533685119 |
| Table Stall W7 | Wet Store Building | wet_v5_table_7 | 1 | 1 | 5 (close) | 123.04110514760248 | 10.605458885925142 |
| Table Stall W8 | Wet Store Building | wet_v5_table_8 | 1 | 1 | 1 | 123.04113282549265 | 10.60545105492391 |
| Table Stall W8 | Wet Store Building | wet_v5_table_8 | 1 | 1 | 2 | 123.04116050338287 | 10.605443223922473 |
| Table Stall W8 | Wet Store Building | wet_v5_table_8 | 1 | 1 | 3 | 123.04115161495005 | 10.605412871680898 |
| Table Stall W8 | Wet Store Building | wet_v5_table_8 | 1 | 1 | 4 | 123.04112393705982 | 10.60542070268311 |
| Table Stall W8 | Wet Store Building | wet_v5_table_8 | 1 | 1 | 5 (close) | 123.04113282549265 | 10.60545105492391 |
| Table Stall W9 | Wet Store Building | wet_v5_table_9 | 1 | 1 | 1 | 123.04116050338287 | 10.605443223922473 |
| Table Stall W9 | Wet Store Building | wet_v5_table_9 | 1 | 1 | 2 | 123.0411881812731 | 10.60543539292082 |
| Table Stall W9 | Wet Store Building | wet_v5_table_9 | 1 | 1 | 3 | 123.04117929284025 | 10.605405040678468 |
| Table Stall W9 | Wet Store Building | wet_v5_table_9 | 1 | 1 | 4 | 123.04115161495005 | 10.605412871680898 |
| Table Stall W9 | Wet Store Building | wet_v5_table_9 | 1 | 1 | 5 (close) | 123.04116050338287 | 10.605443223922473 |
| Table Stall W10 | Wet Store Building | wet_v5_table_10 | 1 | 1 | 1 | 123.0411881812731 | 10.60543539292082 |
| Table Stall W10 | Wet Store Building | wet_v5_table_10 | 1 | 1 | 2 | 123.04121585916327 | 10.605427561918976 |
| Table Stall W10 | Wet Store Building | wet_v5_table_10 | 1 | 1 | 3 | 123.04120697073044 | 10.605397209675848 |
| Table Stall W10 | Wet Store Building | wet_v5_table_10 | 1 | 1 | 4 | 123.04117929284025 | 10.605405040678468 |
| Table Stall W10 | Wet Store Building | wet_v5_table_10 | 1 | 1 | 5 (close) | 123.0411881812731 | 10.60543539292082 |
| Table Stall W11 | Wet Store Building | wet_v5_table_11 | 1 | 1 | 1 | 123.04091349891794 | 10.6054185167063 |
| Table Stall W11 | Wet Store Building | wet_v5_table_11 | 1 | 1 | 2 | 123.04094117680816 | 10.60541068570401 |
| Table Stall W11 | Wet Store Building | wet_v5_table_11 | 1 | 1 | 3 | 123.04093250516637 | 10.605381073757885 |
| Table Stall W11 | Wet Store Building | wet_v5_table_11 | 1 | 1 | 4 | 123.04090482727614 | 10.605388904760924 |
| Table Stall W11 | Wet Store Building | wet_v5_table_11 | 1 | 1 | 5 (close) | 123.04091349891794 | 10.6054185167063 |
| Table Stall W12 | Wet Store Building | wet_v5_table_12 | 1 | 1 | 1 | 123.04094117680816 | 10.60541068570401 |
| Table Stall W12 | Wet Store Building | wet_v5_table_12 | 1 | 1 | 2 | 123.04096885469836 | 10.605402854701543 |
| Table Stall W12 | Wet Store Building | wet_v5_table_12 | 1 | 1 | 3 | 123.04096018305655 | 10.605373242754666 |
| Table Stall W12 | Wet Store Building | wet_v5_table_12 | 1 | 1 | 4 | 123.04093250516637 | 10.605381073757885 |
| Table Stall W12 | Wet Store Building | wet_v5_table_12 | 1 | 1 | 5 (close) | 123.04094117680816 | 10.60541068570401 |
| Table Stall W13 | Wet Store Building | wet_v5_table_13 | 1 | 1 | 1 | 123.04096885469836 | 10.605402854701543 |
| Table Stall W13 | Wet Store Building | wet_v5_table_13 | 1 | 1 | 2 | 123.04099653258857 | 10.605395023698872 |
| Table Stall W13 | Wet Store Building | wet_v5_table_13 | 1 | 1 | 3 | 123.04098786094677 | 10.605365411751233 |
| Table Stall W13 | Wet Store Building | wet_v5_table_13 | 1 | 1 | 4 | 123.04096018305655 | 10.605373242754666 |
| Table Stall W13 | Wet Store Building | wet_v5_table_13 | 1 | 1 | 5 (close) | 123.04096885469836 | 10.605402854701543 |
| Table Stall W14 | Wet Store Building | wet_v5_table_14 | 1 | 1 | 1 | 123.04099653258857 | 10.605395023698872 |
| Table Stall W14 | Wet Store Building | wet_v5_table_14 | 1 | 1 | 2 | 123.0410242104788 | 10.605387192695984 |
| Table Stall W14 | Wet Store Building | wet_v5_table_14 | 1 | 1 | 3 | 123.04101553883699 | 10.605357580747581 |
| Table Stall W14 | Wet Store Building | wet_v5_table_14 | 1 | 1 | 4 | 123.04098786094677 | 10.605365411751233 |
| Table Stall W14 | Wet Store Building | wet_v5_table_14 | 1 | 1 | 5 (close) | 123.04099653258857 | 10.605395023698872 |
| Table Stall W15 | Wet Store Building | wet_v5_table_15 | 1 | 1 | 1 | 123.0410242104788 | 10.605387192695984 |
| Table Stall W15 | Wet Store Building | wet_v5_table_15 | 1 | 1 | 2 | 123.04105188836897 | 10.60537936169292 |
| Table Stall W15 | Wet Store Building | wet_v5_table_15 | 1 | 1 | 3 | 123.04104321672718 | 10.605349749743754 |
| Table Stall W15 | Wet Store Building | wet_v5_table_15 | 1 | 1 | 4 | 123.04101553883699 | 10.605357580747581 |
| Table Stall W15 | Wet Store Building | wet_v5_table_15 | 1 | 1 | 5 (close) | 123.0410242104788 | 10.605387192695984 |
| Table Stall W16 | Wet Store Building | wet_v5_table_16 | 1 | 1 | 1 | 123.04105188836897 | 10.60537936169292 |
| Table Stall W16 | Wet Store Building | wet_v5_table_16 | 1 | 1 | 2 | 123.04107956625919 | 10.605371530689625 |
| Table Stall W16 | Wet Store Building | wet_v5_table_16 | 1 | 1 | 3 | 123.04107089461739 | 10.60534191873971 |
| Table Stall W16 | Wet Store Building | wet_v5_table_16 | 1 | 1 | 4 | 123.04104321672718 | 10.605349749743754 |
| Table Stall W16 | Wet Store Building | wet_v5_table_16 | 1 | 1 | 5 (close) | 123.04105188836897 | 10.60537936169292 |
| Table Stall W17 | Wet Store Building | wet_v5_table_17 | 1 | 1 | 1 | 123.04107956625919 | 10.605371530689625 |
| Table Stall W17 | Wet Store Building | wet_v5_table_17 | 1 | 1 | 2 | 123.04110724414939 | 10.605363699686153 |
| Table Stall W17 | Wet Store Building | wet_v5_table_17 | 1 | 1 | 3 | 123.04109857250756 | 10.605334087735486 |
| Table Stall W17 | Wet Store Building | wet_v5_table_17 | 1 | 1 | 4 | 123.04107089461739 | 10.60534191873971 |
| Table Stall W17 | Wet Store Building | wet_v5_table_17 | 1 | 1 | 5 (close) | 123.04107956625919 | 10.605371530689625 |
| Table Stall W18 | Wet Store Building | wet_v5_table_18 | 1 | 1 | 1 | 123.04110724414939 | 10.605363699686153 |
| Table Stall W18 | Wet Store Building | wet_v5_table_18 | 1 | 1 | 2 | 123.04113492203959 | 10.605355868682476 |
| Table Stall W18 | Wet Store Building | wet_v5_table_18 | 1 | 1 | 3 | 123.04112625039777 | 10.60532625673106 |
| Table Stall W18 | Wet Store Building | wet_v5_table_18 | 1 | 1 | 4 | 123.04109857250756 | 10.605334087735486 |
| Table Stall W18 | Wet Store Building | wet_v5_table_18 | 1 | 1 | 5 (close) | 123.04110724414939 | 10.605363699686153 |
| Table Stall W19 | Wet Store Building | wet_v5_table_19 | 1 | 1 | 1 | 123.04113492203959 | 10.605355868682476 |
| Table Stall W19 | Wet Store Building | wet_v5_table_19 | 1 | 1 | 2 | 123.04116259992982 | 10.605348037678597 |
| Table Stall W19 | Wet Store Building | wet_v5_table_19 | 1 | 1 | 3 | 123.041153928288 | 10.605318425726404 |
| Table Stall W19 | Wet Store Building | wet_v5_table_19 | 1 | 1 | 4 | 123.04112625039777 | 10.60532625673106 |
| Table Stall W19 | Wet Store Building | wet_v5_table_19 | 1 | 1 | 5 (close) | 123.04113492203959 | 10.605355868682476 |
| Table Stall W20 | Wet Store Building | wet_v5_table_20 | 1 | 1 | 1 | 123.04116259992982 | 10.605348037678597 |
| Table Stall W20 | Wet Store Building | wet_v5_table_20 | 1 | 1 | 2 | 123.04119027782 | 10.605340206674528 |
| Table Stall W20 | Wet Store Building | wet_v5_table_20 | 1 | 1 | 3 | 123.04118160617818 | 10.605310594721583 |
| Table Stall W20 | Wet Store Building | wet_v5_table_20 | 1 | 1 | 4 | 123.041153928288 | 10.605318425726404 |
| Table Stall W20 | Wet Store Building | wet_v5_table_20 | 1 | 1 | 5 (close) | 123.04116259992982 | 10.605348037678597 |
| Table Stall W21 | Wet Store Building | wet_v5_table_21 | 1 | 1 | 1 | 123.04127150028279 | 10.605411819182708 |
| Table Stall W21 | Wet Store Building | wet_v5_table_21 | 1 | 1 | 2 | 123.04129896416867 | 10.60540404872925 |
| Table Stall W21 | Wet Store Building | wet_v5_table_21 | 1 | 1 | 3 | 123.04129007573583 | 10.605373696483793 |
| Table Stall W21 | Wet Store Building | wet_v5_table_21 | 1 | 1 | 4 | 123.04126261184996 | 10.605381466938002 |
| Table Stall W21 | Wet Store Building | wet_v5_table_21 | 1 | 1 | 5 (close) | 123.04127150028279 | 10.605411819182708 |
| Table Stall W22 | Wet Store Building | wet_v5_table_22 | 1 | 1 | 1 | 123.04129896416867 | 10.60540404872925 |
| Table Stall W22 | Wet Store Building | wet_v5_table_22 | 1 | 1 | 2 | 123.04132642805456 | 10.605396278275574 |
| Table Stall W22 | Wet Store Building | wet_v5_table_22 | 1 | 1 | 3 | 123.04131753962172 | 10.605365926029355 |
| Table Stall W22 | Wet Store Building | wet_v5_table_22 | 1 | 1 | 4 | 123.04129007573583 | 10.605373696483793 |
| Table Stall W22 | Wet Store Building | wet_v5_table_22 | 1 | 1 | 5 (close) | 123.04129896416867 | 10.60540404872925 |
| Table Stall W23 | Wet Store Building | wet_v5_table_23 | 1 | 1 | 1 | 123.04132642805456 | 10.605396278275574 |
| Table Stall W23 | Wet Store Building | wet_v5_table_23 | 1 | 1 | 2 | 123.04135389194047 | 10.605388507821733 |
| Table Stall W23 | Wet Store Building | wet_v5_table_23 | 1 | 1 | 3 | 123.04134500350764 | 10.605358155574738 |
| Table Stall W23 | Wet Store Building | wet_v5_table_23 | 1 | 1 | 4 | 123.04131753962172 | 10.605365926029355 |
| Table Stall W23 | Wet Store Building | wet_v5_table_23 | 1 | 1 | 5 (close) | 123.04132642805456 | 10.605396278275574 |
| Table Stall W24 | Wet Store Building | wet_v5_table_24 | 1 | 1 | 1 | 123.04135389194047 | 10.605388507821733 |
| Table Stall W24 | Wet Store Building | wet_v5_table_24 | 1 | 1 | 2 | 123.04138135582636 | 10.605380737367677 |
| Table Stall W24 | Wet Store Building | wet_v5_table_24 | 1 | 1 | 3 | 123.04137246739353 | 10.605350385119905 |
| Table Stall W24 | Wet Store Building | wet_v5_table_24 | 1 | 1 | 4 | 123.04134500350764 | 10.605358155574738 |
| Table Stall W24 | Wet Store Building | wet_v5_table_24 | 1 | 1 | 5 (close) | 123.04135389194047 | 10.605388507821733 |
| Table Stall W25 | Wet Store Building | wet_v5_table_25 | 1 | 1 | 1 | 123.04138135582636 | 10.605380737367677 |
| Table Stall W25 | Wet Store Building | wet_v5_table_25 | 1 | 1 | 2 | 123.04140881971225 | 10.605372966913441 |
| Table Stall W25 | Wet Store Building | wet_v5_table_25 | 1 | 1 | 3 | 123.04139993127943 | 10.605342614664908 |
| Table Stall W25 | Wet Store Building | wet_v5_table_25 | 1 | 1 | 4 | 123.04137246739353 | 10.605350385119905 |
| Table Stall W25 | Wet Store Building | wet_v5_table_25 | 1 | 1 | 5 (close) | 123.04138135582636 | 10.605380737367677 |
| Table Stall W26 | Wet Store Building | wet_v5_table_26 | 1 | 1 | 1 | 123.04140881971225 | 10.605372966913441 |
| Table Stall W26 | Wet Store Building | wet_v5_table_26 | 1 | 1 | 2 | 123.04143628359817 | 10.60536519645899 |
| Table Stall W26 | Wet Store Building | wet_v5_table_26 | 1 | 1 | 3 | 123.04142739516536 | 10.605334844209679 |
| Table Stall W26 | Wet Store Building | wet_v5_table_26 | 1 | 1 | 4 | 123.04139993127943 | 10.605342614664908 |
| Table Stall W26 | Wet Store Building | wet_v5_table_26 | 1 | 1 | 5 (close) | 123.04140881971225 | 10.605372966913441 |
| Table Stall W27 | Wet Store Building | wet_v5_table_27 | 1 | 1 | 1 | 123.04143628359817 | 10.60536519645899 |
| Table Stall W27 | Wet Store Building | wet_v5_table_27 | 1 | 1 | 2 | 123.04146374748407 | 10.60535742600436 |
| Table Stall W27 | Wet Store Building | wet_v5_table_27 | 1 | 1 | 3 | 123.04145485905124 | 10.605327073754262 |
| Table Stall W27 | Wet Store Building | wet_v5_table_27 | 1 | 1 | 4 | 123.04142739516536 | 10.605334844209679 |
| Table Stall W27 | Wet Store Building | wet_v5_table_27 | 1 | 1 | 5 (close) | 123.04143628359817 | 10.60536519645899 |
| Table Stall W28 | Wet Store Building | wet_v5_table_28 | 1 | 1 | 1 | 123.04146374748407 | 10.60535742600436 |
| Table Stall W28 | Wet Store Building | wet_v5_table_28 | 1 | 1 | 2 | 123.04149121136993 | 10.605349655549501 |
| Table Stall W28 | Wet Store Building | wet_v5_table_28 | 1 | 1 | 3 | 123.04148232293713 | 10.605319303298652 |
| Table Stall W28 | Wet Store Building | wet_v5_table_28 | 1 | 1 | 4 | 123.04145485905124 | 10.605327073754262 |
| Table Stall W28 | Wet Store Building | wet_v5_table_28 | 1 | 1 | 5 (close) | 123.04146374748407 | 10.60535742600436 |
| Table Stall W29 | Wet Store Building | wet_v5_table_29 | 1 | 1 | 1 | 123.04149121136993 | 10.605349655549501 |
| Table Stall W29 | Wet Store Building | wet_v5_table_29 | 1 | 1 | 2 | 123.04151867525589 | 10.605341885094479 |
| Table Stall W29 | Wet Store Building | wet_v5_table_29 | 1 | 1 | 3 | 123.04150978682304 | 10.605311532842853 |
| Table Stall W29 | Wet Store Building | wet_v5_table_29 | 1 | 1 | 4 | 123.04148232293713 | 10.605319303298652 |
| Table Stall W29 | Wet Store Building | wet_v5_table_29 | 1 | 1 | 5 (close) | 123.04149121136993 | 10.605349655549501 |
| Table Stall W30 | Wet Store Building | wet_v5_table_30 | 1 | 1 | 1 | 123.04151867525589 | 10.605341885094479 |
| Table Stall W30 | Wet Store Building | wet_v5_table_30 | 1 | 1 | 2 | 123.04154613914177 | 10.605334114639238 |
| Table Stall W30 | Wet Store Building | wet_v5_table_30 | 1 | 1 | 3 | 123.04153725070893 | 10.60530376238685 |
| Table Stall W30 | Wet Store Building | wet_v5_table_30 | 1 | 1 | 4 | 123.04150978682304 | 10.605311532842853 |
| Table Stall W30 | Wet Store Building | wet_v5_table_30 | 1 | 1 | 5 (close) | 123.04151867525589 | 10.605341885094479 |
| Table Stall W31 | Wet Store Building | wet_v5_table_31 | 1 | 1 | 1 | 123.04124591893951 | 10.605324463933757 |
| Table Stall W31 | Wet Store Building | wet_v5_table_31 | 1 | 1 | 2 | 123.0412733828254 | 10.605316693478084 |
| Table Stall W31 | Wet Store Building | wet_v5_table_31 | 1 | 1 | 3 | 123.04126471118359 | 10.605287081522862 |
| Table Stall W31 | Wet Store Building | wet_v5_table_31 | 1 | 1 | 4 | 123.0412372472977 | 10.605294851979274 |
| Table Stall W31 | Wet Store Building | wet_v5_table_31 | 1 | 1 | 5 (close) | 123.04124591893951 | 10.605324463933757 |
| Table Stall W32 | Wet Store Building | wet_v5_table_32 | 1 | 1 | 1 | 123.0412733828254 | 10.605316693478084 |
| Table Stall W32 | Wet Store Building | wet_v5_table_32 | 1 | 1 | 2 | 123.04130084671128 | 10.605308923022195 |
| Table Stall W32 | Wet Store Building | wet_v5_table_32 | 1 | 1 | 3 | 123.04129217506949 | 10.605279311066223 |
| Table Stall W32 | Wet Store Building | wet_v5_table_32 | 1 | 1 | 4 | 123.04126471118359 | 10.605287081522862 |
| Table Stall W32 | Wet Store Building | wet_v5_table_32 | 1 | 1 | 5 (close) | 123.0412733828254 | 10.605316693478084 |
| Table Stall W33 | Wet Store Building | wet_v5_table_33 | 1 | 1 | 1 | 123.04130084671128 | 10.605308923022195 |
| Table Stall W33 | Wet Store Building | wet_v5_table_33 | 1 | 1 | 2 | 123.0413283105972 | 10.60530115256614 |
| Table Stall W33 | Wet Store Building | wet_v5_table_33 | 1 | 1 | 3 | 123.04131963895539 | 10.605271540609404 |
| Table Stall W33 | Wet Store Building | wet_v5_table_33 | 1 | 1 | 4 | 123.04129217506949 | 10.605279311066223 |
| Table Stall W33 | Wet Store Building | wet_v5_table_33 | 1 | 1 | 5 (close) | 123.04130084671128 | 10.605308923022195 |
| Table Stall W34 | Wet Store Building | wet_v5_table_34 | 1 | 1 | 1 | 123.0413283105972 | 10.60530115256614 |
| Table Stall W34 | Wet Store Building | wet_v5_table_34 | 1 | 1 | 2 | 123.04135577448308 | 10.605293382109858 |
| Table Stall W34 | Wet Store Building | wet_v5_table_34 | 1 | 1 | 3 | 123.04134710284127 | 10.605263770152384 |
| Table Stall W34 | Wet Store Building | wet_v5_table_34 | 1 | 1 | 4 | 123.04131963895539 | 10.605271540609404 |
| Table Stall W34 | Wet Store Building | wet_v5_table_34 | 1 | 1 | 5 (close) | 123.0413283105972 | 10.60530115256614 |
| Table Stall W35 | Wet Store Building | wet_v5_table_35 | 1 | 1 | 1 | 123.04135577448308 | 10.605293382109858 |
| Table Stall W35 | Wet Store Building | wet_v5_table_35 | 1 | 1 | 2 | 123.04138323836897 | 10.605285611653409 |
| Table Stall W35 | Wet Store Building | wet_v5_table_35 | 1 | 1 | 3 | 123.04137456672717 | 10.605255999695173 |
| Table Stall W35 | Wet Store Building | wet_v5_table_35 | 1 | 1 | 4 | 123.04134710284127 | 10.605263770152384 |
| Table Stall W35 | Wet Store Building | wet_v5_table_35 | 1 | 1 | 5 (close) | 123.04135577448308 | 10.605293382109858 |
| Table Stall W36 | Wet Store Building | wet_v5_table_36 | 1 | 1 | 1 | 123.04138323836897 | 10.605285611653409 |
| Table Stall W36 | Wet Store Building | wet_v5_table_36 | 1 | 1 | 2 | 123.0414107022549 | 10.605277841196731 |
| Table Stall W36 | Wet Store Building | wet_v5_table_36 | 1 | 1 | 3 | 123.04140203061309 | 10.605248229237743 |
| Table Stall W36 | Wet Store Building | wet_v5_table_36 | 1 | 1 | 4 | 123.04137456672717 | 10.605255999695173 |
| Table Stall W36 | Wet Store Building | wet_v5_table_36 | 1 | 1 | 5 (close) | 123.04138323836897 | 10.605285611653409 |
| Table Stall W37 | Wet Store Building | wet_v5_table_37 | 1 | 1 | 1 | 123.0414107022549 | 10.605277841196731 |
| Table Stall W37 | Wet Store Building | wet_v5_table_37 | 1 | 1 | 2 | 123.04143816614076 | 10.605270070739888 |
| Table Stall W37 | Wet Store Building | wet_v5_table_37 | 1 | 1 | 3 | 123.04142949449896 | 10.60524045878015 |
| Table Stall W37 | Wet Store Building | wet_v5_table_37 | 1 | 1 | 4 | 123.04140203061309 | 10.605248229237743 |
| Table Stall W37 | Wet Store Building | wet_v5_table_37 | 1 | 1 | 5 (close) | 123.0414107022549 | 10.605277841196731 |
| Table Stall W38 | Wet Store Building | wet_v5_table_38 | 1 | 1 | 1 | 123.04143816614076 | 10.605270070739888 |
| Table Stall W38 | Wet Store Building | wet_v5_table_38 | 1 | 1 | 2 | 123.04146563002665 | 10.605262300282803 |
| Table Stall W38 | Wet Store Building | wet_v5_table_38 | 1 | 1 | 3 | 123.04145695838486 | 10.605232688322328 |
| Table Stall W38 | Wet Store Building | wet_v5_table_38 | 1 | 1 | 4 | 123.04142949449896 | 10.60524045878015 |
| Table Stall W38 | Wet Store Building | wet_v5_table_38 | 1 | 1 | 5 (close) | 123.04143816614076 | 10.605270070739888 |
| Table Stall W39 | Wet Store Building | wet_v5_table_39 | 1 | 1 | 1 | 123.04146563002665 | 10.605262300282803 |
| Table Stall W39 | Wet Store Building | wet_v5_table_39 | 1 | 1 | 2 | 123.04149309391259 | 10.605254529825565 |
| Table Stall W39 | Wet Store Building | wet_v5_table_39 | 1 | 1 | 3 | 123.04148442227078 | 10.605224917864327 |
| Table Stall W39 | Wet Store Building | wet_v5_table_39 | 1 | 1 | 4 | 123.04145695838486 | 10.605232688322328 |
| Table Stall W39 | Wet Store Building | wet_v5_table_39 | 1 | 1 | 5 (close) | 123.04146563002665 | 10.605262300282803 |
| Table Stall W40 | Wet Store Building | wet_v5_table_40 | 1 | 1 | 1 | 123.04149309391259 | 10.605254529825565 |
| Table Stall W40 | Wet Store Building | wet_v5_table_40 | 1 | 1 | 2 | 123.04152055779849 | 10.605246759368098 |
| Table Stall W40 | Wet Store Building | wet_v5_table_40 | 1 | 1 | 3 | 123.04151188615667 | 10.60521714740611 |
| Table Stall W40 | Wet Store Building | wet_v5_table_40 | 1 | 1 | 4 | 123.04148442227078 | 10.605224917864327 |
| Table Stall W40 | Wet Store Building | wet_v5_table_40 | 1 | 1 | 5 (close) | 123.04149309391259 | 10.605254529825565 |
| Table Stall W41 | Wet Store Building | wet_v5_table_41 | 1 | 1 | 1 | 123.04097402090997 | 10.605451094440749 |
| Table Stall W41 | Wet Store Building | wet_v5_table_41 | 1 | 1 | 2 | 123.0409878802364 | 10.605447173173468 |
| Table Stall W41 | Wet Store Building | wet_v5_table_41 | 1 | 1 | 3 | 123.04098484516179 | 10.6054368089939 |
| Table Stall W41 | Wet Store Building | wet_v5_table_41 | 1 | 1 | 4 | 123.04097098583534 | 10.605440730261307 |
| Table Stall W41 | Wet Store Building | wet_v5_table_41 | 1 | 1 | 5 (close) | 123.04097402090997 | 10.605451094440749 |
| Table Stall W42 | Wet Store Building | wet_v5_table_42 | 1 | 1 | 1 | 123.0409878802364 | 10.605447173173468 |
| Table Stall W42 | Wet Store Building | wet_v5_table_42 | 1 | 1 | 2 | 123.0410017395629 | 10.605443251906138 |
| Table Stall W42 | Wet Store Building | wet_v5_table_42 | 1 | 1 | 3 | 123.04099870448827 | 10.605432887726442 |
| Table Stall W42 | Wet Store Building | wet_v5_table_42 | 1 | 1 | 4 | 123.04098484516179 | 10.6054368089939 |
| Table Stall W42 | Wet Store Building | wet_v5_table_42 | 1 | 1 | 5 (close) | 123.0409878802364 | 10.605447173173468 |
| Table Stall W43 | Wet Store Building | wet_v5_table_43 | 1 | 1 | 1 | 123.0410017395629 | 10.605443251906138 |
| Table Stall W43 | Wet Store Building | wet_v5_table_43 | 1 | 1 | 2 | 123.04101559888936 | 10.605439330638793 |
| Table Stall W43 | Wet Store Building | wet_v5_table_43 | 1 | 1 | 3 | 123.04101256381472 | 10.605428966458971 |
| Table Stall W43 | Wet Store Building | wet_v5_table_43 | 1 | 1 | 4 | 123.04099870448827 | 10.605432887726442 |
| Table Stall W43 | Wet Store Building | wet_v5_table_43 | 1 | 1 | 5 (close) | 123.0410017395629 | 10.605443251906138 |
| Table Stall W44 | Wet Store Building | wet_v5_table_44 | 1 | 1 | 1 | 123.04101559888936 | 10.605439330638793 |
| Table Stall W44 | Wet Store Building | wet_v5_table_44 | 1 | 1 | 2 | 123.04102945821583 | 10.605435409371372 |
| Table Stall W44 | Wet Store Building | wet_v5_table_44 | 1 | 1 | 3 | 123.0410264231412 | 10.60542504519141 |
| Table Stall W44 | Wet Store Building | wet_v5_table_44 | 1 | 1 | 4 | 123.04101256381472 | 10.605428966458971 |
| Table Stall W44 | Wet Store Building | wet_v5_table_44 | 1 | 1 | 5 (close) | 123.04101559888936 | 10.605439330638793 |
| Table Stall W45 | Wet Store Building | wet_v5_table_45 | 1 | 1 | 1 | 123.04102945821583 | 10.605435409371372 |
| Table Stall W45 | Wet Store Building | wet_v5_table_45 | 1 | 1 | 2 | 123.04104331754228 | 10.605431488103902 |
| Table Stall W45 | Wet Store Building | wet_v5_table_45 | 1 | 1 | 3 | 123.04104028246763 | 10.605421123923799 |
| Table Stall W45 | Wet Store Building | wet_v5_table_45 | 1 | 1 | 4 | 123.0410264231412 | 10.60542504519141 |
| Table Stall W45 | Wet Store Building | wet_v5_table_45 | 1 | 1 | 5 (close) | 123.04102945821583 | 10.605435409371372 |
| Table Stall W46 | Wet Store Building | wet_v5_table_46 | 1 | 1 | 1 | 123.04104331754228 | 10.605431488103902 |
| Table Stall W46 | Wet Store Building | wet_v5_table_46 | 1 | 1 | 2 | 123.04105717686878 | 10.60542756683638 |
| Table Stall W46 | Wet Store Building | wet_v5_table_46 | 1 | 1 | 3 | 123.04105414179413 | 10.60541720265615 |
| Table Stall W46 | Wet Store Building | wet_v5_table_46 | 1 | 1 | 4 | 123.04104028246763 | 10.605421123923799 |
| Table Stall W46 | Wet Store Building | wet_v5_table_46 | 1 | 1 | 5 (close) | 123.04104331754228 | 10.605431488103902 |
| Table Stall W47 | Wet Store Building | wet_v5_table_47 | 1 | 1 | 1 | 123.04105717686878 | 10.60542756683638 |
| Table Stall W47 | Wet Store Building | wet_v5_table_47 | 1 | 1 | 2 | 123.0410710361952 | 10.605423645568832 |
| Table Stall W47 | Wet Store Building | wet_v5_table_47 | 1 | 1 | 3 | 123.04106800112059 | 10.60541328138845 |
| Table Stall W47 | Wet Store Building | wet_v5_table_47 | 1 | 1 | 4 | 123.04105414179413 | 10.60541720265615 |
| Table Stall W47 | Wet Store Building | wet_v5_table_47 | 1 | 1 | 5 (close) | 123.04105717686878 | 10.60542756683638 |
| Table Stall W48 | Wet Store Building | wet_v5_table_48 | 1 | 1 | 1 | 123.04108030971513 | 10.605421021779458 |
| Table Stall W48 | Wet Store Building | wet_v5_table_48 | 1 | 1 | 2 | 123.04109396522797 | 10.605417158177518 |
| Table Stall W48 | Wet Store Building | wet_v5_table_48 | 1 | 1 | 3 | 123.04109093015333 | 10.605406793996933 |
| Table Stall W48 | Wet Store Building | wet_v5_table_48 | 1 | 1 | 4 | 123.04107727464049 | 10.605410657599013 |
| Table Stall W48 | Wet Store Building | wet_v5_table_48 | 1 | 1 | 5 (close) | 123.04108030971513 | 10.605421021779458 |
| Table Stall W49 | Wet Store Building | wet_v5_table_49 | 1 | 1 | 1 | 123.04109396522797 | 10.605417158177518 |
| Table Stall W49 | Wet Store Building | wet_v5_table_49 | 1 | 1 | 2 | 123.0411076207408 | 10.605413294575513 |
| Table Stall W49 | Wet Store Building | wet_v5_table_49 | 1 | 1 | 3 | 123.04110458566616 | 10.6054029303948 |
| Table Stall W49 | Wet Store Building | wet_v5_table_49 | 1 | 1 | 4 | 123.04109093015333 | 10.605406793996933 |
| Table Stall W49 | Wet Store Building | wet_v5_table_49 | 1 | 1 | 5 (close) | 123.04109396522797 | 10.605417158177518 |
| Table Stall W50 | Wet Store Building | wet_v5_table_50 | 1 | 1 | 1 | 123.0411076207408 | 10.605413294575513 |
| Table Stall W50 | Wet Store Building | wet_v5_table_50 | 1 | 1 | 2 | 123.04112127625365 | 10.60540943097347 |
| Table Stall W50 | Wet Store Building | wet_v5_table_50 | 1 | 1 | 3 | 123.041118241179 | 10.605399066792618 |
| Table Stall W50 | Wet Store Building | wet_v5_table_50 | 1 | 1 | 4 | 123.04110458566616 | 10.6054029303948 |
| Table Stall W50 | Wet Store Building | wet_v5_table_50 | 1 | 1 | 5 (close) | 123.0411076207408 | 10.605413294575513 |
| Table Stall W51 | Wet Store Building | wet_v5_table_51 | 1 | 1 | 1 | 123.04112127625365 | 10.60540943097347 |
| Table Stall W51 | Wet Store Building | wet_v5_table_51 | 1 | 1 | 2 | 123.04113493176649 | 10.605405567371376 |
| Table Stall W51 | Wet Store Building | wet_v5_table_51 | 1 | 1 | 3 | 123.04113189669185 | 10.605395203190408 |
| Table Stall W51 | Wet Store Building | wet_v5_table_51 | 1 | 1 | 4 | 123.041118241179 | 10.605399066792618 |
| Table Stall W51 | Wet Store Building | wet_v5_table_51 | 1 | 1 | 5 (close) | 123.04112127625365 | 10.60540943097347 |
| Table Stall W52 | Wet Store Building | wet_v5_table_52 | 1 | 1 | 1 | 123.04113493176649 | 10.605405567371376 |
| Table Stall W52 | Wet Store Building | wet_v5_table_52 | 1 | 1 | 2 | 123.04114858727932 | 10.60540170376922 |
| Table Stall W52 | Wet Store Building | wet_v5_table_52 | 1 | 1 | 3 | 123.04114555220468 | 10.605391339588124 |
| Table Stall W52 | Wet Store Building | wet_v5_table_52 | 1 | 1 | 4 | 123.04113189669185 | 10.605395203190408 |
| Table Stall W52 | Wet Store Building | wet_v5_table_52 | 1 | 1 | 5 (close) | 123.04113493176649 | 10.605405567371376 |
| Table Stall W53 | Wet Store Building | wet_v5_table_53 | 1 | 1 | 1 | 123.04114858727932 | 10.60540170376922 |
| Table Stall W53 | Wet Store Building | wet_v5_table_53 | 1 | 1 | 2 | 123.04116224279218 | 10.605397840167024 |
| Table Stall W53 | Wet Store Building | wet_v5_table_53 | 1 | 1 | 3 | 123.04115920771754 | 10.605387475985802 |
| Table Stall W53 | Wet Store Building | wet_v5_table_53 | 1 | 1 | 4 | 123.04114555220468 | 10.605391339588124 |
| Table Stall W53 | Wet Store Building | wet_v5_table_53 | 1 | 1 | 5 (close) | 123.04114858727932 | 10.60540170376922 |
| Table Stall W54 | Wet Store Building | wet_v5_table_54 | 1 | 1 | 1 | 123.04116224279218 | 10.605397840167024 |
| Table Stall W54 | Wet Store Building | wet_v5_table_54 | 1 | 1 | 2 | 123.04117589830501 | 10.605393976564791 |
| Table Stall W54 | Wet Store Building | wet_v5_table_54 | 1 | 1 | 3 | 123.04117286323037 | 10.605383612383429 |
| Table Stall W54 | Wet Store Building | wet_v5_table_54 | 1 | 1 | 4 | 123.04115920771754 | 10.605387475985802 |
| Table Stall W54 | Wet Store Building | wet_v5_table_54 | 1 | 1 | 5 (close) | 123.04116224279218 | 10.605397840167024 |
| Table Stall W55 | Wet Store Building | wet_v5_table_55 | 1 | 1 | 1 | 123.04118588517264 | 10.605391150945202 |
| Table Stall W55 | Wet Store Building | wet_v5_table_55 | 1 | 1 | 2 | 123.04119954068547 | 10.60538728734288 |
| Table Stall W55 | Wet Store Building | wet_v5_table_55 | 1 | 1 | 3 | 123.04119650561083 | 10.605376923161302 |
| Table Stall W55 | Wet Store Building | wet_v5_table_55 | 1 | 1 | 4 | 123.041182850098 | 10.605380786763739 |
| Table Stall W55 | Wet Store Building | wet_v5_table_55 | 1 | 1 | 5 (close) | 123.04118588517264 | 10.605391150945202 |
| Table Stall W56 | Wet Store Building | wet_v5_table_56 | 1 | 1 | 1 | 123.04119954068547 | 10.60538728734288 |
| Table Stall W56 | Wet Store Building | wet_v5_table_56 | 1 | 1 | 2 | 123.0412131961983 | 10.605383423740506 |
| Table Stall W56 | Wet Store Building | wet_v5_table_56 | 1 | 1 | 3 | 123.04121016112369 | 10.605373059558788 |
| Table Stall W56 | Wet Store Building | wet_v5_table_56 | 1 | 1 | 4 | 123.04119650561083 | 10.605376923161302 |
| Table Stall W56 | Wet Store Building | wet_v5_table_56 | 1 | 1 | 5 (close) | 123.04119954068547 | 10.60538728734288 |
| Table Stall W57 | Wet Store Building | wet_v5_table_57 | 1 | 1 | 1 | 123.0412131961983 | 10.605383423740506 |
| Table Stall W57 | Wet Store Building | wet_v5_table_57 | 1 | 1 | 2 | 123.04122685171116 | 10.605379560138083 |
| Table Stall W57 | Wet Store Building | wet_v5_table_57 | 1 | 1 | 3 | 123.04122381663652 | 10.605369195956223 |
| Table Stall W57 | Wet Store Building | wet_v5_table_57 | 1 | 1 | 4 | 123.04121016112369 | 10.605373059558788 |
| Table Stall W57 | Wet Store Building | wet_v5_table_57 | 1 | 1 | 5 (close) | 123.0412131961983 | 10.605383423740506 |
| Table Stall W58 | Wet Store Building | wet_v5_table_58 | 1 | 1 | 1 | 123.04122685171116 | 10.605379560138083 |
| Table Stall W58 | Wet Store Building | wet_v5_table_58 | 1 | 1 | 2 | 123.04124050722399 | 10.605375696535594 |
| Table Stall W58 | Wet Store Building | wet_v5_table_58 | 1 | 1 | 3 | 123.04123747214935 | 10.605365332353621 |
| Table Stall W58 | Wet Store Building | wet_v5_table_58 | 1 | 1 | 4 | 123.04122381663652 | 10.605369195956223 |
| Table Stall W58 | Wet Store Building | wet_v5_table_58 | 1 | 1 | 5 (close) | 123.04122685171116 | 10.605379560138083 |
| Table Stall W59 | Wet Store Building | wet_v5_table_59 | 1 | 1 | 1 | 123.04124050722399 | 10.605375696535594 |
| Table Stall W59 | Wet Store Building | wet_v5_table_59 | 1 | 1 | 2 | 123.04125416273682 | 10.605371832933093 |
| Table Stall W59 | Wet Store Building | wet_v5_table_59 | 1 | 1 | 3 | 123.0412511276622 | 10.60536146875098 |
| Table Stall W59 | Wet Store Building | wet_v5_table_59 | 1 | 1 | 4 | 123.04123747214935 | 10.605365332353621 |
| Table Stall W59 | Wet Store Building | wet_v5_table_59 | 1 | 1 | 5 (close) | 123.04124050722399 | 10.605375696535594 |
| Table Stall W60 | Wet Store Building | wet_v5_table_60 | 1 | 1 | 1 | 123.04125416273682 | 10.605371832933093 |
| Table Stall W60 | Wet Store Building | wet_v5_table_60 | 1 | 1 | 2 | 123.04126781824968 | 10.605367969330516 |
| Table Stall W60 | Wet Store Building | wet_v5_table_60 | 1 | 1 | 3 | 123.04126478317504 | 10.605357605148276 |
| Table Stall W60 | Wet Store Building | wet_v5_table_60 | 1 | 1 | 4 | 123.0412511276622 | 10.60536146875098 |
| Table Stall W60 | Wet Store Building | wet_v5_table_60 | 1 | 1 | 5 (close) | 123.04125416273682 | 10.605371832933093 |
| Table Stall W61 | Wet Store Building | wet_v5_table_61 | 1 | 1 | 1 | 123.04126781824968 | 10.605367969330516 |
| Table Stall W61 | Wet Store Building | wet_v5_table_61 | 1 | 1 | 2 | 123.04128147376251 | 10.605364105727901 |
| Table Stall W61 | Wet Store Building | wet_v5_table_61 | 1 | 1 | 3 | 123.04127843868787 | 10.605353741545521 |
| Table Stall W61 | Wet Store Building | wet_v5_table_61 | 1 | 1 | 4 | 123.04126478317504 | 10.605357605148276 |
| Table Stall W61 | Wet Store Building | wet_v5_table_61 | 1 | 1 | 5 (close) | 123.04126781824968 | 10.605367969330516 |
| Table Stall W62 | Wet Store Building | wet_v5_table_62 | 1 | 1 | 1 | 123.04129146063008 | 10.605361280108033 |
| Table Stall W62 | Wet Store Building | wet_v5_table_62 | 1 | 1 | 2 | 123.04130501423612 | 10.60535744533819 |
| Table Stall W62 | Wet Store Building | wet_v5_table_62 | 1 | 1 | 3 | 123.04130197916149 | 10.60534708115558 |
| Table Stall W62 | Wet Store Building | wet_v5_table_62 | 1 | 1 | 4 | 123.04128842555545 | 10.605350915925564 |
| Table Stall W62 | Wet Store Building | wet_v5_table_62 | 1 | 1 | 5 (close) | 123.04129146063008 | 10.605361280108033 |
| Table Stall W63 | Wet Store Building | wet_v5_table_63 | 1 | 1 | 1 | 123.04130501423612 | 10.60535744533819 |
| Table Stall W63 | Wet Store Building | wet_v5_table_63 | 1 | 1 | 2 | 123.04131856784217 | 10.605353610568306 |
| Table Stall W63 | Wet Store Building | wet_v5_table_63 | 1 | 1 | 3 | 123.04131553276753 | 10.605343246385571 |
| Table Stall W63 | Wet Store Building | wet_v5_table_63 | 1 | 1 | 4 | 123.04130197916149 | 10.60534708115558 |
| Table Stall W63 | Wet Store Building | wet_v5_table_63 | 1 | 1 | 5 (close) | 123.04130501423612 | 10.60535744533819 |
| Table Stall W64 | Wet Store Building | wet_v5_table_64 | 1 | 1 | 1 | 123.04131856784217 | 10.605353610568306 |
| Table Stall W64 | Wet Store Building | wet_v5_table_64 | 1 | 1 | 2 | 123.04133212144819 | 10.605349775798361 |
| Table Stall W64 | Wet Store Building | wet_v5_table_64 | 1 | 1 | 3 | 123.04132908637355 | 10.605339411615498 |
| Table Stall W64 | Wet Store Building | wet_v5_table_64 | 1 | 1 | 4 | 123.04131553276753 | 10.605343246385571 |
| Table Stall W64 | Wet Store Building | wet_v5_table_64 | 1 | 1 | 5 (close) | 123.04131856784217 | 10.605353610568306 |
| Table Stall W65 | Wet Store Building | wet_v5_table_65 | 1 | 1 | 1 | 123.04133212144819 | 10.605349775798361 |
| Table Stall W65 | Wet Store Building | wet_v5_table_65 | 1 | 1 | 2 | 123.04134567505419 | 10.605345941028364 |
| Table Stall W65 | Wet Store Building | wet_v5_table_65 | 1 | 1 | 3 | 123.04134263997955 | 10.605335576845361 |
| Table Stall W65 | Wet Store Building | wet_v5_table_65 | 1 | 1 | 4 | 123.04132908637355 | 10.605339411615498 |
| Table Stall W65 | Wet Store Building | wet_v5_table_65 | 1 | 1 | 5 (close) | 123.04133212144819 | 10.605349775798361 |
| Table Stall W66 | Wet Store Building | wet_v5_table_66 | 1 | 1 | 1 | 123.04134567505419 | 10.605345941028364 |
| Table Stall W66 | Wet Store Building | wet_v5_table_66 | 1 | 1 | 2 | 123.04135922866023 | 10.605342106258318 |
| Table Stall W66 | Wet Store Building | wet_v5_table_66 | 1 | 1 | 3 | 123.0413561935856 | 10.6053317420752 |
| Table Stall W66 | Wet Store Building | wet_v5_table_66 | 1 | 1 | 4 | 123.04134263997955 | 10.605335576845361 |
| Table Stall W66 | Wet Store Building | wet_v5_table_66 | 1 | 1 | 5 (close) | 123.04134567505419 | 10.605345941028364 |
| Table Stall W67 | Wet Store Building | wet_v5_table_67 | 1 | 1 | 1 | 123.04135922866023 | 10.605342106258318 |
| Table Stall W67 | Wet Store Building | wet_v5_table_67 | 1 | 1 | 2 | 123.04137278226627 | 10.605338271488232 |
| Table Stall W67 | Wet Store Building | wet_v5_table_67 | 1 | 1 | 3 | 123.04136974719164 | 10.605327907304973 |
| Table Stall W67 | Wet Store Building | wet_v5_table_67 | 1 | 1 | 4 | 123.0413561935856 | 10.6053317420752 |
| Table Stall W67 | Wet Store Building | wet_v5_table_67 | 1 | 1 | 5 (close) | 123.04135922866023 | 10.605342106258318 |
| Table Stall W68 | Wet Store Building | wet_v5_table_68 | 1 | 1 | 1 | 123.04137278226627 | 10.605338271488232 |
| Table Stall W68 | Wet Store Building | wet_v5_table_68 | 1 | 1 | 2 | 123.04138633587229 | 10.605334436718096 |
| Table Stall W68 | Wet Store Building | wet_v5_table_68 | 1 | 1 | 3 | 123.04138330079768 | 10.60532407253471 |
| Table Stall W68 | Wet Store Building | wet_v5_table_68 | 1 | 1 | 4 | 123.04136974719164 | 10.605327907304973 |
| Table Stall W68 | Wet Store Building | wet_v5_table_68 | 1 | 1 | 5 (close) | 123.04137278226627 | 10.605338271488232 |
| Table Stall W69 | Wet Store Building | wet_v5_table_69 | 1 | 1 | 1 | 123.04139632273989 | 10.605331611097974 |
| Table Stall W69 | Wet Store Building | wet_v5_table_69 | 1 | 1 | 2 | 123.04140987634591 | 10.605327776327748 |
| Table Stall W69 | Wet Store Building | wet_v5_table_69 | 1 | 1 | 3 | 123.04140684127128 | 10.605317412144133 |
| Table Stall W69 | Wet Store Building | wet_v5_table_69 | 1 | 1 | 4 | 123.04139328766526 | 10.6053212469145 |
| Table Stall W69 | Wet Store Building | wet_v5_table_69 | 1 | 1 | 5 (close) | 123.04139632273989 | 10.605331611097974 |
| Table Stall W70 | Wet Store Building | wet_v5_table_70 | 1 | 1 | 1 | 123.04140987634591 | 10.605327776327748 |
| Table Stall W70 | Wet Store Building | wet_v5_table_70 | 1 | 1 | 2 | 123.04142342995195 | 10.60532394155747 |
| Table Stall W70 | Wet Store Building | wet_v5_table_70 | 1 | 1 | 3 | 123.04142039487732 | 10.60531357737373 |
| Table Stall W70 | Wet Store Building | wet_v5_table_70 | 1 | 1 | 4 | 123.04140684127128 | 10.605317412144133 |
| Table Stall W70 | Wet Store Building | wet_v5_table_70 | 1 | 1 | 5 (close) | 123.04140987634591 | 10.605327776327748 |
| Table Stall W71 | Wet Store Building | wet_v5_table_71 | 1 | 1 | 1 | 123.04142342995195 | 10.60532394155747 |
| Table Stall W71 | Wet Store Building | wet_v5_table_71 | 1 | 1 | 2 | 123.04143698355799 | 10.605320106787156 |
| Table Stall W71 | Wet Store Building | wet_v5_table_71 | 1 | 1 | 3 | 123.04143394848336 | 10.605309742603302 |
| Table Stall W71 | Wet Store Building | wet_v5_table_71 | 1 | 1 | 4 | 123.04142039487732 | 10.60531357737373 |
| Table Stall W71 | Wet Store Building | wet_v5_table_71 | 1 | 1 | 5 (close) | 123.04142342995195 | 10.60532394155747 |
| Table Stall W72 | Wet Store Building | wet_v5_table_72 | 1 | 1 | 1 | 123.04143698355799 | 10.605320106787156 |
| Table Stall W72 | Wet Store Building | wet_v5_table_72 | 1 | 1 | 2 | 123.041450537164 | 10.605316272016804 |
| Table Stall W72 | Wet Store Building | wet_v5_table_72 | 1 | 1 | 3 | 123.04144750208935 | 10.605305907832795 |
| Table Stall W72 | Wet Store Building | wet_v5_table_72 | 1 | 1 | 4 | 123.04143394848336 | 10.605309742603302 |
| Table Stall W72 | Wet Store Building | wet_v5_table_72 | 1 | 1 | 5 (close) | 123.04143698355799 | 10.605320106787156 |
| Table Stall W73 | Wet Store Building | wet_v5_table_73 | 1 | 1 | 1 | 123.041450537164 | 10.605316272016804 |
| Table Stall W73 | Wet Store Building | wet_v5_table_73 | 1 | 1 | 2 | 123.04146409077002 | 10.605312437246374 |
| Table Stall W73 | Wet Store Building | wet_v5_table_73 | 1 | 1 | 3 | 123.04146105569538 | 10.605302073062251 |
| Table Stall W73 | Wet Store Building | wet_v5_table_73 | 1 | 1 | 4 | 123.04144750208935 | 10.605305907832795 |
| Table Stall W73 | Wet Store Building | wet_v5_table_73 | 1 | 1 | 5 (close) | 123.041450537164 | 10.605316272016804 |
| Table Stall W74 | Wet Store Building | wet_v5_table_74 | 1 | 1 | 1 | 123.04146409077002 | 10.605312437246374 |
| Table Stall W74 | Wet Store Building | wet_v5_table_74 | 1 | 1 | 2 | 123.04147764437606 | 10.605308602475933 |
| Table Stall W74 | Wet Store Building | wet_v5_table_74 | 1 | 1 | 3 | 123.04147460930142 | 10.605298238291683 |
| Table Stall W74 | Wet Store Building | wet_v5_table_74 | 1 | 1 | 4 | 123.04146105569538 | 10.605302073062251 |
| Table Stall W74 | Wet Store Building | wet_v5_table_74 | 1 | 1 | 5 (close) | 123.04146409077002 | 10.605312437246374 |
| Table Stall W75 | Wet Store Building | wet_v5_table_75 | 1 | 1 | 1 | 123.04147764437606 | 10.605308602475933 |
| Table Stall W75 | Wet Store Building | wet_v5_table_75 | 1 | 1 | 2 | 123.0414911979821 | 10.605304767705427 |
| Table Stall W75 | Wet Store Building | wet_v5_table_75 | 1 | 1 | 3 | 123.04148816290746 | 10.605294403521038 |
| Table Stall W75 | Wet Store Building | wet_v5_table_75 | 1 | 1 | 4 | 123.04147460930142 | 10.605298238291683 |
| Table Stall W75 | Wet Store Building | wet_v5_table_75 | 1 | 1 | 5 (close) | 123.04147764437606 | 10.605308602475933 |
| Table Stall W76 | Wet Store Building | wet_v5_table_76 | 1 | 1 | 1 | 123.04096708359657 | 10.605427404887218 |
| Table Stall W76 | Wet Store Building | wet_v5_table_76 | 1 | 1 | 2 | 123.04098094292303 | 10.605423483619644 |
| Table Stall W76 | Wet Store Building | wet_v5_table_76 | 1 | 1 | 3 | 123.04097790784839 | 10.605413119439262 |
| Table Stall W76 | Wet Store Building | wet_v5_table_76 | 1 | 1 | 4 | 123.04096404852193 | 10.605417040706962 |
| Table Stall W76 | Wet Store Building | wet_v5_table_76 | 1 | 1 | 5 (close) | 123.04096708359657 | 10.605427404887218 |
| Table Stall W77 | Wet Store Building | wet_v5_table_77 | 1 | 1 | 1 | 123.04098094292303 | 10.605423483619644 |
| Table Stall W77 | Wet Store Building | wet_v5_table_77 | 1 | 1 | 2 | 123.0409948022495 | 10.60541956235202 |
| Table Stall W77 | Wet Store Building | wet_v5_table_77 | 1 | 1 | 3 | 123.04099176717487 | 10.605409198171499 |
| Table Stall W77 | Wet Store Building | wet_v5_table_77 | 1 | 1 | 4 | 123.04097790784839 | 10.605413119439262 |
| Table Stall W77 | Wet Store Building | wet_v5_table_77 | 1 | 1 | 5 (close) | 123.04098094292303 | 10.605423483619644 |
| Table Stall W78 | Wet Store Building | wet_v5_table_78 | 1 | 1 | 1 | 123.0409948022495 | 10.60541956235202 |
| Table Stall W78 | Wet Store Building | wet_v5_table_78 | 1 | 1 | 2 | 123.04100866157593 | 10.605415641084372 |
| Table Stall W78 | Wet Store Building | wet_v5_table_78 | 1 | 1 | 3 | 123.04100562650133 | 10.605405276903708 |
| Table Stall W78 | Wet Store Building | wet_v5_table_78 | 1 | 1 | 4 | 123.04099176717487 | 10.605409198171499 |
| Table Stall W78 | Wet Store Building | wet_v5_table_78 | 1 | 1 | 5 (close) | 123.0409948022495 | 10.60541956235202 |
| Table Stall W79 | Wet Store Building | wet_v5_table_79 | 1 | 1 | 1 | 123.04100866157593 | 10.605415641084372 |
| Table Stall W79 | Wet Store Building | wet_v5_table_79 | 1 | 1 | 2 | 123.04102252090244 | 10.605411719816646 |
| Table Stall W79 | Wet Store Building | wet_v5_table_79 | 1 | 1 | 3 | 123.0410194858278 | 10.605401355635856 |
| Table Stall W79 | Wet Store Building | wet_v5_table_79 | 1 | 1 | 4 | 123.04100562650133 | 10.605405276903708 |
| Table Stall W79 | Wet Store Building | wet_v5_table_79 | 1 | 1 | 5 (close) | 123.04100866157593 | 10.605415641084372 |
| Table Stall W80 | Wet Store Building | wet_v5_table_80 | 1 | 1 | 1 | 123.04102252090244 | 10.605411719816646 |
| Table Stall W80 | Wet Store Building | wet_v5_table_80 | 1 | 1 | 2 | 123.04103638022887 | 10.605407798548857 |
| Table Stall W80 | Wet Store Building | wet_v5_table_80 | 1 | 1 | 3 | 123.04103334515423 | 10.60539743436794 |
| Table Stall W80 | Wet Store Building | wet_v5_table_80 | 1 | 1 | 4 | 123.0410194858278 | 10.605401355635856 |
| Table Stall W80 | Wet Store Building | wet_v5_table_80 | 1 | 1 | 5 (close) | 123.04102252090244 | 10.605411719816646 |
| Table Stall W81 | Wet Store Building | wet_v5_table_81 | 1 | 1 | 1 | 123.04103638022887 | 10.605407798548857 |
| Table Stall W81 | Wet Store Building | wet_v5_table_81 | 1 | 1 | 2 | 123.04105023955536 | 10.605403877281042 |
| Table Stall W81 | Wet Store Building | wet_v5_table_81 | 1 | 1 | 3 | 123.04104720448073 | 10.605393513099985 |
| Table Stall W81 | Wet Store Building | wet_v5_table_81 | 1 | 1 | 4 | 123.04103334515423 | 10.60539743436794 |
| Table Stall W81 | Wet Store Building | wet_v5_table_81 | 1 | 1 | 5 (close) | 123.04103638022887 | 10.605407798548857 |
| Table Stall W82 | Wet Store Building | wet_v5_table_82 | 1 | 1 | 1 | 123.04105023955536 | 10.605403877281042 |
| Table Stall W82 | Wet Store Building | wet_v5_table_82 | 1 | 1 | 2 | 123.0410640988818 | 10.605399956013176 |
| Table Stall W82 | Wet Store Building | wet_v5_table_82 | 1 | 1 | 3 | 123.04106106380716 | 10.605389591831992 |
| Table Stall W82 | Wet Store Building | wet_v5_table_82 | 1 | 1 | 4 | 123.04104720448073 | 10.605393513099985 |
| Table Stall W82 | Wet Store Building | wet_v5_table_82 | 1 | 1 | 5 (close) | 123.04105023955536 | 10.605403877281042 |
| Table Stall W83 | Wet Store Building | wet_v5_table_83 | 1 | 1 | 1 | 123.04107337240173 | 10.605397332223612 |
| Table Stall W83 | Wet Store Building | wet_v5_table_83 | 1 | 1 | 2 | 123.04108702791457 | 10.605393468621365 |
| Table Stall W83 | Wet Store Building | wet_v5_table_83 | 1 | 1 | 3 | 123.04108399283993 | 10.605383104439966 |
| Table Stall W83 | Wet Store Building | wet_v5_table_83 | 1 | 1 | 4 | 123.04107033732708 | 10.605386968042351 |
| Table Stall W83 | Wet Store Building | wet_v5_table_83 | 1 | 1 | 5 (close) | 123.04107337240173 | 10.605397332223612 |
| Table Stall W84 | Wet Store Building | wet_v5_table_84 | 1 | 1 | 1 | 123.04108702791457 | 10.605393468621365 |
| Table Stall W84 | Wet Store Building | wet_v5_table_84 | 1 | 1 | 2 | 123.0411006834274 | 10.605389605019068 |
| Table Stall W84 | Wet Store Building | wet_v5_table_84 | 1 | 1 | 3 | 123.04109764835277 | 10.605379240837529 |
| Table Stall W84 | Wet Store Building | wet_v5_table_84 | 1 | 1 | 4 | 123.04108399283993 | 10.605383104439966 |
| Table Stall W84 | Wet Store Building | wet_v5_table_84 | 1 | 1 | 5 (close) | 123.04108702791457 | 10.605393468621365 |
| Table Stall W85 | Wet Store Building | wet_v5_table_85 | 1 | 1 | 1 | 123.0411006834274 | 10.605389605019068 |
| Table Stall W85 | Wet Store Building | wet_v5_table_85 | 1 | 1 | 2 | 123.04111433894026 | 10.605385741416708 |
| Table Stall W85 | Wet Store Building | wet_v5_table_85 | 1 | 1 | 3 | 123.0411113038656 | 10.605375377235053 |
| Table Stall W85 | Wet Store Building | wet_v5_table_85 | 1 | 1 | 4 | 123.04109764835277 | 10.605379240837529 |
| Table Stall W85 | Wet Store Building | wet_v5_table_85 | 1 | 1 | 5 (close) | 123.0411006834274 | 10.605389605019068 |
| Table Stall W86 | Wet Store Building | wet_v5_table_86 | 1 | 1 | 1 | 123.04111433894026 | 10.605385741416708 |
| Table Stall W86 | Wet Store Building | wet_v5_table_86 | 1 | 1 | 2 | 123.04112799445309 | 10.605381877814335 |
| Table Stall W86 | Wet Store Building | wet_v5_table_86 | 1 | 1 | 3 | 123.04112495937845 | 10.605371513632539 |
| Table Stall W86 | Wet Store Building | wet_v5_table_86 | 1 | 1 | 4 | 123.0411113038656 | 10.605375377235053 |
| Table Stall W86 | Wet Store Building | wet_v5_table_86 | 1 | 1 | 5 (close) | 123.04111433894026 | 10.605385741416708 |
| Table Stall W87 | Wet Store Building | wet_v5_table_87 | 1 | 1 | 1 | 123.04112799445309 | 10.605381877814335 |
| Table Stall W87 | Wet Store Building | wet_v5_table_87 | 1 | 1 | 2 | 123.04114164996592 | 10.605378014211897 |
| Table Stall W87 | Wet Store Building | wet_v5_table_87 | 1 | 1 | 3 | 123.0411386148913 | 10.605367650029962 |
| Table Stall W87 | Wet Store Building | wet_v5_table_87 | 1 | 1 | 4 | 123.04112495937845 | 10.605371513632539 |
| Table Stall W87 | Wet Store Building | wet_v5_table_87 | 1 | 1 | 5 (close) | 123.04112799445309 | 10.605381877814335 |
| Table Stall W88 | Wet Store Building | wet_v5_table_88 | 1 | 1 | 1 | 123.04114164996592 | 10.605378014211897 |
| Table Stall W88 | Wet Store Building | wet_v5_table_88 | 1 | 1 | 2 | 123.04115530547878 | 10.605374150609396 |
| Table Stall W88 | Wet Store Building | wet_v5_table_88 | 1 | 1 | 3 | 123.04115227040414 | 10.605363786427334 |
| Table Stall W88 | Wet Store Building | wet_v5_table_88 | 1 | 1 | 4 | 123.0411386148913 | 10.605367650029962 |
| Table Stall W88 | Wet Store Building | wet_v5_table_88 | 1 | 1 | 5 (close) | 123.04114164996592 | 10.605378014211897 |
| Table Stall W89 | Wet Store Building | wet_v5_table_89 | 1 | 1 | 1 | 123.04115530547878 | 10.605374150609396 |
| Table Stall W89 | Wet Store Building | wet_v5_table_89 | 1 | 1 | 2 | 123.04116896099161 | 10.605370287006844 |
| Table Stall W89 | Wet Store Building | wet_v5_table_89 | 1 | 1 | 3 | 123.04116592591697 | 10.605359922824656 |
| Table Stall W89 | Wet Store Building | wet_v5_table_89 | 1 | 1 | 4 | 123.04115227040414 | 10.605363786427334 |
| Table Stall W89 | Wet Store Building | wet_v5_table_89 | 1 | 1 | 5 (close) | 123.04115530547878 | 10.605374150609396 |
| Table Stall W90 | Wet Store Building | wet_v5_table_90 | 1 | 1 | 1 | 123.04117894785921 | 10.60536746138704 |
| Table Stall W90 | Wet Store Building | wet_v5_table_90 | 1 | 1 | 2 | 123.04119260337205 | 10.605363597784425 |
| Table Stall W90 | Wet Store Building | wet_v5_table_90 | 1 | 1 | 3 | 123.04118956829744 | 10.60535323360202 |
| Table Stall W90 | Wet Store Building | wet_v5_table_90 | 1 | 1 | 4 | 123.0411759127846 | 10.605357097204749 |
| Table Stall W90 | Wet Store Building | wet_v5_table_90 | 1 | 1 | 5 (close) | 123.04117894785921 | 10.60536746138704 |
| Table Stall W91 | Wet Store Building | wet_v5_table_91 | 1 | 1 | 1 | 123.04119260337205 | 10.605363597784425 |
| Table Stall W91 | Wet Store Building | wet_v5_table_91 | 1 | 1 | 2 | 123.0412062588849 | 10.605359734181746 |
| Table Stall W91 | Wet Store Building | wet_v5_table_91 | 1 | 1 | 3 | 123.04120322381029 | 10.605349369999201 |
| Table Stall W91 | Wet Store Building | wet_v5_table_91 | 1 | 1 | 4 | 123.04118956829744 | 10.60535323360202 |
| Table Stall W91 | Wet Store Building | wet_v5_table_91 | 1 | 1 | 5 (close) | 123.04119260337205 | 10.605363597784425 |
| Table Stall W92 | Wet Store Building | wet_v5_table_92 | 1 | 1 | 1 | 123.0412062588849 | 10.605359734181746 |
| Table Stall W92 | Wet Store Building | wet_v5_table_92 | 1 | 1 | 2 | 123.04121991439774 | 10.605355870579016 |
| Table Stall W92 | Wet Store Building | wet_v5_table_92 | 1 | 1 | 3 | 123.04121687932312 | 10.605345506396331 |
| Table Stall W92 | Wet Store Building | wet_v5_table_92 | 1 | 1 | 4 | 123.04120322381029 | 10.605349369999201 |
| Table Stall W92 | Wet Store Building | wet_v5_table_92 | 1 | 1 | 5 (close) | 123.0412062588849 | 10.605359734181746 |
| Table Stall W93 | Wet Store Building | wet_v5_table_93 | 1 | 1 | 1 | 123.04121991439774 | 10.605355870579016 |
| Table Stall W93 | Wet Store Building | wet_v5_table_93 | 1 | 1 | 2 | 123.04123356991057 | 10.605352006976249 |
| Table Stall W93 | Wet Store Building | wet_v5_table_93 | 1 | 1 | 3 | 123.04123053483596 | 10.605341642793435 |
| Table Stall W93 | Wet Store Building | wet_v5_table_93 | 1 | 1 | 4 | 123.04121687932312 | 10.605345506396331 |
| Table Stall W93 | Wet Store Building | wet_v5_table_93 | 1 | 1 | 5 (close) | 123.04121991439774 | 10.605355870579016 |
| Table Stall W94 | Wet Store Building | wet_v5_table_94 | 1 | 1 | 1 | 123.04123356991057 | 10.605352006976249 |
| Table Stall W94 | Wet Store Building | wet_v5_table_94 | 1 | 1 | 2 | 123.04124722542342 | 10.60534814337343 |
| Table Stall W94 | Wet Store Building | wet_v5_table_94 | 1 | 1 | 3 | 123.0412441903488 | 10.605337779190503 |
| Table Stall W94 | Wet Store Building | wet_v5_table_94 | 1 | 1 | 4 | 123.04123053483596 | 10.605341642793435 |
| Table Stall W94 | Wet Store Building | wet_v5_table_94 | 1 | 1 | 5 (close) | 123.04123356991057 | 10.605352006976249 |
| Table Stall W95 | Wet Store Building | wet_v5_table_95 | 1 | 1 | 1 | 123.04124722542342 | 10.60534814337343 |
| Table Stall W95 | Wet Store Building | wet_v5_table_95 | 1 | 1 | 2 | 123.04126088093626 | 10.60534427977056 |
| Table Stall W95 | Wet Store Building | wet_v5_table_95 | 1 | 1 | 3 | 123.04125784586164 | 10.605333915587494 |
| Table Stall W95 | Wet Store Building | wet_v5_table_95 | 1 | 1 | 4 | 123.0412441903488 | 10.605337779190503 |
| Table Stall W95 | Wet Store Building | wet_v5_table_95 | 1 | 1 | 5 (close) | 123.04124722542342 | 10.60534814337343 |
| Table Stall W96 | Wet Store Building | wet_v5_table_96 | 1 | 1 | 1 | 123.04126088093626 | 10.60534427977056 |
| Table Stall W96 | Wet Store Building | wet_v5_table_96 | 1 | 1 | 2 | 123.0412745364491 | 10.605340416167651 |
| Table Stall W96 | Wet Store Building | wet_v5_table_96 | 1 | 1 | 3 | 123.04127150137448 | 10.605330051984446 |
| Table Stall W96 | Wet Store Building | wet_v5_table_96 | 1 | 1 | 4 | 123.04125784586164 | 10.605333915587494 |
| Table Stall W96 | Wet Store Building | wet_v5_table_96 | 1 | 1 | 5 (close) | 123.04126088093626 | 10.60534427977056 |
| Table Stall W97 | Wet Store Building | wet_v5_table_97 | 1 | 1 | 1 | 123.04128452331668 | 10.605337590547554 |
| Table Stall W97 | Wet Store Building | wet_v5_table_97 | 1 | 1 | 2 | 123.04129807692271 | 10.60533375577742 |
| Table Stall W97 | Wet Store Building | wet_v5_table_97 | 1 | 1 | 3 | 123.04129504184807 | 10.605323391593982 |
| Table Stall W97 | Wet Store Building | wet_v5_table_97 | 1 | 1 | 4 | 123.04128148824203 | 10.605327226364272 |
| Table Stall W97 | Wet Store Building | wet_v5_table_97 | 1 | 1 | 5 (close) | 123.04128452331668 | 10.605337590547554 |
| Table Stall W98 | Wet Store Building | wet_v5_table_98 | 1 | 1 | 1 | 123.04129807692271 | 10.60533375577742 |
| Table Stall W98 | Wet Store Building | wet_v5_table_98 | 1 | 1 | 2 | 123.04131163052874 | 10.605329921007245 |
| Table Stall W98 | Wet Store Building | wet_v5_table_98 | 1 | 1 | 3 | 123.04130859545413 | 10.605319556823682 |
| Table Stall W98 | Wet Store Building | wet_v5_table_98 | 1 | 1 | 4 | 123.04129504184807 | 10.605323391593982 |
| Table Stall W98 | Wet Store Building | wet_v5_table_98 | 1 | 1 | 5 (close) | 123.04129807692271 | 10.60533375577742 |
| Table Stall W99 | Wet Store Building | wet_v5_table_99 | 1 | 1 | 1 | 123.04131163052874 | 10.605329921007245 |
| Table Stall W99 | Wet Store Building | wet_v5_table_99 | 1 | 1 | 2 | 123.04132518413478 | 10.605326086236992 |
| Table Stall W99 | Wet Store Building | wet_v5_table_99 | 1 | 1 | 3 | 123.04132214906015 | 10.605315722053316 |
| Table Stall W99 | Wet Store Building | wet_v5_table_99 | 1 | 1 | 4 | 123.04130859545413 | 10.605319556823682 |
| Table Stall W99 | Wet Store Building | wet_v5_table_99 | 1 | 1 | 5 (close) | 123.04131163052874 | 10.605329921007245 |
| Table Stall W100 | Wet Store Building | wet_v5_table_100 | 1 | 1 | 1 | 123.04132518413478 | 10.605326086236992 |
| Table Stall W100 | Wet Store Building | wet_v5_table_100 | 1 | 1 | 2 | 123.04133873774079 | 10.605322251466704 |
| Table Stall W100 | Wet Store Building | wet_v5_table_100 | 1 | 1 | 3 | 123.04133570266615 | 10.605311887282886 |
| Table Stall W100 | Wet Store Building | wet_v5_table_100 | 1 | 1 | 4 | 123.04132214906015 | 10.605315722053316 |
| Table Stall W100 | Wet Store Building | wet_v5_table_100 | 1 | 1 | 5 (close) | 123.04132518413478 | 10.605326086236992 |
| Table Stall W101 | Wet Store Building | wet_v5_table_101 | 1 | 1 | 1 | 123.04133873774079 | 10.605322251466704 |
| Table Stall W101 | Wet Store Building | wet_v5_table_101 | 1 | 1 | 2 | 123.04135229134683 | 10.605318416696363 |
| Table Stall W101 | Wet Store Building | wet_v5_table_101 | 1 | 1 | 3 | 123.04134925627218 | 10.605308052512418 |
| Table Stall W101 | Wet Store Building | wet_v5_table_101 | 1 | 1 | 4 | 123.04133570266615 | 10.605311887282886 |
| Table Stall W101 | Wet Store Building | wet_v5_table_101 | 1 | 1 | 5 (close) | 123.04133873774079 | 10.605322251466704 |
| Table Stall W102 | Wet Store Building | wet_v5_table_102 | 1 | 1 | 1 | 123.04135229134683 | 10.605318416696363 |
| Table Stall W102 | Wet Store Building | wet_v5_table_102 | 1 | 1 | 2 | 123.04136584495286 | 10.605314581925972 |
| Table Stall W102 | Wet Store Building | wet_v5_table_102 | 1 | 1 | 3 | 123.04136280987822 | 10.605304217741901 |
| Table Stall W102 | Wet Store Building | wet_v5_table_102 | 1 | 1 | 4 | 123.04134925627218 | 10.605308052512418 |
| Table Stall W102 | Wet Store Building | wet_v5_table_102 | 1 | 1 | 5 (close) | 123.04135229134683 | 10.605318416696363 |
| Table Stall W103 | Wet Store Building | wet_v5_table_103 | 1 | 1 | 1 | 123.04136584495286 | 10.605314581925972 |
| Table Stall W103 | Wet Store Building | wet_v5_table_103 | 1 | 1 | 2 | 123.04137939855889 | 10.605310747155544 |
| Table Stall W103 | Wet Store Building | wet_v5_table_103 | 1 | 1 | 3 | 123.04137636348428 | 10.605300382971333 |
| Table Stall W103 | Wet Store Building | wet_v5_table_103 | 1 | 1 | 4 | 123.04136280987822 | 10.605304217741901 |
| Table Stall W103 | Wet Store Building | wet_v5_table_103 | 1 | 1 | 5 (close) | 123.04136584495286 | 10.605314581925972 |
| Table Stall W104 | Wet Store Building | wet_v5_table_104 | 1 | 1 | 1 | 123.04138938542648 | 10.605307921535205 |
| Table Stall W104 | Wet Store Building | wet_v5_table_104 | 1 | 1 | 2 | 123.04140293903251 | 10.605304086764688 |
| Table Stall W104 | Wet Store Building | wet_v5_table_104 | 1 | 1 | 3 | 123.04139990395787 | 10.605293722580246 |
| Table Stall W104 | Wet Store Building | wet_v5_table_104 | 1 | 1 | 4 | 123.04138635035184 | 10.605297557350905 |
| Table Stall W104 | Wet Store Building | wet_v5_table_104 | 1 | 1 | 5 (close) | 123.04138938542648 | 10.605307921535205 |
| Table Stall W105 | Wet Store Building | wet_v5_table_105 | 1 | 1 | 1 | 123.04140293903251 | 10.605304086764688 |
| Table Stall W105 | Wet Store Building | wet_v5_table_105 | 1 | 1 | 2 | 123.04141649263855 | 10.605300251994118 |
| Table Stall W105 | Wet Store Building | wet_v5_table_105 | 1 | 1 | 3 | 123.0414134575639 | 10.605289887809551 |
| Table Stall W105 | Wet Store Building | wet_v5_table_105 | 1 | 1 | 4 | 123.04139990395787 | 10.605293722580246 |
| Table Stall W105 | Wet Store Building | wet_v5_table_105 | 1 | 1 | 5 (close) | 123.04140293903251 | 10.605304086764688 |
| Table Stall W106 | Wet Store Building | wet_v5_table_106 | 1 | 1 | 1 | 123.04141649263855 | 10.605300251994118 |
| Table Stall W106 | Wet Store Building | wet_v5_table_106 | 1 | 1 | 2 | 123.04143004624459 | 10.605296417223498 |
| Table Stall W106 | Wet Store Building | wet_v5_table_106 | 1 | 1 | 3 | 123.04142701116993 | 10.605286053038816 |
| Table Stall W106 | Wet Store Building | wet_v5_table_106 | 1 | 1 | 4 | 123.0414134575639 | 10.605289887809551 |
| Table Stall W106 | Wet Store Building | wet_v5_table_106 | 1 | 1 | 5 (close) | 123.04141649263855 | 10.605300251994118 |
| Table Stall W107 | Wet Store Building | wet_v5_table_107 | 1 | 1 | 1 | 123.04143004624459 | 10.605296417223498 |
| Table Stall W107 | Wet Store Building | wet_v5_table_107 | 1 | 1 | 2 | 123.04144359985058 | 10.605292582452828 |
| Table Stall W107 | Wet Store Building | wet_v5_table_107 | 1 | 1 | 3 | 123.04144056477595 | 10.605282218268018 |
| Table Stall W107 | Wet Store Building | wet_v5_table_107 | 1 | 1 | 4 | 123.04142701116993 | 10.605286053038816 |
| Table Stall W107 | Wet Store Building | wet_v5_table_107 | 1 | 1 | 5 (close) | 123.04143004624459 | 10.605296417223498 |
| Table Stall W108 | Wet Store Building | wet_v5_table_108 | 1 | 1 | 1 | 123.04144359985058 | 10.605292582452828 |
| Table Stall W108 | Wet Store Building | wet_v5_table_108 | 1 | 1 | 2 | 123.0414571534566 | 10.605288747682119 |
| Table Stall W108 | Wet Store Building | wet_v5_table_108 | 1 | 1 | 3 | 123.04145411838198 | 10.605278383497168 |
| Table Stall W108 | Wet Store Building | wet_v5_table_108 | 1 | 1 | 4 | 123.04144056477595 | 10.605282218268018 |
| Table Stall W108 | Wet Store Building | wet_v5_table_108 | 1 | 1 | 5 (close) | 123.04144359985058 | 10.605292582452828 |
| Table Stall W109 | Wet Store Building | wet_v5_table_109 | 1 | 1 | 1 | 123.0414571534566 | 10.605288747682119 |
| Table Stall W109 | Wet Store Building | wet_v5_table_109 | 1 | 1 | 2 | 123.04147070706266 | 10.605284912911385 |
| Table Stall W109 | Wet Store Building | wet_v5_table_109 | 1 | 1 | 3 | 123.04146767198802 | 10.605274548726307 |
| Table Stall W109 | Wet Store Building | wet_v5_table_109 | 1 | 1 | 4 | 123.04145411838198 | 10.605278383497168 |
| Table Stall W109 | Wet Store Building | wet_v5_table_109 | 1 | 1 | 5 (close) | 123.0414571534566 | 10.605288747682119 |
| Table Stall W110 | Wet Store Building | wet_v5_table_110 | 1 | 1 | 1 | 123.04147070706266 | 10.605284912911385 |
| Table Stall W110 | Wet Store Building | wet_v5_table_110 | 1 | 1 | 2 | 123.0414842606687 | 10.605281078140573 |
| Table Stall W110 | Wet Store Building | wet_v5_table_110 | 1 | 1 | 3 | 123.04148122559407 | 10.605270713955356 |
| Table Stall W110 | Wet Store Building | wet_v5_table_110 | 1 | 1 | 4 | 123.04146767198802 | 10.605274548726307 |
| Table Stall W110 | Wet Store Building | wet_v5_table_110 | 1 | 1 | 5 (close) | 123.04147070706266 | 10.605284912911385 |
| Comfort Room (CR) | Wet Store Building | wet_v5_comfort_room | 1 | 1 | 1 | 123.04122799946177 | 10.605469018636446 |
| Comfort Room (CR) | Wet Store Building | wet_v5_comfort_room | 1 | 1 | 2 | 123.04128364058128 | 10.605453275902292 |
| Comfort Room (CR) | Wet Store Building | wet_v5_comfort_room | 1 | 1 | 3 | 123.04126196147679 | 10.60537924604192 |
| Comfort Room (CR) | Wet Store Building | wet_v5_comfort_room | 1 | 1 | 4 | 123.04120632035729 | 10.60539498877988 |
| Comfort Room (CR) | Wet Store Building | wet_v5_comfort_room | 1 | 1 | 5 (close) | 123.04122799946177 | 10.605469018636446 |

## Complete object data (JSON)

```json
{
  "version": 1,
  "exported_at": "2026-09-10T13:56:40.099Z",
  "source": "Three-building reference layout generated from local-stall-map.html. Wet Store Building traced from the supplied wet-market photograph: perimeter wings, meat counters, vegetable counters, fish counters and stairwell. Perimeter numbers repeat by wing; table labels are assigned locally where tiny printed labels remain unreadable. Geometry is an image trace, not survey measurements. Browser-only edits are not included. Timestamps were generated for this reference snapshot.",
  "stalls": [
    {
      "id": "plan_1",
      "stall_name": "Stall 1",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04098919999998,
              10.605745800000005
            ],
            [
              123.04101637586209,
              10.605738200609562
            ],
            [
              123.04100876146812,
              10.605711859706553
            ],
            [
              123.04098158560603,
              10.605719459097656
            ],
            [
              123.04098919999998,
              10.605745800000005
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.055Z",
      "updated_at": "2026-09-10T13:56:40.055Z"
    },
    {
      "id": "plan_2",
      "stall_name": "Stall 2",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04098158560603,
              10.605719459097656
            ],
            [
              123.04100876146812,
              10.605711859706553
            ],
            [
              123.04100074631663,
              10.605684132437771
            ],
            [
              123.04097357045454,
              10.605691731829575
            ],
            [
              123.04098158560603,
              10.605719459097656
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_3",
      "stall_name": "Stall 3",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04101637586209,
              10.605738200609562
            ],
            [
              123.0410435517241,
              10.605730601218891
            ],
            [
              123.04103593733015,
              10.605704260315232
            ],
            [
              123.04100876146812,
              10.605711859706553
            ],
            [
              123.04101637586209,
              10.605738200609562
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_4",
      "stall_name": "Stall 4",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04100876146812,
              10.605711859706553
            ],
            [
              123.04103593733015,
              10.605704260315232
            ],
            [
              123.04102792217866,
              10.605676533045765
            ],
            [
              123.04100074631663,
              10.605684132437771
            ],
            [
              123.04100876146812,
              10.605711859706553
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_5",
      "stall_name": "Stall 5",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410435517241,
              10.605730601218891
            ],
            [
              123.0410707275862,
              10.605723001828053
            ],
            [
              123.04106311319225,
              10.605696660923734
            ],
            [
              123.04103593733015,
              10.605704260315232
            ],
            [
              123.0410435517241,
              10.605730601218891
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_6",
      "stall_name": "Stall 6",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04103593733015,
              10.605704260315232
            ],
            [
              123.04106311319225,
              10.605696660923734
            ],
            [
              123.04105509804074,
              10.605668933653591
            ],
            [
              123.04102792217866,
              10.605676533045765
            ],
            [
              123.04103593733015,
              10.605704260315232
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_7",
      "stall_name": "Stall 7",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410707275862,
              10.605723001828053
            ],
            [
              123.04109790344828,
              10.605715402437013
            ],
            [
              123.04109028905432,
              10.605689061532033
            ],
            [
              123.04106311319225,
              10.605696660923734
            ],
            [
              123.0410707275862,
              10.605723001828053
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_8",
      "stall_name": "Stall 8",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04106311319225,
              10.605696660923734
            ],
            [
              123.04109028905432,
              10.605689061532033
            ],
            [
              123.04108227390282,
              10.605661334261203
            ],
            [
              123.04105509804074,
              10.605668933653591
            ],
            [
              123.04106311319225,
              10.605696660923734
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_9",
      "stall_name": "Stall 9",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04109790344828,
              10.605715402437013
            ],
            [
              123.04112507931036,
              10.605707803045796
            ],
            [
              123.0411174649164,
              10.605681462140165
            ],
            [
              123.04109028905432,
              10.605689061532033
            ],
            [
              123.04109790344828,
              10.605715402437013
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_10",
      "stall_name": "Stall 10",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04109028905432,
              10.605689061532033
            ],
            [
              123.0411174649164,
              10.605681462140165
            ],
            [
              123.04110944976492,
              10.60565373486865
            ],
            [
              123.04108227390282,
              10.605661334261203
            ],
            [
              123.04109028905432,
              10.605689061532033
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_11",
      "stall_name": "Stall 11",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04112507931036,
              10.605707803045796
            ],
            [
              123.0411522551724,
              10.605700203654386
            ],
            [
              123.04114464077844,
              10.60567386274812
            ],
            [
              123.0411174649164,
              10.605681462140165
            ],
            [
              123.04112507931036,
              10.605707803045796
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_12",
      "stall_name": "Stall 12",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411174649164,
              10.605681462140165
            ],
            [
              123.04114464077844,
              10.60567386274812
            ],
            [
              123.04113662562693,
              10.60564613547589
            ],
            [
              123.04110944976492,
              10.60565373486865
            ],
            [
              123.0411174649164,
              10.605681462140165
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_13",
      "stall_name": "Stall 13",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411522551724,
              10.605700203654386
            ],
            [
              123.04117943103448,
              10.605692604262773
            ],
            [
              123.04117181664051,
              10.605666263355845
            ],
            [
              123.04114464077844,
              10.60567386274812
            ],
            [
              123.0411522551724,
              10.605700203654386
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_14",
      "stall_name": "Stall 14",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04114464077844,
              10.60567386274812
            ],
            [
              123.04117181664051,
              10.605666263355845
            ],
            [
              123.04116380148903,
              10.605638536082942
            ],
            [
              123.04113662562693,
              10.60564613547589
            ],
            [
              123.04114464077844,
              10.60567386274812
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_15",
      "stall_name": "Stall 15",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04117943103448,
              10.605692604262773
            ],
            [
              123.04120660689655,
              10.605685004870995
            ],
            [
              123.0411989925026,
              10.605658663963418
            ],
            [
              123.04117181664051,
              10.605666263355845
            ],
            [
              123.04117943103448,
              10.605692604262773
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_16",
      "stall_name": "Stall 16",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04117181664051,
              10.605666263355845
            ],
            [
              123.0411989925026,
              10.605658663963418
            ],
            [
              123.04119097735109,
              10.605630936689828
            ],
            [
              123.04116380148903,
              10.605638536082942
            ],
            [
              123.04117181664051,
              10.605666263355845
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_17",
      "stall_name": "Stall 17",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04120660689655,
              10.605685004870995
            ],
            [
              123.0412337827586,
              10.605677405479012
            ],
            [
              123.04122616836463,
              10.605651064570775
            ],
            [
              123.0411989925026,
              10.605658663963418
            ],
            [
              123.04120660689655,
              10.605685004870995
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_18",
      "stall_name": "Stall 18",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411989925026,
              10.605658663963418
            ],
            [
              123.04122616836463,
              10.605651064570775
            ],
            [
              123.04121815321315,
              10.605623337296485
            ],
            [
              123.04119097735109,
              10.605630936689828
            ],
            [
              123.0411989925026,
              10.605658663963418
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_19",
      "stall_name": "Stall 19",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412337827586,
              10.605677405479012
            ],
            [
              123.04126095862067,
              10.605669806086853
            ],
            [
              123.04125334422673,
              10.605643465177954
            ],
            [
              123.04122616836463,
              10.605651064570775
            ],
            [
              123.0412337827586,
              10.605677405479012
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_20",
      "stall_name": "Stall 20",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04122616836463,
              10.605651064570775
            ],
            [
              123.04125334422673,
              10.605643465177954
            ],
            [
              123.04124532907522,
              10.605615737902989
            ],
            [
              123.04121815321315,
              10.605623337296485
            ],
            [
              123.04122616836463,
              10.605651064570775
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_21",
      "stall_name": "Stall 21",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04126095862067,
              10.605669806086853
            ],
            [
              123.04128813448277,
              10.605662206694502
            ],
            [
              123.04128052008882,
              10.605635865784967
            ],
            [
              123.04125334422673,
              10.605643465177954
            ],
            [
              123.04126095862067,
              10.605669806086853
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.056Z",
      "updated_at": "2026-09-10T13:56:40.056Z"
    },
    {
      "id": "plan_22",
      "stall_name": "Stall 22",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04125334422673,
              10.605643465177954
            ],
            [
              123.04128052008882,
              10.605635865784967
            ],
            [
              123.04127250493731,
              10.60560813850929
            ],
            [
              123.04124532907522,
              10.605615737902989
            ],
            [
              123.04125334422673,
              10.605643465177954
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_23",
      "stall_name": "Stall 23",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04134146551723,
              10.605647293332408
            ],
            [
              123.04136864137931,
              10.60563969393951
            ],
            [
              123.04136082660659,
              10.605612659846123
            ],
            [
              123.04133365074452,
              10.605620259239695
            ],
            [
              123.04134146551723,
              10.605647293332408
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_24",
      "stall_name": "Stall 24",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04133365074452,
              10.605620259239695
            ],
            [
              123.04136082660659,
              10.605612659846123
            ],
            [
              123.04135301183386,
              10.605585625750342
            ],
            [
              123.04132583597178,
              10.605593225144576
            ],
            [
              123.04133365074452,
              10.605620259239695
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_25",
      "stall_name": "Stall 25",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04136864137931,
              10.60563969393951
            ],
            [
              123.0413958172414,
              10.605632094546422
            ],
            [
              123.0413880024687,
              10.605605060452348
            ],
            [
              123.04136082660659,
              10.605612659846123
            ],
            [
              123.04136864137931,
              10.60563969393951
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_26",
      "stall_name": "Stall 26",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04136082660659,
              10.605612659846123
            ],
            [
              123.0413880024687,
              10.605605060452348
            ],
            [
              123.04138018769592,
              10.605578026355893
            ],
            [
              123.04135301183386,
              10.605585625750342
            ],
            [
              123.04136082660659,
              10.605612659846123
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_27",
      "stall_name": "Stall 27",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0413958172414,
              10.605632094546422
            ],
            [
              123.04142299310342,
              10.605624495153105
            ],
            [
              123.04141517833072,
              10.60559746105838
            ],
            [
              123.0413880024687,
              10.605605060452348
            ],
            [
              123.0413958172414,
              10.605632094546422
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_28",
      "stall_name": "Stall 28",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0413880024687,
              10.605605060452348
            ],
            [
              123.04141517833072,
              10.60559746105838
            ],
            [
              123.04140736355798,
              10.605570426961252
            ],
            [
              123.04138018769592,
              10.605578026355893
            ],
            [
              123.0413880024687,
              10.605605060452348
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_29",
      "stall_name": "Stall 29",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04142299310342,
              10.605624495153105
            ],
            [
              123.04145016896551,
              10.605616895759635
            ],
            [
              123.04144235419281,
              10.605589861664237
            ],
            [
              123.04141517833072,
              10.60559746105838
            ],
            [
              123.04142299310342,
              10.605624495153105
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_30",
      "stall_name": "Stall 30",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04141517833072,
              10.60559746105838
            ],
            [
              123.04144235419281,
              10.605589861664237
            ],
            [
              123.04143453942004,
              10.605562827566434
            ],
            [
              123.04140736355798,
              10.605570426961252
            ],
            [
              123.04141517833072,
              10.60559746105838
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_31",
      "stall_name": "Stall 31",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04145016896551,
              10.605616895759635
            ],
            [
              123.04147734482761,
              10.605609296365973
            ],
            [
              123.04146953005487,
              10.605582262269888
            ],
            [
              123.04144235419281,
              10.605589861664237
            ],
            [
              123.04145016896551,
              10.605616895759635
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_32",
      "stall_name": "Stall 32",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04144235419281,
              10.605589861664237
            ],
            [
              123.04146953005487,
              10.605582262269888
            ],
            [
              123.04146171528214,
              10.605555228171411
            ],
            [
              123.04143453942004,
              10.605562827566434
            ],
            [
              123.04144235419281,
              10.605589861664237
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_33",
      "stall_name": "Stall 33",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04147734482761,
              10.605609296365973
            ],
            [
              123.04150452068964,
              10.605601696972109
            ],
            [
              123.04149670591693,
              10.605574662875362
            ],
            [
              123.04146953005487,
              10.605582262269888
            ],
            [
              123.04147734482761,
              10.605609296365973
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_34",
      "stall_name": "Stall 34",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04146953005487,
              10.605582262269888
            ],
            [
              123.04149670591693,
              10.605574662875362
            ],
            [
              123.04148889114418,
              10.605547628776224
            ],
            [
              123.04146171528214,
              10.605555228171411
            ],
            [
              123.04146953005487,
              10.605582262269888
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_35",
      "stall_name": "Stall 35",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04150452068964,
              10.605601696972109
            ],
            [
              123.04153169655173,
              10.605594097578079
            ],
            [
              123.04152388177899,
              10.605567063480658
            ],
            [
              123.04149670591693,
              10.605574662875362
            ],
            [
              123.04150452068964,
              10.605601696972109
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_36",
      "stall_name": "Stall 36",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04149670591693,
              10.605574662875362
            ],
            [
              123.04152388177899,
              10.605567063480658
            ],
            [
              123.04151606700626,
              10.605540029380844
            ],
            [
              123.04148889114418,
              10.605547628776224
            ],
            [
              123.04149670591693,
              10.605574662875362
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_37",
      "stall_name": "Stall 37",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04153169655173,
              10.605594097578079
            ],
            [
              123.04155887241379,
              10.605586498183833
            ],
            [
              123.04155105764109,
              10.605559464085736
            ],
            [
              123.04152388177899,
              10.605567063480658
            ],
            [
              123.04153169655173,
              10.605594097578079
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_38",
      "stall_name": "Stall 38",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04152388177899,
              10.605567063480658
            ],
            [
              123.04155105764109,
              10.605559464085736
            ],
            [
              123.04154324286834,
              10.60553242998525
            ],
            [
              123.04151606700626,
              10.605540029380844
            ],
            [
              123.04152388177899,
              10.605567063480658
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_39",
      "stall_name": "Stall 39",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04155887241379,
              10.605586498183833
            ],
            [
              123.04158604827587,
              10.605578898789409
            ],
            [
              123.04157823350316,
              10.605551864690652
            ],
            [
              123.04155105764109,
              10.605559464085736
            ],
            [
              123.04155887241379,
              10.605586498183833
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_40",
      "stall_name": "Stall 40",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04155105764109,
              10.605559464085736
            ],
            [
              123.04157823350316,
              10.605551864690652
            ],
            [
              123.04157041873042,
              10.60552483058949
            ],
            [
              123.04154324286834,
              10.60553242998525
            ],
            [
              123.04155105764109,
              10.605559464085736
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_41",
      "stall_name": "Stall 41",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04158604827587,
              10.605578898789409
            ],
            [
              123.04161322413792,
              10.605571299394793
            ],
            [
              123.0416054093652,
              10.60554426529536
            ],
            [
              123.04157823350316,
              10.605551864690652
            ],
            [
              123.04158604827587,
              10.605578898789409
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_42",
      "stall_name": "Stall 42",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04157823350316,
              10.605551864690652
            ],
            [
              123.0416054093652,
              10.60554426529536
            ],
            [
              123.04159759459247,
              10.605517231193526
            ],
            [
              123.04157041873042,
              10.60552483058949
            ],
            [
              123.04157823350316,
              10.605551864690652
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_43",
      "stall_name": "Stall 43",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04161322413792,
              10.605571299394793
            ],
            [
              123.0416404,
              10.6055637
            ],
            [
              123.04163258522729,
              10.605536665899894
            ],
            [
              123.0416054093652,
              10.60554426529536
            ],
            [
              123.04161322413792,
              10.605571299394793
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_44",
      "stall_name": "Stall 44",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "North Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0416054093652,
              10.60554426529536
            ],
            [
              123.04163258522729,
              10.605536665899894
            ],
            [
              123.04162477045453,
              10.605509631797396
            ],
            [
              123.04159759459247,
              10.605517231193526
            ],
            [
              123.0416054093652,
              10.60554426529536
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_45",
      "stall_name": "Stall 45",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04100756613117,
              10.605602059325413
            ],
            [
              123.04103462149517,
              10.605594493627185
            ],
            [
              123.0410268067224,
              10.605567459529789
            ],
            [
              123.04099975135843,
              10.605575025228692
            ],
            [
              123.04100756613117,
              10.605602059325413
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_46",
      "stall_name": "Stall 46",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04099975135843,
              10.605575025228692
            ],
            [
              123.0410268067224,
              10.605567459529789
            ],
            [
              123.04101879157089,
              10.60553973224793
            ],
            [
              123.04099173620692,
              10.60554729794752
            ],
            [
              123.04099975135843,
              10.605575025228692
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_47",
      "stall_name": "Stall 47",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04103462149517,
              10.605594493627185
            ],
            [
              123.04106167685916,
              10.605586927928766
            ],
            [
              123.0410538620864,
              10.605559893830721
            ],
            [
              123.0410268067224,
              10.605567459529789
            ],
            [
              123.04103462149517,
              10.605594493627185
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_48",
      "stall_name": "Stall 48",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410268067224,
              10.605567459529789
            ],
            [
              123.0410538620864,
              10.605559893830721
            ],
            [
              123.04104584693489,
              10.605532166548175
            ],
            [
              123.04101879157089,
              10.60553973224793
            ],
            [
              123.0410268067224,
              10.605567459529789
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_49",
      "stall_name": "Stall 49",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04106167685916,
              10.605586927928766
            ],
            [
              123.0410887322231,
              10.605579362230156
            ],
            [
              123.04108091745034,
              10.605552328131424
            ],
            [
              123.0410538620864,
              10.605559893830721
            ],
            [
              123.04106167685916,
              10.605586927928766
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_50",
      "stall_name": "Stall 50",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410538620864,
              10.605559893830721
            ],
            [
              123.04108091745034,
              10.605552328131424
            ],
            [
              123.04107290229884,
              10.60552460084819
            ],
            [
              123.04104584693489,
              10.605532166548175
            ],
            [
              123.0410538620864,
              10.605559893830721
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.057Z",
      "updated_at": "2026-09-10T13:56:40.057Z"
    },
    {
      "id": "plan_51",
      "stall_name": "Stall 51",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410887322231,
              10.605579362230156
            ],
            [
              123.04111578758707,
              10.605571796531367
            ],
            [
              123.04110797281434,
              10.605544762431974
            ],
            [
              123.04108091745034,
              10.605552328131424
            ],
            [
              123.0410887322231,
              10.605579362230156
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_52",
      "stall_name": "Stall 52",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04108091745034,
              10.605552328131424
            ],
            [
              123.04110797281434,
              10.605544762431974
            ],
            [
              123.04109995766284,
              10.605517035148052
            ],
            [
              123.04107290229884,
              10.60552460084819
            ],
            [
              123.04108091745034,
              10.605552328131424
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_53",
      "stall_name": "Stall 53",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04111578758707,
              10.605571796531367
            ],
            [
              123.04114284295107,
              10.605564230832375
            ],
            [
              123.04113502817832,
              10.605537196732307
            ],
            [
              123.04110797281434,
              10.605544762431974
            ],
            [
              123.04111578758707,
              10.605571796531367
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_54",
      "stall_name": "Stall 54",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04110797281434,
              10.605544762431974
            ],
            [
              123.04113502817832,
              10.605537196732307
            ],
            [
              123.04112701302682,
              10.6055094694477
            ],
            [
              123.04109995766284,
              10.605517035148052
            ],
            [
              123.04110797281434,
              10.605544762431974
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_55",
      "stall_name": "Stall 55",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04114284295107,
              10.605564230832375
            ],
            [
              123.04116989831508,
              10.605556665133205
            ],
            [
              123.04116208354232,
              10.605529631032475
            ],
            [
              123.04113502817832,
              10.605537196732307
            ],
            [
              123.04114284295107,
              10.605564230832375
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_56",
      "stall_name": "Stall 56",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04113502817832,
              10.605537196732307
            ],
            [
              123.04116208354232,
              10.605529631032475
            ],
            [
              123.04115406839081,
              10.60550190374718
            ],
            [
              123.04112701302682,
              10.6055094694477
            ],
            [
              123.04113502817832,
              10.605537196732307
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_57",
      "stall_name": "Stall 57",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04116989831508,
              10.605556665133205
            ],
            [
              123.04119695367905,
              10.60554909943383
            ],
            [
              123.0411891389063,
              10.60552206533244
            ],
            [
              123.04116208354232,
              10.605529631032475
            ],
            [
              123.04116989831508,
              10.605556665133205
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_58",
      "stall_name": "Stall 58",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04116208354232,
              10.605529631032475
            ],
            [
              123.0411891389063,
              10.60552206533244
            ],
            [
              123.0411811237548,
              10.605494338046459
            ],
            [
              123.04115406839081,
              10.60550190374718
            ],
            [
              123.04116208354232,
              10.605529631032475
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_59",
      "stall_name": "Stall 59",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04119695367905,
              10.60554909943383
            ],
            [
              123.04122400904305,
              10.605541533734291
            ],
            [
              123.04121619427028,
              10.605514499632227
            ],
            [
              123.0411891389063,
              10.60552206533244
            ],
            [
              123.04119695367905,
              10.60554909943383
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_60",
      "stall_name": "Stall 60",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411891389063,
              10.60552206533244
            ],
            [
              123.04121619427028,
              10.605514499632227
            ],
            [
              123.04120817911878,
              10.605486772345584
            ],
            [
              123.0411811237548,
              10.605494338046459
            ],
            [
              123.0411891389063,
              10.60552206533244
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_61",
      "stall_name": "Stall 61",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04122400904305,
              10.605541533734291
            ],
            [
              123.04125106440704,
              10.605533968034575
            ],
            [
              123.04124324963428,
              10.605506933931835
            ],
            [
              123.04121619427028,
              10.605514499632227
            ],
            [
              123.04122400904305,
              10.605541533734291
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_62",
      "stall_name": "Stall 62",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04121619427028,
              10.605514499632227
            ],
            [
              123.04124324963428,
              10.605506933931835
            ],
            [
              123.04123523448277,
              10.605479206644493
            ],
            [
              123.04120817911878,
              10.605486772345584
            ],
            [
              123.04121619427028,
              10.605514499632227
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_63",
      "stall_name": "Stall 63",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04130439544151,
              10.605519054666248
            ],
            [
              123.04133157130357,
              10.605511455270143
            ],
            [
              123.04132375653084,
              10.60548442116542
            ],
            [
              123.04129658066874,
              10.605492020562185
            ],
            [
              123.04130439544151,
              10.605519054666248
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_64",
      "stall_name": "Stall 64",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04129658066874,
              10.605492020562185
            ],
            [
              123.04132375653084,
              10.60548442116542
            ],
            [
              123.04131574137934,
              10.605456693876029
            ],
            [
              123.04128856551723,
              10.605464293273494
            ],
            [
              123.04129658066874,
              10.605492020562185
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_65",
      "stall_name": "Stall 65",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04133157130357,
              10.605511455270143
            ],
            [
              123.04135874716567,
              10.605503855873861
            ],
            [
              123.04135093239292,
              10.605476821768464
            ],
            [
              123.04132375653084,
              10.60548442116542
            ],
            [
              123.04133157130357,
              10.605511455270143
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_66",
      "stall_name": "Stall 66",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04132375653084,
              10.60548442116542
            ],
            [
              123.04135093239292,
              10.605476821768464
            ],
            [
              123.04134291724141,
              10.605449094478399
            ],
            [
              123.04131574137934,
              10.605456693876029
            ],
            [
              123.04132375653084,
              10.60548442116542
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_67",
      "stall_name": "Stall 67",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04135874716567,
              10.605503855873861
            ],
            [
              123.04138592302769,
              10.605496256477377
            ],
            [
              123.04137810825496,
              10.605469222371317
            ],
            [
              123.04135093239292,
              10.605476821768464
            ],
            [
              123.04135874716567,
              10.605503855873861
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_68",
      "stall_name": "Stall 68",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04135093239292,
              10.605476821768464
            ],
            [
              123.04137810825496,
              10.605469222371317
            ],
            [
              123.04137009310345,
              10.605441495080552
            ],
            [
              123.04134291724141,
              10.605449094478399
            ],
            [
              123.04135093239292,
              10.605476821768464
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_69",
      "stall_name": "Stall 69",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04138592302769,
              10.605496256477377
            ],
            [
              123.04141309888979,
              10.605488657080725
            ],
            [
              123.04140528411703,
              10.60546162297399
            ],
            [
              123.04137810825496,
              10.605469222371317
            ],
            [
              123.04138592302769,
              10.605496256477377
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_70",
      "stall_name": "Stall 70",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04137810825496,
              10.605469222371317
            ],
            [
              123.04140528411703,
              10.60546162297399
            ],
            [
              123.04139726896553,
              10.60543389568254
            ],
            [
              123.04137009310345,
              10.605441495080552
            ],
            [
              123.04137810825496,
              10.605469222371317
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_71",
      "stall_name": "Stall 71",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04141309888979,
              10.605488657080725
            ],
            [
              123.04144027475186,
              10.605481057683859
            ],
            [
              123.04143245997912,
              10.60545402357645
            ],
            [
              123.04140528411703,
              10.60546162297399
            ],
            [
              123.04141309888979,
              10.605488657080725
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_72",
      "stall_name": "Stall 72",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04140528411703,
              10.60546162297399
            ],
            [
              123.04143245997912,
              10.60545402357645
            ],
            [
              123.04142444482761,
              10.60542629628431
            ],
            [
              123.04139726896553,
              10.60543389568254
            ],
            [
              123.04140528411703,
              10.60546162297399
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_73",
      "stall_name": "Stall 73",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04144027475186,
              10.605481057683859
            ],
            [
              123.04146745061391,
              10.605473458286825
            ],
            [
              123.04145963584115,
              10.605446424178743
            ],
            [
              123.04143245997912,
              10.60545402357645
            ],
            [
              123.04144027475186,
              10.605481057683859
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_74",
      "stall_name": "Stall 74",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143245997912,
              10.60545402357645
            ],
            [
              123.04145963584115,
              10.605446424178743
            ],
            [
              123.04145162068966,
              10.605418696885918
            ],
            [
              123.04142444482761,
              10.60542629628431
            ],
            [
              123.04143245997912,
              10.60545402357645
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_75",
      "stall_name": "Stall 75",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04146745061391,
              10.605473458286825
            ],
            [
              123.04149462647598,
              10.605465858889602
            ],
            [
              123.04148681170324,
              10.605438824780846
            ],
            [
              123.04145963584115,
              10.605446424178743
            ],
            [
              123.04146745061391,
              10.605473458286825
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_76",
      "stall_name": "Stall 76",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04145963584115,
              10.605446424178743
            ],
            [
              123.04148681170324,
              10.605438824780846
            ],
            [
              123.04147879655173,
              10.605411097487332
            ],
            [
              123.04145162068966,
              10.605418696885918
            ],
            [
              123.04145963584115,
              10.605446424178743
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.058Z",
      "updated_at": "2026-09-10T13:56:40.058Z"
    },
    {
      "id": "plan_77",
      "stall_name": "Stall 77",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04149462647598,
              10.605465858889602
            ],
            [
              123.04152180233807,
              10.605458259492176
            ],
            [
              123.04151398756531,
              10.605431225382757
            ],
            [
              123.04148681170324,
              10.605438824780846
            ],
            [
              123.04149462647598,
              10.605465858889602
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_78",
      "stall_name": "Stall 78",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04148681170324,
              10.605438824780846
            ],
            [
              123.04151398756531,
              10.605431225382757
            ],
            [
              123.0415059724138,
              10.605403498088545
            ],
            [
              123.04147879655173,
              10.605411097487332
            ],
            [
              123.04148681170324,
              10.605438824780846
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_79",
      "stall_name": "Stall 79",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04152180233807,
              10.605458259492176
            ],
            [
              123.04154897820014,
              10.60545066009457
            ],
            [
              123.04154116342741,
              10.605423625984479
            ],
            [
              123.04151398756531,
              10.605431225382757
            ],
            [
              123.04152180233807,
              10.605458259492176
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_80",
      "stall_name": "Stall 80",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04151398756531,
              10.605431225382757
            ],
            [
              123.04154116342741,
              10.605423625984479
            ],
            [
              123.0415331482759,
              10.605395898689578
            ],
            [
              123.0415059724138,
              10.605403498088545
            ],
            [
              123.04151398756531,
              10.605431225382757
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_81",
      "stall_name": "Stall 81",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04154897820014,
              10.60545066009457
            ],
            [
              123.04157615406218,
              10.605443060696762
            ],
            [
              123.04156833928946,
              10.605416026585996
            ],
            [
              123.04154116342741,
              10.605423625984479
            ],
            [
              123.04154897820014,
              10.60545066009457
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_82",
      "stall_name": "Stall 82",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04154116342741,
              10.605423625984479
            ],
            [
              123.04156833928946,
              10.605416026585996
            ],
            [
              123.04156032413795,
              10.605388299290421
            ],
            [
              123.0415331482759,
              10.605395898689578
            ],
            [
              123.04154116342741,
              10.605423625984479
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_83",
      "stall_name": "Stall 83",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04157615406218,
              10.605443060696762
            ],
            [
              123.04160332992426,
              10.605435461298788
            ],
            [
              123.04159551515153,
              10.605408427187347
            ],
            [
              123.04156833928946,
              10.605416026585996
            ],
            [
              123.04157615406218,
              10.605443060696762
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_84",
      "stall_name": "Stall 84",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "South Wing",
      "business_type": "",
      "notes": "Pre-drawn from the Murcia Dry Market floor plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04156833928946,
              10.605416026585996
            ],
            [
              123.04159551515153,
              10.605408427187347
            ],
            [
              123.04158750000002,
              10.605380699891073
            ],
            [
              123.04156032413795,
              10.605388299290421
            ],
            [
              123.04156833928946,
              10.605416026585996
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "plan_table_1",
      "stall_name": "Table Stall 1",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04100866064525,
              10.605655696761325
            ],
            [
              123.04102234426594,
              10.60565187030657
            ],
            [
              123.04101593214472,
              10.605629688487403
            ],
            [
              123.04100224852407,
              10.605633514942424
            ],
            [
              123.04100866064525,
              10.605655696761325
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_2",
      "stall_name": "Table Stall 2",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04102234426594,
              10.60565187030657
            ],
            [
              123.04103602788659,
              10.605648043851765
            ],
            [
              123.04102961576541,
              10.605625862032317
            ],
            [
              123.04101593214472,
              10.605629688487403
            ],
            [
              123.04102234426594,
              10.60565187030657
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_3",
      "stall_name": "Table Stall 3",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.041063395128,
              10.605640390942014
            ],
            [
              123.04107707874866,
              10.60563656448707
            ],
            [
              123.04107066662748,
              10.605614382666795
            ],
            [
              123.04105698300678,
              10.60561820912202
            ],
            [
              123.041063395128,
              10.605640390942014
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_4",
      "stall_name": "Table Stall 4",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04107707874866,
              10.60563656448707
            ],
            [
              123.0410907623694,
              10.605632738032073
            ],
            [
              123.0410843502482,
              10.605610556211518
            ],
            [
              123.04107066662748,
              10.605614382666795
            ],
            [
              123.04107707874866,
              10.60563656448707
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_5",
      "stall_name": "Table Stall 5",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04111812961072,
              10.605625085121954
            ],
            [
              123.04113181323146,
              10.60562125866683
            ],
            [
              123.04112540111026,
              10.605599076845436
            ],
            [
              123.04111171748954,
              10.605602903300852
            ],
            [
              123.04111812961072,
              10.605625085121954
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_6",
      "stall_name": "Table Stall 6",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04113181323146,
              10.60562125866683
            ],
            [
              123.04114549685212,
              10.605617432211643
            ],
            [
              123.04113908473094,
              10.60559525038997
            ],
            [
              123.04112540111026,
              10.605599076845436
            ],
            [
              123.04113181323146,
              10.60562125866683
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_7",
      "stall_name": "Table Stall 7",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04117075892108,
              10.605610367986548
            ],
            [
              123.0411844425418,
              10.60560654153122
            ],
            [
              123.04117803042062,
              10.605584359708772
            ],
            [
              123.0411643467999,
              10.605588186164377
            ],
            [
              123.04117075892108,
              10.605610367986548
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_8",
      "stall_name": "Table Stall 8",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411844425418,
              10.60560654153122
            ],
            [
              123.04119812616248,
              10.605602715075856
            ],
            [
              123.04119171404128,
              10.605580533253127
            ],
            [
              123.04117803042062,
              10.605584359708772
            ],
            [
              123.0411844425418,
              10.60560654153122
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_9",
      "stall_name": "Table Stall 9",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04122479167972,
              10.605595258393466
            ],
            [
              123.04123847530037,
              10.605591431937961
            ],
            [
              123.0412320631792,
              10.605569250114405
            ],
            [
              123.04121837955853,
              10.605573076570202
            ],
            [
              123.04122479167972,
              10.605595258393466
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_10",
      "stall_name": "Table Stall 10",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04123847530037,
              10.605591431937961
            ],
            [
              123.04125215892111,
              10.605587605482405
            ],
            [
              123.04124574679992,
              10.60556542365857
            ],
            [
              123.0412320631792,
              10.605569250114405
            ],
            [
              123.04123847530037,
              10.605591431937961
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_11",
      "stall_name": "Table Stall 11",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04128022788662,
              10.605579756342648
            ],
            [
              123.0412918063349,
              10.605576518572434
            ],
            [
              123.0412853942137,
              10.605554336747808
            ],
            [
              123.04127381576544,
              10.605557574518263
            ],
            [
              123.04128022788662,
              10.605579756342648
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_12",
      "stall_name": "Table Stall 12",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412918063349,
              10.605576518572434
            ],
            [
              123.04130338478319,
              10.605573280802194
            ],
            [
              123.04129697266198,
              10.605551098977328
            ],
            [
              123.0412853942137,
              10.605554336747808
            ],
            [
              123.0412918063349,
              10.605576518572434
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_13",
      "stall_name": "Table Stall 13",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0413321554728,
              10.605565235433573
            ],
            [
              123.04134548823144,
              10.605561507091933
            ],
            [
              123.04133907611023,
              10.605539325266214
            ],
            [
              123.04132574335162,
              10.605543053608134
            ],
            [
              123.0413321554728,
              10.605565235433573
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_14",
      "stall_name": "Table Stall 14",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04134548823144,
              10.605561507091933
            ],
            [
              123.04135882099006,
              10.605557778750267
            ],
            [
              123.04135240886885,
              10.605535596924282
            ],
            [
              123.04133907611023,
              10.605539325266214
            ],
            [
              123.04134548823144,
              10.605561507091933
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_15",
      "stall_name": "Table Stall 15",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04138408305904,
              10.605550714523797
            ],
            [
              123.04139741581766,
              10.605546986182006
            ],
            [
              123.04139100369648,
              10.60552480435523
            ],
            [
              123.04137767093786,
              10.605528532697303
            ],
            [
              123.04138408305904,
              10.605550714523797
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_16",
      "stall_name": "Table Stall 16",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04139741581766,
              10.605546986182006
            ],
            [
              123.04141074857628,
              10.605543257840138
            ],
            [
              123.04140433645509,
              10.605521076013096
            ],
            [
              123.04139100369648,
              10.60552480435523
            ],
            [
              123.04139741581766,
              10.605546986182006
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_17",
      "stall_name": "Table Stall 17",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143951926592,
              10.605535212470727
            ],
            [
              123.04145320288664,
              10.605531386014471
            ],
            [
              123.04144679076543,
              10.605509204186564
            ],
            [
              123.04143310714471,
              10.605513030643113
            ],
            [
              123.04143951926592,
              10.605535212470727
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_18",
      "stall_name": "Table Stall 18",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04145320288664,
              10.605531386014471
            ],
            [
              123.0414668865073,
              10.605527559558166
            ],
            [
              123.04146047438611,
              10.60550537772999
            ],
            [
              123.04144679076543,
              10.605509204186564
            ],
            [
              123.04145320288664,
              10.605531386014471
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_19",
      "stall_name": "Table Stall 19",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04149425374871,
              10.6055199066454
            ],
            [
              123.04150758650731,
              10.6055161783032
            ],
            [
              123.04150117438613,
              10.60549399647421
            ],
            [
              123.04148784162749,
              10.605497724816665
            ],
            [
              123.04149425374871,
              10.6055199066454
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_20",
      "stall_name": "Table Stall 20",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04150758650731,
              10.6055161783032
            ],
            [
              123.04152091926593,
              10.605512449960987
            ],
            [
              123.04151450714474,
              10.60549026813172
            ],
            [
              123.04150117438613,
              10.60549399647421
            ],
            [
              123.04150758650731,
              10.6055161783032
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_21",
      "stall_name": "Table Stall 21",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04154758478317,
              10.605504993276398
            ],
            [
              123.04156056667972,
              10.605501363048292
            ],
            [
              123.04155415455853,
              10.60547918121821
            ],
            [
              123.04154117266197,
              10.605482811446583
            ],
            [
              123.04154758478317,
              10.605504993276398
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_table_22",
      "stall_name": "Table Stall 22",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Middle aisle",
      "business_type": "",
      "notes": "Table stall traced from the middle islands on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04156056667972,
              10.605501363048292
            ],
            [
              123.0415735485763,
              10.605497732820162
            ],
            [
              123.04156713645509,
              10.605475550989825
            ],
            [
              123.04155415455853,
              10.60547918121821
            ],
            [
              123.04156056667972,
              10.605501363048292
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "table_stall"
    },
    {
      "id": "plan_technical_room",
      "stall_name": "Technical Room",
      "building": "Dry Store Building",
      "floor": "1",
      "section": "Facilities",
      "business_type": "",
      "notes": "Technical room, located in the electrical-room space on the reference plan.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04095212992426,
              10.605617561375114
            ],
            [
              123.04100756613117,
              10.605602059325413
            ],
            [
              123.04099173620692,
              10.60554729794752
            ],
            [
              123.04093630000001,
              10.605562799999992
            ],
            [
              123.04095212992426,
              10.605617561375114
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z",
      "kind": "technical_room"
    },
    {
      "id": "main_1",
      "stall_name": "Stall 1",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410153,
              10.605920700000011
            ],
            [
              123.04104884755556,
              10.605911108002939
            ],
            [
              123.04102659755556,
              10.605835908009821
            ],
            [
              123.04099305,
              10.605845500009249
            ],
            [
              123.0410153,
              10.605920700000011
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.059Z",
      "updated_at": "2026-09-10T13:56:40.059Z"
    },
    {
      "id": "main_2",
      "stall_name": "Stall 2",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04099305,
              10.605845500009249
            ],
            [
              123.04102659755556,
              10.605835908009821
            ],
            [
              123.04100434755554,
              10.60576070799822
            ],
            [
              123.0409708,
              10.605770300000012
            ],
            [
              123.04099305,
              10.605845500009249
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_3",
      "stall_name": "Stall 3",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04104884755556,
              10.605911108002939
            ],
            [
              123.0410823951111,
              10.605901516005574
            ],
            [
              123.04106014511109,
              10.60582631601009
            ],
            [
              123.04102659755556,
              10.605835908009821
            ],
            [
              123.04104884755556,
              10.605911108002939
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_4",
      "stall_name": "Stall 4",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04102659755556,
              10.605835908009821
            ],
            [
              123.04106014511109,
              10.60582631601009
            ],
            [
              123.04103789511109,
              10.605751115996133
            ],
            [
              123.04100434755554,
              10.60576070799822
            ],
            [
              123.04102659755556,
              10.605835908009821
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_5",
      "stall_name": "Stall 5",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410823951111,
              10.605901516005574
            ],
            [
              123.04111594266668,
              10.605891924007903
            ],
            [
              123.04109369266668,
              10.605816724010053
            ],
            [
              123.04106014511109,
              10.60582631601009
            ],
            [
              123.0410823951111,
              10.605901516005574
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_6",
      "stall_name": "Stall 6",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04106014511109,
              10.60582631601009
            ],
            [
              123.04109369266668,
              10.605816724010053
            ],
            [
              123.04107144266668,
              10.60574152399373
            ],
            [
              123.04103789511109,
              10.605751115996133
            ],
            [
              123.04106014511109,
              10.60582631601009
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_7",
      "stall_name": "Stall 7",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04111594266668,
              10.605891924007903
            ],
            [
              123.04114949022221,
              10.605882332009902
            ],
            [
              123.04112724022221,
              10.60580713200971
            ],
            [
              123.04109369266668,
              10.605816724010053
            ],
            [
              123.04111594266668,
              10.605891924007903
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_8",
      "stall_name": "Stall 8",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04109369266668,
              10.605816724010053
            ],
            [
              123.04112724022221,
              10.60580713200971
            ],
            [
              123.0411049902222,
              10.605731931991034
            ],
            [
              123.04107144266668,
              10.60574152399373
            ],
            [
              123.04109369266668,
              10.605816724010053
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_9",
      "stall_name": "Stall 9",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04114949022221,
              10.605882332009902
            ],
            [
              123.04118303777778,
              10.60587274001162
            ],
            [
              123.0411607877778,
              10.605797540009062
            ],
            [
              123.04112724022221,
              10.60580713200971
            ],
            [
              123.04114949022221,
              10.605882332009902
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_10",
      "stall_name": "Stall 10",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04112724022221,
              10.60580713200971
            ],
            [
              123.0411607877778,
              10.605797540009062
            ],
            [
              123.04113853777778,
              10.605722339988047
            ],
            [
              123.0411049902222,
              10.605731931991034
            ],
            [
              123.04112724022221,
              10.60580713200971
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_11",
      "stall_name": "Stall 11",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04118303777778,
              10.60587274001162
            ],
            [
              123.0412165853333,
              10.605863148013045
            ],
            [
              123.0411943353333,
              10.605787948008135
            ],
            [
              123.0411607877778,
              10.605797540009062
            ],
            [
              123.04118303777778,
              10.60587274001162
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_12",
      "stall_name": "Stall 12",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411607877778,
              10.605797540009062
            ],
            [
              123.0411943353333,
              10.605787948008135
            ],
            [
              123.04117208533332,
              10.605712747984752
            ],
            [
              123.04113853777778,
              10.605722339988047
            ],
            [
              123.0411607877778,
              10.605797540009062
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_13",
      "stall_name": "Stall 13",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412165853333,
              10.605863148013045
            ],
            [
              123.04125013288889,
              10.605853556014178
            ],
            [
              123.04122788288889,
              10.605778356006901
            ],
            [
              123.0411943353333,
              10.605787948008135
            ],
            [
              123.0412165853333,
              10.605863148013045
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_14",
      "stall_name": "Stall 14",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411943353333,
              10.605787948008135
            ],
            [
              123.04122788288889,
              10.605778356006901
            ],
            [
              123.04120563288889,
              10.605703155981152
            ],
            [
              123.04117208533332,
              10.605712747984752
            ],
            [
              123.0411943353333,
              10.605787948008135
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_15",
      "stall_name": "Stall 15",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04125013288889,
              10.605853556014178
            ],
            [
              123.04128368044445,
              10.605843964014982
            ],
            [
              123.04126143044446,
              10.605768764005363
            ],
            [
              123.04122788288889,
              10.605778356006901
            ],
            [
              123.04125013288889,
              10.605853556014178
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_16",
      "stall_name": "Stall 16",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04122788288889,
              10.605778356006901
            ],
            [
              123.04126143044446,
              10.605768764005363
            ],
            [
              123.04123918044446,
              10.60569356397726
            ],
            [
              123.04120563288889,
              10.605703155981152
            ],
            [
              123.04122788288889,
              10.605778356006901
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_17",
      "stall_name": "Stall 17",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04128368044445,
              10.605843964014982
            ],
            [
              123.04131722800001,
              10.605834372015504
            ],
            [
              123.04129497800001,
              10.605759172003532
            ],
            [
              123.04126143044446,
              10.605768764005363
            ],
            [
              123.04128368044445,
              10.605843964014982
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_18",
      "stall_name": "Stall 18",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04126143044446,
              10.605768764005363
            ],
            [
              123.04129497800001,
              10.605759172003532
            ],
            [
              123.041272728,
              10.605683971973075
            ],
            [
              123.04123918044446,
              10.60569356397726
            ],
            [
              123.04126143044446,
              10.605768764005363
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_19",
      "stall_name": "Stall 19",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.041399572,
              10.605810828015503
            ],
            [
              123.04143311955555,
              10.605801236014983
            ],
            [
              123.04141086955556,
              10.605726035994856
            ],
            [
              123.041377322,
              10.605735627997731
            ],
            [
              123.041399572,
              10.605810828015503
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_20",
      "stall_name": "Stall 20",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.041377322,
              10.605735627997731
            ],
            [
              123.04141086955556,
              10.605726035994856
            ],
            [
              123.04138861955555,
              10.605650835956258
            ],
            [
              123.04135507200002,
              10.605660427961485
            ],
            [
              123.041377322,
              10.605735627997731
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_21",
      "stall_name": "Stall 21",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143311955555,
              10.605801236014983
            ],
            [
              123.04146666711112,
              10.605791644014156
            ],
            [
              123.04144441711111,
              10.605716443991676
            ],
            [
              123.04141086955556,
              10.605726035994856
            ],
            [
              123.04143311955555,
              10.605801236014983
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_22",
      "stall_name": "Stall 22",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04141086955556,
              10.605726035994856
            ],
            [
              123.04144441711111,
              10.605716443991676
            ],
            [
              123.04142216711111,
              10.605641243950725
            ],
            [
              123.04138861955555,
              10.605650835956258
            ],
            [
              123.04141086955556,
              10.605726035994856
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_23",
      "stall_name": "Stall 23",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04146666711112,
              10.605791644014156
            ],
            [
              123.04150021466671,
              10.605782052013051
            ],
            [
              123.0414779646667,
              10.605706851988204
            ],
            [
              123.04144441711111,
              10.605716443991676
            ],
            [
              123.04146666711112,
              10.605791644014156
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_24",
      "stall_name": "Stall 24",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04144441711111,
              10.605716443991676
            ],
            [
              123.0414779646667,
              10.605706851988204
            ],
            [
              123.0414557146667,
              10.605631651944886
            ],
            [
              123.04142216711111,
              10.605641243950725
            ],
            [
              123.04144441711111,
              10.605716443991676
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_25",
      "stall_name": "Stall 25",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04150021466671,
              10.605782052013051
            ],
            [
              123.04153376222222,
              10.605772460011627
            ],
            [
              123.04151151222223,
              10.605697259984428
            ],
            [
              123.0414779646667,
              10.605706851988204
            ],
            [
              123.04150021466671,
              10.605782052013051
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_26",
      "stall_name": "Stall 26",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0414779646667,
              10.605706851988204
            ],
            [
              123.04151151222223,
              10.605697259984428
            ],
            [
              123.04148926222223,
              10.605622059938755
            ],
            [
              123.0414557146667,
              10.605631651944886
            ],
            [
              123.0414779646667,
              10.605706851988204
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_27",
      "stall_name": "Stall 27",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04153376222222,
              10.605772460011627
            ],
            [
              123.0415673097778,
              10.605762868009897
            ],
            [
              123.0415450597778,
              10.605687667980344
            ],
            [
              123.04151151222223,
              10.605697259984428
            ],
            [
              123.04153376222222,
              10.605772460011627
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_28",
      "stall_name": "Stall 28",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04151151222223,
              10.605697259984428
            ],
            [
              123.0415450597778,
              10.605687667980344
            ],
            [
              123.04152280977782,
              10.605612467932318
            ],
            [
              123.04148926222223,
              10.605622059938755
            ],
            [
              123.04151151222223,
              10.605697259984428
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_29",
      "stall_name": "Stall 29",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0415673097778,
              10.605762868009897
            ],
            [
              123.04160085733334,
              10.605753276007864
            ],
            [
              123.04157860733334,
              10.605678075975955
            ],
            [
              123.0415450597778,
              10.605687667980344
            ],
            [
              123.0415673097778,
              10.605762868009897
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_30",
      "stall_name": "Stall 30",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0415450597778,
              10.605687667980344
            ],
            [
              123.04157860733334,
              10.605678075975955
            ],
            [
              123.04155635733332,
              10.605602875925564
            ],
            [
              123.04152280977782,
              10.605612467932318
            ],
            [
              123.0415450597778,
              10.605687667980344
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_31",
      "stall_name": "Stall 31",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04160085733334,
              10.605753276007864
            ],
            [
              123.04163440488892,
              10.60574368400555
            ],
            [
              123.04161215488891,
              10.605668483971275
            ],
            [
              123.04157860733334,
              10.605678075975955
            ],
            [
              123.04160085733334,
              10.605753276007864
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_32",
      "stall_name": "Stall 32",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04157860733334,
              10.605678075975955
            ],
            [
              123.04161215488891,
              10.605668483971275
            ],
            [
              123.04158990488891,
              10.60559328391853
            ],
            [
              123.04155635733332,
              10.605602875925564
            ],
            [
              123.04157860733334,
              10.605678075975955
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_33",
      "stall_name": "Stall 33",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04163440488892,
              10.60574368400555
            ],
            [
              123.04166795244446,
              10.605734092002917
            ],
            [
              123.04164570244446,
              10.60565889196629
            ],
            [
              123.04161215488891,
              10.605668483971275
            ],
            [
              123.04163440488892,
              10.60574368400555
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_34",
      "stall_name": "Stall 34",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04161215488891,
              10.605668483971275
            ],
            [
              123.04164570244446,
              10.60565889196629
            ],
            [
              123.04162345244444,
              10.60558369191119
            ],
            [
              123.04158990488891,
              10.60559328391853
            ],
            [
              123.04161215488891,
              10.605668483971275
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_35",
      "stall_name": "Stall 35",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04166795244446,
              10.605734092002917
            ],
            [
              123.04170150000002,
              10.605724499999992
            ],
            [
              123.04167925000002,
              10.60564929996101
            ],
            [
              123.04164570244446,
              10.60565889196629
            ],
            [
              123.04166795244446,
              10.605734092002917
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "main_36",
      "stall_name": "Stall 36",
      "building": "Main Building",
      "floor": "1",
      "section": "Main stalls",
      "business_type": "",
      "kind": "stall",
      "numbering_verified": false,
      "notes": "Traced from the supplied three-building reference. Main building labels are assigned locally because its boxes have no numbers.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04164570244446,
              10.60565889196629
            ],
            [
              123.04167925000002,
              10.60564929996101
            ],
            [
              123.041657,
              10.605574099903546
            ],
            [
              123.04162345244444,
              10.60558369191119
            ],
            [
              123.04164570244446,
              10.60565889196629
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_2",
      "stall_name": "NW Stall 2",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 2,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04092339999998,
              10.605555200000003
            ],
            [
              123.04095109086015,
              10.60554736533159
            ],
            [
              123.04093895056167,
              10.605505908624743
            ],
            [
              123.04091125970149,
              10.605513743294212
            ],
            [
              123.04092339999998,
              10.605555200000003
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_3",
      "stall_name": "NW Stall 3",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 3,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04095109086015,
              10.60554736533159
            ],
            [
              123.04097878172031,
              10.605539530662975
            ],
            [
              123.04096664142182,
              10.60549807395507
            ],
            [
              123.04093895056167,
              10.605505908624743
            ],
            [
              123.04095109086015,
              10.60554736533159
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_4",
      "stall_name": "NW Stall 4",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 4,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04097878172031,
              10.605539530662975
            ],
            [
              123.04100647258048,
              10.605531695994156
            ],
            [
              123.040994332282,
              10.605490239285169
            ],
            [
              123.04096664142182,
              10.60549807395507
            ],
            [
              123.04097878172031,
              10.605539530662975
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_5",
      "stall_name": "NW Stall 5",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 5,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04100647258048,
              10.605531695994156
            ],
            [
              123.04103416344064,
              10.605523861325144
            ],
            [
              123.04102202314218,
              10.605482404615115
            ],
            [
              123.040994332282,
              10.605490239285169
            ],
            [
              123.04100647258048,
              10.605531695994156
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_6",
      "stall_name": "NW Stall 6",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 6,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04103416344064,
              10.605523861325144
            ],
            [
              123.04106185430082,
              10.60551602665593
            ],
            [
              123.04104971400233,
              10.605474569944832
            ],
            [
              123.04102202314218,
              10.605482404615115
            ],
            [
              123.04103416344064,
              10.605523861325144
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_7",
      "stall_name": "NW Stall 7",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 7,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04106185430082,
              10.60551602665593
            ],
            [
              123.04108954516097,
              10.605508191986525
            ],
            [
              123.04107740486249,
              10.605466735274359
            ],
            [
              123.04104971400233,
              10.605474569944832
            ],
            [
              123.04106185430082,
              10.60551602665593
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_8",
      "stall_name": "NW Stall 8",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 8,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04108954516097,
              10.605508191986525
            ],
            [
              123.04111723602115,
              10.605500357316917
            ],
            [
              123.04110509572266,
              10.605458900603695
            ],
            [
              123.04107740486249,
              10.605466735274359
            ],
            [
              123.04108954516097,
              10.605508191986525
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_9",
      "stall_name": "NW Stall 9",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 9,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04111723602115,
              10.605500357316917
            ],
            [
              123.04114492688126,
              10.60549252264708
            ],
            [
              123.04113278658276,
              10.605451065932801
            ],
            [
              123.04110509572266,
              10.605458900603695
            ],
            [
              123.04111723602115,
              10.605500357316917
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_10",
      "stall_name": "NW Stall 10",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 10,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04114492688126,
              10.60549252264708
            ],
            [
              123.04117261774142,
              10.605484687977075
            ],
            [
              123.04116047744294,
              10.605443231261717
            ],
            [
              123.04113278658276,
              10.605451065932801
            ],
            [
              123.04114492688126,
              10.60549252264708
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.060Z",
      "updated_at": "2026-09-10T13:56:40.060Z"
    },
    {
      "id": "wet_v5_NW_11",
      "stall_name": "NW Stall 11",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 11,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04117261774142,
              10.605484687977075
            ],
            [
              123.04120030860159,
              10.605476853306843
            ],
            [
              123.04118816830312,
              10.605435396590455
            ],
            [
              123.04116047744294,
              10.605443231261717
            ],
            [
              123.04117261774142,
              10.605484687977075
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NW_12",
      "stall_name": "NW Stall 12",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 12,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04120030860159,
              10.605476853306843
            ],
            [
              123.04122799946177,
              10.605469018636446
            ],
            [
              123.04121585916327,
              10.605427561918976
            ],
            [
              123.04118816830312,
              10.605435396590455
            ],
            [
              123.04120030860159,
              10.605476853306843
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NW_1",
      "stall_name": "NW Stall 1",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 1,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04091125970149,
              10.605513743294212
            ],
            [
              123.04093908026123,
              10.605505871928393
            ],
            [
              123.04092759033585,
              10.605466636111395
            ],
            [
              123.04089976977613,
              10.605474507478204
            ],
            [
              123.04091125970149,
              10.605513743294212
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_12",
      "stall_name": "NE Stall 12",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 12,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04128364058128,
              10.605453275902292
            ],
            [
              123.04131113689205,
              10.605445496275808
            ],
            [
              123.04129899659358,
              10.605404039555156
            ],
            [
              123.04127150028279,
              10.605411819182708
            ],
            [
              123.04128364058128,
              10.605453275902292
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_11",
      "stall_name": "NE Stall 11",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 11,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04131113689205,
              10.605445496275808
            ],
            [
              123.04133863320284,
              10.605437716649107
            ],
            [
              123.04132649290435,
              10.6053962599274
            ],
            [
              123.04129899659358,
              10.605404039555156
            ],
            [
              123.04131113689205,
              10.605445496275808
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_10",
      "stall_name": "NE Stall 10",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 10,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04133863320284,
              10.605437716649107
            ],
            [
              123.04136612951363,
              10.605429937022228
            ],
            [
              123.04135398921514,
              10.605388480299466
            ],
            [
              123.04132649290435,
              10.6053962599274
            ],
            [
              123.04133863320284,
              10.605437716649107
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_9",
      "stall_name": "NE Stall 9",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 9,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04136612951363,
              10.605429937022228
            ],
            [
              123.04139362582443,
              10.605422157395134
            ],
            [
              123.04138148552593,
              10.605380700671327
            ],
            [
              123.04135398921514,
              10.605388480299466
            ],
            [
              123.04136612951363,
              10.605429937022228
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_8",
      "stall_name": "NE Stall 8",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 8,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04139362582443,
              10.605422157395134
            ],
            [
              123.04142112213522,
              10.605414377767849
            ],
            [
              123.04140898183672,
              10.605372921042985
            ],
            [
              123.04138148552593,
              10.605380700671327
            ],
            [
              123.04139362582443,
              10.605422157395134
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_7",
      "stall_name": "NE Stall 7",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 7,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04142112213522,
              10.605414377767849
            ],
            [
              123.041448618446,
              10.605406598140371
            ],
            [
              123.0414364781475,
              10.60536514141444
            ],
            [
              123.04140898183672,
              10.605372921042985
            ],
            [
              123.04142112213522,
              10.605414377767849
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_6",
      "stall_name": "NE Stall 6",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 6,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.041448618446,
              10.605406598140371
            ],
            [
              123.04147611475679,
              10.605398818512692
            ],
            [
              123.0414639744583,
              10.605357361785718
            ],
            [
              123.0414364781475,
              10.60536514141444
            ],
            [
              123.041448618446,
              10.605406598140371
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_5",
      "stall_name": "NE Stall 5",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 5,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04147611475679,
              10.605398818512692
            ],
            [
              123.04150361106761,
              10.60539103888481
            ],
            [
              123.04149147076913,
              10.60534958215679
            ],
            [
              123.0414639744583,
              10.605357361785718
            ],
            [
              123.04147611475679,
              10.605398818512692
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_4",
      "stall_name": "NE Stall 4",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 4,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04150361106761,
              10.60539103888481
            ],
            [
              123.0415311073784,
              10.605383259256735
            ],
            [
              123.04151896707991,
              10.605341802527647
            ],
            [
              123.04149147076913,
              10.60534958215679
            ],
            [
              123.04150361106761,
              10.60539103888481
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_3",
      "stall_name": "NE Stall 3",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 3,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0415311073784,
              10.605383259256735
            ],
            [
              123.04155860368918,
              10.605375479628469
            ],
            [
              123.0415464633907,
              10.605334022898326
            ],
            [
              123.04151896707991,
              10.605341802527647
            ],
            [
              123.0415311073784,
              10.605383259256735
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_2",
      "stall_name": "NE Stall 2",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 2,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04155860368918,
              10.605375479628469
            ],
            [
              123.04158609999998,
              10.605367699999988
            ],
            [
              123.0415739597015,
              10.605326243268802
            ],
            [
              123.0415464633907,
              10.605334022898326
            ],
            [
              123.04155860368918,
              10.605375479628469
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_NE_1",
      "stall_name": "NE Stall 1",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 1,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04154613914177,
              10.605334114639238
            ],
            [
              123.0415739597015,
              10.605326243268802
            ],
            [
              123.04156246977612,
              10.605287007428762
            ],
            [
              123.04153464921639,
              10.605294878800203
            ],
            [
              123.04154613914177,
              10.605334114639238
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_2",
      "stall_name": "SW Stall 2",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 2,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04087700671641,
              10.605396776129744
            ],
            [
              123.04090469757656,
              10.605388941457287
            ],
            [
              123.04089299086017,
              10.605348965326517
            ],
            [
              123.04086530000001,
              10.605356800000006
            ],
            [
              123.04087700671641,
              10.605396776129744
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_3",
      "stall_name": "SW Stall 3",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 3,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04090469757656,
              10.605388941457287
            ],
            [
              123.04093238843674,
              10.605381106784625
            ],
            [
              123.04092068172035,
              10.605341130652825
            ],
            [
              123.04089299086017,
              10.605348965326517
            ],
            [
              123.04090469757656,
              10.605388941457287
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_4",
      "stall_name": "SW Stall 4",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 4,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04093238843674,
              10.605381106784625
            ],
            [
              123.0409600792969,
              10.605373272111734
            ],
            [
              123.04094837258052,
              10.605333295978928
            ],
            [
              123.04092068172035,
              10.605341130652825
            ],
            [
              123.04093238843674,
              10.605381106784625
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_5",
      "stall_name": "SW Stall 5",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 5,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0409600792969,
              10.605373272111734
            ],
            [
              123.04098777015709,
              10.605365437438676
            ],
            [
              123.04097606344068,
              10.60532546130483
            ],
            [
              123.04094837258052,
              10.605333295978928
            ],
            [
              123.0409600792969,
              10.605373272111734
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_6",
      "stall_name": "SW Stall 6",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 6,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04098777015709,
              10.605365437438676
            ],
            [
              123.04101546101724,
              10.605357602765404
            ],
            [
              123.04100375430083,
              10.605317626630539
            ],
            [
              123.04097606344068,
              10.60532546130483
            ],
            [
              123.04098777015709,
              10.605365437438676
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_7",
      "stall_name": "SW Stall 7",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 7,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04101546101724,
              10.605357602765404
            ],
            [
              123.04104315187739,
              10.60534976809194
            ],
            [
              123.04103144516101,
              10.605309791956044
            ],
            [
              123.04100375430083,
              10.605317626630539
            ],
            [
              123.04101546101724,
              10.605357602765404
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_8",
      "stall_name": "SW Stall 8",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 8,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04104315187739,
              10.60534976809194
            ],
            [
              123.04107084273757,
              10.605341933418273
            ],
            [
              123.04105913602116,
              10.605301957281359
            ],
            [
              123.04103144516101,
              10.605309791956044
            ],
            [
              123.04104315187739,
              10.60534976809194
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_9",
      "stall_name": "SW Stall 9",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 9,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04107084273757,
              10.605341933418273
            ],
            [
              123.04109853359769,
              10.605334098744377
            ],
            [
              123.0410868268813,
              10.605294122606447
            ],
            [
              123.04105913602116,
              10.605301957281359
            ],
            [
              123.04107084273757,
              10.605341933418273
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_10",
      "stall_name": "SW Stall 10",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 10,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04109853359769,
              10.605334098744377
            ],
            [
              123.04112622445786,
              10.605326264070303
            ],
            [
              123.04111451774148,
              10.605286287931353
            ],
            [
              123.0410868268813,
              10.605294122606447
            ],
            [
              123.04109853359769,
              10.605334098744377
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_11",
      "stall_name": "SW Stall 11",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 11,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04112622445786,
              10.605326264070303
            ],
            [
              123.04115391531803,
              10.60531842939604
            ],
            [
              123.04114220860163,
              10.605278453256059
            ],
            [
              123.04111451774148,
              10.605286287931353
            ],
            [
              123.04112622445786,
              10.605326264070303
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_12",
      "stall_name": "SW Stall 12",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 12,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04115391531803,
              10.60531842939604
            ],
            [
              123.04118160617818,
              10.605310594721583
            ],
            [
              123.04116989946179,
              10.60527061858056
            ],
            [
              123.04114220860163,
              10.605278453256059
            ],
            [
              123.04115391531803,
              10.60531842939604
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SW_1",
      "stall_name": "SW Stall 1",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 1,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04088849664177,
              10.605436011955714
            ],
            [
              123.04091631720152,
              10.605428140587911
            ],
            [
              123.04090482727614,
              10.605388904760924
            ],
            [
              123.04087700671641,
              10.605396776129744
            ],
            [
              123.04088849664177,
              10.605436011955714
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SE_12",
      "stall_name": "SE Stall 12",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 12,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412372472977,
              10.605294851979274
            ],
            [
              123.0412647436085,
              10.605287072348757
            ],
            [
              123.04125303689209,
              10.605247096204678
            ],
            [
              123.0412255405813,
              10.605254875836215
            ],
            [
              123.0412372472977,
              10.605294851979274
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.061Z",
      "updated_at": "2026-09-10T13:56:40.061Z"
    },
    {
      "id": "wet_v5_SE_11",
      "stall_name": "SE Stall 11",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 11,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412647436085,
              10.605287072348757
            ],
            [
              123.04129223991927,
              10.605279292718036
            ],
            [
              123.04128053320287,
              10.605239316572941
            ],
            [
              123.04125303689209,
              10.605247096204678
            ],
            [
              123.0412647436085,
              10.605287072348757
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_10",
      "stall_name": "SE Stall 10",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 10,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04129223991927,
              10.605279292718036
            ],
            [
              123.04131973623007,
              10.605271513087125
            ],
            [
              123.04130802951367,
              10.605231536941012
            ],
            [
              123.04128053320287,
              10.605239316572941
            ],
            [
              123.04129223991927,
              10.605279292718036
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_9",
      "stall_name": "SE Stall 9",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 9,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04131973623007,
              10.605271513087125
            ],
            [
              123.04134723254086,
              10.60526373345601
            ],
            [
              123.04133552582445,
              10.60522375730888
            ],
            [
              123.04130802951367,
              10.605231536941012
            ],
            [
              123.04131973623007,
              10.605271513087125
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_8",
      "stall_name": "SE Stall 8",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 8,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04134723254086,
              10.60526373345601
            ],
            [
              123.04137472885165,
              10.60525595382469
            ],
            [
              123.04136302213524,
              10.605215977676542
            ],
            [
              123.04133552582445,
              10.60522375730888
            ],
            [
              123.04134723254086,
              10.60526373345601
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_7",
      "stall_name": "SE Stall 7",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 7,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04137472885165,
              10.60525595382469
            ],
            [
              123.04140222516241,
              10.605248174193195
            ],
            [
              123.04139051844604,
              10.605208198044028
            ],
            [
              123.04136302213524,
              10.605215977676542
            ],
            [
              123.04137472885165,
              10.60525595382469
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_6",
      "stall_name": "SE Stall 6",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 6,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04140222516241,
              10.605248174193195
            ],
            [
              123.04142972147321,
              10.60524039456148
            ],
            [
              123.04141801475681,
              10.605200418411311
            ],
            [
              123.04139051844604,
              10.605208198044028
            ],
            [
              123.04140222516241,
              10.605248174193195
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_5",
      "stall_name": "SE Stall 5",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 5,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04142972147321,
              10.60524039456148
            ],
            [
              123.04145721778404,
              10.605232614929564
            ],
            [
              123.04144551106765,
              10.605192638778377
            ],
            [
              123.04141801475681,
              10.605200418411311
            ],
            [
              123.04142972147321,
              10.60524039456148
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_4",
      "stall_name": "SE Stall 4",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 4,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04145721778404,
              10.605232614929564
            ],
            [
              123.04148471409484,
              10.60522483529747
            ],
            [
              123.04147300737843,
              10.605184859145265
            ],
            [
              123.04144551106765,
              10.605192638778377
            ],
            [
              123.04145721778404,
              10.605232614929564
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_3",
      "stall_name": "SE Stall 3",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 3,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04148471409484,
              10.60522483529747
            ],
            [
              123.0415122104056,
              10.605217055665172
            ],
            [
              123.04150050368924,
              10.605177079511948
            ],
            [
              123.04147300737843,
              10.605184859145265
            ],
            [
              123.04148471409484,
              10.60522483529747
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_2",
      "stall_name": "SE Stall 2",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 2,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0415122104056,
              10.605217055665172
            ],
            [
              123.04153970671642,
              10.60520927603267
            ],
            [
              123.04152800000001,
              10.605169299878428
            ],
            [
              123.04150050368924,
              10.605177079511948
            ],
            [
              123.0415122104056,
              10.605217055665172
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_SE_1",
      "stall_name": "SE Stall 1",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": 1,
      "numbering_verified": true,
      "notes": "Perimeter numbering repeats by wing on the source plan; the wing prefix identifies the stall uniquely.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04152337608205,
              10.605256383255117
            ],
            [
              123.04155119664178,
              10.605248511882685
            ],
            [
              123.04153970671642,
              10.60520927603267
            ],
            [
              123.04151188615667,
              10.60521714740611
            ],
            [
              123.04152337608205,
              10.605256383255117
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_1",
      "stall_name": "Table Stall W1",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04093908026123,
              10.605505871928393
            ],
            [
              123.04096675815146,
              10.605498040928344
            ],
            [
              123.04095786971862,
              10.605467688692213
            ],
            [
              123.04093019182842,
              10.605475519693039
            ],
            [
              123.04093908026123,
              10.605505871928393
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_2",
      "stall_name": "Table Stall W2",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04096675815146,
              10.605498040928344
            ],
            [
              123.04099443604164,
              10.605490209928115
            ],
            [
              123.0409855476088,
              10.605459857691196
            ],
            [
              123.04095786971862,
              10.605467688692213
            ],
            [
              123.04096675815146,
              10.605498040928344
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_3",
      "stall_name": "Table Stall W3",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04099443604164,
              10.605490209928115
            ],
            [
              123.04102211393185,
              10.605482378927684
            ],
            [
              123.04101322549903,
              10.605452026689989
            ],
            [
              123.0409855476088,
              10.605459857691196
            ],
            [
              123.04099443604164,
              10.605490209928115
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_4",
      "stall_name": "Table Stall W4",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04102211393185,
              10.605482378927684
            ],
            [
              123.04104979182208,
              10.605474547927024
            ],
            [
              123.04104090338923,
              10.605444195688564
            ],
            [
              123.04101322549903,
              10.605452026689989
            ],
            [
              123.04102211393185,
              10.605482378927684
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_5",
      "stall_name": "Table Stall W5",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04104979182208,
              10.605474547927024
            ],
            [
              123.04107746971226,
              10.605466716926196
            ],
            [
              123.04106858127942,
              10.60543636468695
            ],
            [
              123.04104090338923,
              10.605444195688564
            ],
            [
              123.04104979182208,
              10.605474547927024
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_6",
      "stall_name": "Table Stall W6",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04107746971226,
              10.605466716926196
            ],
            [
              123.04110514760248,
              10.605458885925142
            ],
            [
              123.04109625916965,
              10.605428533685119
            ],
            [
              123.04106858127942,
              10.60543636468695
            ],
            [
              123.04107746971226,
              10.605466716926196
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_7",
      "stall_name": "Table Stall W7",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04110514760248,
              10.605458885925142
            ],
            [
              123.04113282549265,
              10.60545105492391
            ],
            [
              123.04112393705982,
              10.60542070268311
            ],
            [
              123.04109625916965,
              10.605428533685119
            ],
            [
              123.04110514760248,
              10.605458885925142
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_8",
      "stall_name": "Table Stall W8",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04113282549265,
              10.60545105492391
            ],
            [
              123.04116050338287,
              10.605443223922473
            ],
            [
              123.04115161495005,
              10.605412871680898
            ],
            [
              123.04112393705982,
              10.60542070268311
            ],
            [
              123.04113282549265,
              10.60545105492391
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_9",
      "stall_name": "Table Stall W9",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04116050338287,
              10.605443223922473
            ],
            [
              123.0411881812731,
              10.60543539292082
            ],
            [
              123.04117929284025,
              10.605405040678468
            ],
            [
              123.04115161495005,
              10.605412871680898
            ],
            [
              123.04116050338287,
              10.605443223922473
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_10",
      "stall_name": "Table Stall W10",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411881812731,
              10.60543539292082
            ],
            [
              123.04121585916327,
              10.605427561918976
            ],
            [
              123.04120697073044,
              10.605397209675848
            ],
            [
              123.04117929284025,
              10.605405040678468
            ],
            [
              123.0411881812731,
              10.60543539292082
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_11",
      "stall_name": "Table Stall W11",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04091349891794,
              10.6054185167063
            ],
            [
              123.04094117680816,
              10.60541068570401
            ],
            [
              123.04093250516637,
              10.605381073757885
            ],
            [
              123.04090482727614,
              10.605388904760924
            ],
            [
              123.04091349891794,
              10.6054185167063
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_12",
      "stall_name": "Table Stall W12",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04094117680816,
              10.60541068570401
            ],
            [
              123.04096885469836,
              10.605402854701543
            ],
            [
              123.04096018305655,
              10.605373242754666
            ],
            [
              123.04093250516637,
              10.605381073757885
            ],
            [
              123.04094117680816,
              10.60541068570401
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_13",
      "stall_name": "Table Stall W13",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04096885469836,
              10.605402854701543
            ],
            [
              123.04099653258857,
              10.605395023698872
            ],
            [
              123.04098786094677,
              10.605365411751233
            ],
            [
              123.04096018305655,
              10.605373242754666
            ],
            [
              123.04096885469836,
              10.605402854701543
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_14",
      "stall_name": "Table Stall W14",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04099653258857,
              10.605395023698872
            ],
            [
              123.0410242104788,
              10.605387192695984
            ],
            [
              123.04101553883699,
              10.605357580747581
            ],
            [
              123.04098786094677,
              10.605365411751233
            ],
            [
              123.04099653258857,
              10.605395023698872
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_15",
      "stall_name": "Table Stall W15",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410242104788,
              10.605387192695984
            ],
            [
              123.04105188836897,
              10.60537936169292
            ],
            [
              123.04104321672718,
              10.605349749743754
            ],
            [
              123.04101553883699,
              10.605357580747581
            ],
            [
              123.0410242104788,
              10.605387192695984
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_16",
      "stall_name": "Table Stall W16",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04105188836897,
              10.60537936169292
            ],
            [
              123.04107956625919,
              10.605371530689625
            ],
            [
              123.04107089461739,
              10.60534191873971
            ],
            [
              123.04104321672718,
              10.605349749743754
            ],
            [
              123.04105188836897,
              10.60537936169292
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_17",
      "stall_name": "Table Stall W17",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04107956625919,
              10.605371530689625
            ],
            [
              123.04110724414939,
              10.605363699686153
            ],
            [
              123.04109857250756,
              10.605334087735486
            ],
            [
              123.04107089461739,
              10.60534191873971
            ],
            [
              123.04107956625919,
              10.605371530689625
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.062Z",
      "updated_at": "2026-09-10T13:56:40.062Z"
    },
    {
      "id": "wet_v5_table_18",
      "stall_name": "Table Stall W18",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04110724414939,
              10.605363699686153
            ],
            [
              123.04113492203959,
              10.605355868682476
            ],
            [
              123.04112625039777,
              10.60532625673106
            ],
            [
              123.04109857250756,
              10.605334087735486
            ],
            [
              123.04110724414939,
              10.605363699686153
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_19",
      "stall_name": "Table Stall W19",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04113492203959,
              10.605355868682476
            ],
            [
              123.04116259992982,
              10.605348037678597
            ],
            [
              123.041153928288,
              10.605318425726404
            ],
            [
              123.04112625039777,
              10.60532625673106
            ],
            [
              123.04113492203959,
              10.605355868682476
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_20",
      "stall_name": "Table Stall W20",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Meat section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04116259992982,
              10.605348037678597
            ],
            [
              123.04119027782,
              10.605340206674528
            ],
            [
              123.04118160617818,
              10.605310594721583
            ],
            [
              123.041153928288,
              10.605318425726404
            ],
            [
              123.04116259992982,
              10.605348037678597
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_21",
      "stall_name": "Table Stall W21",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04127150028279,
              10.605411819182708
            ],
            [
              123.04129896416867,
              10.60540404872925
            ],
            [
              123.04129007573583,
              10.605373696483793
            ],
            [
              123.04126261184996,
              10.605381466938002
            ],
            [
              123.04127150028279,
              10.605411819182708
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_22",
      "stall_name": "Table Stall W22",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04129896416867,
              10.60540404872925
            ],
            [
              123.04132642805456,
              10.605396278275574
            ],
            [
              123.04131753962172,
              10.605365926029355
            ],
            [
              123.04129007573583,
              10.605373696483793
            ],
            [
              123.04129896416867,
              10.60540404872925
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_23",
      "stall_name": "Table Stall W23",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04132642805456,
              10.605396278275574
            ],
            [
              123.04135389194047,
              10.605388507821733
            ],
            [
              123.04134500350764,
              10.605358155574738
            ],
            [
              123.04131753962172,
              10.605365926029355
            ],
            [
              123.04132642805456,
              10.605396278275574
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_24",
      "stall_name": "Table Stall W24",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04135389194047,
              10.605388507821733
            ],
            [
              123.04138135582636,
              10.605380737367677
            ],
            [
              123.04137246739353,
              10.605350385119905
            ],
            [
              123.04134500350764,
              10.605358155574738
            ],
            [
              123.04135389194047,
              10.605388507821733
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_25",
      "stall_name": "Table Stall W25",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04138135582636,
              10.605380737367677
            ],
            [
              123.04140881971225,
              10.605372966913441
            ],
            [
              123.04139993127943,
              10.605342614664908
            ],
            [
              123.04137246739353,
              10.605350385119905
            ],
            [
              123.04138135582636,
              10.605380737367677
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_26",
      "stall_name": "Table Stall W26",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04140881971225,
              10.605372966913441
            ],
            [
              123.04143628359817,
              10.60536519645899
            ],
            [
              123.04142739516536,
              10.605334844209679
            ],
            [
              123.04139993127943,
              10.605342614664908
            ],
            [
              123.04140881971225,
              10.605372966913441
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_27",
      "stall_name": "Table Stall W27",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143628359817,
              10.60536519645899
            ],
            [
              123.04146374748407,
              10.60535742600436
            ],
            [
              123.04145485905124,
              10.605327073754262
            ],
            [
              123.04142739516536,
              10.605334844209679
            ],
            [
              123.04143628359817,
              10.60536519645899
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_28",
      "stall_name": "Table Stall W28",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04146374748407,
              10.60535742600436
            ],
            [
              123.04149121136993,
              10.605349655549501
            ],
            [
              123.04148232293713,
              10.605319303298652
            ],
            [
              123.04145485905124,
              10.605327073754262
            ],
            [
              123.04146374748407,
              10.60535742600436
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_29",
      "stall_name": "Table Stall W29",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04149121136993,
              10.605349655549501
            ],
            [
              123.04151867525589,
              10.605341885094479
            ],
            [
              123.04150978682304,
              10.605311532842853
            ],
            [
              123.04148232293713,
              10.605319303298652
            ],
            [
              123.04149121136993,
              10.605349655549501
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_30",
      "stall_name": "Table Stall W30",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04151867525589,
              10.605341885094479
            ],
            [
              123.04154613914177,
              10.605334114639238
            ],
            [
              123.04153725070893,
              10.60530376238685
            ],
            [
              123.04150978682304,
              10.605311532842853
            ],
            [
              123.04151867525589,
              10.605341885094479
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_31",
      "stall_name": "Table Stall W31",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04124591893951,
              10.605324463933757
            ],
            [
              123.0412733828254,
              10.605316693478084
            ],
            [
              123.04126471118359,
              10.605287081522862
            ],
            [
              123.0412372472977,
              10.605294851979274
            ],
            [
              123.04124591893951,
              10.605324463933757
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_32",
      "stall_name": "Table Stall W32",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412733828254,
              10.605316693478084
            ],
            [
              123.04130084671128,
              10.605308923022195
            ],
            [
              123.04129217506949,
              10.605279311066223
            ],
            [
              123.04126471118359,
              10.605287081522862
            ],
            [
              123.0412733828254,
              10.605316693478084
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_33",
      "stall_name": "Table Stall W33",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04130084671128,
              10.605308923022195
            ],
            [
              123.0413283105972,
              10.60530115256614
            ],
            [
              123.04131963895539,
              10.605271540609404
            ],
            [
              123.04129217506949,
              10.605279311066223
            ],
            [
              123.04130084671128,
              10.605308923022195
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_34",
      "stall_name": "Table Stall W34",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0413283105972,
              10.60530115256614
            ],
            [
              123.04135577448308,
              10.605293382109858
            ],
            [
              123.04134710284127,
              10.605263770152384
            ],
            [
              123.04131963895539,
              10.605271540609404
            ],
            [
              123.0413283105972,
              10.60530115256614
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_35",
      "stall_name": "Table Stall W35",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04135577448308,
              10.605293382109858
            ],
            [
              123.04138323836897,
              10.605285611653409
            ],
            [
              123.04137456672717,
              10.605255999695173
            ],
            [
              123.04134710284127,
              10.605263770152384
            ],
            [
              123.04135577448308,
              10.605293382109858
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_36",
      "stall_name": "Table Stall W36",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04138323836897,
              10.605285611653409
            ],
            [
              123.0414107022549,
              10.605277841196731
            ],
            [
              123.04140203061309,
              10.605248229237743
            ],
            [
              123.04137456672717,
              10.605255999695173
            ],
            [
              123.04138323836897,
              10.605285611653409
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_37",
      "stall_name": "Table Stall W37",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0414107022549,
              10.605277841196731
            ],
            [
              123.04143816614076,
              10.605270070739888
            ],
            [
              123.04142949449896,
              10.60524045878015
            ],
            [
              123.04140203061309,
              10.605248229237743
            ],
            [
              123.0414107022549,
              10.605277841196731
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_38",
      "stall_name": "Table Stall W38",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143816614076,
              10.605270070739888
            ],
            [
              123.04146563002665,
              10.605262300282803
            ],
            [
              123.04145695838486,
              10.605232688322328
            ],
            [
              123.04142949449896,
              10.60524045878015
            ],
            [
              123.04143816614076,
              10.605270070739888
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_39",
      "stall_name": "Table Stall W39",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04146563002665,
              10.605262300282803
            ],
            [
              123.04149309391259,
              10.605254529825565
            ],
            [
              123.04148442227078,
              10.605224917864327
            ],
            [
              123.04145695838486,
              10.605232688322328
            ],
            [
              123.04146563002665,
              10.605262300282803
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_40",
      "stall_name": "Table Stall W40",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Vegetable section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04149309391259,
              10.605254529825565
            ],
            [
              123.04152055779849,
              10.605246759368098
            ],
            [
              123.04151188615667,
              10.60521714740611
            ],
            [
              123.04148442227078,
              10.605224917864327
            ],
            [
              123.04149309391259,
              10.605254529825565
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_41",
      "stall_name": "Table Stall W41",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04097402090997,
              10.605451094440749
            ],
            [
              123.0409878802364,
              10.605447173173468
            ],
            [
              123.04098484516179,
              10.6054368089939
            ],
            [
              123.04097098583534,
              10.605440730261307
            ],
            [
              123.04097402090997,
              10.605451094440749
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_42",
      "stall_name": "Table Stall W42",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0409878802364,
              10.605447173173468
            ],
            [
              123.0410017395629,
              10.605443251906138
            ],
            [
              123.04099870448827,
              10.605432887726442
            ],
            [
              123.04098484516179,
              10.6054368089939
            ],
            [
              123.0409878802364,
              10.605447173173468
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_43",
      "stall_name": "Table Stall W43",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0410017395629,
              10.605443251906138
            ],
            [
              123.04101559888936,
              10.605439330638793
            ],
            [
              123.04101256381472,
              10.605428966458971
            ],
            [
              123.04099870448827,
              10.605432887726442
            ],
            [
              123.0410017395629,
              10.605443251906138
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_44",
      "stall_name": "Table Stall W44",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04101559888936,
              10.605439330638793
            ],
            [
              123.04102945821583,
              10.605435409371372
            ],
            [
              123.0410264231412,
              10.60542504519141
            ],
            [
              123.04101256381472,
              10.605428966458971
            ],
            [
              123.04101559888936,
              10.605439330638793
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_45",
      "stall_name": "Table Stall W45",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04102945821583,
              10.605435409371372
            ],
            [
              123.04104331754228,
              10.605431488103902
            ],
            [
              123.04104028246763,
              10.605421123923799
            ],
            [
              123.0410264231412,
              10.60542504519141
            ],
            [
              123.04102945821583,
              10.605435409371372
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_46",
      "stall_name": "Table Stall W46",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04104331754228,
              10.605431488103902
            ],
            [
              123.04105717686878,
              10.60542756683638
            ],
            [
              123.04105414179413,
              10.60541720265615
            ],
            [
              123.04104028246763,
              10.605421123923799
            ],
            [
              123.04104331754228,
              10.605431488103902
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_47",
      "stall_name": "Table Stall W47",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04105717686878,
              10.60542756683638
            ],
            [
              123.0410710361952,
              10.605423645568832
            ],
            [
              123.04106800112059,
              10.60541328138845
            ],
            [
              123.04105414179413,
              10.60541720265615
            ],
            [
              123.04105717686878,
              10.60542756683638
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_48",
      "stall_name": "Table Stall W48",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04108030971513,
              10.605421021779458
            ],
            [
              123.04109396522797,
              10.605417158177518
            ],
            [
              123.04109093015333,
              10.605406793996933
            ],
            [
              123.04107727464049,
              10.605410657599013
            ],
            [
              123.04108030971513,
              10.605421021779458
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_49",
      "stall_name": "Table Stall W49",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04109396522797,
              10.605417158177518
            ],
            [
              123.0411076207408,
              10.605413294575513
            ],
            [
              123.04110458566616,
              10.6054029303948
            ],
            [
              123.04109093015333,
              10.605406793996933
            ],
            [
              123.04109396522797,
              10.605417158177518
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_50",
      "stall_name": "Table Stall W50",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411076207408,
              10.605413294575513
            ],
            [
              123.04112127625365,
              10.60540943097347
            ],
            [
              123.041118241179,
              10.605399066792618
            ],
            [
              123.04110458566616,
              10.6054029303948
            ],
            [
              123.0411076207408,
              10.605413294575513
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_51",
      "stall_name": "Table Stall W51",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04112127625365,
              10.60540943097347
            ],
            [
              123.04113493176649,
              10.605405567371376
            ],
            [
              123.04113189669185,
              10.605395203190408
            ],
            [
              123.041118241179,
              10.605399066792618
            ],
            [
              123.04112127625365,
              10.60540943097347
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_52",
      "stall_name": "Table Stall W52",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04113493176649,
              10.605405567371376
            ],
            [
              123.04114858727932,
              10.60540170376922
            ],
            [
              123.04114555220468,
              10.605391339588124
            ],
            [
              123.04113189669185,
              10.605395203190408
            ],
            [
              123.04113493176649,
              10.605405567371376
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_53",
      "stall_name": "Table Stall W53",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04114858727932,
              10.60540170376922
            ],
            [
              123.04116224279218,
              10.605397840167024
            ],
            [
              123.04115920771754,
              10.605387475985802
            ],
            [
              123.04114555220468,
              10.605391339588124
            ],
            [
              123.04114858727932,
              10.60540170376922
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_54",
      "stall_name": "Table Stall W54",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04116224279218,
              10.605397840167024
            ],
            [
              123.04117589830501,
              10.605393976564791
            ],
            [
              123.04117286323037,
              10.605383612383429
            ],
            [
              123.04115920771754,
              10.605387475985802
            ],
            [
              123.04116224279218,
              10.605397840167024
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_55",
      "stall_name": "Table Stall W55",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04118588517264,
              10.605391150945202
            ],
            [
              123.04119954068547,
              10.60538728734288
            ],
            [
              123.04119650561083,
              10.605376923161302
            ],
            [
              123.041182850098,
              10.605380786763739
            ],
            [
              123.04118588517264,
              10.605391150945202
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_56",
      "stall_name": "Table Stall W56",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04119954068547,
              10.60538728734288
            ],
            [
              123.0412131961983,
              10.605383423740506
            ],
            [
              123.04121016112369,
              10.605373059558788
            ],
            [
              123.04119650561083,
              10.605376923161302
            ],
            [
              123.04119954068547,
              10.60538728734288
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_57",
      "stall_name": "Table Stall W57",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412131961983,
              10.605383423740506
            ],
            [
              123.04122685171116,
              10.605379560138083
            ],
            [
              123.04122381663652,
              10.605369195956223
            ],
            [
              123.04121016112369,
              10.605373059558788
            ],
            [
              123.0412131961983,
              10.605383423740506
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_58",
      "stall_name": "Table Stall W58",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04122685171116,
              10.605379560138083
            ],
            [
              123.04124050722399,
              10.605375696535594
            ],
            [
              123.04123747214935,
              10.605365332353621
            ],
            [
              123.04122381663652,
              10.605369195956223
            ],
            [
              123.04122685171116,
              10.605379560138083
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_59",
      "stall_name": "Table Stall W59",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04124050722399,
              10.605375696535594
            ],
            [
              123.04125416273682,
              10.605371832933093
            ],
            [
              123.0412511276622,
              10.60536146875098
            ],
            [
              123.04123747214935,
              10.605365332353621
            ],
            [
              123.04124050722399,
              10.605375696535594
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_60",
      "stall_name": "Table Stall W60",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04125416273682,
              10.605371832933093
            ],
            [
              123.04126781824968,
              10.605367969330516
            ],
            [
              123.04126478317504,
              10.605357605148276
            ],
            [
              123.0412511276622,
              10.60536146875098
            ],
            [
              123.04125416273682,
              10.605371832933093
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_61",
      "stall_name": "Table Stall W61",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04126781824968,
              10.605367969330516
            ],
            [
              123.04128147376251,
              10.605364105727901
            ],
            [
              123.04127843868787,
              10.605353741545521
            ],
            [
              123.04126478317504,
              10.605357605148276
            ],
            [
              123.04126781824968,
              10.605367969330516
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_62",
      "stall_name": "Table Stall W62",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04129146063008,
              10.605361280108033
            ],
            [
              123.04130501423612,
              10.60535744533819
            ],
            [
              123.04130197916149,
              10.60534708115558
            ],
            [
              123.04128842555545,
              10.605350915925564
            ],
            [
              123.04129146063008,
              10.605361280108033
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_63",
      "stall_name": "Table Stall W63",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04130501423612,
              10.60535744533819
            ],
            [
              123.04131856784217,
              10.605353610568306
            ],
            [
              123.04131553276753,
              10.605343246385571
            ],
            [
              123.04130197916149,
              10.60534708115558
            ],
            [
              123.04130501423612,
              10.60535744533819
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_64",
      "stall_name": "Table Stall W64",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04131856784217,
              10.605353610568306
            ],
            [
              123.04133212144819,
              10.605349775798361
            ],
            [
              123.04132908637355,
              10.605339411615498
            ],
            [
              123.04131553276753,
              10.605343246385571
            ],
            [
              123.04131856784217,
              10.605353610568306
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_65",
      "stall_name": "Table Stall W65",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04133212144819,
              10.605349775798361
            ],
            [
              123.04134567505419,
              10.605345941028364
            ],
            [
              123.04134263997955,
              10.605335576845361
            ],
            [
              123.04132908637355,
              10.605339411615498
            ],
            [
              123.04133212144819,
              10.605349775798361
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_66",
      "stall_name": "Table Stall W66",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04134567505419,
              10.605345941028364
            ],
            [
              123.04135922866023,
              10.605342106258318
            ],
            [
              123.0413561935856,
              10.6053317420752
            ],
            [
              123.04134263997955,
              10.605335576845361
            ],
            [
              123.04134567505419,
              10.605345941028364
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_67",
      "stall_name": "Table Stall W67",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04135922866023,
              10.605342106258318
            ],
            [
              123.04137278226627,
              10.605338271488232
            ],
            [
              123.04136974719164,
              10.605327907304973
            ],
            [
              123.0413561935856,
              10.6053317420752
            ],
            [
              123.04135922866023,
              10.605342106258318
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_68",
      "stall_name": "Table Stall W68",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04137278226627,
              10.605338271488232
            ],
            [
              123.04138633587229,
              10.605334436718096
            ],
            [
              123.04138330079768,
              10.60532407253471
            ],
            [
              123.04136974719164,
              10.605327907304973
            ],
            [
              123.04137278226627,
              10.605338271488232
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.063Z",
      "updated_at": "2026-09-10T13:56:40.063Z"
    },
    {
      "id": "wet_v5_table_69",
      "stall_name": "Table Stall W69",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04139632273989,
              10.605331611097974
            ],
            [
              123.04140987634591,
              10.605327776327748
            ],
            [
              123.04140684127128,
              10.605317412144133
            ],
            [
              123.04139328766526,
              10.6053212469145
            ],
            [
              123.04139632273989,
              10.605331611097974
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_70",
      "stall_name": "Table Stall W70",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04140987634591,
              10.605327776327748
            ],
            [
              123.04142342995195,
              10.60532394155747
            ],
            [
              123.04142039487732,
              10.60531357737373
            ],
            [
              123.04140684127128,
              10.605317412144133
            ],
            [
              123.04140987634591,
              10.605327776327748
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_71",
      "stall_name": "Table Stall W71",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04142342995195,
              10.60532394155747
            ],
            [
              123.04143698355799,
              10.605320106787156
            ],
            [
              123.04143394848336,
              10.605309742603302
            ],
            [
              123.04142039487732,
              10.60531357737373
            ],
            [
              123.04142342995195,
              10.60532394155747
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_72",
      "stall_name": "Table Stall W72",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143698355799,
              10.605320106787156
            ],
            [
              123.041450537164,
              10.605316272016804
            ],
            [
              123.04144750208935,
              10.605305907832795
            ],
            [
              123.04143394848336,
              10.605309742603302
            ],
            [
              123.04143698355799,
              10.605320106787156
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_73",
      "stall_name": "Table Stall W73",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.041450537164,
              10.605316272016804
            ],
            [
              123.04146409077002,
              10.605312437246374
            ],
            [
              123.04146105569538,
              10.605302073062251
            ],
            [
              123.04144750208935,
              10.605305907832795
            ],
            [
              123.041450537164,
              10.605316272016804
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_74",
      "stall_name": "Table Stall W74",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04146409077002,
              10.605312437246374
            ],
            [
              123.04147764437606,
              10.605308602475933
            ],
            [
              123.04147460930142,
              10.605298238291683
            ],
            [
              123.04146105569538,
              10.605302073062251
            ],
            [
              123.04146409077002,
              10.605312437246374
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_75",
      "stall_name": "Table Stall W75",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04147764437606,
              10.605308602475933
            ],
            [
              123.0414911979821,
              10.605304767705427
            ],
            [
              123.04148816290746,
              10.605294403521038
            ],
            [
              123.04147460930142,
              10.605298238291683
            ],
            [
              123.04147764437606,
              10.605308602475933
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_76",
      "stall_name": "Table Stall W76",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04096708359657,
              10.605427404887218
            ],
            [
              123.04098094292303,
              10.605423483619644
            ],
            [
              123.04097790784839,
              10.605413119439262
            ],
            [
              123.04096404852193,
              10.605417040706962
            ],
            [
              123.04096708359657,
              10.605427404887218
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_77",
      "stall_name": "Table Stall W77",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04098094292303,
              10.605423483619644
            ],
            [
              123.0409948022495,
              10.60541956235202
            ],
            [
              123.04099176717487,
              10.605409198171499
            ],
            [
              123.04097790784839,
              10.605413119439262
            ],
            [
              123.04098094292303,
              10.605423483619644
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_78",
      "stall_name": "Table Stall W78",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0409948022495,
              10.60541956235202
            ],
            [
              123.04100866157593,
              10.605415641084372
            ],
            [
              123.04100562650133,
              10.605405276903708
            ],
            [
              123.04099176717487,
              10.605409198171499
            ],
            [
              123.0409948022495,
              10.60541956235202
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_79",
      "stall_name": "Table Stall W79",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04100866157593,
              10.605415641084372
            ],
            [
              123.04102252090244,
              10.605411719816646
            ],
            [
              123.0410194858278,
              10.605401355635856
            ],
            [
              123.04100562650133,
              10.605405276903708
            ],
            [
              123.04100866157593,
              10.605415641084372
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_80",
      "stall_name": "Table Stall W80",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04102252090244,
              10.605411719816646
            ],
            [
              123.04103638022887,
              10.605407798548857
            ],
            [
              123.04103334515423,
              10.60539743436794
            ],
            [
              123.0410194858278,
              10.605401355635856
            ],
            [
              123.04102252090244,
              10.605411719816646
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_81",
      "stall_name": "Table Stall W81",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04103638022887,
              10.605407798548857
            ],
            [
              123.04105023955536,
              10.605403877281042
            ],
            [
              123.04104720448073,
              10.605393513099985
            ],
            [
              123.04103334515423,
              10.60539743436794
            ],
            [
              123.04103638022887,
              10.605407798548857
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_82",
      "stall_name": "Table Stall W82",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04105023955536,
              10.605403877281042
            ],
            [
              123.0410640988818,
              10.605399956013176
            ],
            [
              123.04106106380716,
              10.605389591831992
            ],
            [
              123.04104720448073,
              10.605393513099985
            ],
            [
              123.04105023955536,
              10.605403877281042
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_83",
      "stall_name": "Table Stall W83",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04107337240173,
              10.605397332223612
            ],
            [
              123.04108702791457,
              10.605393468621365
            ],
            [
              123.04108399283993,
              10.605383104439966
            ],
            [
              123.04107033732708,
              10.605386968042351
            ],
            [
              123.04107337240173,
              10.605397332223612
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_84",
      "stall_name": "Table Stall W84",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04108702791457,
              10.605393468621365
            ],
            [
              123.0411006834274,
              10.605389605019068
            ],
            [
              123.04109764835277,
              10.605379240837529
            ],
            [
              123.04108399283993,
              10.605383104439966
            ],
            [
              123.04108702791457,
              10.605393468621365
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_85",
      "stall_name": "Table Stall W85",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0411006834274,
              10.605389605019068
            ],
            [
              123.04111433894026,
              10.605385741416708
            ],
            [
              123.0411113038656,
              10.605375377235053
            ],
            [
              123.04109764835277,
              10.605379240837529
            ],
            [
              123.0411006834274,
              10.605389605019068
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_86",
      "stall_name": "Table Stall W86",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04111433894026,
              10.605385741416708
            ],
            [
              123.04112799445309,
              10.605381877814335
            ],
            [
              123.04112495937845,
              10.605371513632539
            ],
            [
              123.0411113038656,
              10.605375377235053
            ],
            [
              123.04111433894026,
              10.605385741416708
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_87",
      "stall_name": "Table Stall W87",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04112799445309,
              10.605381877814335
            ],
            [
              123.04114164996592,
              10.605378014211897
            ],
            [
              123.0411386148913,
              10.605367650029962
            ],
            [
              123.04112495937845,
              10.605371513632539
            ],
            [
              123.04112799445309,
              10.605381877814335
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_88",
      "stall_name": "Table Stall W88",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04114164996592,
              10.605378014211897
            ],
            [
              123.04115530547878,
              10.605374150609396
            ],
            [
              123.04115227040414,
              10.605363786427334
            ],
            [
              123.0411386148913,
              10.605367650029962
            ],
            [
              123.04114164996592,
              10.605378014211897
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_89",
      "stall_name": "Table Stall W89",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04115530547878,
              10.605374150609396
            ],
            [
              123.04116896099161,
              10.605370287006844
            ],
            [
              123.04116592591697,
              10.605359922824656
            ],
            [
              123.04115227040414,
              10.605363786427334
            ],
            [
              123.04115530547878,
              10.605374150609396
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_90",
      "stall_name": "Table Stall W90",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04117894785921,
              10.60536746138704
            ],
            [
              123.04119260337205,
              10.605363597784425
            ],
            [
              123.04118956829744,
              10.60535323360202
            ],
            [
              123.0411759127846,
              10.605357097204749
            ],
            [
              123.04117894785921,
              10.60536746138704
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_91",
      "stall_name": "Table Stall W91",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04119260337205,
              10.605363597784425
            ],
            [
              123.0412062588849,
              10.605359734181746
            ],
            [
              123.04120322381029,
              10.605349369999201
            ],
            [
              123.04118956829744,
              10.60535323360202
            ],
            [
              123.04119260337205,
              10.605363597784425
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_92",
      "stall_name": "Table Stall W92",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0412062588849,
              10.605359734181746
            ],
            [
              123.04121991439774,
              10.605355870579016
            ],
            [
              123.04121687932312,
              10.605345506396331
            ],
            [
              123.04120322381029,
              10.605349369999201
            ],
            [
              123.0412062588849,
              10.605359734181746
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_93",
      "stall_name": "Table Stall W93",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04121991439774,
              10.605355870579016
            ],
            [
              123.04123356991057,
              10.605352006976249
            ],
            [
              123.04123053483596,
              10.605341642793435
            ],
            [
              123.04121687932312,
              10.605345506396331
            ],
            [
              123.04121991439774,
              10.605355870579016
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_94",
      "stall_name": "Table Stall W94",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04123356991057,
              10.605352006976249
            ],
            [
              123.04124722542342,
              10.60534814337343
            ],
            [
              123.0412441903488,
              10.605337779190503
            ],
            [
              123.04123053483596,
              10.605341642793435
            ],
            [
              123.04123356991057,
              10.605352006976249
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_95",
      "stall_name": "Table Stall W95",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04124722542342,
              10.60534814337343
            ],
            [
              123.04126088093626,
              10.60534427977056
            ],
            [
              123.04125784586164,
              10.605333915587494
            ],
            [
              123.0412441903488,
              10.605337779190503
            ],
            [
              123.04124722542342,
              10.60534814337343
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_96",
      "stall_name": "Table Stall W96",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04126088093626,
              10.60534427977056
            ],
            [
              123.0412745364491,
              10.605340416167651
            ],
            [
              123.04127150137448,
              10.605330051984446
            ],
            [
              123.04125784586164,
              10.605333915587494
            ],
            [
              123.04126088093626,
              10.60534427977056
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_97",
      "stall_name": "Table Stall W97",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04128452331668,
              10.605337590547554
            ],
            [
              123.04129807692271,
              10.60533375577742
            ],
            [
              123.04129504184807,
              10.605323391593982
            ],
            [
              123.04128148824203,
              10.605327226364272
            ],
            [
              123.04128452331668,
              10.605337590547554
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_98",
      "stall_name": "Table Stall W98",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04129807692271,
              10.60533375577742
            ],
            [
              123.04131163052874,
              10.605329921007245
            ],
            [
              123.04130859545413,
              10.605319556823682
            ],
            [
              123.04129504184807,
              10.605323391593982
            ],
            [
              123.04129807692271,
              10.60533375577742
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_99",
      "stall_name": "Table Stall W99",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04131163052874,
              10.605329921007245
            ],
            [
              123.04132518413478,
              10.605326086236992
            ],
            [
              123.04132214906015,
              10.605315722053316
            ],
            [
              123.04130859545413,
              10.605319556823682
            ],
            [
              123.04131163052874,
              10.605329921007245
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_100",
      "stall_name": "Table Stall W100",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04132518413478,
              10.605326086236992
            ],
            [
              123.04133873774079,
              10.605322251466704
            ],
            [
              123.04133570266615,
              10.605311887282886
            ],
            [
              123.04132214906015,
              10.605315722053316
            ],
            [
              123.04132518413478,
              10.605326086236992
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_101",
      "stall_name": "Table Stall W101",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04133873774079,
              10.605322251466704
            ],
            [
              123.04135229134683,
              10.605318416696363
            ],
            [
              123.04134925627218,
              10.605308052512418
            ],
            [
              123.04133570266615,
              10.605311887282886
            ],
            [
              123.04133873774079,
              10.605322251466704
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_102",
      "stall_name": "Table Stall W102",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04135229134683,
              10.605318416696363
            ],
            [
              123.04136584495286,
              10.605314581925972
            ],
            [
              123.04136280987822,
              10.605304217741901
            ],
            [
              123.04134925627218,
              10.605308052512418
            ],
            [
              123.04135229134683,
              10.605318416696363
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_103",
      "stall_name": "Table Stall W103",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04136584495286,
              10.605314581925972
            ],
            [
              123.04137939855889,
              10.605310747155544
            ],
            [
              123.04137636348428,
              10.605300382971333
            ],
            [
              123.04136280987822,
              10.605304217741901
            ],
            [
              123.04136584495286,
              10.605314581925972
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.064Z",
      "updated_at": "2026-09-10T13:56:40.064Z"
    },
    {
      "id": "wet_v5_table_104",
      "stall_name": "Table Stall W104",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04138938542648,
              10.605307921535205
            ],
            [
              123.04140293903251,
              10.605304086764688
            ],
            [
              123.04139990395787,
              10.605293722580246
            ],
            [
              123.04138635035184,
              10.605297557350905
            ],
            [
              123.04138938542648,
              10.605307921535205
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_table_105",
      "stall_name": "Table Stall W105",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04140293903251,
              10.605304086764688
            ],
            [
              123.04141649263855,
              10.605300251994118
            ],
            [
              123.0414134575639,
              10.605289887809551
            ],
            [
              123.04139990395787,
              10.605293722580246
            ],
            [
              123.04140293903251,
              10.605304086764688
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_table_106",
      "stall_name": "Table Stall W106",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04141649263855,
              10.605300251994118
            ],
            [
              123.04143004624459,
              10.605296417223498
            ],
            [
              123.04142701116993,
              10.605286053038816
            ],
            [
              123.0414134575639,
              10.605289887809551
            ],
            [
              123.04141649263855,
              10.605300251994118
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_table_107",
      "stall_name": "Table Stall W107",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04143004624459,
              10.605296417223498
            ],
            [
              123.04144359985058,
              10.605292582452828
            ],
            [
              123.04144056477595,
              10.605282218268018
            ],
            [
              123.04142701116993,
              10.605286053038816
            ],
            [
              123.04143004624459,
              10.605296417223498
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_table_108",
      "stall_name": "Table Stall W108",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04144359985058,
              10.605292582452828
            ],
            [
              123.0414571534566,
              10.605288747682119
            ],
            [
              123.04145411838198,
              10.605278383497168
            ],
            [
              123.04144056477595,
              10.605282218268018
            ],
            [
              123.04144359985058,
              10.605292582452828
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_table_109",
      "stall_name": "Table Stall W109",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.0414571534566,
              10.605288747682119
            ],
            [
              123.04147070706266,
              10.605284912911385
            ],
            [
              123.04146767198802,
              10.605274548726307
            ],
            [
              123.04145411838198,
              10.605278383497168
            ],
            [
              123.0414571534566,
              10.605288747682119
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_table_110",
      "stall_name": "Table Stall W110",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Fish section",
      "business_type": "",
      "kind": "table_stall",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04147070706266,
              10.605284912911385
            ],
            [
              123.0414842606687,
              10.605281078140573
            ],
            [
              123.04148122559407,
              10.605270713955356
            ],
            [
              123.04146767198802,
              10.605274548726307
            ],
            [
              123.04147070706266,
              10.605284912911385
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    },
    {
      "id": "wet_v5_comfort_room",
      "stall_name": "Comfort Room (CR)",
      "building": "Wet Store Building",
      "floor": "1",
      "section": "Facilities",
      "business_type": "",
      "kind": "comfort_room",
      "source_plan": "775047548_1355790473373932_7238331607465683801_n.jpg",
      "source_stall_number": null,
      "numbering_verified": false,
      "notes": "Traced from the supplied wet-market floor plan. Table identifiers are assigned locally; tiny printed counter numbers are not verified.",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              123.04122799946177,
              10.605469018636446
            ],
            [
              123.04128364058128,
              10.605453275902292
            ],
            [
              123.04126196147679,
              10.60537924604192
            ],
            [
              123.04120632035729,
              10.60539498877988
            ],
            [
              123.04122799946177,
              10.605469018636446
            ]
          ]
        ]
      },
      "created_at": "2026-09-10T13:56:40.065Z",
      "updated_at": "2026-09-10T13:56:40.065Z"
    }
  ]
}
```

## Mapper localStorage snapshot (JSON)

Values below are the raw strings stored under this mapper's keys. Only this mapper's current data, migration flags, and historical alignment backup are included. A null value means the key was absent. Browser snapshots reflect saved data at export time; unsaved drawings or edit-tool changes are not included.

```json
{
  "note": "Reference layout generated from source code, NOT captured from your browser. No actual browser storage strings, migration flags, prior backups, or user edits were read. Use Export Markdown in the mapper for those.",
  "current_data_key": "pubmark_local_stall_mapper_v1",
  "seed_key": "pubmark_local_stall_mapper_plan_seed_v1",
  "alignment_key": "pubmark_local_stall_mapper_v1_alignment",
  "alignment_backup_key": "pubmark_local_stall_mapper_v1_before_alignment_v2",
  "middle_features_key": "pubmark_local_stall_mapper_v1_middle_features_v1"
}
```
