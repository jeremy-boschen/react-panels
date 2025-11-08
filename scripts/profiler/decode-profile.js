#!/usr/bin/env node

import fs from 'fs';

const profilePath = process.argv[2] || '.profile/profiling-data.11-07-2025.19-21-51.json';
const data = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

// React DevTools profiler operation codes
const TREE_OPERATION_ADD = 1;
const TREE_OPERATION_REMOVE = 2;
const TREE_OPERATION_REORDER_CHILDREN = 3;
const TREE_OPERATION_UPDATE_TREE_BASE_DURATION = 4;
const TREE_OPERATION_UPDATE_ERRORS_OR_WARNINGS = 5;
const TREE_OPERATION_REMOVE_ROOT = 6;
const TREE_OPERATION_SET_SUBTREE_MODE = 7;

console.log('=== React Profiler Deep Analysis ===\n');

data.dataForRoots.forEach((rootData, rootIndex) => {
  console.log(`\n--- Root ${rootIndex + 1}: ${rootData.displayName} ---`);
  console.log(`Root ID: ${rootData.rootID}`);
  console.log(`Total commits: ${rootData.commitData.length}`);
  console.log(`Total operations: ${rootData.operations.length}`);

  // Decode the first operation (tree structure)
  const fiberMap = new Map();

  if (rootData.operations && rootData.operations.length > 0) {
    const firstOp = rootData.operations[0];
    console.log(`\nDecoding initial tree from first operation (${firstOp.length} elements)...`);

    let i = 0;
    while (i < firstOp.length) {
      const operation = firstOp[i];

      if (operation === TREE_OPERATION_ADD) {
        i++;
        const fiberID = firstOp[i++];
        const elementType = firstOp[i++];
        const parentFiberID = firstOp[i++];
        const ownerFiberID = firstOp[i++];
        const displayNameLength = firstOp[i++];

        let displayName = '';
        for (let j = 0; j < displayNameLength; j++) {
          displayName += String.fromCharCode(firstOp[i++]);
        }

        const keyLength = firstOp[i++];
        let key = '';
        for (let j = 0; j < keyLength; j++) {
          key += String.fromCharCode(firstOp[i++]);
        }

        fiberMap.set(fiberID, {
          id: fiberID,
          type: elementType,
          parent: parentFiberID,
          owner: ownerFiberID,
          displayName,
          key: key || null
        });
      } else {
        // Skip other operations for now
        break;
      }
    }

    console.log(`\nExtracted ${fiberMap.size} fibers from tree`);
  }

  // Analyze component re-renders with names
  const componentChangeCounts = new Map();
  rootData.commitData.forEach(commit => {
    if (commit.changeDescriptions) {
      commit.changeDescriptions.forEach(([fiberId, changeDesc]) => {
        componentChangeCounts.set(fiberId, (componentChangeCounts.get(fiberId) || 0) + 1);
      });
    }
  });

  console.log(`\n\nComponents with most re-renders:`);
  console.log(`─`.repeat(90));
  console.log(`${'Component'.padEnd(30)} ${'Fiber ID'.padEnd(10)} ${'Type'.padEnd(8)} ${'Re-renders'.padEnd(12)}`);
  console.log(`─`.repeat(90));

  const sortedComponents = Array.from(componentChangeCounts.entries())
    .map(([fiberId, count]) => {
      const fiber = fiberMap.get(fiberId);
      return {
        fiberId,
        count,
        displayName: fiber?.displayName || 'Unknown',
        type: fiber?.type || -1
      };
    })
    .sort((a, b) => b.count - a.count);

  sortedComponents.slice(0, 30).forEach(({ displayName, fiberId, type, count }) => {
    console.log(`${displayName.padEnd(30)} ${String(fiberId).padEnd(10)} ${String(type).padEnd(8)} ${String(count).padEnd(12)}`);
  });

  // Group by component name
  const nameGroups = new Map();
  sortedComponents.forEach(({ displayName, count }) => {
    if (!nameGroups.has(displayName)) {
      nameGroups.set(displayName, { count: 0, instances: 0 });
    }
    const group = nameGroups.get(displayName);
    group.count += count;
    group.instances += 1;
  });

  console.log(`\n\nAggregate by component type:`);
  console.log(`─`.repeat(80));
  console.log(`${'Component'.padEnd(40)} ${'Instances'.padEnd(12)} ${'Total Re-renders'.padEnd(15)}`);
  console.log(`─`.repeat(80));

  Array.from(nameGroups.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .forEach(([name, { count, instances }]) => {
      console.log(`${name.padEnd(40)} ${String(instances).padEnd(12)} ${String(count).padEnd(15)}`);
    });

  // Analyze commit durations
  const durations = rootData.commitData.map(c => c.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);

  console.log(`\n\nPerformance Summary:`);
  console.log(`─`.repeat(80));
  console.log(`Average commit duration: ${avg.toFixed(2)}ms`);
  console.log(`Max commit duration: ${max.toFixed(2)}ms`);
  console.log(`Min commit duration: ${min.toFixed(2)}ms`);
  console.log(`Commits > 16ms (dropping below 60fps): ${durations.filter(d => d > 16).length}`);
  console.log(`Commits > 50ms (very slow): ${durations.filter(d => d > 50).length}`);

  // Look at specific slow components
  console.log(`\n\nComponent render times (from first commit):`);
  console.log(`─`.repeat(80));
  if (rootData.commitData[0]?.fiberActualDurations) {
    const durationsWithNames = rootData.commitData[0].fiberActualDurations
      .map(([fiberId, duration]) => {
        const fiber = fiberMap.get(fiberId);
        return {
          fiberId,
          duration,
          displayName: fiber?.displayName || 'Unknown'
        };
      })
      .sort((a, b) => b.duration - a.duration);

    console.log(`${'Component'.padEnd(30)} ${'Fiber ID'.padEnd(10)} ${'Duration'.padEnd(12)}`);
    console.log(`─`.repeat(80));
    durationsWithNames.slice(0, 20).forEach(({ displayName, fiberId, duration }) => {
      console.log(`${displayName.padEnd(30)} ${String(fiberId).padEnd(10)} ${duration.toFixed(2)}ms`);
    });
  }
});

console.log('\n\n=== Analysis Complete ===\n');
