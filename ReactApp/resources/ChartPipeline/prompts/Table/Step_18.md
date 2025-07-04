
This will return an array of matched chains, where each chain is a sequence of related records from both tables WHEN USER CLICK ID ISOMETRIC IN ANY ONE OF BOTH TABLES?

```javascript

function splitTestPack(testPackStr) {
return testPackStr.split("|").map(v => v.trim());
}

function filterByIsometric(table, isoId) {
return table.filter(row => row.ISOMETRIC === isoId);
}

function filterByTestPack(table, testPack) {
return table.filter(row =>
splitTestPack(row.TEST_PACK).includes(testPack)
);
}

function findMatchingChains(isometricTable, mountingTable) {
const visitedIsometrics = new Set();
const matchingChains = [];

for (const record of isometricTable) {
const isoId = record.ISOMETRIC;

    if (visitedIsometrics.has(isoId)) continue;

    const currentChain = [];
    const stack = [isoId];

    while (stack.length > 0) {
      const currentIso = stack.pop();

      if (visitedIsometrics.has(currentIso)) continue;
      visitedIsometrics.add(currentIso);

      const isoRecords = filterByIsometric(isometricTable, currentIso);

      for (const isoRec of isoRecords) {
        const testPacks = splitTestPack(isoRec.TEST_PACK);
        const subsystemIso = isoRec.SUBSYSTEM;

        for (const testPack of testPacks) {
          const matchingMounts = filterByTestPack(mountingTable, testPack);

          for (const mountRec of matchingMounts) {
            const subsystemMount = mountRec.SUBSYSTEM;

            // RED CONDITION: subsystem must match
            if (subsystemIso === subsystemMount) {
              const nextIso = mountRec.ISOMETRIC;
              if (!visitedIsometrics.has(nextIso)) {
                stack.push(nextIso);
                currentChain.push({ isometric: isoRec, mounting: mountRec });
              }
            }
          }
        }
      }
    }

    if (currentChain.length > 0) {
      matchingChains.push(currentChain);
    }
}

return matchingChains;
}

```